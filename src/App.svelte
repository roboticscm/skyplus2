<script lang="ts">
  import { AppStore, appStore } from '@/store/app';
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
  import { ModalType } from '@/components/ui/modal/types';
  import { unlockScreen } from '@/lib/js/security';
  import Nickname from '@/components/layout/nickname';
  import { getUserFullName } from '@/lib/js/security';

  let routerView: any;
  let confirmPasswordModalRef: any;

  // @ts-ignore
  const { isLogged$, screenLock$ } = AppStore;
  // @ts-ignore
  const { user$ } = appStore;

  // @ts-ignore
  $: if ($screenLock$) {
    confirmPasswordModalRef &&
      confirmPasswordModalRef.show().then(() => {
        unlockScreen();
      });
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

{#if $isLogged$}
  <MainLayout>
    <section slot="header" class="layout-header {$isLogged$ ? 'layout-header-logged-in' : ''}">
      <div class="layout-header__top {!$isLogged$ ? 'layout-header__large_top' : ''}">
        <div class="layout-header__top__left">
          <BranchDropdown />

          {#if $isLogged$}
            <div class="separator" />
            <ModulesDropdown id="moduleId" />
          {/if}

        </div>
        <div class="layout-header__top__center">
          {#if !$isLogged$}
            <div class="layout-header__top__center__body">
              <div class="layout-header__top__center__body__welcome">
                <i class="fa fa-sign-in-alt" />
                {@html `${T('SYS.MSG.WELCOME_TO')} <b>SKYHUB</b>`}
              </div>
              <SearchBar id="mainSearchBarId" menuPath="intro" />
            </div>
          {/if}

          {#if $isLogged$}
            <SearchBar id="mainSearchBarId" menuPath="intro" />
          {/if}
        </div>
        <div class="layout-header__top__right">
          {#if $isLogged$}
            <Notification />
          {/if}
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
  <Nickname />
{:else}
  <div style="height: 100%; background: var(--bg-tertiary); overflow: auto;">
    <RouterView bind:this={routerView} />
  </div>
{/if}
