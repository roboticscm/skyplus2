<script lang="ts">
  import Modal from 'src/components/ui/modal/base/index.svelte';
  import { T } from 'src/lib/js/locale/locale';
  import { Menu } from 'src/modules/sys/menu/model';

  export let id: string;
  export let title: string;
  export let containerWidth: string;
  export let menuPath: string;
  export let defaultWidth = 500;
  export let defaultHeight = 300;
  export let menuInfo: Menu;

  let modalRef: any;

  export const show = () => {
    return modalRef.show();
  };

  // @ts-ignore
  $: console.log('containerWidth ', containerWidth);
</script>

<Modal
  wrapperClass="high-z-index"
  {menuPath}
  {defaultWidth}
  {defaultHeight}
  contentClass="full-modal-content"
  fontIcon={menuInfo && menuInfo.fontIcon}
  {title}
  {id}
  showControlButton={false}
  bind:this={modalRef}>
  <slot />
</Modal>
