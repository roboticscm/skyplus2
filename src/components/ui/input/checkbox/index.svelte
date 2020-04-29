<script lang="ts">
  import { App } from '@/lib/js/constants';
  export let name: string;
  export let disabled = false;
  export let className = '';
  export let checked;
  export let text = '';

  let inputRef: any;
  export const focus = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };
</script>

<div>
  <input {name} type="checkbox" {disabled} class={className} bind:checked bind:this={inputRef} on:change />
  <label class={disabled ? 'readonly' : ''}>{text}</label>
</div>
