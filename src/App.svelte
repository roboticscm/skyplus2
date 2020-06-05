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
  import {onMount} from 'svelte';
  import OrgIconMark from '@/components/layout/icons/org-mark';
  import { OrgStore } from '@/store/org';
  import MobileMainNavBar from '@/components/layout/mobile-main-nav-bar';

  const { currentCompany$ } = OrgStore;

  let routerView: any;
  let confirmPasswordModalRef: any;
  let windowWidth = window.innerWidth;
  const SMALL_SCREEN_WIDTH = 768;

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

  const onResizeWindow = () => {
    windowWidth = window.innerWidth;
  }

  onMount(() => {
    window.addEventListener('resize', onResizeWindow);
  });


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
  {#if windowWidth >= SMALL_SCREEN_WIDTH}
  <MainLayout>
    <section slot="header" class="layout-header layout-header-logged-in">
      <div class="layout-header__top">
        <div class="layout-header__top__left">
          <BranchDropdown />
          <div class="separator" />
          <ModulesDropdown id="moduleId" />
        </div>
        <div class="layout-header__top__center">
            <SearchBar id="mainSearchBarId" menuPath="intro" />
        </div>
        <div class="layout-header__top__right">
          <Notification />
          <UserProfiles />
        </div>
      </div>
      <nav class="layout-header__bottom">
          <MainNavBar />
      </nav>
    </section>

    <div slot="default" style="height: 100%; background: var(--bg-tertiary); overflow: auto;">
      <RouterView bind:this={routerView} />
    </div>
  </MainLayout>
  {:else}
    <MainLayout>
      <section slot="header" class="mobile-header">
        <div class="mobile-header__top">
          <div class="mobile-header__top__logo">
            <div class="mobile-header__top__logo__mark">
              <OrgIconMark />
            </div>
            <img class="mobile-header__top__logo__img" src={$currentCompany$.iconData} alt="" />
            <div class="mobile-separator" ></div>
          </div>
          <div class="mobile-header__top__module">
            <ModulesDropdown id="moduleId" />
          </div>
          <div class="mobile-header__top__avatar">
            <UserProfiles />
          </div>
        </div>

        <div class="mobile-header__bottom">
          <div class="mobile-header__bottom__hamburger-menu">
            <MobileMainNavBar></MobileMainNavBar>
          </div>

          <div class="mobile-header__bottom__search">
            <SearchBar id="mainSearchBarId" menuPath="intro" />
          </div>

          <div class="mobile-header__bottom__notify">
            <Notification />
          </div>
        </div>
      </section>
      <div slot="default" style="height: 100%; background: var(--bg-tertiary); overflow: auto;">
        <RouterView bind:this={routerView} />
      </div>
    </MainLayout>
  {/if}
  <Nickname />
{:else}
  <div style="height: 100%; background: var(--bg-tertiary); overflow: auto;">
    <RouterView bind:this={routerView} />
  </div>
{/if}
