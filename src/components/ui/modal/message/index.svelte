<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { ButtonType, ButtonPressed } from 'src/components/ui/button/types';
  import { dragElement } from '../use-modal';
  import { StringUtil } from 'src/lib/js/string-util';
  import CloseIcon from 'src/components/layout/icons/common/cancel-submit.svelte';
  export let title: string = undefined;
  export let content: string = undefined;
  export let right = 0;
  export let top = 0;
  export let lineThrough = false;

  const dispatch = createEventDispatcher();

  let modalRef: any;

  const onCLose = () => {
    // modalRef.classList.add('hide-message-modal');
    dispatch('close');
  };

  const onClick = () => {
    dispatch('click');
  };

  onMount(() => {
    dragElement(modalRef);
    modalRef.style.right = `${right}px`;
    modalRef.style.top = `${top}px`;

    setTimeout(() => {
      onCLose();
    }, 1000 * 60 * 5);
  });
</script>

<div class="message-modal" bind:this={modalRef}>
  <div class="message-modal__title">
    {#if title}
      <div class="message-modal__title__text">
        {@html title}
      </div>
    {/if}
    <slot name="title" />
    <div class="message-modal__title__close">
      <span on:click={onCLose}>
        <CloseIcon />
      </span>
    </div>
  </div>
  <div class="horizontal-separator" />
  <div on:click|stopPropagation={onClick} class="message-modal__body">
    {#if content}
      <div
        class="message-modal__body__content {lineThrough ? 'line-through' : ''}
        "
        title={StringUtil.replaceAll(content, '</br>', '\n')
          .replace('<span class="italic-text">', '')
          .replace('</span>', '')}>
        {@html content}
      </div>
    {/if}
    <slot />
  </div>
</div>
