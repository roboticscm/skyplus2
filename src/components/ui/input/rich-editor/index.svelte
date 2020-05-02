<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { T } from '@/lib/js/locale/locale';

  export let className = 'rich-editor';
  export let height = '100px';

  let iframeRef: any;
  let controllerRef: any;

  const controllers = [
    { cmd: 'bold', icon: '<i class="fa fa-bold"></i>', title: T('COMMON.LABEL.BOLD') },
    { cmd: 'italic', icon: '<i class="fa fa-italic"></i>', title: T('COMMON.LABEL.ITALIC') },
  ];
  export const getTextContent = () => {
    return iframeRef.contentWindow.document.getElementsByTagName('body')[0].textContent;
  };

  export const getHtmlContent = () => {
    return iframeRef.contentWindow.document.getElementsByTagName('body')[0].innerHTML;
  };

  const windowBlurred = (e: any) => {
    const el = document.activeElement;
    if (el.tagName.toLowerCase() === 'iframe') {
      controllerRef && controllerRef.classList.add('show-controller');
    }
  };

  let timer: any;
  const windowFocussed = (e: any) => {
    const el = document.activeElement;
    if (el.getAttribute('data-id') !== 'controller') {
      timer = setTimeout(() => {
        controllerRef && controllerRef.classList.remove('show-controller');
      }, 0);
    } else {
      if (timer) {
        clearTimeout(timer);
      }
      controllerRef && controllerRef.classList.add('show-controller');
    }
  };

  onMount(() => {
    if (iframeRef) {
      iframeRef.contentWindow.document.designMode = 'On';
      iframeRef.height = height;
    }

    window.addEventListener('focus', windowFocussed, true);
    window.addEventListener('blur', windowBlurred, true);
  });

  onDestroy(() => {
    window.removeEventListener('focus', windowFocussed);
    window.removeEventListener('blur', windowBlurred);
  });

  const execCmd = (cmd: string) => {
    iframeRef.contentWindow.document.execCommand(cmd, false, null);
  };
</script>

<div class={className}>
  <slot />
  <div class="rich-editor__body">
    <div class="rich-editor__body__controller" bind:this={controllerRef}>
      {#each controllers as item}
        <button data-id="controller" title={item.title} on:click={() => execCmd(item.cmd)}>
          {@html item.icon}
        </button>
      {/each}
    </div>
    <iframe bind:this={iframeRef} title="" class="rich-editor__body__content" />
  </div>
</div>
