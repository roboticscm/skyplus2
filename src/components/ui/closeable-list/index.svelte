<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CloseableListItem } from './types';
  import { Observable } from 'rxjs';
  import Modal from 'src/components/ui/modal/base';
  import { ModalType } from 'src/components/ui/modal/types';
  import { ButtonPressed } from '../button/types';
  import { T } from 'src/lib/js/locale/locale';
  import { API } from 'src/lib/js/constants';

  export let confirmDelete = false;
  export let menuPath: string;
  export let id: string;
  export let directClose = false;
  export let className = '';
  export let linkClass = '';
  export let disabled = false;
  export let download = false;
  export let savePath = '';

  export let customRender: string = undefined;
  export let list: any[] = [];

  const dispatch = createEventDispatcher();

  let modalRef: any;
  let _data: any[] = [];
  let CustomRender: any;

  const downloadUrl = API.BASE_URL + 'sys/download?filePath=';

  // @ts-ignore
  $: if (list && list.length > 0 && list[0].id) {
    _data = list;
  } else {
    _data = [];
  }

  // @ts-ignore
  $: {
    if (customRender) {
      import('src/' + customRender).then((res: any) => (CustomRender = res.default));
    }
  }

  const onClickItem = (row: CloseableListItem) => {
    if (disabled) {
      return;
    }

    dispatch('click', row);
  };

  const onClose = (e: any, row: CloseableListItem) => {
    if (disabled) {
      return;
    }

    if (confirmDelete) {
      modalRef.show().then((buttonPressed: ButtonPressed) => {
        if (buttonPressed === ButtonPressed.OK) {
          if (directClose) {
            // e.target.parentElement.style.display = 'none';
            const index = _data.findIndex((it: any) => it.id === row.id);
            _data.splice(index, 1);
            _data = [..._data];
          }
          dispatch('close', row);
        }
      });
    } else {
      if (directClose) {
        // e.target.parentElement.style.display = 'none';
        const index = _data.findIndex((it: any) => it.id === row.id);
        _data.splice(index, 1);
        _data = [..._data];
      }
      dispatch('close', row);
    }
    list = _data;
  };

  const onCloseAll = () => {
    if (disabled) {
      return;
    }

    if (confirmDelete) {
      modalRef.show().then((buttonPressed: ButtonPressed) => {
        if (buttonPressed === ButtonPressed.OK) {
          if (directClose) {
            clearAll();
          }
          dispatch('closeAll');
        }
      });
    } else {
      if (directClose) {
        clearAll();
      }
      dispatch('closeAll');
    }
  };

  export const push = (item: CloseableListItem) => {
    _data = [..._data, item];
    list = _data;
  };

  export const clearAll = () => {
    _data = [];
    list = _data;
  };

  export const getData = () => {
    return _data.map((it: any) => it.id + it.name);
  };
</script>

<Modal id={'confirmModal' + id} {menuPath} modalType={ModalType.Confirm} bind:this={modalRef} />
<div class="closeable-list {className} {disabled ? '' : 'closeable-list__hover'}">
  {#if _data && _data.length > 1}
    <span title={T('COMMON.LABEL.CLOSE_ALL')} class="close-all" on:click={onCloseAll}>&times;</span>
  {/if}
  <div class="closeable-list__content ">
    <ul>
      {#if customRender}
        {#each _data as row}
          {#if row.show}
            <li on:click={() => onClickItem(row)}>
              <svelte:component this={CustomRender} data={row} {disabled} on:view on:edit on:submit />
              {#if row.closeable}
                <span class="close" on:click={(e) => onClose(e, row)}>&times;</span>
              {/if}
            </li>
          {/if}
        {/each}
      {:else}
        {#each _data as row}
          <li class={row.lineThrough ? 'line-through' : ''} on:click={() => onClickItem(row)}>
            {#if download}
              <a download href={downloadUrl + savePath + '/' + row.id + row.name}>{row ? row.name : ''}</a>
            {:else}{row ? row.name : ''}{/if}
            <span class="close" on:click={(e) => onClose(e, row)}>&times;</span>
          </li>
        {/each}
      {/if}
    </ul>
  </div>

  <div class="closeable-list__controller {linkClass}">
    <slot />
  </div>

  <div class="closeable-list__floating-controller {linkClass}">
    <slot name="floatingController" />
  </div>

</div>
