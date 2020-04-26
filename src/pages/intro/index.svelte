<script lang="ts">
  import { onMount } from 'svelte';
  import Store from './store';
  import NewsItem from './news-item/index.svelte';

  const { dataList$ } = Store;

  onMount(() => {
    Store.getList();
  });
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .news-content {
    height: 100%;
    max-width: 1300px;
    margin: 0 auto;
    padding-left: $large-padding;
    padding-right: $large-padding;
    padding-top: $default-padding;
  }

  .news {
    display: flex;
    flex-wrap: wrap;
    margin: 0 auto;
    justify-content: center;
    align-content: space-evenly;
  }
</style>

<div class="news-content">
  <div class="news">
    <!--      <div class="row">-->
    {#each $dataList$ as item}
      <!--      <div class="col-xs-24 col-md-12 col-lg-6 ">-->
      <NewsItem news={item} />
      <!--      </div>-->
    {/each}
  </div>
</div>
