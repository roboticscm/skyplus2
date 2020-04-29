<script lang="ts">
  import { onMount } from 'svelte';
  import Store from './store';
  import NewsItem from './news-item/index.svelte';
  import SkyhubLogo from '@/components/layout/icons/skyhub';

  const { dataList$ } = Store;

  onMount(() => {
    Store.getList();
  });
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .news-content {
    height: 100%;
    width: 100%;
    /*max-width: 1300px;*/
    margin: 0 auto;
    padding-left: $large-padding;
    padding-right: $large-padding;
    padding-top: $default-padding;
    background: var(--bg-primary);
  }

  .news {
    display: flex;
    flex-wrap: wrap;
    margin-top: 50px;
    justify-content: center;
    align-content: space-evenly;
  }
</style>

<div class="news-content">
  <div class="news">
    {#if $dataList$ && $dataList$.length > 0}
      {#each $dataList$ as item}
        <NewsItem news={item} />
      {/each}
    {:else}
      <SkyhubLogo />
    {/if}
  </div>
</div>
