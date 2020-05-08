<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fromEvents } from '@/lib/js/rx';
  import { distinctUntilChanged, switchMap } from 'rxjs/operators';
  export let placeholder = '';
  export let action: any = undefined;
  export let showAdvancedSearch = false;

  let inputRef: any;

  const dispatch = createEventDispatcher();

  export const getTextSearch = () => {
    return inputRef.value;
  };

  const useAction = (component, param) => {
    if (action) {
      action.register(component, param);
    }
  };

  export const focus = () => {
    inputRef.focus();
  };

  const onMouseoverAdvanced = () => {
    dispatch('mouseoverAdvanced');
  };

  const onMouseoutAdvanced = () => {
    dispatch('mouseoutAdvanced');
  };

  const onClickAdvanced = () => {
    dispatch('clickAdvanced');
  };
</script>

<div class="quick-search-wrapper floating-wrapper">
  <input required use:useAction type="search" class="floating__input" bind:this={inputRef} {placeholder} />
  <label class="floating__label" data-content={placeholder} />
  <i class="search-icon fa fa-search" />
  {#if showAdvancedSearch}
    <i
      on:click={onClickAdvanced}
      on:mouseover={onMouseoverAdvanced}
      on:mouseout={onMouseoutAdvanced}
      class="advanced-icon fa fa-chevron-down">
      <slot />
    </i>
  {/if}
</div>
