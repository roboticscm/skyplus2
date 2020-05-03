<script lang="ts">
  export let name: string = undefined;
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

<style lang="scss">
  .floating-checkbox {
    margin-top: 25px;
  }
</style>

<div class="floating-checkbox">
  <input {name} type="checkbox" {disabled} class={className} bind:checked bind:this={inputRef} on:change />
  <label class={disabled ? 'readonly' : ''}>{text}</label>
</div>
