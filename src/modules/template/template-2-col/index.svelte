<script lang="ts">
  import TwoColumnView from 'src/components/layout/two-column-view';
  import WorkList from './work-list/index.svelte';
  import MainContent from './content/index.svelte';
  import ProgressBar from 'src/components/ui/progress-bar';
  import { ViewStore } from 'src/store/view';

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
</script>

<ProgressBar loading$={view.loading$} />

<TwoColumnView minLeftPane={!showWorkList} id={'mainLayout' + view.getViewName()} {menuPath}>
  <div style="height: 100%" slot="viewLeft">
    <WorkList {view} {menuPath} {callFrom} on:callback />
  </div>

  <div style="height: 100%" slot="default">
    <MainContent {view} {menuPath} />
  </div>
</TwoColumnView>
