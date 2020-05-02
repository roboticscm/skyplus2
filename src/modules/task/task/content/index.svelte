<script lang="ts">
  import { tick } from 'svelte';
  import { fromEvent } from 'rxjs';

  import SC from '@/components/set-common';
  import { ViewStore } from '@/store/view';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';
  import Button from '@/components/ui/flat-button';
  import Store from '../store';
  import Form from '@/lib/js/form/form';
  import { Task } from '../../types';
  import FloatSelect from '@/components/ui/float-input/select';
  import FloatCheckbox from '@/components/ui/float-input/checkbox';
  import FloatLabel from '@/components/ui/float-input/label';
  import RichEditor from '@/components/ui/input/rich-editor';
  import { T } from '@/lib/js/locale/locale';
  import Section from '@/components/ui/section';
  import FloatTextInput from '@/components/ui/float-input/text-input';
  import Error from '@/components/ui/error';
  import CloseableList from '@/components/ui/closeable-list'
  import UploadFiles from '@/components/ui/upload-files'
  import SelectHumanModal from '@/components/modal/select-human'
  import {ButtonPressed} from "@/components/ui/button/types";
  import {SObject} from "@/lib/js/sobject";

  // Props
  export let view: ViewStore;
  export let menuPath: string;
  export let store: Store;

  // @ts-ignore
  const { selectedData$, hasAnyDeletedRecord$, deleteRunning$, saveRunning$, isReadOnlyMode$, isUpdateMode$ } = view;

  // @ts-ignore
  const { projects$, uploadFiles$, assigneeList$ } = store;

  // Refs
  let scRef: any;
  let taskNameRef: any;
  let taskDescRef: any;
  let uploadFilesRef: any;
  let assigneeRef: any;
  let selectHumanModalRef: any;

  let selectedData: Task;

  /**
   * Reset form (reset input and errors)
   * @param {none}
   * @return {Form}. New Form
   */
  const resetForm = () => {
    return new Form({
      ...new Task(),
    });
  };
  let form = resetForm();
  let beforeForm: Form;

  const saveUpdateUri = 'sys/language/save-or-update';

  // ============================== EVENT HANDLE ==========================
  /**
   * Event handle for Add New button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onAddNew = (event) => {
    // verify permission
    view.verifyAddNewAction(event.currentTarget.id, scRef).then((_) => {
      // if everything is OK, call the action
      // doAddNew();
    });
  };

  /**
   * Event handle for Edit button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onEdit = (event) => {
    // verify permission
    view.verifyEditAction(event.currentTarget.id, scRef, selectedData.name).then((_) => {
      // just switch to edit mode
      isReadOnlyMode$.next(false);
      tick().then(() => {
        // the moving focus to the first element
        taskNameRef.focus();
      });
    });
  };

  /**
   * Event handle for Delete button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onDelete = (event) => {
    // verify permission
    view.verifyDeleteAction(event.currentTarget.id, scRef, selectedData.name).then((_) => {
      // if everything is OK, call the action
      view.doDelete(selectedData.id, scRef.snackbarRef(), doAddNew);
    });
  };

  /**
   * Event handle for Config button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onConfig = (event) => {
    view.showViewConfigModal(event.currentTarget.id, scRef);
  };

  /**
   * Event handle for Trash Restore button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onTrashRestore = (event) => {
    view.showTrashRestoreModal(event.currentTarget.id, false, scRef);
  };


  const onAddAssignee = () => {
    // @ts-ignore
    const assignee: any[] = SObject.clone($assigneeList$);
    selectHumanModalRef.show(assignee).then((buttonPressed: ButtonPressed) => {

      if(buttonPressed === ButtonPressed.OK) {
        assigneeList$.next(assignee.map((it: any) => {
          return {
            id: it.id,
            name: it.lastName + ' ' + it.firstName
          }
        }));
      }
    })
  }
  // ============================== // EVENT HANDLE ==========================

  // ============================== FUNCTIONAL ==========================
  /**
   * Add new add. Called by onAddNew event handle
   * @param {none}
   * @return {void}.
   */
  const doAddNew = () => {
    // reset status flag
    isReadOnlyMode$.next(false);
    isUpdateMode$.next(false);
    view.selectedData$.next(null);

    // reset form
    form = resetForm();

    // moving focus to the first element after DOM updated
    tick().then(() => {
      taskNameRef.focus();
    });
  };

  // ============================== // FUNCTIONAL ==========================

  /**
   * Use save or update action directive. Register click event for Save / Update button
   * @param {none}
   * @return {void}.
   */
  const useSaveOrUpdateAction = {
    register(component: HTMLElement, param: any) {
      // TODO
      // doSaveOrUpdate(fromEvent(component, 'click'));
    },
  };
</script>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<SelectHumanModal id={view.getViewName() + "SelectHumanModal"} {menuPath} bind:this={selectHumanModalRef}></SelectHumanModal>
<!--//Invisible Element-->


<!--Form controller-->
<section class="view-content-controller">
  {#if view.isRendered(ButtonId.AddNew)}
    <Button btnType={ButtonType.AddNew} on:click={onAddNew} disabled={view.isDisabled(ButtonId.AddNew)} />
  {/if}

  {#if view.isRendered(ButtonId.Save, !$isUpdateMode$)}
    <Button
      action={useSaveOrUpdateAction}
      btnType={ButtonType.Save}
      disabled={view.isDisabled(ButtonId.Save, form.errors.any())}
      running={$saveRunning$} />
  {/if}

  {#if view.isRendered(ButtonId.Edit, $isReadOnlyMode$ && $isUpdateMode$)}
    <Button btnType={ButtonType.Edit} on:click={onEdit} disabled={view.isDisabled(ButtonId.Edit)} />
  {/if}

  {#if view.isRendered(ButtonId.Update, !$isReadOnlyMode$ && $isUpdateMode$)}
    <Button
      action={useSaveOrUpdateAction}
      btnType={ButtonType.Update}
      disabled={view.isDisabled(ButtonId.Update, form.errors.any())}
      running={$saveRunning$} />
  {/if}

  {#if view.isRendered(ButtonId.Delete, $isUpdateMode$)}
    <Button
      btnType={ButtonType.Delete}
      on:click={onDelete}
      disabled={view.isDisabled(ButtonId.Delete)}
      running={$deleteRunning$} />
  {/if}

  {#if view.isRendered(ButtonId.Config)}
    <Button btnType={ButtonType.Config} on:click={onConfig} disabled={view.isDisabled(ButtonId.Config)} />
  {/if}

  {#if view.isRendered(ButtonId.TrashRestore, $hasAnyDeletedRecord$)}
    <Button
      btnType={ButtonType.TrashRestore}
      on:click={onTrashRestore}
      disabled={view.isDisabled(ButtonId.TrashRestore)} />
  {/if}
</section>
<!--//Form controller-->

<!--Main content-->
<section class="view-content-main">
  <!-- Task Info-->
  <Section title={T('TASK.LABEL.TASK')}>
    <div class="row">
      <div class="col-xs-24 col-md-12 col-lg-6">
        <!-- Project -->
        <FloatSelect
          id={view.getViewName() + 'ProjectId'}
          placeholder={T('TASK.LABEL.PROJECT')}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={projects$} />

      </div>
      <!-- // Project -->

      <!-- Name -->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatTextInput
          bind:this={taskNameRef}
          placeholder={T('COMMON.LABEL.NAME')}
          name="name"
          disabled={$isReadOnlyMode$}
          bind:value={form.name} />
        <Error {form} field="name" />
      </div>
      <!-- // Name -->

      <!-- Last status -->
      <div class="danger col-xs-24 col-md-12 col-lg-6">
        <FloatTextInput
                placeholder={T('COMMON.LABEL.STATUS')}
                disabled={true}
                bind:value={form.lastStatusName} />

      </div>
      <!-- // Last status -->
      <!-- Private task -->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatCheckbox text={T('COMMON.LABEL.PRIVATE')} disabled={$isReadOnlyMode$} bind:checked={form.private} />
      </div>
      <!-- // Private task -->


    </div>

    <!-- Task Description -->
    <div class="row">
      <div class="col-24">
        <RichEditor bind:this={taskDescRef}>{T('TASK.LABEL.TASK_DESCRIPTION')}:</RichEditor>
      </div>
    </div>
    <!-- // Task Description -->

    <!-- Attach file -->
    <div class="row">
      <div class="col-24">
        <UploadFiles {menuPath} id = {view.getViewName() + "UploadFiles"}>
        </UploadFiles>
      </div>
    </div>
    <!-- // Attach file -->

    <!-- Assignee -->
    <div class="row">
      <div class="col-24">
        <CloseableList data$={assigneeList$} bind:this={assigneeRef} {menuPath} id="{view.getViewName() + 'AssigneeId'}">
          <Button on:click={onAddAssignee} title={T('COMMON.LABEL.ADD_ASSIGNEE') + '...'}></Button>
        </CloseableList>
      </div>
    </div>
    <!-- // Assignee -->

  </Section>
  <!-- //Task Info-->
</section>
<!--//Main content-->
