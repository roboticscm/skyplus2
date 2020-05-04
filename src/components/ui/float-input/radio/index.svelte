<script lang="ts">
  export let disabled = false;
  export let className = '';
  export let value: any = undefined;
  export let group: any = undefined;
  export let text = '';

  let inputRef: any;
  export const focus = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };
</script>

<style lang="scss">
  .floating-radio {
    margin-top: 25px;
  }
</style>

<div class="floating-radio">
  <input bind:group {value} type="radio" {disabled} class={className} bind:this={inputRef} on:change />
  <label class={disabled ? 'readonly' : ''}>{text}</label>
</div>
