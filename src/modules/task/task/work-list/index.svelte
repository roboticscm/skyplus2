<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
  import { ViewStore } from 'src/store/view';
  import QuickSearch from 'src/components/ui/input/quick-search';
  import { switchMap, map, tap, filter, delay, debounceTime, distinctUntilChanged } from 'rxjs/operators';
  import { fromEvents } from 'src/lib/js/rx';
  import { T } from 'src/lib/js/locale/locale';
  import { forkJoin, fromEvent, Observable, Subscription, of, BehaviorSubject, EMPTY } from 'rxjs';
  import { Dropdown } from 'src/lib/js/dropdown';
  import Radio from 'src/components/ui/float-input/radio';
  import Store from '../store';
  import TaskView from '../components/task-view/index.svelte';
  import ProjectView from '../components/project-view/index.svelte';
  import { Task } from '../../types';
  import Button from 'src/components/ui/flat-button';
  import { ButtonType, ButtonId } from 'src/components/ui/button/types';
  import ContentFilter from 'src/components/ui/float-input/content-filter';
  import { convertArrayObjectToObject, getStatusCodeById } from './helper';
  import CloseableList from 'src/components/ui/closeable-list';
  import { StringUtil } from 'src/lib/js/string-util';
  import { SObject } from 'src/lib/js/sobject';
  import { apolloClient } from 'src/lib/js/hasura-client';
  import { App } from 'src/lib/js/constants';
  import { appStore, AppStore } from 'src/store/app';
  import Pagination from 'src/components/ui/pagination';
  import { markStringSearch } from 'src/lib/js/util';
  import { SDate } from 'src/lib/js/sdate';
  import { TableUtilStore } from 'src/store/table-util';
  import FunctionalStatus from 'src/components/layout/functional-status';
  import { functionalStatusFields } from './helper';
  import MainContent from '../content/index.svelte';
  import { getTargetIdFromUrlParam, getViewTitleFromMenuPath } from 'src/lib/js/url-util';

  export let menuPath: string;
  export let view: ViewStore;
  export let store: Store;
  export let selectedId: string = undefined;

  // @ts-ignore
  const { isDetailPage$ } = AppStore;

  const { fullCount$, needSelectId$ } = view;
  const { taskList$, projectList$, showDashboard$ } = store;
  let quickSearchRef: any;
  let searchWrapperRef: any;
  let viewBy = 'task';
  let selectedTask: Task = undefined;

  let mappedFilterList: any[] = [];
  let mappedFunctionalStatusFields: any[] = functionalStatusFields;
  let usedFilterColumns: any[] = [];

  let taskSub, selectSub: Subscription;
  let taskApolloClient$: any;
  let viewByTaskRef, pageRef, functionalStatusRef, workListHeaderRef, listRef: any;

  const searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  let markedData: any[] = undefined;
  let textSearch: string = '';
  let searchKeyword: string = '';
  let mainContentRef: any;
  let detailTitle = '';
  const filterColumns = view.searchFields.map((it: any) => {
    it.name = T('TASK.LABEL.' + it.name);
    return it;
  });

  const dispatch = createEventDispatcher();

  const getDefaultValueForItem = (item: any) => {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      value: null,
    };
  };
  let filteredList: any[] = [getDefaultValueForItem(filterColumns[0])];

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
        console.log('Quick Search Took 1 ', end - start);
        searchProgress$.next(false);
        didSearch(res, textSearch);
      });
  };

  const makeSearch$ = () => {
    const searchParam = getAdvSearchParam();

    if (StringUtil.isEmpty(textSearch) && SObject.isEmptyField(searchParam)) {
      return store.tskFindTasks({ menuPath, departmentId: appStore.org.departmentId });
    } else if (textSearch.startsWith(App.SEARCH_ALL)) {
      textSearch = '';
      return store.tskFindTasks({ menuPath, departmentId: appStore.org.departmentId });
    } else {
      let _textSearch = '';
      const isExactly = textSearch.includes(App.SEARCH_EXACTLY) ? true : false;
      if (isExactly) {
        _textSearch = StringUtil.formatExactlySearchParam(textSearch);
      } else {
        _textSearch = StringUtil.formatFTSParam(textSearch);
      }

      return store.tskFindTasks({
        menuPath,
        departmentId: appStore.org.departmentId,
        textSearch: _textSearch,
        ...searchParam,
        isExactly,
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
    if (event.detail > 1) {
      onSelectSearchField();
    }
  };

  const findNextItemIndex = () => {
    for (let i = 0; i < filterColumns.length; i++) {
      if (filteredList.findIndex((item: any) => item.id === filterColumns[i].id) < 0) {
        return i;
      }
    }
    return -1;
  };

  const getNextItem = (defaultValue: any) => {
    const nextIndex = findNextItemIndex();
    if (nextIndex > -1) {
      return {
        ...filterColumns[nextIndex],
        value: defaultValue,
      };
    }
    return {};
  };

  const onSearch = (event: any, item: any, idx: number) => {
    if (filteredList.length > filterColumns.length - 1) {
      onSelectSearchField();
      return;
    }

    const index = usedFilterColumns.indexOf(item.id);
    if (index < 0) {
      usedFilterColumns.push(item.id);
      usedFilterColumns = [...usedFilterColumns];
    }

    // render checkbox
    if (typeof event.detail === 'boolean') {
      if (index < 0 || (filteredList.length > 0 && filteredList[filteredList.length - 1].type === 'boolean')) {
        filteredList = [...filteredList, getNextItem(null)];
      }
      // render datepicker
    } else if (typeof event.detail === 'number') {
      if (
        event.detail &&
        (index < 0 || (filteredList.length > 0 && filteredList[filteredList.length - 1].type === 'date'))
      ) {
        filteredList = [...filteredList, getNextItem(Date.now())];
      }
    } else {
      // render text
      if (filteredList.length > 0 && filteredList[filteredList.length - 1].value !== '') {
        filteredList = [...filteredList, getNextItem('')];
      }

      if (
        ((event.detail && event.detail.length > 0) || (item.value && item.value.length > 0)) &&
        idx < filterColumns.length - 1
      ) {
        setTimeout(() => {
          const nextEle: any = document.querySelector('#' + filterColumns[idx + 1].id);
          nextEle && nextEle.focus();
        }, 200);
      }
    }
  };

  const removeFilterItem = (itemId: string, type: string) => {
    const index = filteredList.findIndex((it: any) => it.id === itemId);
    if (index >= 0) {
      filteredList.splice(index, 1);
      filteredList = [...filteredList];
    }

    if (mappedFunctionalStatusFields.findIndex((it: any) => it.id === itemId) >= 0) {
      functionalStatusRef && functionalStatusRef.clearActive();
    }

    if (filteredList.length === 0) {
      filteredList = [getDefaultValueForItem(filterColumns[0])];
    }

    const usedIndex = usedFilterColumns.indexOf(itemId);
    if (usedIndex >= 0) {
      usedFilterColumns.splice(usedIndex, 1);
      usedFilterColumns = [...usedFilterColumns];
    }
  };

  const removeAllFilterItems = () => {
    usedFilterColumns = [];
    filteredList = [getDefaultValueForItem(filterColumns[0])];
  };

  const onRemoveFilter = (event: any) => {
    // do not allow remove last item
    if (filteredList.length === 1) {
      return;
    }

    removeFilterItem(event.id, event.type);
  };

  const onToggleDashboard = () => {
    // @ts-ignore
    showDashboard$.next(!$showDashboard$);
  };

  const onSelectSearchField = () => {
    mappedFilterList = filteredList
      .filter((it: any) => !StringUtil.isEmpty(it.value))
      .map((it: any) => {
        return {
          id: it.id,
          lineThrough: typeof it.value === 'boolean' ? !it.value : false,
          name:
            it.name +
            (typeof it.value === 'number'
              ? ': ' + SDate.convertMillisecondToDateTimeString(it.value)
              : typeof it.value === 'boolean'
              ? ''
              : ': ' + it.value),
        };
      });

    doAdvSearch();
    onCloseSearch();
  };

  const getAdvSearchParam = () => {
    let param = convertArrayObjectToObject(
      filteredList.map((it: any) => {
        const statusCode = getStatusCodeById(it.id);
        if (statusCode !== null) {
          return {
            submitStatus: statusCode,
          };
        } else {
          return {
            [it.id]: it.value,
          };
        }
      }),
    );

    return param;
  };

  const doAdvSearch = () => {
    const start = Date.now();
    searchProgress$.next(true);
    makeSearch$().subscribe((res) => {
      const end = Date.now();
      console.log('Took ', end - start);
      searchProgress$.next(false);
      didSearch(res, textSearch);
    });
  };
  const onCloseFilter = (event: any) => {
    removeFilterItem(event.detail.id, event.detail.type);
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

      mark(getKeyword(filteredList, textSearch), res.data.payload);
    }
  };

  const getKeyword = (filteredList: any[], textSearch: string) => {
    const keywordFilterList = filteredList
      .filter((it: any) => typeof it.value === 'string' && it.value !== '')
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

  const reload = () => {
    const start = Date.now();
    makeSearch$().subscribe((res: any) => {
      const end = Date.now();
      console.log('Reload Took ', end - start);
      didSearch(res);
    });
    view.checkDeletedRecord(false);

    store.tskStatusCount(menuPath, appStore.org.departmentId).subscribe((res: any) => {
      functionalStatusFields[0].counter = res.data[0].statusNew;
      functionalStatusFields[1].counter = res.data[0].statusSubmitted;
      functionalStatusFields[2].counter = res.data[0].statusAssigned;
      functionalStatusFields[3].counter = res.data[0].statusProcessing;
      functionalStatusFields[4].counter = res.data[0].statusCompleted;

      mappedFunctionalStatusFields = [...functionalStatusFields];
    });
  };

  const onClickTask = (event: any) => {
    selectedTask = event.detail;
  };

  const doSelect = (ob$: Observable<any>) => {
    return ob$
      .pipe(
        delay(100),
        filter((_) => selectedTask !== undefined),
        tap((_) => {
          view.loading$.next(true);
        }),
        switchMap((_) => forkJoin([store.tskGetTaskById(selectedTask.id)])),
      )
      .subscribe((res: any[]) => {
        if ((window as any).isSmartPhone) {
          isDetailPage$.next(true);
          setTimeout(() => {
            const selectedData = SObject.convertFieldsToCamelCase(res[0].data[0]);
            view.selectedData$.next(selectedData);
            detailTitle =
              getViewTitleFromMenuPath(menuPath) + ' - ' + selectedData.name + ' (' + selectedData.code + ')';
            view.loading$.next(false);
          });
        } else {
          view.selectedData$.next(SObject.convertFieldsToCamelCase(res[0].data[0]));
          view.loading$.next(false);
        }
      });
  };

  onMount(() => {
    registerSubscription();

    if (pageRef) {
      pageRef.loadSettings().then(() => {
        reload();
      });
    }

    needSelectId$.subscribe((id: string) => {
      if (id) {
        selectedTask = {
          id,
        };
        doSelect(of(1));
      }
    });

    // select target from email link
    setTimeout(() => {
      const targetId = getTargetIdFromUrlParam();
      if (targetId) {
        selectedTask = {
          id: targetId,
        };
        doSelect(of(1));
      }
    }, 1000);

    onClickFunctionalStatus({
      detail: {
        field: mappedFunctionalStatusFields[3].id,
        title: mappedFunctionalStatusFields[3].title,
        value: true,
      },
    });

    const headerHeight = window['$'](workListHeaderRef).height() + 10;
    if (listRef) {
      listRef.style.height = `calc(100% - ${headerHeight}px)`;
    }
  });

  onDestroy(() => {
    taskSub && taskSub.unsubscribe();
    selectSub && selectSub.unsubscribe();

    taskApolloClient$ && taskApolloClient$.unsubscribe();
  });

  const onAddNew = () => {
    selectedTask = undefined;
    if ((window as any).isSmartPhone) {
      isDetailPage$.next(true);
      setTimeout(() => {
        mainContentRef && mainContentRef.doAddNew();
      }, 500);
    } else {
      dispatch('addNew');
    }
  };

  const onLoadPage = (event) => {
    view.pageSize = event.detail.pageSize;
    view.page = event.detail.page;
    reload();
  };

  const onPaginationInit = (event) => {
    view.pageSize = event.detail;
  };

  // select target from notify list
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
  $: searchKeyword = getKeyword(filteredList, textSearch);

  const mark = (textSearch: string, source: any) => {
    if (StringUtil.isEmpty(textSearch)) {
      markedData = source;
      return;
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

  const doAutocompleteSearch = (field: string, textSearch: string) => {
    let query: string = undefined;
    textSearch = StringUtil.formatSearchParam(textSearch);
    switch (field) {
      case 'taskCode':
        query = `
          SELECT DISTINCT code AS id, code AS name, access_date
          FROM tsk_task
          WHERE F_UNACCENT(code) ~* '${textSearch}'
          ORDER BY access_date
        `;
        break;

      case 'taskName':
        query = `
          SELECT DISTINCT name AS id, name AS name, access_date
          FROM tsk_task
          WHERE F_UNACCENT(name) ~* '${textSearch}'
          ORDER BY access_date
        `;
        break;

      case 'projectName':
        query = `
          SELECT DISTINCT p.name AS id, p.name AS name, p.access_date
          FROM tsk_task t
          LEFT JOIN tsk_project p ON p.id = t.project_id
          WHERE F_UNACCENT(p.name) ~* '${textSearch}'
          ORDER BY p.access_date, p.name
        `;
        break;
      case 'assigneeName':
        query = `
          SELECT DISTINCT assignee.last_name || ' ' || assignee.first_name AS id, assignee.last_name || ' ' || assignee.first_name AS name
          FROM tsk_task t
          LEFT JOIN tsk_assign_human_or_org assign ON assign.task_id = t.id
          LEFT JOIN human_or_org assignee ON assignee.id = assign.human_or_org_id
          WHERE assign.assign_position='ASSIGNEE' AND F_UNACCENT(assignee.last_name || ' ' || assignee.first_name) ~* '${textSearch}'
          ORDER BY name
        `;
        break;
      case 'assignerName':
        query = `
          SELECT DISTINCT assignee.last_name || ' ' || assignee.first_name AS id, assignee.last_name || ' ' || assignee.first_name AS name
          FROM tsk_task t
          LEFT JOIN tsk_assign_human_or_org assign ON assign.task_id = t.id
          LEFT JOIN human_or_org assignee ON assignee.id = assign.human_or_org_id
          WHERE assign.assign_position='ASSIGNER' AND F_UNACCENT(assignee.last_name || ' ' || assignee.first_name) ~* '${textSearch}'
          ORDER BY name
        `;
        break;

      case 'evaluatorName':
        query = `
          SELECT DISTINCT assignee.last_name || ' ' || assignee.first_name AS id, assignee.last_name || ' ' || assignee.first_name AS name
          FROM tsk_task t
          LEFT JOIN tsk_assign_human_or_org assign ON assign.task_id = t.id
          LEFT JOIN human_or_org assignee ON assignee.id = assign.human_or_org_id
          WHERE assign.assign_position='EVALUATOR' AND F_UNACCENT(assignee.last_name || ' ' || assignee.first_name) ~* '${textSearch}'
          ORDER BY name
        `;
        break;
      default:
        break;
    }

    if (query) {
      return TableUtilStore.jsonQuery(query);
    } else {
      return EMPTY;
    }
  };

  const onClickFunctionalStatus = (event: any) => {
    view.page = 1;
    if (event.detail.field === 'recent') {
      filteredList = [getDefaultValueForItem(filterColumns[0])];
      textSearch = App.SEARCH_ALL;
    } else {
      const selectedStatusField = {
        id: event.detail.field,
        name: event.detail.title,
        value: true,
      };

      // remove the old first
      filteredList = [
        ...filteredList.filter((it: any) => mappedFunctionalStatusFields.findIndex((f: any) => f.id === it.id) < 0),
        selectedStatusField,
      ];
    }

    onSelectSearchField();
  };

  const onClickBack = () => {
    isDetailPage$.next(false);
  };

  const useActionTask = (component, param) => {
    selectSub = doSelect(fromEvent(component, 'click'));
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
    height: 60vh;
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
      height: calc(60vh - 40px);
      overflow: auto;
      &__content {
        padding-bottom: 100px;
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

{#if $isDetailPage$ && window.isSmartPhone}
  <section style="width: 100%;">
    <MainContent backCallback={onClickBack} {detailTitle} {view} {menuPath} {store} bind:this={mainContentRef} />
  </section>
{:else}
  <section class="view-left-main" style="padding-top: 0px;">
    <div bind:this={workListHeaderRef}>
      <!-- Add new -->
      <div style="display: flex; justify-content: center; align-content: flex-start;">
        {#if view.isRendered(ButtonId.AddNew)}
          <Button on:click={onAddNew} btnType={ButtonType.AddNew} disabled={view.isDisabled(ButtonId.AddNew)} />
        {/if}
        <Button
          on:click={onToggleDashboard}
          btnType={ButtonType.Dashboard}
          text={$showDashboard$ ? T('COMMON.BUTTON.HIDE_DASHBOARD') : T('COMMON.BUTTON.SHOW_DASHBOARD')} />
      </div>
      <!--   // Add new-->
      <div class="horizontal-separator" style="margin-top: 5px;" />

      <div style="margin-top: 6px; margin-bottom: 4px;">
        <FunctionalStatus
          bind:this={functionalStatusRef}
          data={mappedFunctionalStatusFields}
          on:click={onClickFunctionalStatus} />
      </div>
    </div>
    <div bind:this={listRef} style="overflow: auto;">
      <!-- Search-->
      <div bind:this={searchWrapperRef}>
        <QuickSearch
          loading$={searchProgress$}
          on:clickAdvanced={onClickAdvanced}
          showAdvancedSearch={true}
          action={useSearchAction}
          bind:this={quickSearchRef}
          placeholder={T('TASK.LABEL.SEARCH_TASK_OR_PROJECT')}>
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
                  {#each filteredList.filter((it) => mappedFunctionalStatusFields.findIndex((f) => f.id === it.id) < 0) as item, index}
                    <div style="display: flex;">
                      <ContentFilter
                        {menuPath}
                        searchFunc={doAutocompleteSearch}
                        on:emptyCount={onEmptyCountSearchAdv}
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

        <div bind:this={viewByTaskRef} use:useActionTask>
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
    </div>
  </section>
{/if}
