<script lang="ts">
  import { AppStore } from '@/store/app';
  import ChatIcon from '@/components/layout/icons/common/chat.svelte';
  import BellIcon from '@/components/layout/icons/common/bell.svelte';
  import AlertIcon from '@/components/layout/icons/common/alert.svelte';

  // @ts-ignore
  const { isLogged$ } = AppStore;
</script>

<div class="notification">
  {#if $isLogged$}
    <div class="notify-icon notify-icon-disabled">
      <ChatIcon />
    </div>
    <!--    <div class="badge badge-chat">3</div>-->

    <div class="notify-icon">
      <BellIcon />
    </div>
    <div class="badge badge-functional">114</div>

    <div class="notify-icon">
      <AlertIcon />
    </div>
    <div class="badge badge-alert">14</div>
  {/if}
</div>
