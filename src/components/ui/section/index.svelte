<script lang="ts">
  export let title: string = '';
  export let collapse = true;
  export let showBorder = true;
  export let roundedBorder = true;

  let open = true;

  const onToggle = () => {
    open = !open;
  };
</script>

<div class="section {showBorder ? 'border' : ''} {roundedBorder ? 'border-radius' : ''}">
  {#if title && title.length > 0}
    <div on:click={onToggle} class="section__title {collapse ? 'link' : ''}">
      {title}
      {#if open}
        <i class="fa fa-minus" />
      {:else}
        <i class="fa fa-angle-down" />
      {/if}
    </div>
  {/if}
  <div class="section__body {open ? '' : 'hide'}">
    <slot />
  </div>

</div>
