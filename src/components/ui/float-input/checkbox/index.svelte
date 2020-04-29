<script lang="ts">
  export let text: string;
  export let disabled = false;
  export let className = '';
  export let checked = false;
  export let title = '';

  let inputRef: any;
  export const focus = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };
</script>

<div class="floating-wrapper" style="min-height: 35px;">
  <input {title} type="checkbox" {disabled} class="{className} floating__input" bind:checked bind:this={inputRef} />
  <label>{text}</label>
</div>
