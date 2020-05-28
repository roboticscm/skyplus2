<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { App } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { SObject } from '@/lib/js/sobject';
  import SelectableTable from '@/components/ui/selectable-table';
  import { StringUtil } from '@/lib/js/string-util';
  import DatePicker from '@/components/ui/input/date-picker';
  import { fromEvents } from '@/lib/js/rx';
  import { distinctUntilChanged, switchMap, tap, map, filter } from 'rxjs/operators';
  import { BehaviorSubject, Observable } from 'rxjs';
  import { markStringSearch } from '@/lib/js/util';
  import { SearchUtilStore } from '@/store/search-util';

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
  export let searchFunc: Function;
  export let menuPath: string;

  let inputRef, datePickerRef, checkboxRef: any;
  let dropdownContentRef: any;
  let selectedItem: any = selected;
  let _list: any[] = [];
  let markData: any[] = [];
  let tableRef: any;
  let dropdownFocused = false;
  let inputWrapperRef: any;
  let autoDropdownRef: any;

  let textSearch = '';
  const searching$ = new BehaviorSubject<boolean>(false);

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
    datePickerRef && datePickerRef.focus();
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
    hidePopup();
    dispatch('itemChange', item);
    selectedItem = item;

    inputRef && inputRef.focus();

    setTimeout(() => {
      datePickerRef && datePickerRef.focus();
      if (checkboxRef) {
        checkboxRef.focus();
        value = true;
      }
    });

    // update counter
    SearchUtilStore.updateCounter(item.id, menuPath).subscribe();
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

    if (!StringUtil.isEmpty(inputRef.value)) {
      dispatch('search', inputRef.value.trim());
    } else {
      hideAutoDropdown();
    }
  };

  const onClickInput = () => {
    if (inputRef && inputRef.value.trim().length > 0) {
      showAutoDropdown();
    }
  };

  let emptyCount = 0;
  const onFocus = () => {
    emptyCount = 0;
  };

  const onKeyupInput = (event: any) => {
    if (event.code === 'Enter' && event.target.value === '') {
      emptyCount++;
      dispatch('emptyCount', emptyCount);
    } else {
      emptyCount = 0;
    }
  };

  const didSearch = (data: any[]) => {
    console.log('data ', data);
    if (data.length > 0) {
      //highligth text search
      const temp = SObject.clone(data);
      markData = temp.map((item) => {
        const markedName = markStringSearch(item.name, textSearch, true);
        item.name = markedName;
        return item;
      });
      showAutoDropdown();
      searching$.next(false);
    } else {
      hideAutoDropdown();
      searching$.next(false);
    }
  };

  const selectItem = (data: any) => {
    if (data.length >= 0 && data[0]) {
      selectedItem.value = StringUtil.removeHtmlTag(data[0].name);
      value = selectedItem.value;
      dispatch('search', data[0].id);
    }
  };

  const hideAutoDropdown = () => {
    dropdownFocused = false;
    autoDropdownRef && autoDropdownRef.classList.remove('simple-show-auto-dropdown');
  };

  const onTableClick = (event) => {
    selectItem(event.detail.data);
    hideAutoDropdown();
  };

  const onTableKeyup = (event: any) => {
    if (dropdownFocused && event.detail.event.code === 'Enter') {
      selectItem(event.detail.data);
    }
  };

  const showAutoDropdown = () => {
    tableRef.unSelectAll();
    if (autoDropdownRef) {
      const containerWidth = window['$'](inputWrapperRef).width();
      autoDropdownRef.style.width = containerWidth + 'px';
      autoDropdownRef.classList.add('simple-show-auto-dropdown');
    }
  };

  const hideOnLostFocus = () => {
    setTimeout(() => {
      if (
        document.activeElement !== inputRef &&
        document.activeElement !== datePickerRef &&
        document.activeElement !== checkboxRef
      ) {
        if (!datePickerRef && !checkboxRef && StringUtil.isEmpty((inputRef && inputRef.value) || '')) {
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

  const doSearch = (ob$: Observable<any>) => {
    ob$
      .pipe(
        filter((event) => preSearch(event)),
        map((event: any) => {
          return {
            type: event.type,
            value: event.target.value,
          };
        }),
        distinctUntilChanged((before: any, after: any) => {
          return before.value === after.value && after.type !== 'click';
        }),
        tap((event: any) => {
          textSearch = event.value;
          searching$.next(true);
        }),
        switchMap((event: any) => searchFunc(selectedItem.id, event.value)),
      )
      .subscribe({
        next: (res: any) => {
          didSearch(res.data);
        },
        error: (error) => {
          searching$.next(false);
        },
      });
  };

  onMount(() => {
    inputWrapperRef && inputWrapperRef.addEventListener('focusout', hideOnLostFocus);
  });

  const onChangeDatePicker = (event: any) => {
    dispatch('search', event.detail.start);
  };

  const onChangeCheckbox = (event: any) => {
    dispatch('search', event.target.checked);
  };

  const inputAction = (component, param) => {
    const events$ = fromEvents(component, 'keyup', 'click');
    doSearch(events$);
  };
</script>

<style lang="scss">

</style>

<div class="floating-filter-wrapper" bind:this={inputWrapperRef}>
  {#if selectedItem.type === 'text'}
    <input
      {id}
      use:inputAction
      on:focus={onFocus}
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
    {#if $searching$}
      <div class="primary search-progress">
        {@html App.PROGRESS_BAR}
      </div>
    {/if}
  {:else if selectedItem.type === 'boolean'}
    <input
      bind:this={checkboxRef}
      class="floating-filter__checkbox {className}"
      type="checkbox"
      bind:checked={value}
      on:change={onChangeCheckbox} />
  {:else if selectedItem.type === 'date'}
    <DatePicker
      {id}
      className="floating-filter__input {className}"
      {disabled}
      bind:this={datePickerRef}
      placeholder={T('SYS.LABEL.SEARCH_WITH') + ': ' + selectedItem.name}
      bind:value
      on:change={onChangeDatePicker} />
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
    <div
      bind:this={dropdownContentRef}
      class="
      {fullWidth ? '' : 'w-100'} filter-dropdown-content"
      style="height: 300px;">
      {#each _list as item}
        <div
          on:click={() => onClickItem(item)}
          class="primary filter-dropdown-item {item.id.toString() === selectedItem.id.toString() ? 'filter-active-item' : ''}">
          {@html item.name}
        </div>
      {/each}
    </div>
  </div>

  <div bind:this={autoDropdownRef} style="height: 300px;" class="simple-auto-dropdown">
    <SelectableTable
      className="table-one-column"
      on:click={onTableClick}
      on:keyup={onTableKeyup}
      bind:this={tableRef}
      data={markData}
      showRowNumber={false}
      {columns}
      showHeader={false} />
  </div>
</div>
