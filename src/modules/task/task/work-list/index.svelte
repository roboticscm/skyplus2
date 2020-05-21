<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { ViewStore } from '@/store/view';
  import QuickSearch from '@/components/ui/input/quick-search';
  import { switchMap, map, tap, filter, delay, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
  import { fromEvents } from '@/lib/js/rx';
  import { T } from '@/lib/js/locale/locale';
  import { forkJoin, fromEvent, Observable, Subscription, of, BehaviorSubject } from 'rxjs';
  import { Dropdown } from '@/lib/js/dropdown';
  import Radio from '@/components/ui/float-input/radio';
  import Store from '../store';
  import TaskView from '../components/task-view/index.svelte';
  import ProjectView from '../components/project-view/index.svelte';
  import { Task } from '../../types';
  import Button from '@/components/ui/flat-button';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';
  import ContentFilter from '@/components/ui/float-input/content-filter';
  import {convertArrayObjectToObject, filterColumns} from './helper';
  import CloseableList from '@/components/ui/closeable-list';
  import { StringUtil } from '@/lib/js/string-util';
  import { SObject } from '@/lib/js/sobject';
  import { apolloClient } from '@/lib/js/hasura-client';
  import { App } from '@/lib/js/constants';
  import { appStore } from '@/store/app';
  import Pagination from '@/components/ui/pagination';
  import {markStringSearch} from "../../../../lib/js/util";

  export let menuPath: string;
  export let view: ViewStore;
  export let store: Store;
  export let selectedId: string = undefined;

  const { fullCount$, needSelectId$} = view;
  const { taskList$, projectList$, showDashboard$ } = store;
  let quickSearchRef: any;
  let searchWrapperRef: any;
  let viewBy = 'task';
  let selectedTask: Task = undefined;

  let filterList: any[] = [{ id: '', name: '' }];
  let mappedFilterList: any[] = [];

  let usedFilterColumns: any[] = [];

  let taskSub, selectSub: Subscription;
  let taskApolloClient$: any;
  let viewByTaskRef, pageRef: any;

  const searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  let markedData: any[] = undefined;
  let textSearch: string = '';

  const dispatch = createEventDispatcher();
  const doFilter = (ob$: Observable<any>) => {
    let start = Date.now();
    ob$
      .pipe(
        filter((e: any) => e.value.length >= App.MIN_SEARCH_LENGTH || e.value.length === 0),
        debounceTime(App.DELAY_ON_INPUT),
        distinctUntilChanged(),
        tap((e: any) => {
          start = Date.now();
          searchProgress$.next(true);
          textSearch = e.value;
        }),
        switchMap((e: any) => {
          if(StringUtil.isEmpty(e.value)) {
            return store.tskFindTasks({menuPath, departmentId: appStore.org.departmentId, isCompleted: false});
          } else {
            return store.tskFindTasks({menuPath, departmentId: appStore.org.departmentId, textSearch: StringUtil.formatFTSParam(e.value)});
          }
        }),
      )
      .subscribe((res) => {
        const end = Date.now();
        console.log('Quick Search Took ', end - start);
        searchProgress$.next(false);
        didSearch(res, textSearch);
      });
  };

  const useSearchAction = {
    register(component: HTMLElement, param: any) {
      const events$ = fromEvents(component, 'input', 'click').pipe(
        map((event: any) => {
          return {
            type: event.type,
            value: event.target.value.trim(),
          };
        }),
      );
      doFilter(events$);
    },
  };

  const onClickAdvanced = () => {
    const inputWidth = window['$'](searchWrapperRef).width();
    const inputLeft = searchWrapperRef.offsetLeft;
    const ele: any = document.querySelector(`#searchTaskWorkListId`);
    ele.style.left = inputLeft + 'px';
    ele.style.width = inputWidth + 'px';
    ele.style.height = '300px';
    Dropdown.show('searchTaskWorkListId');
  };

  const onCloseSearch = () => {
    Dropdown.hide('searchTaskWorkListId');
  };

  const onItemChangeFilter = (event: any, item: any) => {
    item.id = event.detail.current;

    console.log( event.detail.before);

    if (event.detail.before == '') {
      usedFilterColumns.push(event.detail.current);
    } else {
      const index = usedFilterColumns.indexOf(event.detail.before);
      if (index >= 0) {
        usedFilterColumns[index] = event.detail.current;
      }
    }
    usedFilterColumns = [...usedFilterColumns];

    console.log(usedFilterColumns);
  };

  const onSearch = (event: any, item: any) => {
    if (filterList.length >= filterColumns.length - 1 || event.detail.length === 0) {
      return;
    }

    // item.name = event.detail;

    filterList = [
      ...filterList,
      {
        id: '',
        name: '',
      },
    ];

  };

  const onRemoveFilter = (event: any) => {
    // do not allow remove last item
    if (filterList.length === 1) {
      return;
    }
    const index = filterList.findIndex((it: any) => it.id === event.id);
    if (index >= 0) {
      filterList.splice(index, 1);
      filterList = [...filterList];
    }
  };

  const onToggleDashboard = () => {
    // @ts-ignore
    showDashboard$.next(!$showDashboard$);
  };

  const onSelectSearchField = () => {
    mappedFilterList = filterList
      .filter((it: any) => !StringUtil.isEmpty(it.name))
      .map((it: any) => {
        return {
          id: it.id,
          name: T('TASK.LABEL.' + StringUtil.toUpperCaseWithUnderscore(it.id)) + ': ' + it.name,
        };
      });

    // TODO

    const param = convertArrayObjectToObject(filterList.map((it: any) => {
      return {
        [it.id]: it.name
      }
    }));


    doAdvSearch(param);
    onCloseSearch();
  };

  const doAdvSearch = (param: any = {
    taskName: '',
    projectName: '',
    assigneeName: '',
    assignerName: '',
    evaluatorName: '',
    isCompleted: '',
    isDelayDeadline: '',
    createdDateFrom: '',
    createdDateTo: ''
  } ) => {
    const start = Date.now();
    store.tskFindTasks({
      menuPath,
      departmentId: appStore.org.departmentId,
      textSearch,
      ...param
    }).subscribe((res) => {
      console.log(res);
      const end = Date.now();
      console.log('Took ', end - start);
      searchProgress$.next(false);
      didSearch(res, textSearch);
    });

  }
  const onCloseFilter = (event: any) => {
    const _filterList = SObject.clone(filterList);

    const index = _filterList.findIndex((it: any) => it.id === event.detail.id);

    if (index >= 0) {
      _filterList.splice(index, 1);
      filterList = [..._filterList];
    }

    if (filterList.length === 0) {
      filterList = [{ id: '', name: '' }];
    }
    onSelectSearchField();
  };

  const onCloseAllFilter = () => {
    filterList = [{ id: '', name: '' }];
    onSelectSearchField();
  }

  let firstTimes = true;
  const registerSubscription = () => {
    taskSub = ViewStore.loadTableMetaData$('tsk_task').subscribe((res) => {
      const query = ViewStore.createReloadSubscription('tsk_task');

      taskApolloClient$ = apolloClient.subscribe({
        query,
      });
      taskApolloClient$.subscribe((res: any) => {
        if (!firstTimes) {
          reload();
        }
        firstTimes = false;
      });
    });
  };



  const didSearch = (res: any, textSearch = '') => {
    if(!res.data) {
      store.taskList$.next([]);
      view.fullCount$.next(0);
      return;
    }

    if (res.data.payload.length === 0 && view.page > 1) {
      view.page--;
      store.tskFindTasks({menuPath, departmentId: appStore.org.departmentId});
    } else {
      store.taskList$.next(res.data.payload);
      view.fullCount$.next(res.data.fullCount);
      mark(textSearch, res.data.payload);
    }
  };


  const reload = () => {
    const start = Date.now();
    store.tskFindTasks({menuPath, departmentId: appStore.org.departmentId, isCompleted: false}).subscribe((res: any) => {
      const end = Date.now();
      console.log('Reload Took ', end - start);
      didSearch(res);
    });
    view.checkDeletedRecord(false);
  };

  const onClickTask = (event: any) => {
    selectedTask = event.detail;
  };

  const doSelect = (ob$: Observable<any>) => {
    return ob$
      .pipe(
        delay(10),
        filter((_) => selectedTask !== undefined),
        tap((_) => view.loading$.next(true)),
        switchMap((_) => forkJoin([store.tskGetTaskById(selectedTask.id)])),
      )
      .subscribe((res: any[]) => {
        view.selectedData$.next(SObject.convertFieldsToCamelCase(res[0].data[0]));
        view.loading$.next(false);
      });
  };

  onMount(() => {
    registerSubscription();
    setTimeout(() => {
      selectSub = doSelect(fromEvent(viewByTaskRef, 'click'));
    }, 1000);

    pageRef.loadSettings().then(() => {
      reload();
    });
  });

  onDestroy(() => {
    if (taskSub) {
      taskSub.unsubscribe();
    }

    if (selectSub) {
      selectSub.unsubscribe();
    }
  });

  const onAddNew = () => {
    dispatch('addNew');
    selectedTask = undefined;
  };

  const onLoadPage = (event) => {
    view.pageSize = event.detail.pageSize;
    view.page = event.detail.page;
    reload();
  };

  const onPaginationInit = (event) => {
    view.pageSize = event.detail;
  };

  // @ts-ignore
  $: {
    if (selectedId) {
      selectedTask = {
        id: selectedId,
      };
      doSelect(of(1));
    }
  }

  // @ts-ignore
  $: {
    // @ts-ignore
    const needSelectId = $needSelectId$;
    if (needSelectId) {
      selectedTask = {
        id: needSelectId,
      };
      doSelect(of(1));
    }
  }


  const mark = (textSearch: string, source: any) => {
    if (StringUtil.isEmpty(textSearch)) {
      markedData = source;
    }

    markedData = SObject.clone(source).map((item: Task) => {
      const markedName = markStringSearch(item.name, textSearch, true);
      const markedProjectName = markStringSearch(item.projectName, textSearch, true);

      if (markedName !== item.name) {
        item.name = markedName;
      }
      if (markedProjectName !== item.projectName) {
        item.projectName = markedProjectName;
      }

      return item;
    });
  };

</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .summary {
    margin-bottom: 6px;
    &__task {
      display: flex;
      flex-wrap: wrap;
      & > span {
        padding-right: $large-padding;
      }
      &__overdue {
        color: var(--my-active-color);
        font-weight: 500;
      }
      &__completed {
        color: green;
      }
      &__in-progress {
        color: #ffbf1d;
      }
      &__not-started {
      }
    }

    &__project {
      display: flex;
      flex-wrap: wrap;
      & > span {
        padding-right: $large-padding;
      }
      &__overdue {
        color: var(--my-active-color);
        font-weight: 500;
      }
      &__completed {
        color: green;
      }
      &__in-progress {
        color: #ffbf1d;
      }
      &__not-started {
      }
    }
  }
</style>

<section class="view-left-main" style="padding-top: 0px;">
  <!-- Add new -->
  <div style="display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start;">
    {#if view.isRendered(ButtonId.AddNew)}
      <Button on:click={onAddNew} btnType={ButtonType.AddNew} disabled={view.isDisabled(ButtonId.AddNew)} />
    {/if}
    <Button
      on:click={onToggleDashboard}
      btnType={ButtonType.Custom}
      title={$showDashboard$ ? T('COMMON.BUTTON.HIDE_DASHBOARD') : T('COMMON.BUTTON.SHOW_DASHBOARD')} />
  </div>
  <!--   // Add new-->
  <div class="horizontal-separator" style="margin-top: 5px;" />
  <!-- Search-->
  <div bind:this={searchWrapperRef}>
    <QuickSearch
      loading$={searchProgress$}
      on:clickAdvanced={onClickAdvanced}
      showAdvancedSearch={true}
      action={useSearchAction}
      bind:this={quickSearchRef}
      placeholder={T('TASK.LABEL.SEARCH_TASK_OR_PROJECT') + '...'}>
      <div
        id="searchTaskWorkListId"
        class="left-dropdown-content"
        style="color: black; font-weight: 400; overflow: auto; padding: 6px;">
        <div style="display: flex; justify-content: flex-end;">
          <i style="font-size: 1rem;" on:click|stopPropagation={onCloseSearch} class="fa fa-times" />
        </div>

        {#each filterList as item}
          <div style="display: flex;">
            <ContentFilter
              on:search={(e) => onSearch(e, item)}
              on:itemChange={(e) => onItemChangeFilter(e, item)}
              list={filterColumns}
              excludeList={usedFilterColumns}
              selected={item}
              bind:value={item.name} />
            <i
              on:click={() => onRemoveFilter(item)}
              class="fa fa-times"
              style="font-size: 0.7rem; display: flex; flex-direction: column; justify-content: flex-end; padding-left:
              5px; margin-bottom: 5px;" />
          </div>
        {/each}

        <div style="position: absolute; bottom: 6px; left: calc(50% - 60px);">
          <Button on:click={onSelectSearchField} btnType={ButtonType.Custom} title="SEARCH" />
        </div>
      </div>
    </QuickSearch>
  </div>
  <!-- // Search -->

  <!-- Filter -->
  {#if mappedFilterList.length > 0}
    <div style="margin-top: 6px;">
      <CloseableList
        directClose={true}
        className="closeable-list__floating-controller"
        on:close={onCloseFilter}
        on:closeAll={onCloseAllFilter}
        bind:list={mappedFilterList}
        {menuPath}
        id={view.getViewName() + 'FilterId'} />
    </div>
  {/if}
  <!-- // Filter -->
  <!-- Option task or project view -->
  <div style="display: flex; justify-content: space-evenly; margin-bottom: 6px; margin-top: 10px;">
    <Radio text={T('TASK.LABEL.TASK')} bind:group={viewBy} value="task" />
    <Radio text={T('TASK.LABEL.PROJECT')} bind:group={viewBy} value="project" />
  </div>
  <!-- // Option task or project view -->

  {#if viewBy === 'task'}
    <div style="margin-top: 1px;">
      <Pagination
        {menuPath}
        totalRecords={$fullCount$}
        smallSize={true}
        on:loadPage={onLoadPage}
        on:init={onPaginationInit}
        bind:this={pageRef} />
    </div>
    <div bind:this={viewByTaskRef}>
      {#if markedData}
        {#if markedData.length > 0}
          {#each markedData as task}
            <TaskView task={SObject.convertFieldsToCamelCase(task)} {selectedTask} on:click={onClickTask} />
          {/each}
        {:else}{T('TASK.MSG.NO_TASK_FOUND')}{/if}
      {:else}
        {@html App.PROGRESS_BAR}
      {/if}
    </div>
  {/if}

  {#if viewBy === 'project'}
    <div>
      {#each $projectList$ as project}
        <ProjectView {project} />
      {/each}
    </div>
  {/if}

</section>
