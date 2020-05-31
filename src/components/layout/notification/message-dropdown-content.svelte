<script lang="ts">
  import QuickSearch from '@/components/ui/input/quick-search';
  import MessageItem from './message-item.svelte';
  import { T } from '@/lib/js/locale/locale';
  import { fromEvent, BehaviorSubject } from 'rxjs';
  import { map, switchMap, tap } from 'rxjs/operators';
  import { notificationStore } from '@/store/notification';
  import { SObject } from '@/lib/js/sobject';
  import { Mark } from '@/lib/js/mark';
  import { Notification } from '@/model/base';
  import HumanOrOrgStore from '@/modules/sys/user/store';
  import { findAvatar } from './helper';

  import SubmitIcon from '@/icons/submit24x24.svelte';
  import CancelSubmitIcon from '@/icons/cancel-submit24x24.svelte';

  import AssignIcon from '@/icons/assign24x24.svelte';
  import UnAssignIcon from '@/icons/un-assign24x24.svelte';

  import HoldIcon from '@/icons/hold24x24.svelte';
  import UnHoldIcon from '@/icons/un-hold24x24.svelte';

  import Reminder1 from '@/icons/reminder124x24.svelte';
  import Reminder2 from '@/icons/reminder224x24.svelte';

  export let data: any[];
  export let type: string;

  let filteredData: Notification[] = [],
    groupFilteredData: Notification[] = [];
  let searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  let textSearch = '';

  let iconsTab = [
    { icon: SubmitIcon, messageType: 'SUBMIT', isCancel: false, show: true, count: 10 },
    { icon: CancelSubmitIcon, messageType: 'SUBMIT', isCancel: true, show: false, count: 0 },

    { icon: AssignIcon, messageType: 'ASSIGN', isCancel: false, show: false, count: 0 },
    { icon: UnAssignIcon, messageType: 'ASSIGN', isCancel: true, show: false, count: 0 },

    { icon: HoldIcon, messageType: 'HOLD', isCancel: false, show: undefined, count: 0 },
    { icon: UnHoldIcon, messageType: 'HOLD', isCancel: true, show: undefined, count: 0 },

    { icon: Reminder1, messageType: 'REMINDER1', isCancel: false, show: undefined, count: 0 },
    { icon: Reminder2, messageType: 'REMINDER2', isCancel: false, show: undefined, count: 0 },
  ];
  // @ts-ignore
  $: {
    filteredData = data;
  }

  const getCounter = (messageType: string, isCancel: boolean) => {
    return filteredData.filter((it: any) => !it.isRead && messageType === it.messageType && isCancel === it.isCancel)
      .length;
  };

  const applyTab = (foundMessageType: any[]) => {
    let firstTime = false;
    for (let i = 0; i < iconsTab.length; i++) {
      iconsTab[i].show = undefined;

      const index = foundMessageType.findIndex(
        (it: any) => iconsTab[i].messageType === it.messageType && iconsTab[i].isCancel === it.isCancel,
      );

      if (index >= 0) {
        if (!firstTime) {
          iconsTab[i].show = true;
        } else {
          iconsTab[i].show = false;
        }
        firstTime = true;
        iconsTab[i].isCancel = foundMessageType[index].isCancel;
        iconsTab[i].count = getCounter(iconsTab[i].messageType, iconsTab[i].isCancel);
      }
    }

    iconsTab = [...iconsTab];
  };

  // @ts-ignore
  $: {
    groupFilteredData = filteredData;
    let messageTypeAndIsCancel = filteredData.map((it: Notification) => {
      return {
        index: it.messageType + it.isCancel,
        messageType: it.messageType,
        isCancel: it.isCancel,
      };
    });

    messageTypeAndIsCancel = SObject.distinctArrayObject(messageTypeAndIsCancel);
    messageTypeAndIsCancel = messageTypeAndIsCancel.filter((it: any) => it.messageType !== null);

    applyTab(messageTypeAndIsCancel);
  }

  const useInputAction = {
    register(component: HTMLElement, param: any) {
      fromEvent(component, 'input')
        .pipe(
          tap((event: any) => {
            searchProgress$.next(true);
            textSearch = event.target.value;
          }),
          // map((event: any) => event.target.value),
          switchMap((_) => doFilter(textSearch)),
        )
        .subscribe((res: any) => {
          filteredData = res.data.map((it: any) => SObject.convertFieldsToCamelCase(it));

          const fromHumanIds = filteredData.map((it: Notification) => it.fromHumanId);
          const distinctFromHumanIds = new Set(fromHumanIds);

          filteredData.map((it: any) => {
            it.title = Mark.mark(it.title, textSearch);
            return it;
          });

          if (distinctFromHumanIds.size > 0) {
            HumanOrOrgStore.findAvatars([...distinctFromHumanIds].join(',')).subscribe((res: any) => {
              filteredData = filteredData.map((it: Notification) => {
                it.fromHumanAvatar = findAvatar(res.data, it.fromHumanId);
                return it;
              });
            });
          }

          textSearch = '';
          searchProgress$.next(false);
        });
    },
  };

  const doFilter = (value: string) => {
    return notificationStore.findNotifications(type, value);
  };

  const onClickTab = (event: any) => {
    if (event.show) {
      return;
    }

    const index = iconsTab.findIndex(
      (it: any) => it.messageType === event.messageType && it.isCancel === event.isCancel,
    );
    iconsTab.map((it: any, idx: number) => {
      it.show = index === idx ? true : it.show === undefined ? undefined : false;

      return it;
    });

    iconsTab = [...iconsTab];

    if (index >= 0) {
      groupFilteredData = filteredData.filter((it: Notification) => {
        return it.messageType === iconsTab[index].messageType && it.isCancel === iconsTab[index].isCancel;
      });
    }
  };
</script>

<div style="overflow: auto; width: 100%; height: 100%;" class="default-padding">
  <div class="bold-text">{T('TASK.LABEL.' + type)}</div>
  <QuickSearch loading$={searchProgress$} action={useInputAction} placeholder={T('COMMON.LABEL.FILTER')} />
  <div style="display: flex; margin-top: 10px;">
    {#each iconsTab as icon}
      {#if icon.show !== undefined}
        <div on:click={() => onClickTab(icon)} style="position: relative; margin-right: 10px;">
          <svelte:component
            this={icon.icon}
            className="large-svg-icon {icon.show === false ? 'svg-disabled cursor-pointer' : ''}" />
          {#if icon.count > 0}
            <div class="badge">{icon.count}</div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  {#each groupFilteredData as row}
    <MessageItem on:click notification={row} />
  {/each}
</div>
