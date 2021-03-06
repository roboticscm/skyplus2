<script lang="ts">
  import { scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { take } from 'rxjs/operators';

  import { App } from 'src/lib/js/constants';
  import { ViewStore } from 'src/store/view';

  import TwoColumnView from 'src/components/layout/two-column-view';
  import WorkList from './work-list/index.svelte';
  import MainContent from './content/index.svelte';
  import ViewTitle from 'src/components/layout/view-title';
  import ProgressBar from 'src/components/ui/progress-bar';
  import { Store } from './store';

  // Props
  export let showTitle = true;
  export let menuPath: string;
  export let fullControl: boolean;
  export let roleControls: [];
  export let callFrom = 'Self';
  export let showWorkList = true;

  // Init view
  const view = new ViewStore(menuPath);
  const store = new Store(view);
  view.tableName = 'role';
  view.columns = ['id', 'code', 'name', 'sort'];
  view.fullControl = fullControl;
  view.roleControls = roleControls;
  view.loading$.next(true);
  view.loadTableMetaData();
  store.loadOrgTree();

  // ================= SUBSCRIPTION ========================
  const subscription = () => {
    store.completeLoading$.pipe(take(1)).subscribe((_) => {
      view.loading$.next(false);
    });
  };
  // ================= //SUBSCRIPTION ========================

  // ================= KOOK ========================
  onMount(() => {
    subscription();
  });

  export const getViewTitle = () => {
    return view.getViewTitle();
  };

  export const getMenuInfo$ = () => {
    return view.menuInfo$;
  };
  // ================= //KOOK ========================
</script>

<style lang="scss">

</style>

<ProgressBar loading$={view.loading$} />

<TwoColumnView minLeftPane={!showWorkList} id={'mainLayout' + view.getViewName()} {showTitle} {menuPath}>
  <div style="height: 100%" slot="viewLeft">
    <WorkList {store} {view} {menuPath} {callFrom} on:callback />
  </div>

  <div style="height: 100%" slot="default">
    {#if !window.isSmartPhone}
      <MainContent {view} {menuPath} {store} />
    {/if}
  </div>
</TwoColumnView>
