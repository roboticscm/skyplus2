<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { SObject } from '@/lib/js/sobject';
  import { markStringSearch } from '@/lib/js/util';
  import { StringUtil } from '@/lib/js/string-util';
  import { TableColumn } from '@/model/base';
  import ProgressBar from '@/components/ui/progress-bar';
  import { BehaviorSubject, Observable } from 'rxjs';
  import { map, switchMap, tap, mergeAll, filter, distinctUntilChanged } from 'rxjs/operators';
  import { fromEvents } from '@/lib/js/rx';
  import SelectableTable from '@/components/ui/selectable-table';
  import { settingsStore } from '@/store/settings';
  import { SearchType } from '@/components/layout/search-bar/types';
  import { AppStore } from '@/store/app';
  import { passwordChar } from './helper';
  import { Browser } from '@/lib/js/browser';

  export let columns: TableColumn[];
  export let height = '50vh';
  export let id: string;
  export let saveState = false;
  export let disabled = false;
  export let menuPath: string;
  export let searchFunc: Function;
  export let className: string;
  export let type = 'search';
  export let placeholder = '';
  export let container: any = undefined;

  // @ts-ignore
  const { isLogged$ } = AppStore;

  let inputWrapperRef: any;
  let inputRef: any;
  let inputWidth: number;
  let tableRef: any;

  let password = '';
  let memoryPassword = '';

  let dropdownFocused = false;
  let textSearch = '';
  let selectedItem: any = undefined;
  let markData: any[] = [];
  let disableAutocomplete;
  let showBackButton;
  let searching$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  const dispatch = createEventDispatcher();
  const displayChar = passwordChar();
  const isSmartPhone = (window as any).isSmartPhone;

  const isSafari = Browser.getBrowser() === 'Safari';
  // @ts-ignore
  $: {
    disableAutocomplete = type === 'password';
    showBackButton = type === 'password';
  }
  const showAutoDropdown = () => {
    if (disableAutocomplete) {
      return;
    }

    dispatch('showPopup', undefined);
    if (!container) {
      inputWidth = window['$'](inputRef).width();
    } else {
      inputWidth = window['$'](container).width();
    }

    (document.querySelector(`#dropdown${id}`) as any).style.width = inputWidth + 'px';
    tableRef.unSelectAll();
    document.querySelector(`#${'dropdown' + id}`).classList.add('show-auto-dropdown');
  };

  const hideAutoDropdown = () => {
    dispatch('hidePopup', undefined);
    setTimeout(() => {
      dropdownFocused = false;
    }, 200);

    document.querySelector(`#${'dropdown' + id}`).classList.remove('show-auto-dropdown');
  };

  const didSearch = (data: any[]) => {
    if (data && data.length > 0) {
      //highligth text search
      const temp = SObject.clone(data);
      if (type !== 'password') {
        markData = temp.map((item) => {
          const markedName = markStringSearch(item.name, textSearch, true);
          item.name = markedName;
          return item;
        });
      } else {
        markData = temp;
      }

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

    if (!isSmartPhone && !dropdownFocused && event.code === 'Enter') {
      // @ts-ignore
      if (type === 'password') {
        dispatch('change', {
          id: SearchType.Login,
          name: getPassword(),
        });
        // @ts-ignore
      } else if (!$isLogged$) {
        dispatch('change', {
          id: SearchType.Login,
          name: inputRef.value,
        });
      } else {
        dispatch('change', {
          id: undefined,
          name: inputRef.value,
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
          if (type !== 'password') {
            textSearch = event.value;
          } else {
            textSearch = getPassword();
          }
          searching$.next(true);
        }),
        switchMap((event: any) => {
          if (type !== 'password') {
            return searchFunc(event.value);
          } else {
            return searchFunc(getPassword());
          }
        }),
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
    if (document.activeElement !== inputRef) {
      if (StringUtil.isEmpty(inputRef.value)) {
        selectItem([
          {
            id: '',
            name: '',
          },
        ]);
      }
      hideAutoDropdown();
    }
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
    document.addEventListener('click', () => {
      hideOnLostFocus();
    });
    if (inputRef) {
      inputRef.focus();
    }
  });

  const selectItem = (data: any) => {
    if (data.length >= 0) {
      if (data[0] && data[0].name) {
        if (type !== 'password') {
          textSearch = StringUtil.removeMark(data[0].name);
          inputRef.value = textSearch;
        } else {
          textSearch = getPassword();
        }

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
          name: textSearch,
        });
      }
    }
  };

  const onTableClick = (event) => {
    console.log('xxxx', event.detail.data);
    selectItem(event.detail.data);
    hideAutoDropdown();
  };

  const onTableKeyup = (event: any) => {
    if (dropdownFocused) {
      if (event.detail.event.code === 'Enter') {
        selectItem(event.detail.data);
        hideAutoDropdown();
      }
    } else {
      if (event.detail.event.code === 'Enter') {
        if (type === 'password') {
          selectItem({
            id: SearchType.Login,
            name: getPassword(),
          });
        } else {
          selectItem({
            id: undefined,
            name: inputRef.value,
          });
        }

        hideAutoDropdown();
      }
    }
  };

  export const focus = () => {
    inputRef.focus();
  };

  export const clear = () => {
    inputRef.value = '';
    memoryPassword = '';
  };

  const onClickBack = () => {
    dispatch('clickBack', undefined);
  };

  const onClickNext = () => {
    dispatch('change', {
      id: SearchType.Login,
      name: getPassword(),
    });
  };

  const onKeyup = (event: any) => {
    if (type !== 'password') {
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      const start = inputRef.selectionStart;
      const end = inputRef.selectionStart;
      if (start === 0 && end === 0) {
        memoryPassword = '';
      } else {
        memoryPassword = memoryPassword.slice(0, start) + memoryPassword.slice(start + 1, memoryPassword.length);
      }
    }
  };

  const onInput = (event: any) => {
    if (type !== 'password') {
      return;
    }

    if (event.data) {
      const pos = inputRef.selectionStart;
      memoryPassword = StringUtil.insertAt(memoryPassword, event.data, pos);

      inputRef.value = new Array(inputRef.value.length).fill(displayChar).join('');
    }
  };

  const onChange = () => {
    if (!isSmartPhone) {
      return;
    }
    if (!dropdownFocused) {
      // @ts-ignore
      if (type === 'password') {
        dispatch('change', {
          id: SearchType.Login,
          name: getPassword(),
        });
        // @ts-ignore
      } else if (!$isLogged$) {
        dispatch('change', {
          id: SearchType.Login,
          name: inputRef.value,
        });
      } else {
        dispatch('change', {
          id: undefined,
          name: inputRef.value,
        });
      }
    }
    hideAutoDropdown();
  };

  export const getPassword = () => {
    return memoryPassword;
  };
</script>

<div class="w-100 auto-dropdown-wrapper" {id} bind:this={inputWrapperRef}>
  {#if isSafari}
    <input
      on:input={onInput}
      required
      on:keyup={onKeyup}
      on:change={onChange}
      bind:value={password}
      bind:this={inputRef}
      autocomplete="off"
      type="text"
      {placeholder}
      class="input {showBackButton ? 'input-left-indent input-large-spacing hide-search-icon' : 'search-mode'}"
      {disabled} />
  {:else}
    <input
      on:input={onInput}
      required
      on:keyup={onKeyup}
      on:change={onChange}
      bind:value={password}
      bind:this={inputRef}
      autocomplete="off"
      type="search"
      {placeholder}
      class="input {showBackButton ? 'input-left-indent input-large-spacing hide-search-icon' : 'search-mode'}"
      {disabled} />
  {/if}

  {#if showBackButton}
    <i on:click={onClickBack} class="back-button fa fa-arrow-left" />
    <i on:click={onClickNext} class="next-button fa fa-arrow-right" />
  {/if}
  <i class="search-icon fa fa-search" />
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
  </div>
</div>
