<script lang="ts">
  import { onMount } from 'svelte';
  import TwoColumnView from 'src/components/layout/two-column-view';
  import WorkList from './work-list/index.svelte';
  import DashboardWorkList from './work-list/dashboard.svelte';
  import MainContent from './content/index.svelte';
  import DashboardContent from './content/dashboard.svelte';
  import ProgressBar from 'src/components/ui/progress-bar';
  import { ViewStore } from 'src/store/view';
  import Store from './store';

  // Props
  export let menuPath: string;
  export let fullControl: boolean;
  export let roleControls: any[];
  export let searchFields: any[];
  export let showWorkList = true;
  export let selectedId: string; // for notification

  // Init view
  const view = new ViewStore(menuPath);
  view.fullControl = fullControl;
  view.roleControls = roleControls;
  view.searchFields = searchFields;
  view.tableName = 'tsk_task';

  const store = new Store(view);

  // @ts-ignore
  const { showDashboard$ } = store;

  let mainContentRef: any;
  const onceLoad = () => {};

  onMount(() => {
    onceLoad();
  });

  const onAddNew = () => {
    mainContentRef.doAddNew();
  };
</script>

<ProgressBar loading$={view.loading$} />

<TwoColumnView minLeftPane={!showWorkList} id={'mainLayout' + view.getViewName()} {menuPath}>
  <div style="height: 100%" slot="viewLeft">
    {#if $showDashboard$}
      <DashboardWorkList {view} {store} />
    {:else}
      <WorkList {selectedId} {view} {store} {menuPath} on:callback on:addNew={onAddNew} />
    {/if}
  </div>

  <div style="height: 100%" slot="default">
    {#if $showDashboard$}
      <DashboardContent />
    {:else}
      {#if !window.isSmartPhone}
        <MainContent {view} {menuPath} {store} bind:this={mainContentRef} />
      {/if}
    {/if}
  </div>
</TwoColumnView>
