<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { T } from '@/lib/js/locale/locale';
  import { Observable } from 'rxjs';
  import { take } from 'rxjs/operators';
  import { settingsStore } from '@/store/settings';
  import { App } from '@/lib/js/constants';

  export let id: string;
  export let menuPath: string;

  export let name: string = undefined;
  export let disabled = false;
  export let className = '';
  export let placeholder: string;
  export let checked: boolean = undefined;
  export let rightCheck: boolean = false;
  export let data: any[] = undefined;
  export let data$: Observable<any> = undefined;
  export let saveState = false;
  export let showAllItem = false;
  export let value: any = undefined;
  export let autoLoad = false;
  export let selectedId: string = undefined;

  const dispatch = createEventDispatcher();

  let _selectedId = selectedId;

  let inputRef: any;
  let _data: any[] = [];

  export const focus = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };

  const onCheck = () => {
    inputRef && inputRef.focus();
  };

  const onChange = (event) => {
    _selectedId = event.target.value;
    if (saveState) {
      settingsStore.saveUserSettings({
        menuPath,
        controlId: id,
        keys: ['lastSelected'],
        values: [_selectedId],
      });
    }
    dispatch('change', _selectedId);
  };

  export const getSelectedId = () => {
    if (_selectedId) {
      return _selectedId;
    } else {
      return inputRef && inputRef.value;
    }
  };

  export const getSelectedName = () => {
    let selectedItem = getSelectedItem();
    if (selectedItem) {
      return selectedItem.name;
    } else {
      return null;
    }
  };

  export const getSelectedItem = () => {
    const selectedId = getSelectedId();
    const selectedItem = _data.filter((item: any) => item.id == selectedId);
    if (selectedItem && selectedItem.length > 0) {
      return selectedItem[0];
    } else {
      return null;
    }
  };

  export const loadSettings = () => {
    return new Observable((observer) => {
      settingsStore
        .getUserSettings(id, menuPath)
        .then((res) => {
          if (res.length > 0) {
            if (res[0].key === 'lastSelected') {
              _selectedId = res[0].value;
            }
          }

          observer.next(res);
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  };

  onMount(() => {
    if (autoLoad) {
      loadSettings()
        .pipe(take(1))
        .subscribe();
    }
  });

  const onClickLabel = () => {
    if (disabled) {
      return;
    }

    dispatch('clickLabel');
  };
  // @ts-ignore
  $: {
    // @ts-ignore
    if ($data$) {
      // @ts-ignore
      _data = $data$;
    } else {
      _data = data;
    }
  }
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .floating__hover:hover {
    color: var(--my-active-color);
    cursor: pointer;
  }
</style>

<div class="floating-wrapper">
  <select
    on:change={onChange}
    bind:value
    {name}
    {disabled}
    class="{checked !== undefined ? 'check' : ''}
    {rightCheck ? 'right' : ''}
    {className}"
    bind:this={inputRef}>

    <option disabled selected={!saveState && _selectedId === undefined} value={-1}>
      {T('COMMON.MSG.PLEASE_SELECT_ONE')}
    </option>

    {#if showAllItem}
      <option value={undefined}>{'--- ' + T('COMMON.LABEL.ALL') + ' ---'}</option>
    {/if}

    {#if $data$ || data}
      {#each _data as item}
        <option value={item.id} selected={item.id == _selectedId}>{item.name}</option>
      {/each}
    {:else}
      <option>{T('COMMON.LABEL.LOADING')}...</option>
    {/if}

  </select>

  <label
    on:click={onClickLabel}
    class="floating__label {disabled ? '' : 'floating__hover'}"
    data-content={placeholder} />
  {#if checked !== undefined}
    <input class={rightCheck ? 'right' : ''} tabindex="-1" bind:checked type="checkbox" on:change={onCheck} />
  {/if}
  <i class="dropdown-icon fa fa-angle-down {rightCheck ? 'right' : ''}" />
</div>
