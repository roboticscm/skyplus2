<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { App } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { SObject } from '@/lib/js/sobject';
  import SelectableTable from '@/components/ui/selectable-table';
  import { StringUtil } from '@/lib/js/string-util';
  import DatePicker from '@/components/ui/input/date-picker';

  export let disabled = false;
  export let className = '';
  export let autocomplete = App.AUTO_COMPLETE;
  export let value;
  export let list: any[] = [];
  export let excludeList: any[] = [];
  export let fullWidth = true;
  export let selected: any = undefined;
  export let showAllItem = false;
  export let id: string = undefined;

  let inputRef: any;
  let dropdownContentRef: any;
  let selectedItem: any = selected;
  let _list: any[];
  let markData: any[] = [];
  let tableRef: any;
  let dropdownFocused = false;
  let inputWrapperRef: any;
  let autoDropdownRef: any;
  let renderType = 'text';

  const isSmartPhone = (window as any).isSmartPhone;

  const columns = [
    {
      name: 'id',
      type: 'hidden',
    },
    {
      name: 'name',
    },
  ];

  const dispatch = createEventDispatcher();

  // @ts-ignore
  $: selectedItem = selected;

  // @ts-ignore
  $: {
    const distinctFilterColumns = list.filter((el: any) => !excludeList.includes(el.id) || el.id == selectedItem.id);
    if (distinctFilterColumns && distinctFilterColumns.length > 0) {
      // @ts-ignore
      _list = SObject.clone(distinctFilterColumns);
      if (showAllItem) {
        _list.unshift({ id: '-1', name: 'ALL' });
      }

      if (!selectedItem.id) {
        selectedItem.id = _list[0].id;
        selectedItem.name = _list[0].name;
      }
    } else {
      if (showAllItem) {
        _list.unshift({ id: '-1', name: 'ALL' });
      }

      selectedItem.id = undefined;
      selectedItem.name = '';
    }
  }

  export const focus = () => {
     inputRef && inputRef.focus();
  };

  const showPopup = () => {
    const containerWidth = window['$']('.floating-filter-wrapper').width();
    if (fullWidth) {
      dropdownContentRef.style.width = `${containerWidth}px`;
    }
    dropdownContentRef.classList.add('show-dropdown');
  };

  const hidePopup = () => {
    dropdownContentRef.classList.remove('show-dropdown');
  };

  const onClickItem = (item: any) => {
    renderType = item.type;
    hidePopup();
    dispatch('itemChange', item);
    selectedItem = item;
  };

  const preSearch = (event) => {
    if (event.code === 'Escape') {
      hideAutoDropdown();
      return false;
    }

    if (!dropdownFocused && event.code === 'ArrowDown') {
      tableRef.focus();
      dropdownFocused = true;
      return false;
    } else if (event.code === 'ArrowDown') {
      return false;
    }

    if (!isSmartPhone && !dropdownFocused && event.code === 'Enter') {
      if (!dropdownFocused) {
        dispatch('search', inputRef && inputRef.value);
      }
      hideAutoDropdown();
      return false;
    }

    return true;
  };

  const onSearchInput = () => {
    if (!isSmartPhone) {
      return;
    }

    if (inputRef.value.trim().length > 0) {
      dispatch('search', inputRef && inputRef.value.trim());
    } else {
      hideAutoDropdown();
    }
  };

  const onChangeCheckbox = (event: any) => {
    dispatch('search', event.target.checked);
  }

  const onClickInput = () => {
    if (inputRef && inputRef.value.trim().length > 0) {
      showAutoDropdown();
    }
  };

  let emptyCount = 0;
  const onFocus = () => {
    emptyCount = 0;
  }

  const onKeyupInput = (event: any) => {
    if(event.target.value === '') {
      emptyCount++;
      dispatch('emptyCount', emptyCount);
    } else {
      emptyCount = 0;
    }

    if (!preSearch(event)) {
      return;
    }
    markData = _list
      .filter((it: any) => it.id.toString() !== selectedItem.id.toString())
      .map((it: any) => {
        return {
          id: it.id,
          name: `<mark>${(inputRef && inputRef.value)}</mark> in [${it.name}]`,
        };
      });
    showAutoDropdown();
  };

  const selectItem = (data: any) => {
    if (data.length >= 0 && data[0]) {
      dispatch('search', data[0].id);
    }
  };

  const hideAutoDropdown = () => {
    dropdownFocused = false;
    autoDropdownRef.classList.remove('simple-show-auto-dropdown');
  };

  const onTableClick = (event) => {
    selectItem(event.detail.data);
    hideAutoDropdown();
  };

  const onTableKeyup = (event: any) => {
    if (dropdownFocused && event.detail.event.code === 'Enter') {
      // selectItem(event.detail.data);
    }
  };

  const showAutoDropdown = () => {
    tableRef.unSelectAll();
    const containerWidth = window['$'](inputWrapperRef).width();
    autoDropdownRef.style.width = containerWidth + 'px';
    autoDropdownRef.classList.add('simple-show-auto-dropdown');
  };

  const hideOnLostFocus = () => {
    setTimeout(() => {
      if (document.activeElement !== inputRef) {
        if (StringUtil.isEmpty((inputRef && inputRef.value)||'')) {
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
    inputWrapperRef && inputWrapperRef.addEventListener('focusout', hideOnLostFocus);
  });
</script>

<style lang="scss">

</style>

<div class="floating-filter-wrapper" bind:this={inputWrapperRef}>
  {#if renderType === 'text'}
    <input
      {id}
      on:focus = {onFocus}
      on:keyup={onKeyupInput}
      on:click={onClickInput}
      on:search={onSearchInput}
      required
      type="search"
      {disabled}
      class="floating-filter__input {className}"
      bind:value
      {autocomplete}
      bind:this={inputRef}
      placeholder={T('SYS.LABEL.SEARCH_WITH') + ': ' + selectedItem.name} />
    {:else if renderType === 'boolean'}
      <input type="checkbox" class="floating-filter__input {className}" on:change={onChangeCheckbox}>
    {:else if renderType === 'date'}
      <DatePicker className="floating-filter__input"></DatePicker>
    {/if}
  <label class="primary floating-filter__label" data-content={selectedItem.name} />
  <div class="floating-filter__select" on:mouseover|stopPropagation={showPopup} on:mouseout={hidePopup}>
    <span class="primary w-100" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
      {selectedItem.name}
    </span>
    <i
      class="primary fa fa-angle-down"
      style="border-right: 1px solid rgba(0, 0, 0, 0.2); min-width: 15px; display: flex; flex-direction: column;
      justify-content: flex-end;" />
    <div bind:this={dropdownContentRef} class=" {fullWidth ? '' : 'w-100'} filter-dropdown-content">
      {#each _list as item}
        <div
          on:click={() => onClickItem(item)}
          class="primary filter-dropdown-item {item.id.toString() === selectedItem.id.toString() ? 'filter-active-item' : ''}">
          {@html item.name}
        </div>
      {/each}
    </div>
  </div>

  <div bind:this={autoDropdownRef} style="height: 200px;" class="simple-auto-dropdown">
    <SelectableTable
      on:click={onTableClick}
      on:keyup={onTableKeyup}
      bind:this={tableRef}
      data={markData}
      showRowNumber={false}
      {columns}
      showHeader={false} />
  </div>
</div>
