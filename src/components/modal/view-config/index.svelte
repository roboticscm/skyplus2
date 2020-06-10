<script lang="ts">
  import { tick } from 'svelte';
  import Modal from 'src/components/ui/modal/base/index.svelte';
  import { T } from 'src/lib/js/locale/locale';

  const defaultWidth = 800;
  const defaultHeight = 400;

  export let id: string;
  export let subTitle: string;
  export let containerWidth: string;
  export let menuPath: string;

  let modalRef: any;
  let excelGridRef: any;
  let ExcelGridComponent: any;

  let height: string;

  let data: any[];
  const columns = [
    {
      type: 'hidden',
      name: 'controlId',
    },
    {
      type: 'checkbox',
      title: T('COMMON.LABEL.USE'),
      name: 'checked',
      width: 30,
    },
    {
      type: 'text',
      title: T('COMMON.LABEL.CODE'),
      name: 'code',
      width: 80,
      readOnly: true,
    },
    {
      type: 'text',
      title: T('COMMON.LABEL.NAME'),
      name: 'name',
      width: 120,
      readOnly: true,
    },
  ];

  const calcHeight = () => {
    const h = modalRef.getHeight().replace('px', '');
    height = `${h - 100}px`;
  };
  export const show = (_data: any[]) => {
    data = _data;
    calcHeight();
    return new Promise((resolve, reject) => {
      import('src/components/ui/excel-grid/index.svelte').then((res) => {
        ExcelGridComponent = res.default;
        tick().then(() => {
          excelGridRef && excelGridRef.createCheckboxHeader(1, true);
        });
        resolve(modalRef.show());
      });
    });
  };

  const onResize = (event) => {
    containerWidth = event.detail.width;
    calcHeight();
    // excelGridRef.refresh();
  };

  export const getData = () => {
    return excelGridRef.getData();
  };
</script>

<Modal
  {defaultWidth}
  {defaultHeight}
  on:containerResize={onResize}
  {menuPath}
  contentClass="full-modal-content"
  fontIcon="<i class='fa fa-cog'></i>"
  title={T('COMMON.LABEL.CONFIG') + ' - ' + subTitle}
  {id}
  bind:this={modalRef}>
  <svelte:component
    this={ExcelGridComponent}
    {height}
    {menuPath}
    bind:this={excelGridRef}
    id={'grid' + id}
    {columns}
    {data}
    {containerWidth}
    fullWidth={true}>
    <span slot="label" class="label">{T('COMMON.LABEL.CONTROL_LIST')}:</span>
  </svelte:component>
</Modal>
