<script lang="ts">
  import { ViewStore } from '@/store/view';
  import QuickSearch from '@/components/ui/float-input/quick-search';
  import { switchMap, map } from 'rxjs/operators';
  import { fromEvents } from '@/lib/js/rx';
  import { T } from '@/lib/js/locale/locale';
  import { Observable } from 'rxjs';
  import { Dropdown } from '@/lib/js/dropdown';
  import Radio from '@/components/ui/float-input/radio';
  import Store from '../store';
  import TaskView from '../components/task-view/index.svelte';
  import ProjectView from '../components/project-view/index.svelte';
  import { Task } from '../../types';
  import Button from '@/components/ui/flat-button';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';
  import ContentFilter from '@/components/ui/float-input/content-filter';
  import {filterColumns} from './helper';

  export let menuPath: string;
  export let callFrom = 'Self';
  export let view: ViewStore;
  export let store: Store;

  menuPath;
  callFrom;
  view;

  const { taskList$, projectList$ } = store;
  let quickSearchRef: any;
  let searchWrapperRef: any;
  let viewBy = 'task';
  let selectedTask: Task;

  let filterList: any[] = [
    {id: 'taskName', name: ''},
  ];

  let usedFilterColumns: any[] = [];

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

  const onMouseoutAdvanced = () => {
    Dropdown.hide('searchTaskWorkListId');
  };

  const onClickTask = (event: any) => {
    selectedTask = event.detail;
  };

  const onItemChangeFilter = (event: any, item: any) => {
    item.id = event.detail.current;

    if(event.detail.before == '-1') {
      usedFilterColumns.push(event.detail.current);
    } else {
      const index = usedFilterColumns.indexOf(event.detail.before);
      if(index>=0) {
        usedFilterColumns[index] = event.detail.current;
      }
    }
    usedFilterColumns = [...usedFilterColumns];
  }

  const onSearch = (event: any, item: any) => {
    if(filterList.length >= filterColumns.length-1 || event.detail.length === 0) {
      return;
    }

    // item.name = event.detail;

    filterList = [...filterList, {
      id: '', name: ''
    }];

  }

  const onRemoveFilter = (event: any) => {
    console.log(event);
    const index = filterList.findIndex((it: any) => it.id === event.id);
    if (index >= 0) {
      filterList.splice(index, 1);
      filterList = [...filterList];
    }
  }
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

<section class="view-left-main">
  <!-- Add new -->
  {#if view.isRendered(ButtonId.AddNew)}
    <Button btnType={ButtonType.AddNew} disabled={view.isDisabled(ButtonId.AddNew)} />
  {/if}
  <Button btnType={ButtonType.Custom} title={T('COMMON.BUTTON.DASHBOARD')} />
  <!-- Add new -->
  <div class="horizontal-separator"> </div>
  <!-- Search-->
  <div bind:this={searchWrapperRef}>
    <QuickSearch
      on:clickAdvanced={onClickAdvanced}
      showAdvancedSearch={true}
      action={useSearchAction}
      bind:this={quickSearchRef}
      placeholder={T('TASK.LABEL.SEARCH_TASK_OR_PROJECT') + '...'}>
      <div id="searchTaskWorkListId" class="left-dropdown-content" style="color: black; font-weight: 100; overflow: auto; padding: 6px;">
        <div>
          <button>Search</button>
          <button>Close</button>
        </div>




          {#each filterList as item}
<div style="display: flex;">
            <ContentFilter
                    on:search={(e)=>onSearch(e, item)}
                    on:itemChange={(e) => onItemChangeFilter (e, item)}
                    list={filterColumns}
                    excludeList={usedFilterColumns}
                            bind:value={item.name}
                    />
  <i on:click={() => onRemoveFilter(item)} class="fa fa-times" style="display: flex; flex-direction: column; justify-content: flex-end; padding-left: 5px;"></i>
</div>
            {/each}







      </div>
    </QuickSearch>
  </div>
  <!-- // Search -->

  <!-- Option task or project view -->
  <div style="display: flex; justify-content: space-evenly; margin-bottom: 6px;">
    <Radio text={T('TASK.LABEL.TASK')} bind:group={viewBy} value="task" />
    <Radio text={T('TASK.LABEL.PROJECT')} bind:group={viewBy} value="project" />
  </div>
  <!-- // Option task or project view -->

  <!-- Task Summary -->
  <div class="summary">
    {#if viewBy === 'task'}
      <div class="summary__task">
        <span>
          {T('TASK.LABEL.OVERDUE')}(
          <span class="summary__task__overdue">1</span>
          )
        </span>
        <span>
          {T('TASK.LABEL.COMPLETED')}(
          <span class="summary__task__completed">2</span>
          )
        </span>
        <span>
          {T('TASK.LABEL.IN_PROGRESS')}(
          <span class="summary__task__in-progress">1</span>
          )
        </span>
        <span>
          {T('TASK.LABEL.NOT_STARTED')}(
          <span class="summary__task__not-started">3</span>
          )
        </span>
      </div>
    {/if}

    {#if viewBy === 'project'}
      <div class="summary__project">
        <span>
          {T('TASK.LABEL.OVERDUE')}(
          <span class="summary__project__overdue">2</span>
          )
        </span>
        <span>
          {T('TASK.LABEL.COMPLETED')}(
          <span class="summary__project__completed">0</span>
          )
        </span>
        <span>
          {T('TASK.LABEL.IN_PROGRESS')}(
          <span class="summary__project__in-progress">2</span>
          )
        </span>
        <span>
          {T('TASK.LABEL.NOT_STARTED')}(
          <span class="summary__project__not-started">0</span>
          )
        </span>
      </div>
    {/if}
  </div>
  <!-- // Task Summary -->

  {#if viewBy === 'task'}
    <div>
      {#each $taskList$ as task}
        <TaskView {task} {selectedTask} on:click={onClickTask} />
      {/each}
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
