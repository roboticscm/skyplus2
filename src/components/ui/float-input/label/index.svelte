<script lang="ts">
  export let text: string;
  export let disabled = false;
</script>

<style lang="scss">
  .floating-label {
    margin-top: 25px;
  }
</style>

<div class="floating-label">
  <label class={disabled ? 'readonly' : ''}>{text}</label>
</div>
