<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fromEvents } from '@/lib/js/rx';
  import { distinctUntilChanged, switchMap } from 'rxjs/operators';
  import SearchIcon from '@/components/layout/icons/common/search.svelte';
  import { App } from '@/lib/js/constants';
  import { BehaviorSubject } from 'rxjs';

  export let placeholder = '';
  export let action: any = undefined;
  export let showAdvancedSearch = false;
  export let loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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

<div class="quick-search-wrapper" style="margin-top: 20px;">
  <input required use:useAction type="search" class="quick-search-input" bind:this={inputRef} {placeholder} />
  <!--  <i class="search-icon fa fa-search" />-->
  <div class="search-icon">
    <SearchIcon />
  </div>

  {#if $loading$}
    <div class="search-progress">
      {@html App.PROGRESS_BAR}
    </div>
  {/if}
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
