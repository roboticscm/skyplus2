<script lang="ts">
  import { AppStore, appStore } from '@/store/app';
  import { menuStore } from '@/store/menu';
  import { onMount, setContext } from 'svelte';
  import MainLayout from '@/components/layout/main-layout';
  import MainNavBar from '@/components/layout/main-nav-bar';
  import BranchDropdown from '@/components/layout/branch-dropdown';
  import ModulesDropdown from '@/components/layout/modules-dropdown';
  import Notification from '@/components/layout/notification';
  import UserProfiles from '@/components/layout/user-profiles';
  import ConfirmPasswordModal from '@/components/ui/modal/base';
  import SearchBar from '@/components/layout/search-bar';
  import { T } from '@/lib/js/locale/locale';
  import RouterView from '@/components/ui/router-view';
  import { skip, take } from 'rxjs/operators';
  import { ModalType } from '@/components/ui/modal/types';

  let routerView: any;
  let confirmPasswordModalRef: any;

  // @ts-ignore
  const { isLogged$, screenLock$ } = AppStore;
  // @ts-ignore
  const { user$ } = appStore;

  onMount(() => {
    if (routerView) {
      menuStore.dataList$.pipe(skip(1), take(1)).subscribe((_) => {
        routerView.show(appStore.org.menuPath);
      });
    }
  });

  // @ts-ignore
  $: if ($screenLock$) {
    confirmPasswordModalRef && confirmPasswordModalRef.show();
  }
</script>

{#if $isLogged$ && $user$}
  <ConfirmPasswordModal
    transparent={false}
    okButtonTitle={T('COMMON.LABEL.OK')}
    id="confirmPasswordLockScreenId"
    showCloseButton={false}
    showCancelButton={false}
    modalType={ModalType.ConfirmPassword}
    menuPath="screenLock"
    bind:this={confirmPasswordModalRef} />
{/if}
<MainLayout>
  <section slot="header" class="layout-header">
    <div class="layout-header__top {!$isLogged$ ? 'layout-header__large_top' : ''}">
      <div class="layout-header__top__left">
        <BranchDropdown />
        {#if $isLogged$}
          <div class="separator" />
          <ModulesDropdown id="moduleId" />
        {/if}

        {#if !$isLogged$}
          <div class="layout-header__top__center__welcome">
            <span>
              <i class="fa fa-sign-in-alt" />
              {@html `${T('SYS.MSG.WELCOME_TO')} <b>SKYHUB</b>`}
            </span>
          </div>

          <SearchBar id="mainSearchBarId" menuPath="intro" />
        {/if}
      </div>
      <div class="layout-header__top__center">
        {#if $isLogged$}
          <SearchBar id="mainSearchBarId" menuPath="intro" />
        {/if}
      </div>
      <div class="layout-header__top__right">
        <Notification />
        <UserProfiles />
      </div>
    </div>
    <nav class="layout-header__bottom">
      {#if $isLogged$}
        <MainNavBar />
      {/if}
    </nav>
  </section>

  <div slot="default" style="height: 100%; background: var(--bg-tertiary); overflow: auto;">
    <RouterView bind:this={routerView} />
  </div>
</MainLayout>
