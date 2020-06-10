<script lang="ts">
  import { menuStore } from 'src/store/menu';
  import { App } from 'src/lib/js/constants';
  import { appStore } from 'src/store/app';
  import { RoleMenu } from 'src/modules/sys/menu/model';
  import { ViewStore } from 'src/store/view';

  export let view: ViewStore;

  const viewTitle = view.getViewTitle();
  const selectedMenu = menuStore.selectedData;

  document.title = App.NAME + ' - ' + viewTitle;
</script>

<div class="view-title">
  {#if selectedMenu}
    {#if !selectedMenu.useFontIcon && selectedMenu.iconData}
      <img src={selectedMenu.iconData} alt={selectedMenu.menuName} />
    {:else if selectedMenu.fontIcon}
      {@html selectedMenu.fontIcon}
    {:else}
      {@html App.DEFAULT_ICON}
    {/if}
  {/if}
  {viewTitle}
</div>
