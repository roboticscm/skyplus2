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
  import { ViewStore } from '@/store/view';
  import ViewWrapperModal from '@/components/modal/view-wrapper';
  import { take } from 'rxjs/operators';
  import { roleControlStore } from '@/store/role-control';
  import { appStore } from '@/store/app';
  import Error from '@/components/ui/error';
  import { validation } from './validation';

  export let menuPath: string;
  export let id: string;
  export let store: Store;
  export let forAssigner = false;
  export let title: string;
  export let view: ViewStore;

  const { taskStatus$, taskVerification$ } = store;

  let modalRef, taskVerificationRef, statusRef: any;
  const defaultWidth = 800;
  const defaultHeight = 400;

  let form: any = new Form({
    ...new StatusDetail(),
  });
  let disabled = false;
  let modalMenuPath: string;
  let modalContentViewRef: any;
  let viewWrapperModalRef: any;

  let ModalContentView: any;
  let modalFullControl: boolean = undefined;
  let modalRoleControls: any[] = [];

  export const show = (_data: any = undefined, _disabled = false) => {
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
      status: forAssigner
        ? statusRef && statusRef.getSelectedName()
        : taskVerificationRef && taskVerificationRef.getSelectedName(),
      statusId: statusRef && statusRef.getSelectedId(),
      verificationId: taskVerificationRef && taskVerificationRef.getSelectedId(),
      statusCode:  taskVerificationRef && taskVerificationRef.getSelectedItem().code,
    };
  };

  const loadModalComponent = (menuPath: string) => {
    return new Promise((resolve, reject) => {
      roleControlStore
        .sysGetControlListByDepIdAndUserIdAndMenuPath(appStore.org.departmentId, menuPath)
        .pipe(take(1))
        .subscribe((res) => {
          if (res.data.fullControl) {
            modalFullControl = true;
          } else {
            modalRoleControls = res.data;
          }
          import('@/modules/' + menuPath + '/index.svelte')
            .then((res) => {
              ModalContentView = res.default;
              resolve('ok');
            })
            .catch((error) => reject(error));
        });
    });
  };

  const onShowStatusModal = (menuPath: string) => {
    modalMenuPath = menuPath;

    loadModalComponent(menuPath).then((res) => {
      viewWrapperModalRef.show().then((res) => {});
    });
  };

  const addCallback = (event) => {
    if (modalMenuPath === 'task/status') {
      form.statusId = event.detail;
    } else if (modalMenuPath === 'task/task-verification') {
      form.verificationId = event.detail;
    }
  };

  const validate = () => {
    return new Promise((resolve, reject) => {
      // client validation
      form.errors.errors = form.recordErrors(validation(form));
      if (form.errors.any()) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  };

  const onChangeEndTime = () => {
    form.errors.clear('endTime');
  };
</script>

<Modal
  beforeOK={validate}
  {defaultWidth}
  {defaultHeight}
  {menuPath}
  contentClass="full-modal-content"
  fontIcon="<i class='fa fa-cog'></i>"
  {title}
  {id}
  bind:this={modalRef}>
  <form
    class="form"
    on:click={(event) => form.errors.clear(event.target.name)}
    on:keydown={(event) => form.errors.clear(event.target.name)}>
    <div class="row">
      <div class="col-xs-24 col-md-12">
        <FloatDatePicker {disabled} bind:value={form.startTime} placeholder={T('COMMON.LABEL.START_TIME')} />
      </div>

      <div class="col-xs-24 col-md-12">
        <FloatDatePicker
          {disabled}
          name="endTime"
          bind:value={form.endTime}
          placeholder={T('COMMON.LABEL.END_TIME')}
          on:change={onChangeEndTime} />
        <Error {form} field="endTime" />
      </div>
    </div>
    <div class="row">
      <div class="col-24">
        {#if forAssigner}
          <FloatSelect
            on:clickLabel={() => onShowStatusModal('task/status')}
            {disabled}
            bind:this={statusRef}
            bind:value={form.statusId}
            id={id + 'Status'}
            placeholder={T('COMMON.LABEL.STATUS')}
            {menuPath}
            data$={taskStatus$} />
        {:else}
          <FloatSelect
            on:clickLabel={() => onShowStatusModal('task/task-verification')}
            {disabled}
            bind:this={taskVerificationRef}
            bind:value={form.verificationId}
            id={id + 'Percentage'}
            placeholder={T('TASK.LABEL.PERCENTAGE')}
            {menuPath}
            data$={taskVerification$} />
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
        <UploadFiles
          savePath="upload_files/task"
          {disabled}
          {menuPath}
          id={id + 'UploadFiles'}
          bind:list={form.attachFiles} />
      </div>
    </div>
  </form>
</Modal>

<ViewWrapperModal
  menuInfo={modalContentViewRef && modalContentViewRef.getMenuInfo$()}
  title={modalContentViewRef && modalContentViewRef.getViewTitle()}
  defaultWidth={600}
  defaultHeight={400}
  bind:this={viewWrapperModalRef}
  {menuPath}
  id={'modalWrapper' + view.getViewName() + 'StatusModalId'}>
  <svelte:component
    this={ModalContentView}
    showWorkList={false}
    bind:this={modalContentViewRef}
    showTitle={false}
    on:callback={addCallback}
    callFrom={menuPath}
    menuPath={modalMenuPath}
    fullControl={modalFullControl}
    roleControls={modalRoleControls} />
</ViewWrapperModal>
