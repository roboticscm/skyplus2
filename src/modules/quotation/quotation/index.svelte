<script lang="ts">
  import WorkList from './work-list/index.svelte';
  import MainContent from './content/index.svelte';
  import ViewTitle from 'src/components/layout/view-title';
  import TwoColumnView from 'src/components/layout/two-column-view';
  import { ViewStore } from 'src/store/view';

  export let showTitle = true;
  export let menuPath: string;

  const view = new ViewStore(menuPath);
</script>

{#if showTitle}
  <ViewTitle {view} />
{/if}
<TwoColumnView id={'mainLayout' + view.getViewName()} {showTitle} {menuPath}>
  <div style="height: 100%;" slot="viewLeft">
    <WorkList {view} {menuPath} />
  </div>
  <div style="height: 100%;" slot="default">
    <MainContent {view} {menuPath} />
  </div>
</TwoColumnView>
