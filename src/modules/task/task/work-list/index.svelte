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
  import { convertArrayObjectToObject, filterColumns } from './helper';
  import CloseableList from '@/components/ui/closeable-list';
  import { StringUtil } from '@/lib/js/string-util';
  import { SObject } from '@/lib/js/sobject';
  import { apolloClient } from '@/lib/js/hasura-client';
  import { App } from '@/lib/js/constants';
  import { appStore } from '@/store/app';
  import Pagination from '@/components/ui/pagination';
  import { markStringSearch } from '../../../../lib/js/util';

  export let menuPath: string;
  export let view: ViewStore;
  export let store: Store;
  export let selectedId: string = undefined;

  const { fullCount$, needSelectId$ } = view;
  const { taskList$, projectList$, showDashboard$ } = store;
  let quickSearchRef: any;
  let searchWrapperRef: any;
  let viewBy = 'task';
  let selectedTask: Task = undefined;

  let filterList: any[] = [{ id: '', name: '', value: '' }];
  let mappedFilterList: any[] = [];

  let usedFilterColumns: any[] = [];

  let taskSub, selectSub: Subscription;
  let taskApolloClient$: any;
  let viewByTaskRef, pageRef: any;

  const searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  let markedData: any[] = undefined;
  let textSearch: string = '';
  let searchKeyword: string = '';

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
        switchMap((_) => makeSearch$()),
      )
      .subscribe((res) => {
        const end = Date.now();
        console.log('Quick Search Took ', end - start);
        searchProgress$.next(false);
        didSearch(res, textSearch);
      });
  };

  const makeSearch$ = () => {
    if (StringUtil.isEmpty(textSearch) && SObject.isEmptyField(getAdvSearchParam())) {
      return store.tskFindTasks({ menuPath, departmentId: appStore.org.departmentId, isCompleted: false });
    } else {
      return store.tskFindTasks({
        menuPath,
        departmentId: appStore.org.departmentId,
        textSearch: StringUtil.formatFTSParam(textSearch),
        ...getAdvSearchParam(),
      });
    }
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
    // ele.style.height = '400px';
    Dropdown.show('searchTaskWorkListId');
  };

  const onCloseSearch = () => {
    Dropdown.hide('searchTaskWorkListId');
  };

  const onItemChangeFilter = (event: any, item: any) => {
    item.id = event.detail.id;
    item.name = event.detail.name;
    item.type = event.detail.type;

    // item.name = e
    const index = usedFilterColumns.indexOf(event.detail.current);
    if (index < 0) {
      usedFilterColumns.push(event.detail.current);
      usedFilterColumns = [...usedFilterColumns];
    }
  };

  const onEmptyCountSearchAdv = (event: any) => {
    if(event.detail > 1) {
      onSelectSearchField();
    }
  }

  const onSearch = (event: any, item: any, idx: number) => {
    if (filterList.length >= filterColumns.length - 1) {
      onSelectSearchField();
      return;
    }

    // render checkbox
    if(typeof event.detail === 'boolean') {
      const index = usedFilterColumns.indexOf(item.id);
      if (index < 0) {
        usedFilterColumns.push(item.id);
        usedFilterColumns = [...usedFilterColumns];
      }

      if (index < 0 || (filterList.length > 0 && filterList[filterList.length - 1].type === 'boolean' )) {
        filterList = [
          ...filterList,
          {
            id: '',
            name: '',
            value: '',
          },
        ];
      }

      return;
    }



    const index = usedFilterColumns.indexOf(item.id);
    if (index < 0) {
      usedFilterColumns.push(item.id);
      usedFilterColumns = [...usedFilterColumns];
    }

    if (filterList.length > 0 && filterList[filterList.length - 1].value !== '') {
      filterList = [
        ...filterList,
        {
          id: '',
          name: '',
          value: '',
        },
      ];
    }

    if (((event.detail && event.detail.length > 0) || (item.value && item.value.length > 0) ) &&  idx < filterColumns.length - 1) {
      setTimeout(() => {
        const nextEle: any = document.querySelector('#' + filterColumns[idx + 1].id);
        nextEle && nextEle.focus();
      }, 200);
    }
  };

  const removeFilterItem = (itemId: string) => {
    const index = filterList.findIndex((it: any) => it.id === itemId);
    if (index >= 0) {
      filterList.splice(index, 1);
      filterList = [...filterList];
    }

    if (filterList.length === 0) {
      filterList = [{ id: filterColumns[0].id, name: filterColumns[0].name, value: '' }];
    }

    const usedIndex = usedFilterColumns.indexOf(itemId);
    if (usedIndex >= 0) {
      usedFilterColumns.splice(usedIndex, 1);
      usedFilterColumns = [...usedFilterColumns];
    }
  };

  const removeAllFilterItems = () => {
    usedFilterColumns = [];
    filterList = [
      {
        id: filterColumns[0].id,
        name: filterColumns[0].name,
        value: '',
      },
    ];
  };

  const onRemoveFilter = (event: any) => {
    // do not allow remove last item
    if (filterList.length === 1) {
      return;
    }

    removeFilterItem(event.id);
  };

  const onToggleDashboard = () => {
    // @ts-ignore
    showDashboard$.next(!$showDashboard$);
  };

  const onSelectSearchField = () => {
    mappedFilterList = filterList
      .filter((it: any) => !StringUtil.isEmpty(it.value))
      .map((it: any) => {
        return {
          id: it.id,
          name: it.name + ': ' + it.value,
        };
      });

    doAdvSearch();
    onCloseSearch();
  };

  const getAdvSearchParam = () => {
    let param = convertArrayObjectToObject(
      filterList.map((it: any) => {
        return {
          [it.id]: it.value,
        };
      }),
    );

    if (SObject.isEmptyField(param) && StringUtil.isEmpty(textSearch)) {
      param = { isCompleted: false };
    }

    return param;
  };

  const doAdvSearch = () => {
    const start = Date.now();
    searchProgress$.next(true);
    makeSearch$().subscribe((res) => {
      console.log(res);
      const end = Date.now();
      console.log('Took ', end - start);
      searchProgress$.next(false);
      didSearch(res, textSearch);
    });
  };
  const onCloseFilter = (event: any) => {
    removeFilterItem(event.detail.id);
    onSelectSearchField();
  };

  const onCloseAllFilter = () => {
    removeAllFilterItems();
    onSelectSearchField();
  };

  let firstTimes = true;
  const registerSubscription = () => {
    taskSub = ViewStore.loadTableMetaData$('tsk_task').subscribe((res) => {
      const query = ViewStore.createReloadSubscription('tsk_task');
      taskApolloClient$ = apolloClient
        .subscribe({
          query,
        })
        .subscribe((res: any) => {
          if (!firstTimes) {
            reload();
          }
          firstTimes = false;
        });
    });
  };

  const didSearch = (res: any, textSearch = '') => {
    if (!res.data) {
      store.taskList$.next([]);
      view.fullCount$.next(0);
      return;
    }

    if (res.data.payload.length === 0 && view.page > 1) {
      view.page--;
      store.tskFindTasks({ menuPath, departmentId: appStore.org.departmentId });
    } else {
      store.taskList$.next(res.data.payload);
      view.fullCount$.next(res.data.fullCount);

      mark(getKeyword(filterList, textSearch), res.data.payload);
    }
  };

  const getKeyword = (filterList: any[], textSearch: string) => {
    const keywordFilterList = filterList
      .filter((it: any) => it.value !== '')
      .map((it: any) => it.value)
      .join('|');

    let searchKeyword = textSearch;
    if (!StringUtil.isEmpty(textSearch) && !StringUtil.isEmpty(keywordFilterList)) {
      searchKeyword = textSearch + '|' + keywordFilterList;
    } else if (!StringUtil.isEmpty(keywordFilterList)) {
      searchKeyword = keywordFilterList;
    }

    return searchKeyword;
  };

  // TODO
  const reload = () => {
    const start = Date.now();
    makeSearch$().subscribe((res: any) => {
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

    needSelectId$.subscribe((id: string) => {
      console.log('id: ', id);
      if (id) {
        selectedTask = {
          id,
        };
        doSelect(of(1));
      }
    });
  });

  onDestroy(() => {
    taskSub && taskSub.unsubscribe();
    selectSub && selectSub.unsubscribe();

    taskApolloClient$ && taskApolloClient$.unsubscribe();
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

  //
  // // @ts-ignore
  // $: {
  //   // @ts-ignore
  //   const needSelectId = $needSelectId$;
  //   if (needSelectId) {
  //     selectedTask = {
  //       id: needSelectId,
  //     };
  //     doSelect(of(1));
  //   }
  // }

  // @ts-ignore
  $: searchKeyword = getKeyword(filterList, textSearch);

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

  .advanced-search {
    height: 400px;
    &__header {
      display: flex;
      justify-content: flex-end;
      /*&:hover {*/
      /*  .advanced-search__header__search {*/
      /*    display: flex;*/
      /*  }*/
      /*}*/
      &__search {
        width: 70%;
        display: none;
        justify-content: flex-end;
      }
      &__close {
        width: 30%;
        display: flex;
        justify-content: flex-end;
        height: 5px;
      }
    }

    &__body {
      height: 360px;
      overflow: auto;
      &__content {
        padding-bottom: 60px;
        &__close-item {
          font-size: 0.7rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          margin-right: 20px;
          margin-left: 10px;
          margin-bottom: 5px;
        }
      }
    }

    &__footer {
      height: 25px;
      text-align: center;
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
      text={$showDashboard$ ? T('COMMON.BUTTON.HIDE_DASHBOARD') : T('COMMON.BUTTON.SHOW_DASHBOARD')} />
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
        style="color: black; font-weight: 400; padding: 6px;">
        <div class="advanced-search">
          <div class="advanced-search__header">
            <div class="advanced-search__header__search">
              <Button on:click={onSelectSearchField} btnType={ButtonType.Custom} text={T('COMMON.BUTTON.SEARCH')} />
            </div>
            <div class="advanced-search__header__close">
              <i style="font-size: 1rem;" on:click|stopPropagation={onCloseSearch} class="primary fa fa-times" />
            </div>
          </div>

          <div class="advanced-search__body">
            <div class="advanced-search__body__content">
              {#each filterList as item, index}
                <div style="display: flex;">
                  <ContentFilter
                          on:emptyCount = {onEmptyCountSearchAdv}
                    id={item.id}
                    on:search={(e) => onSearch(e, item, index)}
                    on:itemChange={(e) => onItemChangeFilter(e, item)}
                    list={filterColumns}
                    excludeList={usedFilterColumns}
                    selected={item}
                    bind:value={item.value} />
                  <i
                    on:click={() => onRemoveFilter(item)}
                    class="primary advanced-search__body__content__close-item fa fa-times" />
                </div>
              {/each}
            </div>
          </div>

          <div class="advanced-search__footer">
            <Button on:click={onSelectSearchField} btnType={ButtonType.Custom} text={T('COMMON.BUTTON.SEARCH')} />
          </div>
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
        className="closeable-list__floating-controller closeable-list-auto-height"
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
            <TaskView
              keyword={searchKeyword}
              task={SObject.convertFieldsToCamelCase(task)}
              {selectedTask}
              on:click={onClickTask} />
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
