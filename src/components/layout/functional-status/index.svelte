<script lang="ts">
  import SubmitStatusNewIcon from 'src/icons/submit-status-new24x24.svelte';
  import SubmitStatusWaitForApprovedIcon from 'src/icons/submit-status-wait-for-approved24x24.svelte';
  import SubmitStatusApprovedIcon from 'src/icons/submit-status-approved24x24.svelte';
  import SubmitStatusProcessingIcon from 'src/icons/submit-status-processing24x24.svelte';
  import SubmitStatusCompletedIcon from 'src/icons/submit-status-completed24x24.svelte';
  import RecentIcon from 'src/icons/recent24.svelte';
  import { createEventDispatcher } from 'svelte';
  import { T } from 'src/lib/js/locale/locale';

  export let data: any[] = [];

  const dispatch = createEventDispatcher();

  let iconsTab = [
    { icon: SubmitStatusNewIcon, className: 'status-new large-svg-icon', status: 'INIT' },
    { icon: SubmitStatusWaitForApprovedIcon, className: 'status-wait-for-approve large-svg-icon', status: 'SUBMITTED' },
    { icon: SubmitStatusApprovedIcon, className: 'status-approved large-svg-icon', status: 'APPROVED' },
    { icon: SubmitStatusProcessingIcon, className: 'status-processing large-svg-icon', status: 'PROCESSING' },
    { icon: SubmitStatusCompletedIcon, className: 'status-completed large-svg-icon', status: 'COMPLETED' },
    { icon: RecentIcon, className: 'recent-color large-plus-svg-icon', status: 'RECENT' },
  ];

  let activeIndex = undefined;
  let firstTime = true;
  // @ts-ignore
  $: {
    if (data && data.length > 0) {
      iconsTab = iconsTab.map((it: any) => {
        const index = data.findIndex((dt: any) => dt.status === it.status);
        if (index >= 0) {
          it.statusCode = data[index].statusCode;
          it.title = data[index].title;
          it.field = data[index].id;
          it.counter = data[index].counter;
          if (data[index].active && firstTime) {
            activeIndex = index;
            firstTime = false;
          }
        }

        it.show = index >= 0;

        return it;
      });
    }
  }

  const onClick = (event: any, index: number) => {
    activeIndex = index;
    dispatch('click', event);
  };

  export const clearActive = () => {
    activeIndex = undefined;
  };
</script>

<div class="functional-status">
  {#each iconsTab as item, idx}
    {#if item.show}
      <div title={item.title} class="functional-status__item" on:click={() => onClick(item, idx)}>
        <div>
          <svelte:component
            this={item.icon}
            className="{item.className}
            {idx === activeIndex ? 'active' : 'svg-disabled'}" />
        </div>

        {#if item.counter != undefined}
        <div
          class="functional-status__item__counter {idx === activeIndex ? 'functional-status__item__counter__active' : 'text-disabled'}">
          {item.counter || '0'}
        </div>
          {/if}
      </div>
    {/if}
  {/each}
</div>
