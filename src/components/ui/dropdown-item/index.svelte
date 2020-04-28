<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let useFontIcon = false;
  export let fontIcon: string;
  export let iconData: string;
  export let text: string;
  export let selected = false;
  export let inline = true;

  const dispatch = createEventDispatcher();
  const onClick = () => {
    dispatch('click');
  };
</script>

<div
  class="{inline ? 'dropdown-item' : ''}
  {selected ? 'dropdown-content__selected' : ''}"
  on:click|stopPropagation={onClick}>
  {#if useFontIcon}
    <span>
      {@html fontIcon}
    </span>
  {:else if iconData}
    <span>
      <img src={iconData} alt="" />
    </span>
  {:else}
    <span>
      <i class="fa fa-bars" />
    </span>
  {/if}
  <span style="white-space: nowrap">
    {@html text}
  </span>
  <slot />
</div>
