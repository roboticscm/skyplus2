<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Button from '@/components/ui/button/index.svelte';
  import { ButtonType, ButtonPressed } from '@/components/ui/button/types';
  import { dragElement } from '../use-modal';
  import { StringUtil } from '@/lib/js/string-util';

  export let title: string = 'title';
  export let content: string = 'content';
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
    <div class="message-modal__title__text">
      {@html title}
    </div>

    <div class="message-modal__title__close">
      <Button on:click={onCLose} btnType={ButtonType.CloseModal} />
    </div>
  </div>
  <div on:click|stopPropagation={onClick} class="message-modal__body">
    <div
      class="message-modal__body__content {lineThrough ? 'line-through' : ''}
      "
      title={StringUtil.replaceAll(content, '</br>', '\n')
        .replace('<span class="italic-text">', '')
        .replace('</span>', '')}>
      {@html content}
    </div>

  </div>
</div>
