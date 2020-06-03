<script lang="ts">
  import SubmitStatusNewIcon from '@/icons/submit-status-new24x24.svelte';
  import SubmitStatusWaitForApprovedIcon from '@/icons/submit-status-wait-for-approved24x24.svelte';
  import SubmitStatusApprovedIcon from '@/icons/submit-status-approved24x24.svelte';
  import SubmitStatusProcessingIcon from '@/icons/submit-status-processing24x24.svelte';
  import SubmitStatusCompletedIcon from '@/icons/submit-status-completed24x24.svelte';
  import { createEventDispatcher } from 'svelte';
  import { T } from '@/lib/js/locale/locale';

  export let data: any[] = [];

  const dispatch = createEventDispatcher();

  let iconsTab = [
    { icon: SubmitStatusNewIcon, className: 'large-svg-icon', status: 'INIT' },
    { icon: SubmitStatusWaitForApprovedIcon, className: 'large-svg-icon', status: 'SUBMITTED' },
    { icon: SubmitStatusApprovedIcon, className: 'large-svg-icon', status: 'APPROVED' },
    { icon: SubmitStatusProcessingIcon, className: 'large-svg-icon', status: 'PROCESSING' },
    { icon: SubmitStatusCompletedIcon, className: 'large-svg-icon', status: 'COMPLETED' },
  ];

  let activeIndex = undefined;
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
          console.log('data .... ', it.counter);
          if(data[index].active) {
            activeIndex = index;
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
        <div
          class="functional-status__item__counter {idx === activeIndex ? 'functional-status__item__counter__active' : 'text-disabled'}">
          {item.counter || ''}
        </div>
      </div>
    {/if}
  {/each}
</div>
