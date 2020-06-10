<script lang="ts">
  import { ViewStore } from 'src/store/view';
  import MainContent from './content/index.svelte';
  import ProgressBar from 'src/components/ui/progress-bar';
  import Store from './store';

  export let menuPath: string;
  export let fullControl: boolean;
  export let roleControls: [];

  const view = new ViewStore(menuPath);
  const store = new Store(view);

  view.tableName = 'menu';
  view.columns = ['id', 'name', 'path', 'sort'];
  view.fullControl = fullControl;
  view.roleControls = roleControls;
</script>

<style lang="scss">

</style>

<ProgressBar loading$={view.loading$} />

<main class="view-container">
  <section class="view-content">
    <MainContent {view} {menuPath} />
  </section>
</main>
