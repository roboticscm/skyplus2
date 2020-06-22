<script lang="ts">
  import { OrgStore } from 'src/store/org';
  import MainLayout from 'src/components/layout/main-layout';
  import { AppStore, appStore } from 'src/store/app';
  import MainNavBar from 'src/components/layout/main-nav-bar';
  import BranchDropdown from 'src/components/layout/branch-dropdown';
  import ModulesDropdown from 'src/components/layout/modules-dropdown';
  import Notification from 'src/components/layout/notification';
  import UserProfiles from 'src/components/layout/user-profiles';
  import ConfirmPasswordModal from 'src/components/ui/modal/base';
  import SearchBar from 'src/components/layout/search-bar';
  import { T } from 'src/lib/js/locale/locale';
  import RouterView from 'src/components/ui/router-view';
  import { ModalType } from 'src/components/ui/modal/types';
  import { unlockScreen } from 'src/lib/js/security';
  import Nickname from 'src/components/layout/nickname';
  import { getUserFullName } from 'src/lib/js/security';
  import {onMount} from 'svelte';
  import OrgIconMark from 'src/components/layout/icons/org-mark';
  import MobileMainNavBar from 'src/components/layout/mobile-main-nav-bar';

  const { currentCompany$ } = OrgStore;

  let routerView: any;
  let confirmPasswordModalRef: any;
  let windowWidth = window.innerWidth;
  const SMALL_SCREEN_WIDTH = 768;

  // @ts-ignore
  const { isLogged$, screenLock$, isDetailPage$ } = AppStore;
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
    <MainLayout headerHeight="{$isDetailPage$ ? '50px' : '96px' }">
      <section slot="header" class="{$isDetailPage$ ? 'mobile-header-detail' : 'mobile-header'} ">
        {#if !$isDetailPage$}
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
          {:else}
          <div class="mobile-header-detail__left">
            <div class="mobile-header-detail__left__hamburger-menu" >
              <MobileMainNavBar></MobileMainNavBar>
            </div>
            <div class="mobile-header-detail__left__department">
              {appStore.org.selectedDepartment.departmentName}
            </div>
          </div>

          <div class="mobile-header-detail__right">
            <div class="mobile-header-detail__right__notify">
              <Notification />
            </div>
            <div class="mobile-header-detail__right__avatar">
              <UserProfiles />
            </div>
          </div>
          {/if}
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
