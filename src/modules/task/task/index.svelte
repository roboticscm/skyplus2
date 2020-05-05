<script lang="ts">
  import { onMount } from 'svelte';
  import TwoColumnView from '@/components/layout/two-column-view';
  import WorkList from './work-list/index.svelte';
  import DashboardWorkList from './work-list/dashboard.svelte';
  import MainContent from './content/index.svelte';
  import DashboardContent from './content/dashboard.svelte';
  import ProgressBar from '@/components/ui/progress-bar';
  import { ViewStore } from '@/store/view';
  import Store from './store';

  // Props
  export let menuPath: string;
  export let fullControl: boolean;
  export let roleControls: [];
  export let callFrom = 'Self';
  export let showWorkList = true;

  fullControl;
  roleControls;

  // Init view
  const view = new ViewStore(menuPath);
  view.fullControl = fullControl;
  view.roleControls = roleControls;

  const store = new Store(view);

  // @ts-ignore
  const { selectedData$, hasAnyDeletedRecord$, deleteRunning$, saveRunning$, isReadOnlyMode$, isUpdateMode$ } = view;
  // @ts-ignore
  const { showDashboard$ } = store;

  let mainContentRef: any;
  const onceLoad = () => {
    store.findProjects();
    // test
    store.findUploadFiles(undefined);
  };

  onMount(() => {
    onceLoad();
  });
</script>

<ProgressBar loading$={view.loading$} />

<TwoColumnView minLeftPane={!showWorkList} id={'mainLayout' + view.getViewName()} {menuPath}>
  <div style="height: 100%" slot="viewLeft">
    {#if $showDashboard$}
      <DashboardWorkList {view} {store} />
    {:else}
      <WorkList {view} {store} {menuPath} {callFrom} on:callback />
    {/if}
  </div>

  <div style="height: 100%" slot="default">
    {#if $showDashboard$}
      <DashboardContent />
    {:else}
      <MainContent {view} {menuPath} {store} bind:this={mainContentRef} />
    {/if}
  </div>
</TwoColumnView>
