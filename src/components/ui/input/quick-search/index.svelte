<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import SearchIcon from '@/components/layout/icons/common/search.svelte';
  import { App } from '@/lib/js/constants';
  import { BehaviorSubject } from 'rxjs';
  import { T } from '@/lib/js/locale/locale';

  export let placeholder = '';
  export let action: any = undefined;
  export let showAdvancedSearch = false;
  export let loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  export let title = `
    ${T('COMMON.LABEL.FULL_TEXT_SEARCH_OPTION')}:
    1. ${T('COMMON.LABEL.EXACT')}: ${T('COMMON.LABEL.START_WITH')} " -> ${T('COMMON.LABEL.EX')}: "some text
    2. ${T('COMMON.LABEL.SEARCH_OR')}: | -> ${T('COMMON.LABEL.EX')}: some | text
    3. ${T('COMMON.LABEL.ADVANCED')}: ${T('COMMON.LABEL.START_WITH')} \` -> ${T(
    'COMMON.LABEL.EX',
  )}: \`Word<n>OtherWord (n: number)
  `;
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

<div class="quick-search-wrapper">
  <input {title} on:input required use:useAction type="search" class="quick-search-input" bind:this={inputRef} {placeholder} />
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
