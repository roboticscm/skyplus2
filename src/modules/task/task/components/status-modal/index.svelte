<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '@/components/ui/modal/base/index.svelte';
  import { T } from '@/lib/js/locale/locale';
  import FloatDatePicker from '@/components/ui/float-input/date-picker';
  import FloatSelect from '@/components/ui/float-input/select';
  import FloatTextInput from '@/components/ui/float-input/text-input';
  import Store from '../../store';
  import UploadFiles from '@/components/ui/upload-files';
  import Form from '@/lib/js/form/form';
  import { StatusDetail } from '../../../types';

  export let menuPath: string;
  export let id: string;
  export let store: Store;
  export let forAssigner = false;
  export let title: string;

  const { taskStatus$, taskQualification$ } = store;

  let modalRef, taskVerificationRef, statusRef: any;
  const defaultWidth = 800;
  const defaultHeight = 400;

  let form = new Form({
    ...new StatusDetail(),
  });
  let disabled = false;

  export const show = (_data: any = undefined, _disabled=false) => {
    disabled = _disabled;
    if (_data) {
      form = new Form({
        ..._data,
      });
    } else {
      form = new Form({
        ...new StatusDetail(),
      });
    }

    return new Promise((resolve, reject) => {
      resolve(modalRef.show(undefined, disabled));
    });
  };

  onMount(() => {});

  export const getData = () => {
    return {
      ...form,
      status: statusRef && statusRef.getSelectedName(),
      statusId: statusRef && statusRef.getSelectedId(),
      verificationId: taskVerificationRef && taskVerificationRef.getSelectedId(),
      percent: taskVerificationRef && taskVerificationRef.getSelectedName(),
    };
  };

  const onShowStatusModal = () => {
    console.log('xxx');
  }
</script>

<Modal
  {defaultWidth}
  {defaultHeight}
  {menuPath}
  contentClass="full-modal-content"
  fontIcon="<i class='fa fa-cog'></i>"
  {title}
  {id}
  bind:this={modalRef}>
  <div class="row">
    <div class="col-xs-24 col-md-12">
      <FloatDatePicker {disabled} bind:value={form.startTime} placeholder={T('COMMON.LABEL.START_TIME')} />
    </div>

    <div class="col-xs-24 col-md-12">
      <FloatDatePicker {disabled} bind:value={form.endTime} placeholder={T('COMMON.LABEL.END_TIME')} />
    </div>
  </div>

  <div class="row">
    <div class="col-24">
      {#if forAssigner}
        <FloatSelect
          on:clickLabel={onShowStatusModal}
          {disabled}
          bind:this = {statusRef}
          bind:value={form.statusId}
          id={id + 'Status'}
          placeholder={T('TASK.LABEL.STATUS')}
          {menuPath}
          data$={taskStatus$} />
      {:else}
        <FloatSelect
                {disabled}
          bind:this = {taskVerificationRef}
          bind:value={form.verficationId}
          id={id + 'Percentage'}
          placeholder={T('TASK.LABEL.PERCENTAGE')}
          {menuPath}
          data$={taskQualification$} />
      {/if}
    </div>
  </div>

  <div class="row">
    <div class="col-24">
      <FloatTextInput {disabled} placeholder={T('COMMON.LABEL.NOTE')} bind:value={form.note} />
    </div>
  </div>
  <div class="row">
    <div class="col-24" style="margin-top: 6px;">
      <UploadFiles savePath="upload_files/task" {disabled} {menuPath} id={id + 'UploadFiles'} bind:list={form.attachFiles} />
    </div>
  </div>
</Modal>
