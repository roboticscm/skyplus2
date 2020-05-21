<script lang="ts">
  import QuickSearch from '@/components/ui/input/quick-search';
  import MessageItem from './message-item.svelte';
  import { T } from '@/lib/js/locale/locale';
  import { fromEvent, BehaviorSubject } from 'rxjs';
  import { map, switchMap, tap } from 'rxjs/operators';
  import { notificationStore, NotifyType } from '@/store/notification';
  import { Notification } from '@/model/base';
  import { SObject } from '../../../lib/js/sobject';

  export let data: any[];
  export let type: string;

  let filteredData: any[] = [];
  let searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  // @ts-ignore
  $: filteredData = data;

  const useInputAction = {
    register(component: HTMLElement, param: any) {
      fromEvent(component, 'input')
        .pipe(
          tap(() => searchProgress$.next(true)),
          map((event: any) => event.target.value),
          switchMap((value) => doFilter(value)),
        )
        .subscribe((res: any) => {
          filteredData = res.data.map((it: any) => SObject.convertFieldsToCamelCase(it));
          searchProgress$.next(false);
        });
    },
  };

  const doFilter = (value: string) => {
    return notificationStore.findNotifications(type, value);
  };
</script>

<div style="overflow: auto; width: 100%; height: 100%;" class="default-padding">
  <div class="bold-text">{T('TASK.LABEL.' + type)}</div>
  <QuickSearch loading$={searchProgress$} action={useInputAction} placeholder={T('COMMON.LABEL.FILTER')} />
  {#each filteredData as row}
    <MessageItem on:click notification={row} />
  {/each}
</div>
