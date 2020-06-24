<script lang="ts">
  import { AppStore } from 'src/store/app';
  import ChatIcon from 'src/components/layout/icons/common/chat.svelte';
  import BellIcon from 'src/components/layout/icons/common/bell.svelte';
  import AlertIcon from 'src/components/layout/icons/common/alert.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { apolloClient } from 'src/lib/js/hasura-client';
  import { notificationStore, NotifyType } from 'src/store/notification';
  import { Notification } from 'src/model/base';
  import { getUserId } from 'src/lib/js/security';
  import gql from 'graphql-tag';
  import { Subscription } from 'rxjs';
  import { Dropdown } from 'src/lib/js/dropdown';
  import MessageDropdownContent from './message-dropdown-content.svelte';
  import { appStore } from 'src/store/app';
  import { menuStore } from 'src/store/menu';
  import MessageModal from 'src/components/ui/modal/message';
  import { SObject } from 'src/lib/js/sobject';
  import { getViewTitleFromMenuPath } from 'src/lib/js/url-util';
  import { SDate } from 'src/lib/js/sdate';
  import { T } from 'src/lib/js/locale/locale';
  import { StringUtil } from 'src/lib/js/string-util';

  import SubmitIcon from 'src/icons/submit24x24.svelte';
  import CancelSubmitIcon from 'src/icons/cancel-submit24x24.svelte';

  import AssignIcon from 'src/icons/assign24x24.svelte';
  import UnAssignIcon from 'src/icons/un-assign24x24.svelte';

  import HoldIcon from 'src/icons/hold24x24.svelte';
  import UnHoldIcon from 'src/icons/un-hold24x24.svelte';

  import Reminder1 from 'src/icons/reminder124x24.svelte';
  import Reminder2 from 'src/icons/reminder224x24.svelte';

  import HumanOrOrgStore from 'src/modules/sys/user/store';
  import { findAvatar } from './helper';

  // @ts-ignore
  const { isLogged$ } = AppStore;

  let dataSub: Subscription;
  let alarm: Notification[] = [];
  let chat: Notification[] = [];
  let functional: Notification[] = [];
  let countChat,
    countFunctional,
    countAlarm = 0;
  let messageToneRef: any;
  let beforeList: Notification[] = undefined;
  let newestNotificationList: Notification[] = [];
  const messageTone = require('../../../../public/audio/message-tone.ogg').default;
  let firstTimes = true;
  let prevTotalMessagesCount = 0;

  const drawingList: string[] = [];

  const reload = () => {
    notificationStore.findNotifications('', '').subscribe((res: any) => {
      const filteredData = res.data.map((it: any) => SObject.convertFieldsToCamelCase(it));

      notificationStore.data$.next(filteredData);

      if (filteredData && filteredData.length > 0) {
        const fromHumanIds = filteredData.map((it: Notification) => it.fromHumanId);
        const distinctFromHumanIds = new Set(fromHumanIds.filter((it) => it !== null));

        HumanOrOrgStore.findAvatars([...distinctFromHumanIds].join(',')).subscribe((res: any) => {
          const _filteredData = filteredData.map((it: Notification) => {
            it.fromHumanAvatar = findAvatar(res.data, it.fromHumanId);
            return it;
          });

          notificationStore.data$.next(_filteredData);
        });
      }
    });
  };

  const pushToDrawingList = (id: string) => {
    const index = drawingList.indexOf(id);
    if (index < 0) {
      drawingList.push(id);
      return drawingList.length - 1;
    } else {
      return index;
    }
  };

  const calcPosition = () => {
    const padding = 10;
    const modalWidth = 300;
    const modalHeight = 80;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const yNumItems = Math.ceil(windowHeight / (modalHeight + padding)) - 2;

    let count = 0;
    for (const item of newestNotificationList) {
      const index = pushToDrawingList(item.id);
      const col = Math.floor(count / yNumItems);
      item.top = windowHeight - (index + 1 - col * yNumItems) * (modalHeight + padding);
      item.right = col * modalWidth + col * padding + padding;

      count++;
    }
  };

  const registerSubscription = () => {
    const query = gql`
      subscription NotificationSubscription($human_id: bigint!) {
        part_notification(
          limit: 1
          where: { to_human_id: { _eq: $human_id } }
          order_by: { access_date: desc_nulls_last }
        ) {
          access_date
          id
        }
      }
    `;

    const notifyApolloClient$ = apolloClient.subscribe({
      query,
      variables: {
        human_id: getUserId(),
      },
    });
    notifyApolloClient$.subscribe((res: any) => {
      reload();
    });

    dataSub = notificationStore.data$.subscribe((res: Notification[]) => {
      if (beforeList && !firstTimes) {
        const { addArray } = SObject.getDiffRowObjectArray2(beforeList, res, ['id']);

        newestNotificationList = [...newestNotificationList, ...addArray];
        calcPosition();
      } else {
        newestNotificationList = [];
      }

      if (res.length > 0) {
        beforeList = res;
      }

      alarm = res.filter((it: Notification) => it.type === NotifyType.Alarm);
      chat = res.filter((it: Notification) => it.type === NotifyType.Chat);
      functional = res.filter((it: Notification) => it.type === NotifyType.Functional);

      countAlarm = countUnreadMessage(alarm);
      countChat = countUnreadMessage(chat);
      countFunctional = countUnfinishedMessage(functional);

      const totalMessagesCount = countAlarm + countChat + countFunctional;
      if (totalMessagesCount > 0) {
        if (!firstTimes && totalMessagesCount > prevTotalMessagesCount) {
          messageToneRef && messageToneRef.play();
        }
      }

      console.log(totalMessagesCount, prevTotalMessagesCount);

      prevTotalMessagesCount = totalMessagesCount;
    });
  };

  onMount(() => {
    registerSubscription();
    setTimeout(() => {
      firstTimes = false;
    }, 5000);
  });

  onDestroy(() => {
    dataSub && dataSub.unsubscribe();
  });

  const countUnreadMessage = (data: Notification[]) => {
    return data.filter((it: Notification) => !it.isRead).length;
  };

  const countUnfinishedMessage = (data: Notification[]) => {
    return data.filter((it: Notification) => !it.isFinished).length;
  };

  const onMouseover = (id) => {
    (document.querySelector('#' + id) as any).style.transform = 'translateY(-5px)';
    if (
      (id === 'chatDropdown' && chat && chat.length > 0) ||
      (id === 'alarmDropdown' && alarm && alarm.length > 0) ||
      (id === 'functionalDropdown' && functional && functional.length > 0)
    ) {
      Dropdown.show(id);
    }
  };

  const onMouseout = (id) => {
    Dropdown.hide(id);
  };

  const showTarget = (notification: Notification) => {
    const org = appStore.org$.value;
    if (org) {
      org.departmentId = notification.departmentId;
      org.noLoadMenu = true;
      appStore.org$.next(org);

      setTimeout(() => {
        const menu = menuStore.selectedData$.value;
        menu.path = notification.menuPath;
        menu.selectedId = notification.targetId;
        menuStore.selectedData$.next(menu);

        notificationStore.update(notification.id, true, true).subscribe();
      }, 500);
    }
  };

  const onClickItem = (event: any, id) => {
    showTarget(event.detail);

    Dropdown.hide(id);
  };

  const onCloseModal = (id: string) => {
    const index = newestNotificationList.findIndex((item: Notification) => item.id === id);
    if (index >= 0) {
      newestNotificationList.splice(index, 1);
      newestNotificationList = [...newestNotificationList];
    }

    const drawingIndex = drawingList.indexOf(id);
    if (drawingIndex >= 0) {
      drawingList.splice(drawingIndex, 1);
    }
  };

  const onClickModal = (notification: Notification) => {
    showTarget(notification);
    onCloseModal(notification.id);
  };
</script>

<audio bind:this={messageToneRef}>
  <source src={messageTone} type="audio/ogg" />
</audio>

<!--title={'<span class="bold-text">@: ' + (item.fromHumanFullName || T('COMMON.LABEL.SYSTEM')) + '</span>' + '\\' + item.departmentName + '\\' + getViewTitleFromMenuPath(item.menuPath)}-->
<!--content={'<span class="italic-text">' + SDate.convertMillisecondToDateTimeString(item.createdDate) + '</span></br>' + item.title}-->

{#each newestNotificationList as item}
  <MessageModal
    lineThrough={item.isCancel}
    on:click={() => onClickModal(item)}
    on:close={() => onCloseModal(item.id)}
    right={item.right}
    top={item.top}>
    <div slot="title">
      <div class="message-modal__title__header">
        <div class="message-modal__title__header__avatar">
          {#if item.fromHumanAvatar}
            <img class="message-modal__title__header__avatar__image" src={item.fromHumanAvatar} alt="" />
          {:else if item.fromHumanFullName}
            <div class="notify-dropdown-item__title__header__avatar__no">
              {StringUtil.getAvatar(item.fromHumanFullName)}
            </div>
          {:else}
            <i class="message-modal__title__header__avatar__no fa fa-desktop" />
          {/if}
        </div>

        <div class="message-modal__title__header__text">
          <div>{item.departmentName || T('COMMON.MSG.NO_DEPARTMENT')}\{getViewTitleFromMenuPath(item.menuPath)}</div>

          <div>{SDate.convertMillisecondToDateTimeString(item.createdDate)}</div>
        </div>
      </div>
    </div>

    <div
      class="message-modal__body__content"
      title={StringUtil.replaceAll(item.title, '<br>', '\n')
        .replace('<span class="italic-text">', '')
        .replace('</span>', '')}>
      <div class="message-modal__body__content__image">
        {#if item.messageType === 'SUBMIT'}
          {#if item.isCancel}
            <item className="large-svg-icon" />
          {:else}
            <SubmitIcon className="large-svg-icon" />
          {/if}
        {:else if item.messageType === 'ASSIGN'}
          {#if item.isCancel}
            <UnAssignIcon className="large-svg-icon" />
          {:else}
            <AssignIcon className="large-svg-icon" />
          {/if}
        {:else if item.messageType === 'HOLD'}
          {#if item.isCancel}
            <UnHoldIcon className="large-svg-icon" />
          {:else}
            <HoldIcon className="large-svg-icon" />
          {/if}
        {:else if item.messageType === 'REMINDER1'}
          <Reminder1 className="large-svg-icon" />
        {:else if item.messageType === 'REMINDER2'}
          <Reminder2 className="large-svg-icon" />
        {/if}
      </div>
      <div class="message-modal__body__content__text">
        <div class="message-modal__body__content__text__inside">
          {@html item.title}
        </div>
      </div>
    </div>
  </MessageModal>
{/each}

<div class="notification">
  {#if $isLogged$}
    <div
      style="position: relative;"
      on:mouseover={() => onMouseover('chatDropdown')}
      on:mouseout={() => onMouseout('chatDropdown')}
      class="notify-icon {countChat === 0 ? 'notify-icon-disabled' : ''}">
      <ChatIcon />
      {#if countChat > 0}
        <div class="badge">{countChat}</div>
      {/if}

      <div id="chatDropdown" class="right-dropdown-content" style="height: 600px;">
        <MessageDropdownContent type={NotifyType.Chat} on:click={(e) => onClickItem(e, 'chatDropdown')} data={chat} />
      </div>
    </div>

    <div
      style="position: relative; margin-left: 20px;"
      on:mouseover={() => onMouseover('functionalDropdown')}
      on:mouseout={() => onMouseout('functionalDropdown')}
      class="notify-icon {countFunctional === 0 ? 'notify-icon-disabled' : ''}">
      <BellIcon />

      {#if countFunctional > 0}
        <div class="badge">{countFunctional}</div>
      {/if}

      <div id="functionalDropdown" class="right-dropdown-content" style="height: 600px;">
        <MessageDropdownContent
          type={NotifyType.Functional}
          on:click={(e) => onClickItem(e, 'functionalDropdown')}
          data={functional} />
      </div>
    </div>

    <div
      style="position: relative; margin-left: 20px;"
      on:mouseover={() => onMouseover('alarmDropdown')}
      on:mouseout={() => onMouseout('alarmDropdown')}
      class="notify-icon {countAlarm === 0 ? 'notify-icon-disabled' : ''}">
      <AlertIcon />
      {#if countAlarm > 0}
        <div class="badge">{countAlarm}</div>
      {/if}
      <div id="alarmDropdown" class="right-dropdown-content" style="height: 600px;">
        <MessageDropdownContent
          type={NotifyType.Alarm}
          on:click={(e) => onClickItem(e, 'alarmDropdown')}
          data={alarm} />
      </div>
    </div>
  {/if}
</div>
