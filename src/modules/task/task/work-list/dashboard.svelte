<script lang="ts">
  import { ViewStore } from 'src/store/view';
  import Button from 'src/components/ui/flat-button';
  import { ButtonType, ButtonId } from 'src/components/ui/button/types';
  import Store from '../store';
  import { T } from 'src/lib/js/locale/locale';

  export let view: ViewStore;
  export let store: Store;

  view;

  const { showDashboard$ } = store;

  const onToggleDashboard = () => {
    // @ts-ignore
    showDashboard$.next(!$showDashboard$);
  };
</script>

<section class="view-left-main">
  <div style="display: flex; justify-content: center;">
    <Button
      on:click={onToggleDashboard}
      btnType={ButtonType.Custom}
      title={$showDashboard$ ? T('COMMON.BUTTON.HIDE_DASHBOARD') : T('COMMON.BUTTON.SHOW_DASHBOARD')} />
  </div>
</section>
