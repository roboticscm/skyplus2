<script lang="ts">
  export let min = 1;
  export let max = 10;
  export let value = min;

  let inputRef: any;
  export const setValue = (value: number) => {
    if (inputRef) {
      inputRef.value = value;
    }
  };
</script>

<input bind:this={inputRef} type="range" {min} {max} class="full-width slider" on:input bind:value />
