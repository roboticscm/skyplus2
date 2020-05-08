<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '@/components/ui/modal/base/index.svelte';
  import { T } from '@/lib/js/locale/locale';
  import FloatDatePicker from '@/components/ui/float-input/date-picker';
  import FloatSelect from '@/components/ui/float-input/select';
  import FloatTextInput from '@/components/ui/float-input/text-input';
  import Store from '../../store';
  import UploadFiles from '@/components/ui/upload-files';

  export let menuPath: string;
  export let id: string;
  export let store: Store;
  export let forAssigner = false;

  const { taskStatus$, taskQualification$ } = store;

  let modalRef: any;
  const defaultWidth = 800;
  const defaultHeight = 400;
  let data: any = {};

  export const show = (_data: any = undefined) => {
    if (_data) {
      data = _data;
    }

    return new Promise((resolve, reject) => {
      resolve(modalRef.show());
    });
  };

  onMount(() => {});
</script>

<Modal
  {defaultWidth}
  {defaultHeight}
  {menuPath}
  contentClass="full-modal-content"
  fontIcon="<i class='fa fa-cog'></i>"
  title={T('COMMON.LABEL.ADD_STATUS')}
  {id}
  bind:this={modalRef}>
  <div>
    <FloatDatePicker placeholder={T('COMMON.LABEL.DATE')} />
  </div>

  <div>
    {#if forAssigner}
      <FloatSelect id={id + 'Status'} placeholder={T('TASK.LABEL.STATUS')} {menuPath} data$={taskStatus$} />
    {:else}
      <FloatSelect
        id={id + 'Percentage'}
        placeholder={T('TASK.LABEL.PERCENTAGE')}
        {menuPath}
        data$={taskQualification$} />
    {/if}
  </div>

  <div>
    <FloatTextInput placeholder={T('COMMON.LABEL.NOTE')} name="note" bind:value={data.name} />
  </div>

  <div style="margin-top: 6px;">
    <UploadFiles {menuPath} id={id + 'UploadFiles'} />
  </div>
</Modal>
