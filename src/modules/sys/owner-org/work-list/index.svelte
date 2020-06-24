<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ViewStore } from 'src/store/view';
  import Store from '../store';
  import { fromEvent, forkJoin, Observable, Subscription } from 'rxjs';
  import { switchMap, tap, filter } from 'rxjs/operators';
  import TreeView from 'src/components/ui/tree-view';
  import { SObject } from 'src/lib/js/sobject';
  import { apolloClient } from 'src/lib/js/hasura-client';
  import { AppStore } from 'src/store/app';
  import { getViewTitleFromMenuPath } from 'src/lib/js/url-util';
  import MainContent from '../content/index.svelte';

  // Props
  export let view: ViewStore;
  export let store: Store;
  export let callFrom: string;
  export let menuPath: string = undefined;

  // Other vars
  const workListContainerId = `workList${view.getViewName()}Container`;
  const treeId = `workList${view.getViewName()}${callFrom.replace('/', '__')}Tree`;
  let selectedId: string = undefined;
  let allColumnsSub, needSelectIdSub, needHighlightIdSub, selectDataSub: Subscription;
  let apolloClientList$: any;
  let treeRef: any;

  // @ts-ignore
  const { isDetailPage$ } = AppStore;
  let detailTitle = '';
  let mainContentRef: any;

  const { orgData$ } = store;

  // =========================SUBSCRIPTION===========================
  const subscription = () => {
    allColumnsSub = view.allColumns$.subscribe((cols) => {
      if (cols && cols.length > 0) {
        const query = view.createQuerySubscription();
        apolloClientList$ = apolloClient.subscribe({
          query,
        });
      }
    });

    needSelectIdSub = view.needSelectId$.subscribe((id: string) => {
      if (treeRef && id) {
        setTimeout(() => {
          treeRef.selectNodeById(id, true);
        }, 1000);
      }
    });

    needHighlightIdSub = view.needHighlightId$.subscribe((id: string) => {
      if (treeRef && id) {
        setTimeout(() => {
          treeRef.selectNodeById(id, false);
        }, 1000);
      }
    });

    selectDataSub = view.selectedData$.subscribe((data) => {
      if (data && treeRef) {
        treeRef.selectNodeById(data.id, false);
      } else if (treeRef) {
        treeRef && treeRef.clearSelection();
      }
    });
  };
  // =========================//SUBSCRIPTION===========================

  const doSelect = (ob$: Observable<any>) => {
    return ob$
      .pipe(
        filter((_) => selectedId !== undefined),
        tap((_) => view.loading$.next(true)),
        switchMap((_) => forkJoin([view.getOneById(selectedId)])),
      )
      .subscribe((res: any[]) => {
        if ((window as any).isSmartPhone) {
          isDetailPage$.next(true);
          setTimeout(() => {
            const selectedData = SObject.convertFieldsToCamelCase(res[0].data[0]);
            view.selectedData$.next(selectedData);

            detailTitle = getViewTitleFromMenuPath(menuPath) + ' - ' + selectedData.name;
            view.loading$.next(false);
            selectedId = undefined;
          });
        } else {
          view.selectedData$.next(SObject.convertFieldsToCamelCase(res[0].data[0]));
          view.loading$.next(false);
          selectedId = undefined;
        }
      });
  };

  const reload = () => {
    store.loadOrgTree();
    view.checkDeletedRecord(false);
  };

  const onClickTree = (event: any) => {
    if (event.detail) {
      selectedId = event.detail.treeNode.id;
      const change$ = new Observable((observer) => {
        observer.next(event);
      });
      selectDataSub = doSelect(change$);
    }
  };

  onMount(() => {
    subscription();
    reload();
    // setTimeout(() => {
    //   const event$ = fromEvent(document.querySelector('#' + tableId), 'click');
    //   selectSub = doSelect(event$);
    // }, 500);
  });

  onDestroy(() => {
    needSelectIdSub.unsubscribe();
    needHighlightIdSub.unsubscribe();
    selectDataSub.unsubscribe();
    if (allColumnsSub) {
      allColumnsSub.unsubscribe();
    }
  });

  // =========================REACTIVE===========================
  let firstTimes = true;
  // @ts-ignore
  $: {
    // @ts-ignore
    const dataList = $apolloClientList$;
    if (dataList) {
      if (!firstTimes) {
        reload();
      }
      firstTimes = false;
    }
  }
  // =========================//REACTIVE===========================

  const onClickBack = () => {
    isDetailPage$.next(false);
  };
</script>

{#if $isDetailPage$ && window.isSmartPhone}
  <section style="width: 100%;">
    <MainContent backCallback={onClickBack} {detailTitle} {view} {menuPath} bind:this={mainContentRef} />
  </section>
{:else}
  <section id={workListContainerId} class="view-left-main">
    <TreeView bind:this={treeRef} data={$orgData$} id={treeId} on:click={onClickTree} />
  </section>
{/if}
