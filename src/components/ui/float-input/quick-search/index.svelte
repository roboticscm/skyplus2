<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fromEvents } from '@/lib/js/rx';
  import { distinctUntilChanged, switchMap } from 'rxjs/operators';
  export let placeholder = '';
  export let action: any = undefined;

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
  }
</script>

<div class="quick-search-wrapper floating-wrapper">
  <input required use:useAction type="search" class="floating__input" bind:this={inputRef} {placeholder} />
  <label class="floating__label" data-content={placeholder} />
  <i class="search-icon fa fa-search" />
</div>
