<script lang="ts">
  import Modal from 'src/components/ui/modal/base/index.svelte';
  import { T } from 'src/lib/js/locale/locale';
  import { SDate } from 'src/lib/js/sdate';

  export let id: string;
  export let menuPath: string;

  let modalRef: any;
  let excelGridRef: any;
  let ExcelGridComponent: any;

  const defaultWidth = 600;
  const defaultHeight = 300;

  let containerWidth: string;
  let height: string;
  let editedUser: string;
  let atTime: string;

  let data: any[];
  const columns = [
    {
      type: 'text',
      title: T('COMMON.LABEL.FIELD'),
      name: 'field',
      width: 80,
      readOnly: true,
    },
    {
      type: 'text',
      title: T('COMMON.LABEL.OLD_VALUE'),
      name: 'oldValue',
      width: 120,
      readOnly: true,
    },
    {
      type: 'text',
      title: T('COMMON.LABEL.NEW_VALUE'),
      name: 'newValue',
      width: 120,
      readOnly: true,
    },
  ];

  export const show = (_data: any[], _editedUser: string, _atTime: string) => {
    data = _data;
    editedUser = _editedUser;
    atTime = _atTime;
    const h = modalRef.getHeight().replace('px', '');
    height = `${h - 120}px`;
    return new Promise((resolve, reject) => {
      import('src/components/ui/excel-grid/index.svelte').then((res) => {
        ExcelGridComponent = res.default;
        resolve(modalRef.show());
      });
    });
  };

  const onResize = (event) => {
    containerWidth = event.detail.width;
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
  fontIcon="<i class='fa fa-compress-arrows-alt'></i>"
  title={T('COMMON.LABEL.CONFLICT')}
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
    <div slot="label">
      <div>
        {@html T('SYS.MSG.THIS_FORM_WAS_EDITED_BY') + ': ' + editedUser + '. ' + T('COMMON.LABEL.AT') + ': ' + SDate.convertMillisecondToDateTimeString(atTime)}
      </div>
      <div style="text-align: left;">{T('COMMON.LABEL.DETAIL')}:</div>
    </div>
  </svelte:component>
</Modal>
