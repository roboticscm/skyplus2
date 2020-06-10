<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { T } from 'src/lib/js/locale/locale';
  import { menuStore, historyMenuStore } from 'src/store/menu';
  import { appStore } from 'src/store/app';
  import { Debug } from 'src/lib/js/debug';
  import RouterLink from 'src/components/ui/router-link/index.svelte';
  import { settingsStore } from 'src/store/settings';
  import { fromEvent } from 'rxjs';
  import { debounceTime } from 'rxjs/operators';

  const { dataList$ } = menuStore;
  const { navBarConfig$ } = appStore;
  const dispatch = createEventDispatcher();

  let routerLink: any;
  let visibleCountItem = 0;
  let mainNavBarRef: any;

  let dataList: any[] = [];
  let containerWidth: number;

  dataList$.subscribe((dt: any) => {
    dataList = [...dt];
    containerWidth = window['$']('#mainNavBarWrapperId') && window['$']('#mainNavBarWrapperId').width();
  });

  const showPopup = () => {
    const ele: any = document.querySelector('#mainNavBarMoreId');
    ele.classList.add('show-dropdown');
  };

  const hidePopup = () => {
    const ele: any = document.querySelector('#mainNavBarMoreId');
    if (ele) {
      ele.classList.remove('show-dropdown');
    }
  };

  const onNavigate = (event: any) => {
    hidePopup();
    saveSettings(event.detail);
    saveHistorySettings(event.detail);
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

  onMount(() => {
    // fromEvent(window, 'resize')
    //   .pipe(debounceTime(200))
    //   .subscribe((res) => {
    //     if (appStore.org.departmentId) {
    //       // menuStore.sysGetRoledMenuListByUserIdAndDepId(appStore.org.departmentId);
    //       location.reload();
    //     }
    //   });
  });

  const onMouseoverMore = () => {
    showPopup();
  };

  const onMouseoutMore = () => {
    hidePopup();
  };
</script>

<div class="nav" id="mainNavBarWrapperId">
  <div bind:this={mainNavBarRef} id="mainNavBarId" style="display: flex;">
    {#each dataList as row}
      {#if window['$']('#mainNavBarId').width() < containerWidth - 300}
        <RouterLink
          bind:this={routerLink}
          menuName={row.menuName}
          on:navigate={onNavigate}
          __path={'/' + row.path.replace('/', '--')}
          activeClass="active" />
      {:else if window['$']('#mainNavBarId').width() >= containerWidth - 300 && !document.querySelector('#mainNavBarMoreId')}
        <div class="more nav-item" on:mouseover|stopPropagation={onMouseoverMore} on:mouseout={onMouseoutMore}>
          <span>{T('COMMON.LABEL.MORE')} &nbsp;&nbsp;</span>
          <i class="dropdown-mark-icon fa fa-angle-down" />

          <div id="mainNavBarMoreId" class="right-dropdown-content">
            {#each dataList as row}
              {#if !document.querySelector('#' + row.path.replace('/', '--'))}
                <RouterLink
                  bind:this={routerLink}
                  menuName={row.menuName}
                  on:navigate={onNavigate}
                  __path={'/' + row.path.replace('/', '--')}
                  activeClass="active" />
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {/each}

  </div>

</div>
