<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { StringUtil } from 'src/lib/js/string-util';
  import { TableColumn } from 'src/model/base';
  import SelectableTable from 'src/components/ui/selectable-table';
  import { T } from 'src/lib/js/locale/locale';

  export let columns: TableColumn[] = [{ name: 'name' }];
  export let height = '50vh';
  export let id: string;
  export let saveState = false;
  export let disabled = false;
  export let menuPath: string;
  export let data: any[] = [];
  export let placeholder: string;
  export let value: any;
  export let loading = true;

  loading;
  saveState;

  let inputRef: any;
  let tableRef: any;
  let dropdownFocused = false;
  const defaultItemName = T('COMMON.MSG.PLEASE_SELECT_ONE');
  let selectedItem: any = { id: null, name: defaultItemName };
  const dispatch = createEventDispatcher();

  const showAutoDropdown = () => {
    document.querySelector(`#${'dropdown' + id}`).classList.add('simple-show-auto-dropdown');
  };
  const hideAutoDropdown = () => {
    dropdownFocused = false;
    document.querySelector(`#${'dropdown' + id}`).classList.remove('simple-show-auto-dropdown');
  };

  const hideOnLostFocus = () => {
    const inputEle: any = document.querySelector(`#${'dropdownInput' + id}`);
    setTimeout(() => {
      if (document.activeElement !== inputEle) {
        if (StringUtil.isEmpty(inputEle.value)) {
          selectItem([
            {
              id: '',
              name: '',
            },
          ]);
        }
        hideAutoDropdown();
      }
    }, 300);
  };

  onMount(() => {
    document.querySelector(`#${id}`).addEventListener('focusout', hideOnLostFocus);
  });

  const selectItem = (event) => {
    selectedItem = event[0];
    value = selectedItem && selectedItem.id;
  };

  const onTableClick = (event) => {
    selectItem(event.detail.data);
    hideAutoDropdown();
  };

  const onTableKeyup = (event: any) => {
    if (event.detail.event.code === 'Enter' && dropdownFocused) {
      selectItem(event.detail.data);
      hideAutoDropdown();
    }
  };

  const onClickInput = () => {
    if (disabled) {
      return;
    }
    showAutoDropdown();
  };

  export const focus = () => {
    inputRef.focus();
  };

  const onClickLabel = () => {
    if (disabled) {
      return;
    }
    dispatch('clickLabel');
  };

  // @ts-ignore
  $: {
    const index = data.findIndex((it: any) => it.id === value);
    if (index >= 0) {
      selectedItem = data[index];
    } else {
      selectedItem = { id: null, name: defaultItemName };
    }
  }

  // @ts-ignore
  $: {
    data.unshift({ id: null, name: defaultItemName });
  }
</script>

<div class="simple-auto-dropdown-wrapper floating-wrapper" {id}>
  <input
    on:click={onClickInput}
    bind:this={inputRef}
    type="search"
    class="floating__input"
    id={'dropdownInput' + id}
    readonly
    {disabled}
    bind:value={selectedItem.name} />
  <label class="floating__label {disabled ? 'disabled' : ''}" data-content={placeholder} on:click={onClickLabel} />
  <div style={`height: ${height};`} class="simple-auto-dropdown" id={'dropdown' + id}>
    {#if data && data.length > 0}
      <SelectableTable
        className="table-one-column"
        selectedId={selectedItem.id}
        on:click={onTableClick}
        on:keyup={onTableKeyup}
        bind:this={tableRef}
        id={'table' + id}
        {data}
        showRowNumber={false}
        {columns}
        {menuPath}
        showHeader={false} />
    {/if}
  </div>
</div>
