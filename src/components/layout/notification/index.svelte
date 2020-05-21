<script lang="ts">
  import { AppStore } from '@/store/app';
  import ChatIcon from '@/components/layout/icons/common/chat.svelte';
  import BellIcon from '@/components/layout/icons/common/bell.svelte';
  import AlertIcon from '@/components/layout/icons/common/alert.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { apolloClient } from '@/lib/js/hasura-client';
  import { notificationStore, NotifyType } from '@/store/notification';
  import { Notification } from '@/model/base';
  import { getUserId } from '@/lib/js/security';
  import gql from 'graphql-tag';
  import { Subscription } from 'rxjs';
  import { Dropdown } from '@/lib/js/dropdown';
  import MessageDropdownContent from './message-dropdown-content.svelte';
  import { appStore } from '@/store/app';
  import { menuStore } from '@/store/menu';
  import MessageModal from '@/components/ui/modal/message';
  import { SObject } from '@/lib/js/sobject';
  import { getViewTitleFromMenuPath } from '@/lib/js/url-util';
  import { SDate } from '@/lib/js/sdate';
  import { T } from '@/lib/js/locale/locale';

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

  const drawingList: string[] = [];

  const reload = () => {
    notificationStore.findNotifications('', '').subscribe((res: any) => {
      notificationStore.data$.next(res.data.map((it: any) => SObject.convertFieldsToCamelCase(it)));
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
      item.top = (index + 1 - col * yNumItems) * (modalHeight + padding);
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

      if (countAlarm + countChat + countFunctional > 0) {
        if (!firstTimes) {
          // messageToneRef.play();
        }
      }
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

  const onClickItem = (event: any) => {
    showTarget(event.detail);
    Dropdown.hide('functionalDropdown');
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

{#each newestNotificationList as item}
  <MessageModal
    lineThrough={item.isCancel}
    on:click={() => onClickModal(item)}
    on:close={() => onCloseModal(item.id)}
    title={'<span class="bold-text">@: ' + (item.fromHumanFullName || T('COMMON.LABEL.SYSTEM')) + '</span>' + '\\' + item.departmentName + '\\' + getViewTitleFromMenuPath(item.menuPath)}
    content={'<span class="italic-text">' + SDate.convertMillisecondToDateTimeString(item.createdDate) + '</span></br>' + item.title}
    right={item.right}
    top={item.top} />
{/each}

<div class="notification">
  {#if $isLogged$}
    <div
      on:mouseover={() => onMouseover('chatDropdown')}
      on:mouseout={() => onMouseout('chatDropdown')}
      class="notify-icon {countChat === 0 ? 'notify-icon-disabled' : ''}">
      <ChatIcon />
      <div id="chatDropdown" class="right-dropdown-content" style="height: 600px;">
        <MessageDropdownContent type={NotifyType.Chat} on:click={onClickItem} data={chat} />
      </div>
    </div>
    {#if countChat > 0}
      <div class="badge badge-chat">{countChat}</div>
    {/if}

    <div
      on:mouseover={() => onMouseover('functionalDropdown')}
      on:mouseout={() => onMouseout('functionalDropdown')}
      class="notify-icon {countFunctional === 0 ? 'notify-icon-disabled' : ''}">
      <BellIcon />
      <div id="functionalDropdown" class="right-dropdown-content" style="height: 600px;">
        <MessageDropdownContent type={NotifyType.Functional} on:click={onClickItem} data={functional} />
      </div>
    </div>

    {#if countFunctional > 0}
      <div class="badge badge-functional">{countFunctional}</div>
    {/if}

    <div
      on:mouseover={() => onMouseover('alarmDropdown')}
      on:mouseout={() => onMouseout('alarmDropdown')}
      class="notify-icon {countAlarm === 0 ? 'notify-icon-disabled' : ''}">
      <AlertIcon />
      <div id="alarmDropdown" class="right-dropdown-content" style="height: 600px;">
        <MessageDropdownContent type={NotifyType.Alarm} on:click={onClickItem} data={alarm} />
      </div>
    </div>
    {#if countAlarm > 0}
      <div class="badge badge-alert">{countAlarm}</div>
    {/if}
  {/if}
</div>
