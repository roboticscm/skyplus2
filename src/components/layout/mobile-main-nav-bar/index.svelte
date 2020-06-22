<script lang="ts">
  import { menuStore, historyMenuStore } from 'src/store/menu';
  import { appStore, AppStore } from 'src/store/app';
  import { Debug } from 'src/lib/js/debug';
  import RouterLink from 'src/components/ui/router-link/index.svelte';
  import { settingsStore } from 'src/store/settings';

  // @ts-ignore
  const {isDetailPage$ } = AppStore;
  const { dataList$ } = menuStore;


  const showPopup = () => {
    const ele: any = document.querySelector('#mobileMainNavBarId');
    ele.classList.add('show-dropdown');
  };

  const hidePopup = () => {
    const ele: any = document.querySelector('#mobileMainNavBarId');
    if (ele) {
      ele.classList.remove('show-dropdown');
    }
  };

  const onNavigate = (event: any) => {
    hidePopup();
    saveSettings(event.detail);
    saveHistorySettings(event.detail);
    isDetailPage$.next(false);
  };

  const saveSettings = (menuPath: string) => {
    settingsStore.saveUserSettings({
      menuPath: 'system',
      controlId: 'mainNavBarId',
      keys: ['lastMenuPath'],
      values: [menuPath.startsWith('/') ? menuPath.slice(1) : menuPath],
    });
  };

  const saveHistorySettings = (menuPath: string) => {
    historyMenuStore
      .saveOrUpdate({
        menuPath: menuPath.startsWith('/') ? menuPath.slice(1) : menuPath,
        departmentId: appStore.org.departmentId,
      })
      .then(async (_) => {
        // menuStore.sysGetRoledMenuListByUserIdAndDepId(appStore.org.departmentId);
      })
      .catch((error) => Debug.errorSection('Main Nav Bar - onItemClick', error));
  };

  const onMouseover = () => {
    showPopup();
  };

  const onMouseout = () => {
    hidePopup();
  };


</script>

<div class="nav" id="mainNavBarWrapperId">
  <i class="fa fa-bars" on:mouseover={onMouseover} on:mouseout={onMouseout}>
    <div id="mobileMainNavBarId" class="dropdown-content">
      {#each $dataList$ as row}
          <RouterLink className="dropdown-item"
            menuName={row.menuName}
            on:navigate={onNavigate}
            __path={'/' + row.path.replace('/', '--')}
            activeClass="dropdown-content__selected" />
      {/each}
    </div>
  </i>
</div>
