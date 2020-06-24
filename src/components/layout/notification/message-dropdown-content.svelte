<script lang="ts">
  import QuickSearch from 'src/components/ui/input/quick-search';
  import MessageItem from './message-item.svelte';
  import { T } from 'src/lib/js/locale/locale';
  import { fromEvent, BehaviorSubject } from 'rxjs';
  import { map, switchMap, tap } from 'rxjs/operators';
  import { notificationStore } from 'src/store/notification';
  import { SObject } from 'src/lib/js/sobject';
  import { Mark } from 'src/lib/js/mark';
  import { Notification } from 'src/model/base';
  import HumanOrOrgStore from 'src/modules/sys/user/store';
  import { findAvatar } from './helper';

  import SubmitIcon from 'src/icons/submit24x24.svelte';
  import CancelSubmitIcon from 'src/icons/cancel-submit24x24.svelte';

  import AssignIcon from 'src/icons/assign24x24.svelte';
  import UnAssignIcon from 'src/icons/un-assign24x24.svelte';

  import HoldIcon from 'src/icons/hold24x24.svelte';
  import UnHoldIcon from 'src/icons/un-hold24x24.svelte';

  import Reminder1Icon from 'src/icons/reminder124x24.svelte';
  import Reminder2Icon from 'src/icons/reminder224x24.svelte';

  import NotifyIcon from 'src/icons/notify24x24.svelte';
  import SearchIcon from 'src/icons/search.svelte';

  export let data: any[];
  export let type: string;

  let filteredData: Notification[] = [],
    groupFilteredData: Notification[] = [];
  let searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  let textSearch = '';
  let showSearch = false;

  // let iconsTab = [
  //   { icon: SubmitIcon, messageType: 'SUBMIT', isCancel: false, show: true, count: 10 },
  //   { icon: CancelSubmitIcon, messageType: 'SUBMIT', isCancel: true, show: false, count: 0 },
  //
  //   { icon: AssignIcon, messageType: 'ASSIGN', isCancel: false, show: false, count: 0 },
  //   { icon: UnAssignIcon, messageType: 'ASSIGN', isCancel: true, show: false, count: 0 },
  //
  //   { icon: HoldIcon, messageType: 'HOLD', isCancel: false, show: undefined, count: 0 },
  //   { icon: UnHoldIcon, messageType: 'HOLD', isCancel: true, show: undefined, count: 0 },
  //
  //   { icon: Reminder1Icon, messageType: 'REMINDER1', isCancel: false, show: undefined, count: 0 },
  //   { icon: Reminder2Icon, messageType: 'REMINDER2', isCancel: false, show: undefined, count: 0 },
  //
  //   { icon: UpdateIcon, messageType: 'UPDATE', isCancel: false, show: undefined, count: 0 },
  // ];

  let iconsTab = [
    { icon: SubmitIcon, messageTypes: ['SUBMIT', 'APPROVE'], show: true, count: 0 },

    { icon: AssignIcon, messageTypes: ['ASSIGN', 'HOLD'], show: false, count: 0 },

    { icon: Reminder1Icon, messageTypes: ['REMINDER1'], show: undefined, count: 0 },
    { icon: Reminder2Icon, messageTypes: ['REMINDER2'], show: undefined, count: 0 },

    { icon: NotifyIcon, messageTypes: ['UPDATE', 'COMPLETE'], show: undefined, count: 0 },
  ];

  // @ts-ignore
  $: {
    filteredData = data;
  }

  const getCounter = (messageTypes: string[]) => {
    return filteredData.filter((it: any) => !it.isRead && messageTypes.includes(it.messageType)).length;
  };

  const applyTab = (foundMessageType: any[]) => {
    let firstTime = false;
    for (let i = 0; i < iconsTab.length; i++) {
      iconsTab[i].show = undefined;

      const index = foundMessageType.findIndex((it: any) => iconsTab[i].messageTypes.includes(it.messageType));

      if (index >= 0) {
        if (!firstTime) {
          iconsTab[i].show = true;

          onClickTab({
            messageTypes: iconsTab[i].messageTypes,
            show: undefined,
          });
        } else {
          iconsTab[i].show = false;
        }
        firstTime = true;
        iconsTab[i].count = getCounter(iconsTab[i].messageTypes);
      }
    }

    iconsTab = [...iconsTab];
  };

  // @ts-ignore
  $: {
    groupFilteredData = filteredData;
    let messageTypeAndIsCancel = filteredData.map((it: Notification) => {
      return {
        index: it.messageType,
        messageType: it.messageType,
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

    const index = iconsTab.findIndex((it: any) => it.messageTypes === event.messageTypes);

    iconsTab.map((it: any, idx: number) => {
      it.show = index === idx ? true : it.show === undefined ? undefined : false;

      return it;
    });

    iconsTab = [...iconsTab];

    if (index >= 0) {
      groupFilteredData = filteredData.filter((it: Notification) => {
        return iconsTab[index].messageTypes.includes(it.messageType);
      });
    }
  };

  const onClickToggleSearch = () => {
    showSearch = !showSearch;
  };
</script>

<div style="overflow: auto; width: 100%; height: 100%;" class="default-padding">
  <div style="display: flex; align-content: space-between;">
    <div class="bold-text" style="width: 100%;">{T('TASK.LABEL.' + type)}</div>
    <div style="text-align: right; cursor: pointer" on:click={onClickToggleSearch}>
      {#if showSearch}
        <i class="fa fa-chevron-up" />
      {:else}
        <SearchIcon />
      {/if}
    </div>
  </div>
  {#if showSearch}
    <QuickSearch loading$={searchProgress$} action={useInputAction} placeholder={T('COMMON.LABEL.FILTER')} />
  {/if}
  <div style="display: flex; margin-top: 10px; justify-content: center; align-content: center;">
    {#each iconsTab as icon}
      {#if icon.show !== undefined}
        <div on:click={() => onClickTab(icon)} style="position: relative; margin-left: 10px; margin-right: 10px;">
          <svelte:component
            this={icon.icon}
            className="large-svg-icon {icon.show === false ? 'svg-disabled cursor-pointer' : ''}" />
          {#if icon.count > 0}
            <div class="badge {icon.show === false ? 'disabled-badge' : ''}">{icon.count}</div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  {#each groupFilteredData as row}
    <MessageItem on:click notification={row} />
  {/each}
</div>
