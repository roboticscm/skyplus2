<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { NotifyType } from '@/store/notification';
  import { Notification } from '@/model/base';
  import { getViewTitleFromMenuPath } from '@/lib/js/url-util';
  import { createEventDispatcher } from 'svelte';
  import { StringUtil } from '@/lib/js/string-util';
  import SubmitIcon from '@/icons/submit.svelte';
  import CancelSubmitIcon from '@/icons/cancel-submit.svelte';

  import AssignIcon from '@/icons/assign.svelte';
  import UnAssignIcon from '@/icons/un-assign.svelte';

  import HoldIcon from '@/icons/hold.svelte';
  import UnHoldIcon from '@/icons/un-hold.svelte';

  import Reminder1 from '@/icons/reminder1.svelte';
  import Reminder2 from '@/icons/reminder2.svelte';

  const dispatch = createEventDispatcher();

  export let notification: Notification;

  let isOld;
  // @ts-ignore
  $: isOld = notification.type === NotifyType.Functional ? notification.isFinished : notification.isRead;

  const onClick = () => {
    dispatch('click', notification);
  };
</script>

<div
  on:click={onClick}
  class="{isOld ? 'notify-dropdown-item-old' : ''}
  {notification.isCancel ? 'notify-dropdown-item-cancel' : ''} notify-dropdown-item default-rounded-border
  default-padding"
  style="margin-top: 6px;">

  <div class="notify-dropdown-item__header">
    <div class="notify-dropdown-item__header__avatar">
      {#if notification.fromHumanAvatar}
        <img class="notify-dropdown-item__header__avatar__image" src={notification.fromHumanAvatar} alt="" />
      {:else if notification.fromHumanFullName}
        <div class="notify-dropdown-item__header__avatar__no">
          {StringUtil.getAvatar(notification.fromHumanFullName)}
        </div>
      {:else}
        <i class="notify-dropdown-item__header__avatar__no fa fa-desktop" />
      {/if}
    </div>

    <div class="notify-dropdown-item__header__text">
      <div>
        {notification.departmentName || T('COMMON.MSG.NO_DEPARTMENT')}\{getViewTitleFromMenuPath(notification.menuPath)}
      </div>

      <div>{SDate.convertMillisecondToDateTimeString(notification.createdDate)}</div>

    </div>
  </div>

  <div
    class="notify-dropdown-item__content"
    title={StringUtil.replaceAll(notification.title, '</br>', '\n')
      .replace('<span class="italic-text">', '')
      .replace('</span>', '')}>
    {#if notification.messageType === 'SUBMIT'}
      {#if notification.isCancel}
        <CancelSubmitIcon />
      {:else}
        <SubmitIcon />
      {/if}
    {:else if notification.messageType === 'ASSIGN'}
      {#if notification.isCancel}
        <UnAssignIcon />
      {:else}
        <AssignIcon />
      {/if}
    {:else if notification.messageType === 'HOLD'}
      {#if notification.isCancel}
        <UnHoldIcon />
      {:else}
        <HoldIcon />
      {/if}
    {:else if notification.messageType === 'REMINDER1'}
      <Reminder1 />
    {:else if notification.messageType === 'REMINDER2'}
      <Reminder2 />
    {/if}

    {@html notification.title}

  </div>
</div>
