<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { StringUtil } from '@/lib/js/string-util';

  export let displayChar: '*';
  export let name: string;

  const dispatch = createEventDispatcher();

  let memoryPassword = '';
  let inputRef: any;

  const onKeyup = (event: any) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const start = inputRef.selectionStart;
      const end = inputRef.selectionStart;
      if (start === 0 && end === 0) {
        memoryPassword = '';
      } else {
        memoryPassword = memoryPassword.slice(0, start) + memoryPassword.slice(start + 1, memoryPassword.length);
      }
    } else if (event.code.startsWith('Key') || event.code.startsWith('Digit')) {
      const pos = inputRef.selectionStart;
      memoryPassword = StringUtil.insertAt(memoryPassword, event.key, pos);
    }

    inputRef.value = new Array(inputRef.value.length).fill(displayChar).join('');
  };

  const onChange = () => {
    dispatch('change', getPassword());
  };

  export const getPassword = () => {
    return memoryPassword;
  };

  export const focus = () => {
    inputRef.focus();
  };
</script>

<input {name} class="form-control" type="search" bind:this={inputRef} on:keyup={onKeyup} on:change={onChange} />
