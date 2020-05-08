<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { T } from '@/lib/js/locale/locale';

  export let className = 'rich-editor';
  export let height = '100px';
  export let value: string;
  export let disabled = false;

  let iframeRef: any;
  let controllerRef: any;
  let inputColorRef: any;
  let editMode = false;

  const controllers = [
    { cmd: 'bold', icon: '<i class="fa fa-bold"></i>', title: T('COMMON.LABEL.BOLD') },
    { cmd: 'italic', icon: '<i class="fa fa-italic"></i>', title: T('COMMON.LABEL.ITALIC') },
    { cmd: 'foreColor', icon: '<i class="fa fa-palette"></i>', title: T('COMMON.LABEL.TEXT_FORE_COLOR') },
  ];
  export const getTextContent = () => {
    return iframeRef.contentWindow.document.getElementsByTagName('body')[0].textContent;
  };

  export const getHtmlContent = () => {
    return iframeRef.contentWindow.document.getElementsByTagName('body')[0].innerHTML;
  };

  export const setHtmlContent = (htmlContent: string) => {
    if (iframeRef) {
      iframeRef.contentWindow.document.getElementsByTagName('body')[0].innerHTML = htmlContent;
    }
  };

  const windowBlurred = (e: any) => {
    if (disabled) {
      return;
    }

    const el = document.activeElement;
    if (el.tagName.toLowerCase() === 'iframe') {
      controllerRef && controllerRef.classList.add('show-controller');
    }
  };

  let timer: any;
  const windowFocussed = (e: any) => {
    if (disabled) {
      return;
    }

    const el = document.activeElement;
    if (el.getAttribute('data-id') !== 'controller') {
      timer = setTimeout(() => {
        controllerRef && controllerRef.classList.remove('show-controller');
        editMode = false;
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
      iframeRef.height = height;
      iframeRef.contentWindow.document.addEventListener('input', onEdit);
    }

    window.addEventListener('focus', windowFocussed, true);
    window.addEventListener('blur', windowBlurred, true);
  });

  onDestroy(() => {
    window.removeEventListener('focus', windowFocussed);
    window.removeEventListener('blur', windowBlurred);
  });

  const execCmd = (cmd: string) => {
    if (cmd === 'foreColor') {
      inputColorRef.click();
    } else {
      iframeRef.contentWindow.document.execCommand(cmd, false, null);
    }
  };

  const onChangeForeColor = (e: any) => {
    iframeRef.contentWindow.document.execCommand('foreColor', false, e.target.value);
  };

  // @ts-ignore
  $: {
    if (!editMode) {
      setHtmlContent(value);
    }
  }

  // @ts-ignore
  $: {
    if (disabled && iframeRef) {
      iframeRef.contentWindow.document.designMode = 'Off';
    } else if (iframeRef) {
      iframeRef.contentWindow.document.designMode = 'On';
    }
  }

  const onEdit = (e) => {
    editMode = true;
    value = getHtmlContent();
  };
</script>

<input type="color" bind:this={inputColorRef} style="display: none;" on:change={onChangeForeColor} />
<div class={className}>
  <slot />
  <div class="rich-editor__body">
    <iframe bind:this={iframeRef} title="" class="rich-editor__body__content" />

    <div class="rich-editor__body__controller" bind:this={controllerRef}>
      {#each controllers as item}
        <button data-id="controller" title={item.title} on:click={() => execCmd(item.cmd)}>
          {@html item.icon}
        </button>
      {/each}
    </div>
  </div>
</div>
