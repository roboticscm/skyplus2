<script lang="ts">
  import { onMount } from 'svelte';
  import { logout } from '@/lib/js/security';
  import { API } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { AppStore, appStore } from '@/store/app';
  import UserProfilesModal from './components/user-profiles-modal/index.svelte';
  import { User } from '@/model/user';
  import { Subscription } from 'rxjs';
  import LogoutIcon from '@/icons/logout24x24.svelte';
  import ProfilesIcon from '@/icons/profiles24x24.svelte';

  const { user$ } = appStore;

  // @ts-ignore
  const { isLogged$ } = AppStore;

  // @ts-ignore
  const qrcode = require('../../../../public/images/qrcode.png').default;

  let user: User = undefined;

  let userProfilesModalRef: any;

  const onLogout = (event) => {
    logout();
  };

  const showUserProfiles = () => {
    hidePopup();
    userProfilesModalRef.show();
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

  onMount(() => {
    const userSub: Subscription = user$.subscribe((res) => {
      user = res;
    });

    return () => {
      userSub.unsubscribe();
    };
  });
</script>

<UserProfilesModal bind:this={userProfilesModalRef} />

<div class="user-profiles-wrapper" on:mouseover|stopPropagation={showPopup} on:mouseout={hidePopup}>
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
        <div class="user-profiles__fullname">{`${user.lastName} ${user.firstName}`}</div>
        <div on:click|stopPropagation={showUserProfiles} class="dropdown-item">
          <ProfilesIcon />
          &nbsp; {T('SYS.MENU.USER_PROFILES')}
        </div>
        <div on:click={onLogout} class="dropdown-item">
          <LogoutIcon />
          &nbsp; {T('SYS.MENU.LOGOUT')}
        </div>
      </div>
    </div>
  {/if}
  <!--  <i class="user-profiles-mark fa fa-sort-down" />-->
</div>
