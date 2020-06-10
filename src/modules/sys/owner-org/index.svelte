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
  import Store from './store';
  import { OrgStore } from 'src/store/org';

  export let showTitle = true;
  export let menuPath: string;
  export let fullControl: boolean;
  export let roleControls: [];
  export let callFrom = 'Self';

  const view = new ViewStore(menuPath);
  const store = new Store(view);

  view.tableName = 'owner_org';
  view.columns = ['id', 'code', 'name'];
  view.fullControl = fullControl;
  view.roleControls = roleControls;
  view.loading$.next(true);
  view.loadTableMetaData();

  const subscription = () => {
    store.completeLoading$.pipe(take(1)).subscribe((_) => {
      view.loading$.next(false);
    });
  };

  onMount(() => {
    subscription();
  });
</script>

<style lang="scss">

</style>

<ProgressBar loading$={view.loading$} />

<TwoColumnView id={'mainLayout' + view.getViewName()} {showTitle} {menuPath}>
  <div style="height: 100%;" slot="viewLeft">
    <WorkList {view} {store} {callFrom} />
  </div>
  <div style="height: 100%;" slot="default">
    <MainContent {view} {menuPath} />
  </div>
</TwoColumnView>
