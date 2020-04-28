<script lang="ts">
  import { logout } from '@/lib/js/security';
  import { API } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { AppStore, appStore } from '@/store/app';
  // import ThemeConfigModal from '@/components/modal/theme-config-modal/index.vue';
  const { user$ } = appStore;

  // @ts-ignore
  const { isLogged$ } = AppStore;

  // @ts-ignore
  const qrcode = require('../../../../public/images/qrcode.png').default;

  let user;
  // @ts-ignore
  $: user = $user$;

  const onLogout = (event) => {
    logout();
  };

  const showUserProfiles = () => {
    hidePopup();
    // themeConfigModalRef.value.show();
  };
  const showPopup = () => {
    // @ts-ignore
    if (!$isLogged$) {
      return;
    }
    (document.querySelector('#userProfilesDropdown') as any).classList.add('show-dropdown');
  };

  const hidePopup = () => {
    // @ts-ignore
    if (!$isLogged$) {
      return;
    }

    (document.querySelector('#userProfilesDropdown') as any).classList.remove('show-dropdown');
  };
</script>

<style lang="scss">

</style>

<div class="user-profiles-wrapper" on:mouseover|stopPropagation={showPopup} on:mouseout={hidePopup}>
  <!--        <theme-config-modal ref="themeConfigModalRef" id="themeConfigModalId"> </theme-config-modal>-->
  {#if $isLogged$ && user}
    <div class="user-profiles">
      {#if user.useFontIcon}
        <span class="user-profiles__icon">
          {@html user.fontIcon}
        </span>
      {:else if user.iconData}
        <img class="user-profiles__img" src={user.iconData} alt="" />
      {:else}
        <span class="user-profiles__icon">
          <i class="fa fa-camera" />
        </span>
      {/if}

      <div id="userProfilesDropdown" class="right-dropdown-content">
        <div class="user-profiles__fullname">{` ${user.username} - ${user.lastName} ${user.firstName}`}</div>
        <div on:click|stopPropagation={showUserProfiles} class="dropdown-item">
          <i class="fa fa-file-invoice" />
          {T('SYS.MENU.USER_PROFILES')}
        </div>
        <div on:click={onLogout} class="dropdown-item">
          <i class="fa fa-sign-out-alt" />
          {T('SYS.MENU.LOGOUT')}
        </div>
      </div>
    </div>
  {:else}
    <div class="no-user-profiles">
      <span class="no-user-profiles__img">
        <img src={qrcode} alt="SKYHUB" />
      </span>
    </div>
  {/if}
  <i class="fa fa-sort-down" />
</div>
