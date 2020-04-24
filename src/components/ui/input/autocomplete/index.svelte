<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { SObject } from '@/lib/js/sobject';
  import { markStringSearch } from '@/lib/js/util';
  import { StringUtil } from '@/lib/js/string-util';
  import { Debug } from '@/lib/js/debug';
  import { TableColumn } from '@/model/base';
  import ProgressBar from '@/components/ui/progress-bar';
  import { BehaviorSubject, Observable } from 'rxjs';
  import { map, switchMap, tap, mergeAll, filter, distinctUntilChanged } from 'rxjs/operators';
  import { fromEvents } from '@/lib/js/rx';
  import SelectableTable from '@/components/ui/selectable-table';
  import { settingsStore } from '@/store/settings';

  export let columns: TableColumn[];
  export let height = '50vh';
  export let id: string;
  export let saveState = false;
  export let disabled = false;
  export let menuPath: string;
  export let searchFunc: Function;
  export let popupWidth: number = undefined;
  export let className: string;
  export let type = 'search';
  export let placeholder = '';

  let inputWrapperRef: any;
  let inputRef: any;
  let inputWidth: number;
  let tableRef: any;

  let dropdownFocused = false;
  let textSearch = '';
  let selectedItem: any = undefined;
  let markData: any[] = [];
  let disableAutocomplete;
  let searching$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  const dispatch = createEventDispatcher();

  // @ts-ignore
  $: {
    disableAutocomplete = type === 'password';
    console.log('.... change type', type, disableAutocomplete);

  }
  const showAutoDropdown = () => {
    if (disableAutocomplete) {
      return;
    }

    dispatch('showPopup', undefined);
    if(!popupWidth) {
      document.querySelector(`#${id}`).addEventListener('focusout', hideOnLostFocus);
      inputWidth = window['$'](inputRef).width();
    } else {
      inputWidth = popupWidth;
    }

    (document.querySelector(`#dropdown${id}`) as any).style.width = inputWidth + 'px';

    tableRef.unSelectAll();
    document.querySelector(`#${'dropdown' + id}`).classList.add('show-auto-dropdown');
  };

  const hideAutoDropdown = () => {
    dispatch('hidePopup', undefined);
    setTimeout(() => {
      dropdownFocused = false;
    }, 100);

    document.querySelector(`#${'dropdown' + id}`).classList.remove('show-auto-dropdown');
  };
  const didSearch = (data: any[]) => {
    if (data && data.length > 0) {
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

    if (event.code === 'Enter') {
      if (!dropdownFocused) {
        dispatch('change', {
          id: undefined,
          name: inputRef.value
        });
      }
      hideAutoDropdown();
      return false;
    }

    return true;
  };

  const doSearch = () => {
    const events$ = fromEvents(inputRef, 'keyup', 'click').pipe(
      filter((event) => preSearch(event)),
      map((event: any) => {
        return {
          type: event.type,
          value: event.target.value,
        };
      }),
    );
    events$
      .pipe(
        distinctUntilChanged((before: any, after: any) => {
          return before.value === after.value && after.type !== 'click';
        }),
        tap((event: any) => {
          textSearch = event.value;
          searching$.next(true);
        }),
        switchMap((event: any) => searchFunc(event.value)),
      )
      .subscribe({
        next: (res) => {
          didSearch(res.data);
        },
        error: (error) => {
          searching$.next(false);
        },
      });
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

  export const getSelectedItem = () => {
    if (selectedItem && selectedItem.name && textSearch !== StringUtil.removeMark(selectedItem.name)) {
      return null;
    }
    return selectedItem;
  };

  export const getSelectedId = () => {
    const selectedItem = getSelectedItem();
    return selectedItem ? selectedItem.id : null;
  };

  export const getSelectedName = () => {
    if (textSearch.trim().length === 0) {
      selectedItem = undefined;
    }
    const _selectedItem = getSelectedItem();
    return _selectedItem ? _selectedItem.name : null;
  };

  export const getInputText = () => {
    return textSearch;
  };

  export const loadSettings = () => {
    return new Observable((observer) => {
      settingsStore
        .getUserSettings(id, menuPath)
        .then((data) => {
          const idFilter = data.filter((it: any) => it.key === 'autoId');

          let id = null;
          if (idFilter.length > 0) {
            id = idFilter[0].value;
          }

          const nameFilter = data.filter((it: any) => it.key === 'autoName');
          let name = null;
          if (nameFilter.length > 0) {
            name = nameFilter[0].value;
            textSearch = name;
          }

          selectedItem = {
            id,
            name,
          };

          observer.next(selectedItem);
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  };

  onMount(() => {
    doSearch();
    inputWrapperRef && inputWrapperRef.addEventListener('focusout', hideOnLostFocus);
  });

  const selectItem = (data: any) => {
    if (data.length >= 0) {
      if (data[0] && data[0].name) {
        textSearch = StringUtil.removeMark(data[0].name);
        selectedItem = data[0];
        if (saveState) {
          settingsStore.saveUserSettings({
            menuPath,
            controlId: id,
            keys: ['autoId', 'autoName'],
            values: [data[0].id, textSearch],
          });
        }
        dispatch('change', {
          id: data[0].id,
          name: textSearch
        });
      }
    }
  };

  const onTableClick = (event) => {
    selectItem(event.detail.data);
    hideAutoDropdown();
  };

  const onTableKeyup = (event: any) => {
    if (event.detail.event.code === 'Enter') {
      selectItem(event.detail.data);
      hideAutoDropdown();
    }
  };

  export const focus = () => {
    inputRef.focus();
  }

  export const clear = () => {
    inputRef.value='';
  }

  const onFocus = (event) => {
    inputRef.removeAttribute('readonly');
  };
</script>

<div class="w-100 auto-dropdown-wrapper" {id} bind:this={inputWrapperRef}>
  <div style="display:none">
    <input type="password" tabindex="-1"/>
  </div>

  <input
    bind:this={inputRef}
    autocomplete="off"
    {type}
    {placeholder}
    class="form-control"
    id={'dropdownInput' + id}
      readonly
    on:focus={onFocus}
    {disabled} />

  <ProgressBar loading$={searching$} smallSize={true} />
  <div style={`height: ${height};`} class="auto-dropdown {className}" id={'dropdown' + id}>
    <SelectableTable
      on:click={onTableClick}
      on:keyup={onTableKeyup}
      bind:this={tableRef}
      id={'table' + id}
      data={markData}
      showRowNumber={false}
      {columns}
      {menuPath}
      {saveState}
      showHeader={false} />
    <!--    <HandsonTable on:beforeKeyDown={onBeforeKeyDownTable} bind:this={tableRef} id={'table' + id} data={markData} {columns} {menuPath} showHeader={false} />-->
  </div>
</div>
