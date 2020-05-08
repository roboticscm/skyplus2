<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CloseableListItem } from './types';
  import { Observable } from 'rxjs';
  import Modal from '@/components/ui/modal/base';
  import { ModalType } from '@/components/ui/modal/types';
  import { ButtonPressed } from '../button/types';

  export let data: CloseableListItem[] = undefined;
  export let data$: Observable<CloseableListItem[]> = undefined;
  export let confirmDelete = false;
  export let menuPath: string;
  export let id: string;
  export let directClose = false;
  export let className = '';
  export let disabled = false;

  export let customRender: string = undefined;
  export let customData: any[] = [];

  const dispatch = createEventDispatcher();

  let modalRef: any;
  let _data: CloseableListItem[] = [];
  let CustomRender: any;

  // @ts-ignore
  $: {
    if (data) {
      _data = data;
      // @ts-ignore
    } else if ($data$) {
      // @ts-ignore
      _data = $data$;
    }
  }

  // @ts-ignore
  $: {
    if (customRender) {
      import('@/' + customRender).then((res: any) => (CustomRender = res.default));
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
  };

  export const push = (item: CloseableListItem) => {
    _data = [..._data, item];
  };

  export const clearAll = () => {
    _data = [];
  };

  export const getData = () => {
    return _data.map((it: any) => it.id + it.name);
  };
</script>

<Modal id={'confirmModal' + id} {menuPath} modalType={ModalType.Confirm} bind:this={modalRef} />
<div class="closeable-list {className} {disabled ? '' : 'closeable-list__hover'}">
  <div class="closeable-list__content ">
    <ul>
      {#if customRender}
        {#each customData as row}
          <li on:click={() => onClickItem(row)}>
            <svelte:component this={CustomRender} data={row} />
            <span class="close" on:click={(e) => onClose(e, row)}>&times;</span>
          </li>
        {/each}
      {:else}
        {#each _data as row}
          <li on:click={() => onClickItem(row)}>
            {row ? row.name : ''}
            <span class="close" on:click={(e) => onClose(e, row)}>&times;</span>
          </li>
        {/each}
      {/if}
    </ul>
  </div>

  <div class="closeable-list__controller">
    <slot />
  </div>

  <div class="closeable-list__floating-controller">
    <slot name="floatingController" />
  </div>

</div>
