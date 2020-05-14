<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { ViewStore } from '@/store/view';
  import QuickSearch from '@/components/ui/float-input/quick-search';
  import { switchMap, map, tap, filter, delay } from 'rxjs/operators';
  import { fromEvents } from '@/lib/js/rx';
  import { T } from '@/lib/js/locale/locale';
  import { forkJoin, fromEvent, Observable, Subscription } from 'rxjs';
  import { Dropdown } from '@/lib/js/dropdown';
  import Radio from '@/components/ui/float-input/radio';
  import Store from '../store';
  import TaskView from '../components/task-view/index.svelte';
  import ProjectView from '../components/project-view/index.svelte';
  import { Task } from '../../types';
  import Button from '@/components/ui/flat-button';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';
  import ContentFilter from '@/components/ui/float-input/content-filter';
  import { filterColumns } from './helper';
  import CloseableList from '@/components/ui/closeable-list';
  import { StringUtil } from '@/lib/js/string-util';
  import { SObject } from '@/lib/js/sobject';
  import { apolloClient } from '@/lib/js/hasura-client';
  import { App } from '@/lib/js/constants';
  import { appStore } from '@/store/app';
  import Pagination from '@/components/ui/pagination';

  export let menuPath: string;
  export let view: ViewStore;
  export let store: Store;

  const { fullCount$ } = view;
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

  const dispatch = createEventDispatcher();
  const doFilter = (ob$: Observable<any>) => {
    ob$
      // .pipe()
      .subscribe((res) => {
        // console.log(res);
        // data = res.data;
      });
  };

  const useSearchAction = {
    register(component: HTMLElement, param: any) {
      const events$ = fromEvents(component, 'input', 'click').pipe(
        map((event: any) => {
          return {
            type: event.type,
            value: event.target.value,
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

    if (event.detail.before == '-1') {
      usedFilterColumns.push(event.detail.current);
    } else {
      const index = usedFilterColumns.indexOf(event.detail.before);
      if (index >= 0) {
        usedFilterColumns[index] = event.detail.current;
      }
    }
    usedFilterColumns = [...usedFilterColumns];
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
    onCloseSearch();
  };

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

  const reload = () => {
    store.tskFindTasks(menuPath, appStore.org.departmentId);
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
              5px;" />
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
        className="closeable-list__floating-controller"
        on:close={onCloseFilter}
        data={mappedFilterList}
        {menuPath}
        id={view.getViewName() + 'FilterId'} />
    </div>
  {/if}
  <!-- // Filter -->

  <!-- Option task or project view -->
  <div style="display: flex; justify-content: space-evenly; margin-bottom: 6px;">
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
      {#if $taskList$}
        {#if $taskList$.length > 0}
          {#each $taskList$ as task}
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
