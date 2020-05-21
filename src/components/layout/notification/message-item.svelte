<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { NotifyType } from '@/store/notification';
  import { Notification } from '@/model/base';
  import { getViewTitleFromMenuPath } from '@/lib/js/url-util';
  import { createEventDispatcher } from 'svelte';
  import { StringUtil } from '@/lib/js/string-util';

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
    <div class="notify-dropdown-item__header__from">
      <span class="notify-dropdown-item__header__from__human">
        @: {notification.fromHumanFullName || T('COMMON.LABEL.SYSTEM')}
      </span>
      <span>\{notification.departmentName || T('COMMON.MSG.NO_DEPARTMENT')}</span>
      <span>\{getViewTitleFromMenuPath(notification.menuPath)}</span>
    </div>

    <div class="notify-dropdown-item__header__date">
      {SDate.convertMillisecondToDateTimeString(notification.createdDate)}
    </div>
  </div>

  <div
    class="notify-dropdown-item__content"
    title={StringUtil.replaceAll(notification.title, '</br>', '\n')
      .replace('<span class="italic-text">', '')
      .replace('</span>', '')}>
    {@html notification.title}
  </div>
</div>
