<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { NotifyType } from '@/store/notification';
  import { Notification } from '@/model/base';
  import { getViewTitleFromMenuPath } from '@/lib/js/url-util';
  import { createEventDispatcher } from 'svelte';
  import { StringUtil } from '@/lib/js/string-util';
  import SubmitIcon from '@/icons/submit24x24.svelte';
  import CancelSubmitIcon from '@/icons/cancel-submit24x24.svelte';

  import AssignIcon from '@/icons/assign24x24.svelte';
  import UnAssignIcon from '@/icons/un-assign24x24.svelte';

  import HoldIcon from '@/icons/hold24x24.svelte';
  import UnHoldIcon from '@/icons/un-hold24x24.svelte';

  import Reminder1 from '@/icons/reminder124x24.svelte';
  import Reminder2 from '@/icons/reminder224x24.svelte';

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
    <div title={notification.fromHumanFullName} class="notify-dropdown-item__header__avatar">
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
    <div class="notify-dropdown-item__content__image">
      {#if notification.messageType === 'SUBMIT'}
        {#if notification.isCancel}
          <CancelSubmitIcon className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
        {:else}
          <SubmitIcon className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
        {/if}
      {:else if notification.messageType === 'ASSIGN'}
        {#if notification.isCancel}
          <UnAssignIcon className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
        {:else}
          <AssignIcon className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
        {/if}
      {:else if notification.messageType === 'HOLD'}
        {#if notification.isCancel}
          <UnHoldIcon className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
        {:else}
          <HoldIcon className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
        {/if}
      {:else if notification.messageType === 'REMINDER1'}
        <Reminder1 className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
      {:else if notification.messageType === 'REMINDER2'}
        <Reminder2 className="large-svg-icon {isOld ? 'svg-disabled' : ''}" />
      {/if}
    </div>
    <div class="notify-dropdown-item__content__text">
      <div class="notify-dropdown-item__content__text__inside">
        {@html notification.title}
      </div>
    </div>
  </div>
</div>
