<script lang="ts">
  import QuickSearch from '@/components/ui/float-input/quick-search';
  import MessageItem from './message-item.svelte';
  import { T } from '@/lib/js/locale/locale';

  export let data: any[];
  export let title: string;
</script>

<div style="overflow: auto; width: 100%; height: 100%;" class="default-padding">
  <div class="bold-text">{title}</div>
  <QuickSearch placeholder={T('COMMON.LABEL.FILTER')} />
  {#each data as row}
    <MessageItem on:click notification={row} />
  {/each}
</div>
