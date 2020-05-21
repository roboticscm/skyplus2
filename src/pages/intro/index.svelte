<script lang="ts">
  import { onMount } from 'svelte';
  import Store from './store';
  import NewsItem from './news-item/index.svelte';
  import SkyhubLogo from '@/components/layout/icons/skyhub';
  import SearchBar from '@/components/layout/search-bar';
  import QRCode from 'qrcode';

  const { dataList$ } = Store;

  let qrcodeRef: any;

  onMount(() => {
    Store.getList();

    QRCode.toCanvas(qrcodeRef, 'SKYHUB', { margin: 0, version: 1 }, function(error) {
      if (error) {
        console.error(error);
      }
    });
  });
</script>

<div class="login-wrapper">
  <div class="login-logo {$dataList$.length > 0 ? 'login-logo-margin-top' : ''}">
    <SkyhubLogo />
  </div>
  <div class="login-welcome-text">Welcome to SKYHUB</div>

  <div class="login-search">
    <SearchBar id="mainSearchBarId" menuPath="intro" />
  </div>

  <div class="login-qrcode">
    <canvas bind:this={qrcodeRef} />
  </div>
  <div class="news">
    {#if $dataList$ && $dataList$.length > 0}
      {#each $dataList$ as item}
        <NewsItem news={item} />
      {/each}
    {/if}
  </div>
</div>
