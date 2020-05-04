<script lang="ts">
  import { tick } from 'svelte';
  import { fromEvent } from 'rxjs';

  import SC from '@/components/set-common';
  import { ViewStore } from '@/store/view';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';
  import Button from '@/components/ui/flat-button';
  import FloatingButton from '@/components/ui/button/floating';
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
  import FloatDatePicker from '@/components/ui/float-input/date-picker';
  import Error from '@/components/ui/error';
  import CloseableList from '@/components/ui/closeable-list';
  import UploadFiles from '@/components/ui/upload-files';
  import SelectHumanModal from '@/components/modal/select-human';
  import SelectOrgModal from '@/components/modal/select-org';
  import { ButtonPressed } from '@/components/ui/button/types';
  import { SObject } from '@/lib/js/sobject';
  import StatusModal from '../components/status-modal/index.svelte';

  // Props
  export let view: ViewStore;
  export let menuPath: string;
  export let store: Store;

  // @ts-ignore
  const { selectedData$, hasAnyDeletedRecord$, deleteRunning$, saveRunning$, isReadOnlyMode$, isUpdateMode$ } = view;

  // @ts-ignore
  const {
    projects$,
    uploadFiles$,
    assigneeList$,
    assignerList$,
    accessorList$,
    qualitativeComment$,
    quantitativeComment$,
    assigneeStatusList$,
    assignerStatusList$,
    specificOrgList$,
  } = store;

  // Refs
  let scRef: any;
  let taskNameRef: any;
  let taskDescRef: any;
  let uploadFilesRef: any;
  let selectHumanModalRef: any;
  let selectOrgModalRef: any;
  let accessCommentRef: any;
  let statusModalRef: any;

  let selectedData: Task;
  let forAssigner = undefined;

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
      if (buttonPressed === ButtonPressed.OK) {
        const checkedAssignee = selectHumanModalRef.getCheckedLeafNodes();
        assigneeList$.next(
          checkedAssignee.map((it: any) => {
            return {
              id: it.id,
              name: it.name,
            };
          }),
        );
      }
    });
  };

  const onAddSpecificOrg = () => {
    // @ts-ignore
    const specificOrg: any[] = SObject.clone($specificOrgList$);
    selectOrgModalRef.show(specificOrg).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        const checkedSpecificOrg = selectOrgModalRef.getCheckedLeafNodes();
        specificOrgList$.next(
          checkedSpecificOrg.map((it: any) => {
            return {
              id: it.id,
              name: it.name,
            };
          }),
        );
      }
    });
  };

  const onCloseSpecificOrg = (event: any) => {
    // @ts-ignore
    const specificOrgList = SObject.clone($specificOrgList$);

    const index = specificOrgList.findIndex((it: any) => it.id === event.detail.id);
    if (index >= 0) {
      specificOrgList.splice(index, 1);
      specificOrgList$.next(specificOrgList);
    }
  };

  const onCloseAssignee = (event: any) => {
    // @ts-ignore
    const assigneeList = SObject.clone($assigneeList$);

    const index = assigneeList.findIndex((it: any) => it.id === event.detail.id);
    if (index >= 0) {
      assigneeList.splice(index, 1);
      assigneeList$.next(assigneeList);
    }
  };

  const onAddAssigner = () => {
    // @ts-ignore
    const assigner: any[] = SObject.clone($assignerList$);
    selectHumanModalRef.show(assigner).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        const checkedAssigner = selectHumanModalRef.getCheckedLeafNodes();
        assignerList$.next(
          checkedAssigner.map((it: any) => {
            return {
              id: it.id,
              name: it.name,
            };
          }),
        );
      }
    });
  };

  const onCloseAssigner = (event: any) => {
    // @ts-ignore
    const assignerList = SObject.clone($assignerList$);

    const index = assignerList.findIndex((it: any) => it.id === event.detail.id);
    if (index >= 0) {
      assignerList.splice(index, 1);
      assignerList$.next(assignerList);
    }
  };

  const onAddEvaluator = () => {
    // @ts-ignore
    const evaluator: any[] = SObject.clone($accessorList$);
    selectHumanModalRef.show(evaluator).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        const checkedEvaluator = selectHumanModalRef.getCheckedLeafNodes();
        accessorList$.next(
          checkedEvaluator.map((it: any) => {
            return {
              id: it.id,
              name: it.name,
            };
          }),
        );
      }
    });
  };

  const onCloseEvaluator = (event: any) => {
    // @ts-ignore
    const accessorList = SObject.clone($accessorList$);

    const index = accessorList.findIndex((it: any) => it.id === event.detail.id);
    if (index >= 0) {
      accessorList.splice(index, 1);
      accessorList$.next(accessorList);
    }
  };

  const onAddAssignerStatus = () => {
    forAssigner = true;
    statusModalRef.show().then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        assignerStatusList$.next([{ id: '1', date: new Date(), status: 'New status', note: 'Note xxx...' }]);
      }
    });
  };

  const onAddAssigneeStatus = () => {
    forAssigner = false;
    statusModalRef.show().then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        assigneeStatusList$.next([{ id: '1', date: new Date(), percent: 'New status', note: 'Note xxx...' }]);
      }
    });
  };

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

  /**
   * Use submit action directive. Register click event for Submit button
   * @param {none}
   * @return {void}.
   */
  const useSubmitAction = {
    register(component: HTMLElement, param: any) {
      // TODO
      // doSaveOrUpdate(fromEvent(component, 'click'));
    },
  };
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';
</style>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<SelectHumanModal id={view.getViewName() + 'SelectHumanModal'} {menuPath} bind:this={selectHumanModalRef} />
<SelectOrgModal id={view.getViewName() + 'SelectOrgModal'} {menuPath} bind:this={selectOrgModalRef} />
<StatusModal {forAssigner} id={view.getViewName() + 'StatusModal'} {menuPath} bind:this={statusModalRef} {store} />
<!--//Invisible Element-->

<!--Form controller-->
<section class="view-content-controller">
<!--  {#if view.isRendered(ButtonId.AddNew)}-->
<!--    <Button btnType={ButtonType.AddNew} on:click={onAddNew} disabled={view.isDisabled(ButtonId.AddNew)} />-->
<!--  {/if}-->

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

  {#if view.isRendered(ButtonId.Submit, !$isUpdateMode$)}
    <Button
      action={useSubmitAction}
      btnType={ButtonType.Submit}
      disabled={view.isDisabled(ButtonId.Submit, form.errors.any())}
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
  <Section title={T('TASK.LABEL.TASK')} {menuPath} id={view.getViewName() + 'TaskSectionId'}>
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
          checked={form.private}
          checkTitle={T('COMMON.LABEL.PRIVATE')}
          bind:this={taskNameRef}
          placeholder={T('COMMON.LABEL.NAME')}
          name="name"
          disabled={$isReadOnlyMode$}
          bind:value={form.name} />
        <Error {form} field="name" />
      </div>
      <!-- // Name -->

      <!-- Last status -->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatTextInput placeholder={T('COMMON.LABEL.STATUS')} disabled={true} bind:value={form.lastStatusName} />
      </div>
      <!-- // Last status -->
      <!-- Private task -->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.CREATED_DATE')}
          name="firstPrompt"
          disabled={$isReadOnlyMode$}
          bind:value={form.firstPrompt} />
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
        <UploadFiles {menuPath} id={view.getViewName() + 'UploadFiles'} />
      </div>
    </div>
    <!-- // Attach file -->

    <!--    //beneficiary-->
    <!--    // beneficiary organization-->
    <!--    //-->

    <div class="row">
      <div class="col-xs-24 col-md-12">
        <CloseableList
          on:close={onCloseSpecificOrg}
          data$={specificOrgList$}
          {menuPath}
          id={view.getViewName() + 'SpecificOrgId'}>
          <Button on:click={onAddSpecificOrg} title={T('COMMON.LABEL.ADD_SPECIFIC_ORG') + '...'} />
        </CloseableList>
      </div>

      <div class="col-xs-24 col-md-12">
        <CloseableList
          on:close={onCloseAssignee}
          data$={assigneeList$}
          {menuPath}
          id={view.getViewName() + 'AssigneeId'}>
          <Button on:click={onAddAssignee} title={T('COMMON.LABEL.ADD_BENEFICIARY') + '...'} />
        </CloseableList>
      </div>
    </div>

    <div class="row">
      <div class="col-xs-24 col-md-12">
        <CloseableList
          on:close={onCloseAssignee}
          data$={assigneeList$}
          {menuPath}
          id={view.getViewName() + 'AssigneeId'}>
          <Button on:click={onAddSpecificOrg} title={T('COMMON.LABEL.ADD_BENEFICIARY_ORG') + '...'} />
        </CloseableList>
      </div>

      <div class="col-xs-24 col-md-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.FIRST_PROMPT')}
          name="firstPrompt"
          disabled={$isReadOnlyMode$}
          bind:value={form.firstPrompt} />
      </div>

      <div class="col-xs-24 col-md-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.SECOND_PROMPT')}
          name="secondPrompt"
          disabled={$isReadOnlyMode$}
          bind:value={form.secondPrompt} />
      </div>
    </div>

    <div class="row">
      <!-- Assignee -->
      <div class="col-xs-24 col-md-12">
        <CloseableList
          on:close={onCloseAssignee}
          data$={assigneeList$}
          {menuPath}
          id={view.getViewName() + 'AssigneeId'}>
          <Button on:click={onAddAssignee} title={T('COMMON.LABEL.ADD_ASSIGNEE') + '...'} />
        </CloseableList>
      </div>
      <!-- // Assignee -->

      <!-- Assigner -->
      <div class="col-xs-24 col-md-12">
        <CloseableList
          on:close={onCloseAssigner}
          data$={assignerList$}
          {menuPath}
          id={view.getViewName() + 'AssignerId'}>
          <Button on:click={onAddAssigner} title={T('COMMON.LABEL.ADD_ASSIGNER') + '...'} />
        </CloseableList>
      </div>
      <!-- // Assigner -->
    </div>

    <!-- Evaluator -->
    <div class="row">
      <div class="col-24">
        <CloseableList
          on:close={onCloseEvaluator}
          data$={accessorList$}
          {menuPath}
          id={view.getViewName() + 'EvaluatorId'}>
          <Button on:click={onAddEvaluator} title={T('COMMON.LABEL.ADD_EVALUATOR') + '...'} />
        </CloseableList>
      </div>
    </div>
    <!-- // Evaluator -->

  </Section>
  <!-- //Task Info-->

  <!-- Assigner Info-->
  <Section title={T('TASK.LABEL.ASSIGNER')} id={view.getViewName() + 'AssignerSectionId'} {menuPath}>
    <div class="row" style="margin-top: 6px;">
      <div class="col-24">{T('COMMON.LABEL.STATUS_DETAIL')}:</div>
    </div>
    <div class="row">
      <div class=" col-24">
        <CloseableList
          on:close={onCloseEvaluator}
          customData={$assignerStatusList$}
          customRender="modules/task/task/components/status/index.svelte"
          {menuPath}
          id={view.getViewName() + 'AssignerId'}>
          <FloatingButton on:click={onAddAssignerStatus} title={T('TASK.LABEL.ADD_STATUS')} />
        </CloseableList>
      </div>
    </div>
  </Section>
  <!-- // Assigner Info-->

  <!-- Assignee Info-->
  <Section title={T('TASK.LABEL.ASSIGNEE')} id={view.getViewName() + 'AssigneeSectionId'} {menuPath}>
    <!-- Start date-->
    <div class="row">
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.START_DATE')}
          name="startDate"
          disabled={$isReadOnlyMode$}
          bind:value={form.startDate} />
      </div>

      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatCheckbox
          text={T('COMMON.LABEL.CONFIRM')}
          disabled={$isReadOnlyMode$}
          bind:checked={form.startDateConfirm} />
      </div>
    </div>
    <!-- // Start date-->

    {#if form.startDateConfirm}
      <div class="row" style="margin-top: 6px;">
        <div class="col-24">{T('COMMON.LABEL.STATUS_DETAIL')}:</div>
      </div>
      <div class="row">
        <div class=" col-24">
          <CloseableList
            on:close={onCloseEvaluator}
            customData={$assigneeStatusList$}
            customRender="modules/task/task/components/status/index.svelte"
            {menuPath}
            id={view.getViewName() + 'EvaluatorId'}>
            <FloatingButton on:click={onAddAssigneeStatus} title={T('TASK.LABEL.ADD_STATUS')} />
          </CloseableList>
        </div>
      </div>

      <!-- End date-->
      <div class="row">
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.END_DATE')}
            name="endDate"
            disabled={$isReadOnlyMode$}
            bind:value={form.endDate} />
        </div>

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatCheckbox
            text={T('COMMON.LABEL.CONFIRM')}
            disabled={$isReadOnlyMode$}
            bind:checked={form.endDateConfirm} />
        </div>
      </div>
      <!-- // End date-->
    {/if}
  </Section>
  <!-- // Assignee Info-->

  <!-- Evaluator Info-->
  <Section title={T('TASK.LABEL.EVALUATOR')} id={view.getViewName() + 'EvaluatorSectionId'} {menuPath}>
    <!-- Date-->
    <div class="row">
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.DATE')}
          name="evaluateDate"
          disabled={$isReadOnlyMode$}
          bind:value={form.evaluateDate} />
      </div>
    </div>
    <!-- // Date-->

    <!-- Comment-->
    <div class="row">
      <div class="col-24">
        <RichEditor bind:this={accessCommentRef}>{T('TASK.LABEL.COMMENT')}:</RichEditor>
      </div>
    </div>
    <!-- // Comment-->

    <div class="row">
      <!-- Quantitative comment-->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatSelect
          id={view.getViewName() + 'QuantitativeCommentId'}
          placeholder={T('TASK.LABEL.QUANTITATIVE_COMMENT')}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={quantitativeComment$} />
      </div>
      <!-- // Quantitative comment-->

      <!-- Qualitative comment-->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatSelect
          id={view.getViewName() + 'QualitativeCommentId'}
          placeholder={T('TASK.LABEL.QUALITATIVE_COMMENT')}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={qualitativeComment$} />
      </div>
      <!-- // Qualitative comment-->

      <!-- Status-->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatSelect placeholder={T('COMMON.LABEL.EVALUATE_STATUS')} disabled={$isReadOnlyMode$} />
      </div>

      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatCheckbox text={T('COMMON.LABEL.COMPLETE')} disabled={$isReadOnlyMode$} bind:checked={form.complete} />
      </div>
      <!-- // Status-->
    </div>

  </Section>
  <!-- // Evaluator Info-->

</section>
<!--//Main content-->
