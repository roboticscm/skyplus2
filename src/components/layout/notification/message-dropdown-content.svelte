<script lang="ts">
  import QuickSearch from '@/components/ui/input/quick-search';
  import MessageItem from './message-item.svelte';
  import { T } from '@/lib/js/locale/locale';
  import { fromEvent, BehaviorSubject } from 'rxjs';
  import { map, switchMap, tap } from 'rxjs/operators';
  import { notificationStore } from '@/store/notification';
  import { SObject } from '@/lib/js/sobject';
  import { Mark } from '@/lib/js/mark';

  export let data: any[];
  export let type: string;

  let filteredData: any[] = [];
  let searchProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  let textSearch = '';

  // @ts-ignore
  $: filteredData = data;

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
          filteredData = Mark.mark(filteredData, textSearch);
          textSearch = '';
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
