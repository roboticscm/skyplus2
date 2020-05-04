<script lang="ts">
  import { onMount } from 'svelte';
  import TwoColumnView from '@/components/layout/two-column-view';
  import WorkList from './work-list/index.svelte';
  import MainContent from './content/index.svelte';
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
    <WorkList {view} {store} {menuPath} {callFrom} on:callback />
  </div>

  <div style="height: 100%" slot="default">
    <MainContent {view} {menuPath} {store} />
  </div>
</TwoColumnView>
