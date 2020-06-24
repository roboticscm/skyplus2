<script lang="ts">
  import { App } from 'src/lib/js/constants';
  export let name: string = undefined;
  export let disabled = false;
  export let className = '';
  export let autocomplete = App.AUTO_COMPLETE;
  export let value: string = undefined;
  export let placeholder: string;
  export let checked: boolean = undefined;
  export let rightCheck = false;
  export let title = '';
  export let checkTitle = '';
  export let readonly = false;

  let inputRef: any;
  export const focus = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };

  const onCheck = () => {
    inputRef && inputRef.focus();
  };
</script>

<div class="floating-wrapper">
  <input
    title={title ? title : value}
    {name}
    type="search"
    {readonly}
    {disabled}
    class="{checked !== undefined ? 'check' : ''}
    {rightCheck ? 'right' : ''} floating__input {className}"
    bind:value
    {autocomplete}
    bind:this={inputRef}
    {placeholder}
    required />
  <label class="floating__label" data-content={placeholder} />
  {#if checked !== undefined}
    <input
      title={checkTitle}
      class={rightCheck ? 'right' : ''}
      tabindex="-1"
      {disabled}
      bind:checked
      type="checkbox"
      on:change={onCheck} />
  {/if}
</div>
