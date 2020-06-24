<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ViewStore } from 'src/store/view';
  import { Store } from '../store';
  import { fromEvent, forkJoin, Observable, Subscription } from 'rxjs';
  import { switchMap, tap, filter } from 'rxjs/operators';
  import SimpleWorkList from 'src/components/work-list/simple-work-list';
  import { SObject } from 'src/lib/js/sobject';
  import { AppStore } from 'src/store/app';
  import { getViewTitleFromMenuPath } from 'src/lib/js/url-util';
  import MainContent from '../content/index.svelte';

  // Props
  export let view: ViewStore;
  export let store: Store;
  export let menuPath: string;
  export let callFrom: string;

  // @ts-ignore
  const { isDetailPage$ } = AppStore;
  // Other vars
  const workListContainerId = `workList${view.getViewName()}Container`;
  const tableId = `workList${view.getViewName()}${callFrom.replace('/', '__')}Table`;
  let selectedId: string = undefined;
  let selectSub: Subscription;
  let detailTitle = '';
  let mainContentRef: any;

  const doSelect = (ob$: Observable<any>) => {
    return ob$
      .pipe(
        filter((_) => selectedId !== undefined),
        tap((_) => view.loading$.next(true)),
        switchMap((_) =>
          forkJoin([
            view.getOneById(selectedId),
            store.loadAvailableDep(selectedId),
            store.loadAssignedDep(selectedId),
          ]),
        ),
      )
      .subscribe((res: any[]) => {
        if ((window as any).isSmartPhone) {
          isDetailPage$.next(true);
          setTimeout(() => {
            const selectedData = SObject.convertFieldsToCamelCase(res[0].data[0]);
            view.selectedData$.next(selectedData);
            store.availableDep$.next(res[1].data);
            store.assignedDep$.next(res[2].data);
            detailTitle = getViewTitleFromMenuPath(menuPath) + ' - ' + selectedData.name;
            view.loading$.next(false);
            selectedId = undefined;
          });
        } else {
          view.selectedData$.next(SObject.convertFieldsToCamelCase(res[0].data[0]));
          store.availableDep$.next(res[1].data);
          store.assignedDep$.next(res[2].data);
          view.loading$.next(false);
          selectedId = undefined;
        }
      });
  };

  const onSelection = (event) => {
    if (event.detail && event.detail.length > 0) {
      selectedId = event.detail[0].id;

      const change$ = new Observable((observer) => {
        observer.next(event);
      });
      selectSub = doSelect(change$);
    }
  };

  onMount(() => {
    // setTimeout(() => {
    //   const event$ = fromEvent(document.querySelector('#' + tableId), 'click');
    //   selectSub = doSelect(event$);
    // }, 500);
  });

  onDestroy(() => {
    if (selectSub) {
      selectSub.unsubscribe();
    }
  });

  const onClickBack = () => {
    isDetailPage$.next(false);
  };
</script>

{#if $isDetailPage$ && window.isSmartPhone}
  <section style="width: 100%;">
    <MainContent backCallback={onClickBack} {detailTitle} {view} {menuPath} {store} bind:this={mainContentRef} />
  </section>
{:else}
  <section id={workListContainerId} class="view-left-main">
    <SimpleWorkList {view} {menuPath} {tableId} on:selection={onSelection} />
  </section>
{/if}
