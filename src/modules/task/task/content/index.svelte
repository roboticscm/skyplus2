<script lang="ts">
  import { tick, onMount, onDestroy } from 'svelte';
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
  import ViewWrapperModal from '@/components/modal/view-wrapper';
  import { roleControlStore } from '@/store/role-control';
  import { appStore } from '@/store/app';
  import { apolloClient } from '@/lib/js/hasura-client';
  import { Debug } from '@/lib/js/debug';
  import { validation } from './validation';
  import { catchError, concatMap, switchMap, filter, take } from 'rxjs/operators';
  import { fromEvent, of, Observable, EMPTY, Subscription } from 'rxjs';
  import { fromPromise } from 'rxjs/internal-compatibility';

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
    taskQualification$,
    taskVerification$,
    assigneeStatusList$,
    assignerStatusList$,
    characteristicTaskList$,
    priority$,
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
  let modalContentViewRef: any;
  let viewWrapperModalRef: any;
  let ModalContentView: any;
  let selectedData: Task;
  let forAssigner = undefined;
  let modalFullControl: boolean = undefined;
  let modalRoleControls: any[] = [];
  let modalMenuPath: string;

  let projectSub: Subscription;
  let projectApolloClient$: any;

  let prioritySub: Subscription;
  let priorityApolloClient$: any;
  let saveOrUpdateSub: any;

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
  let form: any = resetForm();
  let beforeForm: any;

  export const getForm = () => {
    return form;
  };
  const saveUpdateUri = 'task/task/save-or-update';

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
    if ($isReadOnlyMode$) {
      return;
    }

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

  const onAddCharacteristicTask = () => {
    // @ts-ignore
    if ($isReadOnlyMode$) {
      return;
    }

    // @ts-ignore
    const specificOrg: any[] = SObject.clone($characteristicTaskList$);
    selectOrgModalRef.show(specificOrg).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        const checkedSpecificOrg = selectOrgModalRef.getCheckedLeafNodes();
        characteristicTaskList$.next(
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

  const onCloseCharacteristicTask = (event: any) => {
    // @ts-ignore
    const specificOrgList = SObject.clone($characteristicTaskList$);

    const index = specificOrgList.findIndex((it: any) => it.id === event.detail.id);
    if (index >= 0) {
      specificOrgList.splice(index, 1);
      characteristicTaskList$.next(specificOrgList);
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
    if ($isReadOnlyMode$) {
      return;
    }
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
    if ($isReadOnlyMode$) {
      return;
    }

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
    // @ts-ignore
    if ($isReadOnlyMode$) {
      return;
    }

    forAssigner = true;
    statusModalRef.show().then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        assignerStatusList$.next([{ id: '1', date: new Date(), status: 'New status', note: 'Note xxx...' }]);
      }
    });
  };

  const onAddAssigneeStatus = () => {
    // @ts-ignore
    if ($isReadOnlyMode$) {
      return;
    }

    forAssigner = false;
    statusModalRef.show().then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        assigneeStatusList$.next([{ id: '1', date: new Date(), percent: 'New status', note: 'Note xxx...' }]);
      }
    });
  };

  const onOpenModal = (menuPath: string) => {
    modalMenuPath = menuPath;
    loadModalComponent(menuPath).then((res) => {
      viewWrapperModalRef.show().then((res) => {
        console.log(res);
      });
    });
  };

  // ============================== // EVENT HANDLE ==========================

  // ============================== HELPER ==========================
  const preprocessData = () => {
    // form.description = taskDescRef.getHtmlContent();
    // form.startTime = startTimeRef.getTimestampValue();
    // form.deadline = deadlineRef.getTimestampValue();
    // form.firstReminder = firstReminderRef.getTimestampValue();
    // form.secondReminder = secondReminderRef.getTimestampValue();
    // form.taskAttachFile = uploadFilesRef.getUploadFileNames();
  };

  const postprocessData = () => {
    // @ts-ignore
    if ($isUpdateMode$) {
      form.removeTaskAttachFile =
        beforeForm.taskAttachFile && form.taskAttachFile
          ? beforeForm.taskAttachFile.filter((it: string) => form.taskAttachFile.indexOf(it) < 0)
          : [];
      form.insertTaskAttachFile =
        beforeForm.taskAttachFile && form.taskAttachFile
          ? form.taskAttachFile.filter((it: string) => beforeForm.taskAttachFile.indexOf(it) < 0)
          : form.taskAttachFile;
    } else {
      form.removeTaskAttachFile = [];
      form.insertTaskAttachFile = form.taskAttachFile;
    }
  };
  // ============================== // HELPER ==========================

  // ============================== CLIENT VALIDATION ==========================
  /**
   * Client validation and check for no data change.
   * @param {none}
   * @return {boolean}. true if all of things are valid, false: otherwise
   */
  const validate = () => {
    preprocessData();

    // client validation
    form.errors.errors = form.recordErrors(validation(form));
    if (form.errors.any()) {
      return false;
    }

    // check for data change
    // @ts-ignore
    if ($isUpdateMode$) {
      const dataChanged = view.checkObjectChange(beforeForm, SObject.clone(form), scRef.snackbarRef());
      console.log(dataChanged);
      if (!dataChanged) {
        return false;
      }
    }

    return true;
  };
  // ============================== //CLIENT VALIDATION ==========================

  // ============================== FUNCTIONAL ==========================
  /**
   * Add new add. Called by onAddNew event handle
   * @param {none}
   * @return {void}.
   */
  export const doAddNew = () => {
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

  /**
   * Save or update form. Called by onSave and onUpdate event handle
   * @param {ob$} Observable event of the button click or shortcut key(fromEvent)
   * @return {void}.
   */
  const doSaveOrUpdate = (ob$: Observable<any>) => {
    saveOrUpdateSub = ob$
      .pipe(
        filter((_) => validate()) /* filter if form pass client validation */,
        concatMap((_) =>
          fromPromise(
            /* verify permission*/
            view.verifySaveAction(
              // @ts-ignore
              $isUpdateMode$ ? ButtonId.Update : ButtonId.Save,
              scRef,
            ),
          ).pipe(
            catchError((error) => {
              return of(error);
            }),
          ),
        ),
        filter((value) => value !== 'fail') /* filter if pass verify permission*/,
        switchMap((_) => {
          /* submit data to API server*/
          saveRunning$.next(true);
          postprocessData();
          console.log(form.data());
          return form.post(saveUpdateUri).pipe(
            catchError((error) => {
              return of(error);
            }),
          );
        }),
      )
      .subscribe({
        /* do something after form submit*/
        next: (res: any) => {
          if (res.response && res.response.data) {
            // if error
            if (res.response.data.message) {
              scRef.snackbarRef().showUnknownError(res.response.data.message);
            } else {
              form.errors.errors = form.recordErrors(res.response.data);
            }
          } else {
            // success
            // @ts-ignore
            if ($isUpdateMode$) {
              // update
              scRef.snackbarRef().showUpdateSuccess();
              view.needSelectId$.next(selectedData.id);
            } else {
              // save
              scRef.snackbarRef().showSaveSuccess();
              doAddNew();
            }
          }
          saveRunning$.next(false);
        },
        error: (error) => {
          Debug.errorSection('Task - doSaveOrUpdate', error);
          saveRunning$.next(false);
        },
      });
  };

  const doSelect = (data: any) => {
    selectedData = data;
    if (selectedData) {
      isReadOnlyMode$.next(true);
      isUpdateMode$.next(true);
      form = new Form({
        ...selectedData,
        removeTaskAttachFile: [],
        insertTaskAttachFile: [],
      });

      // taskDescRef.setHtmlContent(form.description);
      // startTimeRef.setTimestampValue(form.startTime);
      // deadlineRef.setTimestampValue(form.deadline);
      // firstReminderRef.setTimestampValue(form.firstReminder);
      // secondReminderRef.setTimestampValue(form.secondReminder);

      // save init value for checking data change
      beforeForm = SObject.clone(form);
      console.log(beforeForm);
    }
  };
  // ============================== // FUNCTIONAL ==========================

  const addCallback = (event) => {
    if (modalMenuPath === 'task/project') {
      form.projectId = event.detail;
    } else if (modalMenuPath === 'task/priority') {
      form.priorityId = event.detail;
    }
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

  /**
   * Use save or update action directive. Register click event for Save / Update button
   * @param {none}
   * @return {void}.
   */
  const useSaveOrUpdateAction = {
    register(component: HTMLElement, param: any) {
      doSaveOrUpdate(fromEvent(component, 'click'));
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

  const registerSubscription = () => {
    projectSub = ViewStore.loadTableMetaData$('tsk_project').subscribe((res) => {
      const query = ViewStore.createCustomQuerySubscription('tsk_project', res.data);
      projectApolloClient$ = apolloClient.subscribe({
        query,
      });
      projectApolloClient$.subscribe((res: any) => {
        store.findProjects();
      });
    });

    prioritySub = ViewStore.loadTableMetaData$('tsk_priority').subscribe((res) => {
      const query = ViewStore.createCustomQuerySubscription('tsk_priority', res.data);
      priorityApolloClient$ = apolloClient.subscribe({
        query,
      });
      priorityApolloClient$.subscribe((res: any) => {
        store.findPriorities();
      });
    });
  };

  onMount(() => {
    registerSubscription();
  });

  onDestroy(() => {
    if (projectSub) {
      projectSub.unsubscribe();
    }

    if (prioritySub) {
      prioritySub.unsubscribe();
    }

    if (saveOrUpdateSub) {
      saveOrUpdateSub.unsubscribe();
    }
  });

  // ============================== REACTIVE ==========================
  // Monitoring selected data from other users
  // When other users edit on the same data, display a confirmation of the change with the current user
  // view.allColumns$.subscribe((cols) => {
  //   if (cols && cols.length > 0) {
  //     const query = view.createQuerySubscription(true);
  //     view.selectedData$
  //             .pipe(
  //                     switchMap((it: any) => {
  //                       if (!it) return EMPTY;
  //                       return apolloClient.subscribe({
  //                         query,
  //                         variables: {
  //                           id: it.id.toString(),
  //                           updatedBy: localStorage.getItem('userId'),
  //                         },
  //                       });
  //                     }),
  //             )
  //             .subscribe(async (res) => {
  //               // @ts-ignore
  //               view.doNotifyConflictData(form, res.data, selectedData.id, $isReadOnlyMode$, scRef);
  //             });
  //   }
  // });

  // when user click on work list. load selected data to the right form
  const selectDataSub = view.selectedData$.subscribe((data) => {
    doSelect(data);
  });

  // ============================== //REACTIVE ==========================
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';
</style>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<SelectHumanModal id={view.getViewName() + 'SelectHumanModal'} {menuPath} bind:this={selectHumanModalRef} />
<SelectOrgModal id={view.getViewName() + 'SelectOrgModal'} {menuPath} bind:this={selectOrgModalRef} />
<StatusModal {forAssigner} id={view.getViewName() + 'StatusModal'} {menuPath} bind:this={statusModalRef} {store} />

<ViewWrapperModal
  menuInfo={modalContentViewRef && modalContentViewRef.getMenuInfo$()}
  title={modalContentViewRef && modalContentViewRef.getViewTitle()}
  defaultWidth={600}
  defaultHeight={400}
  bind:this={viewWrapperModalRef}
  {menuPath}
  id={'modalWrapper' + view.getViewName() + 'ModalId'}>
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
<!--//Invisible Element-->

<!--Form controller-->
<section class="view-content-controller">
  <!--    {#if view.isRendered(ButtonId.AddNew)}-->
  <!--      <Button btnType={ButtonType.AddNew} on:click={onAddNew} disabled={view.isDisabled(ButtonId.AddNew)} />-->
  <!--    {/if}-->

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
      <!-- Name -->
      <div class="col-xs-24 col-md-12">
        <FloatTextInput
          checked={form.private}
          rightCheck={true}
          checkTitle={T('COMMON.LABEL.PRIVATE_TASK')}
          bind:this={taskNameRef}
          placeholder={T('COMMON.LABEL.NAME')}
          name="name"
          disabled={$isReadOnlyMode$}
          bind:value={form.name} />
        <Error {form} field="name" />
      </div>
      <!-- // Name -->

      <div class="col-xs-24 col-md-12">
        <!-- Project -->
        <FloatSelect
          saveState={true}
          autoLoad={true}
          bind:value={form.projectId}
          on:clickLabel={() => onOpenModal('task/project')}
          id={view.getViewName() + 'ProjectId'}
          placeholder={T('TASK.LABEL.PROJECT') + '(+)'}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={projects$} />
      </div>
      <!-- // Project -->
    </div>

    <div class="row">
      <!-- Task Description -->
      <div class="col-xs-24 col-md-12">
        <RichEditor bind:value={form.description} bind:this={taskDescRef} disabled={$isReadOnlyMode$}>
          {T('TASK.LABEL.TASK_DESCRIPTION')}:
        </RichEditor>
      </div>
      <!-- // Task Description -->
      <!-- Attach file -->
      <div class="col-xs-24 col-md-12" style="margin-top: 25px; min-height: 100px;">
        <UploadFiles
          bind:this={uploadFilesRef}
          bind:list={form.taskAttachFile}
          {menuPath}
          id={view.getViewName() + 'UploadFiles'}
          disabled={$isReadOnlyMode$} />
      </div>
      <!-- // Attach file -->
    </div>

    <div class="row">
      <!-- Last status -->
      <div class="col-xs-24 col-md-12">
        <FloatSelect
          saveState={true}
          autoLoad={true}
          bind:value={form.priorityId}
          on:clickLabel={() => onOpenModal('task/priority')}
          id={view.getViewName() + 'PriorityId'}
          placeholder={T('TASK.LABEL.PRIORITY') + '(+)'}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={priority$} />
        <!-- // Last status -->
      </div>
      <!-- Last status -->
      <div class="col-xs-24 col-md-12">
        <FloatTextInput placeholder={T('COMMON.LABEL.STATUS')} disabled={true} bind:value={form.lastStatusName} />
      </div>
      <!-- // Last status -->
    </div>

    <div class="row">
      <!-- Start time -->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          bind:value={form.startTime}
          placeholder={T('COMMON.LABEL.START_TIME')}
          disabled={$isReadOnlyMode$} />
      </div>
      <!-- // tart time -->

      <!-- Deadline -->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.DEADLINE')}
          bind:value={form.deadline}
          disabled={$isReadOnlyMode$} />
      </div>
      <!-- // Deadline -->

      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.FIRST_REMINDER')}
          bind:value={form.firstReminder}
          disabled={$isReadOnlyMode$} />
      </div>

      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker
          placeholder={T('COMMON.LABEL.SECOND_REMINDER')}
          bind:value={form.secondReminder}
          disabled={$isReadOnlyMode$} />
      </div>
    </div>

    <div class="row" style="margin-top: 15px;">
      <!-- Assigner -->
      <div class="col-xs-24 col-md-12">
        <CloseableList
          disabled={$isReadOnlyMode$}
          on:close={onCloseAssigner}
          data$={assignerList$}
          {menuPath}
          id={view.getViewName() + 'AssignerId'}>
          <!--          <Button uppercase={false} on:click={onAddAssigner} title={'+ ' + T('COMMON.LABEL.ASSIGNER')} />-->
          <div on:click={onAddAssigner}>
            {T('COMMON.LABEL.ASSIGNER')}
            <i class="fa fa-angle-down" />
            <div />
          </div>
        </CloseableList>
      </div>
      <!-- // Assigner -->

      <div class="col-xs-24 col-md-12">
        <div class="default-rounded-border">
          <div class="my-placeholder" style="padding: 6px;">{T('COMMON.LABEL.CREATOR')}:</div>
          <div style="margin-top: 5px; padding: 6px;">{'Tony Lua'}</div>
        </div>
      </div>
    </div>

    <div class="row" style="margin-top: 15px;">
      <!-- Assignee -->
      <div class="col-xs-24 col-md-12">
        <CloseableList
          disabled={$isReadOnlyMode$}
          on:close={onCloseAssignee}
          data$={assigneeList$}
          {menuPath}
          id={view.getViewName() + 'AssigneeId'}>
          <!--          <Button uppercase={false} on:click={onAddAssignee} title={'+ ' + T('COMMON.LABEL.ASSIGNEE')} />-->
          <div on:click={onAddAssignee}>
            {T('COMMON.LABEL.ASSIGNEE')}
            <i class="fa fa-angle-down" />
            <div />
          </div>
        </CloseableList>
      </div>
      <!-- // Assignee -->

      <!-- Evaluator -->
      <div class="col-xs-24 col-md-12">
        <CloseableList
          on:close={onCloseEvaluator}
          data$={accessorList$}
          {menuPath}
          id={view.getViewName() + 'EvaluatorId'}>
          <!--          <Button uppercase={false} on:click={onAddEvaluator} title={'+ ' + T('COMMON.LABEL.EVALUATOR')} />-->
          <div on:click={onAddEvaluator}>
            {T('COMMON.LABEL.EVALUATOR')}
            <i class="fa fa-angle-down" />
            <div />
          </div>
        </CloseableList>
      </div>
      <!-- // Evaluator -->
    </div>

    <div style="height: 10px;" />

    <Section
      title={T('TASK.LABEL.CHARACTERISTIC_AND_BENEFICIARY')}
      id={view.getViewName() + 'BeneficiarySectionId'}
      {menuPath}>
      <div class="row">
        <div class="col-xs-24 col-md-12 col-lg-8">
          <CloseableList
            disabled={$isReadOnlyMode$}
            on:close={onCloseCharacteristicTask}
            data$={characteristicTaskList$}
            {menuPath}
            id={view.getViewName() + 'CharacteristicTaskId'}>
            <!--            <Button-->
            <!--              uppercase={false}-->
            <!--              on:click={onAddCharacteristicTask}-->
            <!--              title={'+ ' + T('COMMON.LABEL.CHARACTERISTIC_TASK')} />-->

            <div on:click={onAddCharacteristicTask}>
              {T('COMMON.LABEL.CHARACTERISTIC_TASK')}
              <i class="fa fa-angle-down" />
              <div />
            </div>
          </CloseableList>
        </div>

        <div class="col-xs-24 col-md-12 col-lg-8">
          <CloseableList
            disabled={$isReadOnlyMode$}
            on:close={onCloseAssignee}
            data$={assigneeList$}
            {menuPath}
            id={view.getViewName() + 'AssigneeId'}>
            <!--            <Button uppercase={false} on:click={onAddAssignee} title={'+ ' + T('COMMON.LABEL.BENEFICIARY')} />-->
            <div on:click={onAddAssignee}>
              {T('COMMON.LABEL.BENEFICIARY')}
              <i class="fa fa-angle-down" />
              <div />
            </div>
          </CloseableList>
        </div>

        <div class="col-xs-24 col-md-12 col-lg-8">
          <CloseableList
            disabled={$isReadOnlyMode$}
            on:close={onCloseAssignee}
            data$={assigneeList$}
            {menuPath}
            id={view.getViewName() + 'AssigneeId'}>
            <!--            <Button-->
            <!--              uppercase={false}-->
            <!--              on:click={onAddAssignee}-->
            <!--              title={'+ ' + T('COMMON.LABEL.BENEFICIARY_ORGANIZATION')} />-->
            <div on:click={onAddAssignee}>
              {T('COMMON.LABEL.BENEFICIARY_ORGANIZATION')}
              <i class="fa fa-angle-down" />
              <div />
            </div>
          </CloseableList>
        </div>
      </div>
    </Section>
  </Section>
  <!-- //Task Info-->

  <div style="height: 20px;" />

  <!-- Assigner Info-->
  <Section title={T('TASK.LABEL.ASSIGNER')} id={view.getViewName() + 'AssignerSectionId'} {menuPath}>
    <div class="row" style="margin-top: 6px;">
      <div class="col-24">{T('COMMON.LABEL.STATUS_DETAIL')}:</div>
    </div>
    <div class="row">
      <div class=" col-24">
        <CloseableList
          className="closeable-list__floating-controller"
          on:close={onCloseEvaluator}
          customData={$assignerStatusList$}
          customRender="modules/task/task/components/status/index.svelte"
          {menuPath}
          id={view.getViewName() + 'AssignerId'}>
          <div slot="floatingController">
            <FloatingButton on:click={onAddAssignerStatus} title={T('TASK.LABEL.ADD_STATUS')} />
          </div>
        </CloseableList>
      </div>
    </div>
  </Section>
  <!-- // Assigner Info-->

  <div style="height: 20px;" />

  <!-- Assignee Info-->
  <Section title={T('TASK.LABEL.ASSIGNEE')} id={view.getViewName() + 'AssigneeSectionId'} {menuPath}>
    <!-- Start date-->
    <div class="row">
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker placeholder={T('COMMON.LABEL.START_DATE')} name="startDate" disabled={$isReadOnlyMode$} />
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
            className="closeable-list__floating-controller"
            on:close={onCloseEvaluator}
            customData={$assigneeStatusList$}
            customRender="modules/task/task/components/status/index.svelte"
            {menuPath}
            id={view.getViewName() + 'EvaluatorId'}>
            <div slot="floatingController">
              <FloatingButton on:click={onAddAssigneeStatus} title={T('TASK.LABEL.ADD_STATUS')} />
            </div>
          </CloseableList>
        </div>
      </div>

      <!-- End date-->
      <div class="row">
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker placeholder={T('COMMON.LABEL.END_DATE')} name="endDate" disabled={$isReadOnlyMode$} />
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

  <div style="height: 20px;" />

  <!-- Evaluator Info-->
  <Section title={T('TASK.LABEL.EVALUATOR')} id={view.getViewName() + 'EvaluatorSectionId'} {menuPath}>
    <!-- Date-->
    <div class="row">
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatDatePicker placeholder={T('COMMON.LABEL.DATE')} name="evaluateDate" disabled={$isReadOnlyMode$} />
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
      <!-- Task Verification-->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatSelect
          id={view.getViewName() + 'TaskVerificationId'}
          placeholder={T('TASK.LABEL.TASK_VERIFICATION')}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={taskVerification$} />
      </div>
      <!-- // Task Verification-->

      <!-- Task Qualification-->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatSelect
          id={view.getViewName() + 'TaskQualificationId'}
          placeholder={T('TASK.LABEL.TASK_QUALIFICATION')}
          {menuPath}
          disabled={$isReadOnlyMode$}
          data$={taskQualification$} />
      </div>
      <!-- // Task Qualification-->

      <!-- Status-->
      <div class="col-xs-24 col-md-12 col-lg-6">
        <FloatSelect
          id={view.getViewName() + 'EvaluateStatusId'}
          {menuPath}
          placeholder={T('COMMON.LABEL.EVALUATE_STATUS')}
          disabled={$isReadOnlyMode$} />
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
