<script lang="ts">
  import { onMount, onDestroy, SvelteComponent } from 'svelte';
  import { fromEvent, Subscription } from 'rxjs';
  import { apolloClient } from 'src/lib/js/hasura-client';
  import SelectableTable from 'src/components/ui/selectable-table';
  import { ViewStore } from 'src/store/view';

  import Pagination from 'src/components/ui/pagination';
  import { skip } from 'rxjs/operators';
  import QuickSearch from 'src/components/ui/input/quick-search';

  export let view: ViewStore;
  export let menuPath: string;
  export let tableId: string;

  const columns = view.createWorkListColumns();
  const { dataList$, fullCount$ } = view;

  let apolloClientList$: any;
  let tableRef: any;
  let pageRef: any;
  let needSelectIdSub, needHighlightIdSub, selectDataSub: Subscription;

  // =========================SUBSCRIPTION===========================
  let firstTimes = true;
  const subscription = () => {
    apolloClientList$ = apolloClient
      .subscribe({
        query: ViewStore.createReloadSubscription(view.tableName),
      })
      .subscribe((dataList) => {
        if (dataList) {
          if (!firstTimes) {
            reload();
          }
          firstTimes = false;
        }
      });

    needSelectIdSub = view.needSelectId$.subscribe((id: string) => {
      if (tableRef && id) {
        setTimeout(() => {
          tableRef.selectRowById(id);
        }, 1000);
      }
    });

    needHighlightIdSub = view.needHighlightId$.subscribe((id: string) => {
      if (tableRef && id) {
        setTimeout(() => {
          tableRef.highlightRowById(id);
        }, 1000);
      }
    });

    selectDataSub = view.selectedData$.subscribe((data) => {
      if (data && tableRef) {
        tableRef.highlightRowById(data.id);
      } else if (tableRef) {
        tableRef && tableRef.unSelectAll();
      }
    });
  };
  // =========================//SUBSCRIPTION===========================

  // =========================HELPER FUNCTION===========================
  const reload = () => {
    view.getSimpleList();
    tableRef && tableRef.unSelectAll();
    view.checkDeletedRecord(false);
  };

  // =========================HELPER FUNCTION===========================

  // =========================EVENT HANDLE===========================
  // const onSelection = (event) => {
  //   if (event.detail && event.detail.length > 0) {
  //     view.loading$.next(true);
  //     view.getOneById(event.detail[0].id);
  //   }
  // };

  const onLoadPage = (event) => {
    view.pageSize = event.detail.pageSize;
    view.page = event.detail.page;
    reload();
  };

  const onPaginationInit = (event) => {
    view.pageSize = event.detail;
  };
  // =========================//EVENT HANDLE===========================

  // =========================HOOK===========================
  onMount(() => {
    subscription();
    pageRef.loadSettings().then(() => {
      reload();
    });
  });

  onDestroy(() => {
    needSelectIdSub && needSelectIdSub.unsubscribe();
    needHighlightIdSub && needHighlightIdSub.unsubscribe();
    selectDataSub && selectDataSub.unsubscribe();
    apolloClientList$ && apolloClientList$.unsubscribe();
  });
  // =========================//HOOK===========================
</script>

<div style="margin-top: 1px;">
  <Pagination
    {menuPath}
    totalRecords={$fullCount$}
    smallSize={true}
    on:loadPage={onLoadPage}
    on:init={onPaginationInit}
    bind:this={pageRef} />
</div>

<div style="height: calc(100% - 20px);">
  <SelectableTable
    startRowCount={(view.page - 1) * view.pageSize + 1}
    bind:this={tableRef}
    on:selection
    {columns}
    {menuPath}
    showRowNumber={true}
    data={$dataList$}
    id={tableId}>

    <span style="display: flex; padding-bottom: 6px;" slot="header" let:filter>
      <div style="width: 100%;">
        <QuickSearch on:input={(e) => filter(e.target.value)} />
      </div>
    </span>
  </SelectableTable>
</div>
