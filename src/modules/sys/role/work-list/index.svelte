<script lang="ts">
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { ViewStore } from 'src/store/view';
  import { fromEvent, forkJoin, Observable, Subscription } from 'rxjs';
  import { switchMap, tap, filter } from 'rxjs/operators';
  import SimpleWorkList from 'src/components/work-list/simple-work-list';
  import { SObject } from 'src/lib/js/sobject';
  import { AppStore } from 'src/store/app';
  import { getViewTitleFromMenuPath } from 'src/lib/js/url-util';
  import MainContent from '../content/index.svelte';
  import { Store } from '../store';
  // Props
  export let view: ViewStore;
  export let menuPath: string;
  export let callFrom: string;
  export let store: Store;

  // Other vars
  const workListContainerId = `workList${view.getViewName()}Container`;
  const tableId = `workList${view.getViewName()}${callFrom.replace('/', '__')}Table`;
  let selectedId: string = undefined;
  const dispatch = createEventDispatcher();
  let selectSub: Subscription;

  // @ts-ignore
  const { isDetailPage$ } = AppStore;
  let detailTitle = '';
  let mainContentRef: any;

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

  const onSelection = (event) => {
    if (event.detail && event.detail.length > 0) {
      selectedId = event.detail[0].id;

      const change$ = new Observable((observer) => {
        observer.next(event);
      });
      selectSub = doSelect(change$);

      // dispatch('callback', event.detail[0].id);
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
    <MainContent backCallback={onClickBack} {store} {detailTitle} {view} {menuPath} bind:this={mainContentRef} />
  </section>
{:else}
  <section id={workListContainerId} class="view-left-main">
    <SimpleWorkList on:selection={onSelection} {view} {tableId} {menuPath} />
  </section>
{/if}
