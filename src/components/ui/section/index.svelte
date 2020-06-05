<script lang="ts">
  import { settingsStore } from '@/store/settings';
  import { onMount } from 'svelte';
  import { StringUtil } from '@/lib/js/string-util';

  export let title: string = '';
  export let collapse = true;
  export let showBorder = true;
  export let roundedBorder = true;
  export let saveState = true;
  export let menuPath: string;
  export let id: string;
  export let titleClass = '';

  let open = true;

  const onToggle = () => {
    open = !open;
    if (saveState) {
      settingsStore.saveUserSettings({
        controlId: id,
        menuPath,
        keys: ['open'],
        values: [open + ''],
      });
    }
  };

  onMount(() => {
    if (saveState) {
      settingsStore.getUserSettings(id, menuPath).then((res: any) => {
        if (res && res.length > 0) {
          open = StringUtil.toBoolean(res[0].value);
        }
      });
    }
  });

  export const openSection = () => {
    open = true;
  };
</script>

<div class="section {showBorder ? 'border' : ''} {roundedBorder ? 'border-radius' : ''}">
  {#if title && title.length > 0}
    <div on:click={onToggle}>
      <div class="section__title {collapse ? 'link' : ''} {titleClass}">
        {@html title}
        &nbsp;
        {#if open}
          <i class="fa fa-minus" />
        {:else}
          <i class="fa fa-angle-down" />
        {/if}
      </div>
      {#if !open}
        <div>
          <slot name="subTitle" />
        </div>
      {/if}
    </div>
  {/if}
  <div class="section__body {open ? '' : 'hide'}">
    <slot />
  </div>

</div>
