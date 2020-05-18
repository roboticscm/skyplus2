<script lang="ts">
  import { tick, onMount, onDestroy } from 'svelte';
  import SC from '@/components/set-common';
  import { ViewStore } from '@/store/view';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';
  import Button from '@/components/ui/flat-button';
  import FloatingButton from '@/components/ui/button/floating';
  import Store from '../store';
  import Form from '@/lib/js/form/form';
  import { StatusDetail, Task } from '../../types';
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
  import { fromEvent, of, Observable, EMPTY, Subscription, noop } from 'rxjs';
  import { fromPromise } from 'rxjs/internal-compatibility';
  import {
    findEditStatusDetail,
    findRemoveAndInsertFile,
    findRemoveAndInsertItem,
    findRemoveAndInsertStatusDetail,
  } from './helper';
  import { StringUtil } from '@/lib/js/string-util';
  import { SDate } from '@/lib/js/sdate';
  import { getUserFullName } from '@/lib/js/security';
  import { getUserId } from '@/lib/js/security';

  // Props
  export let view: ViewStore;
  export let menuPath: string;
  export let store: Store;

  // @ts-ignore
  const {
    selectedData$,
    hasAnyDeletedRecord$,
    deleteRunning$,
    saveRunning$,
    isReadOnlyMode$,
    isUpdateMode$,
    ModalContentView$,
    modalFullControl$,
    modalRoleControls$,
  } = view;

  // @ts-ignore
  const { projects$, taskQualification$, taskVerification$, priority$, taskStatus$ } = store;

  // Refs
  let scRef: any;
  let taskNameRef: any;
  let selectHumanModalRef: any;
  let selectOrgModalRef: any;
  let accessCommentRef: any;
  let statusModalRef: any;
  let modalContentViewRef: any;
  let viewWrapperModalRef: any;
  let selectedData: Task;
  let forAssigner = undefined;
  let modalMenuPath: string;

  let saveOrUpdateSub: Subscription;

  let modalTitle = '';
  let submitType = undefined;
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

  let readOnlyMode: boolean;
  let readOnlyModeAssignee, readOnlyModeAssigner, readOnlyModeEvaluator: boolean;

  // @ts-ignore
  $: readOnlyMode = $isReadOnlyMode$ || form.submitStatus == 1 || !isEditTaskUser();

  // @ts-ignore
  $: readOnlyModeAssignee = $isReadOnlyMode$ || form.submitStatus !== 1 || !isAssigneeUser();

  // @ts-ignore
  $: readOnlyModeAssigner = $isReadOnlyMode$ || form.submitStatus !== 1 || !isAssignerUser();

  // @ts-ignore
  $: readOnlyModeEvaluator = $isReadOnlyMode$ || form.submitStatus !== 1 || !isEvaluatorUser();

  const isEditTaskUser = () => {
    return (
      !selectedData ||
      selectedData.createdBy == getUserId() ||
      form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0 ||
      form.evaluators.findIndex((it: any) => it.id == getUserId()) >= 0
    );
  };

  const isAssigneeUser = () => {
    return form.assignees.findIndex((it: any) => it.id == getUserId()) >= 0;
  };

  const isAssignerUser = () => {
    return form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0;
  };

  const isEvaluatorUser = () => {
    return form.evaluators.findIndex((it: any) => it.id == getUserId()) >= 0;
  };
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

  const onAddAssigner = () => {
    addAssignHumanOrOrg(form.assigners).then((res: any) => {
      form.assigners = res;
    });
  };

  const onAddAssignee = () => {
    addAssignHumanOrOrg(form.assignees).then((res: any) => {
      form.assignees = res;
    });
  };

  const onAddEvaluator = () => {
    addAssignHumanOrOrg(form.evaluators).then((res: any) => {
      form.evaluators = res;
    });
  };

  const onAddCharacteristic = () => {
    addAssignOwnerOrg(form.chars).then((res: any) => {
      form.chars = res;
    });
  };

  const onAddTargetPerson = () => {
    addAssignHumanOrOrg(form.targetPersons).then((res: any) => {
      form.targetPersons = res;
    });
  };

  const onAddTargetTeam = () => {
    addAssignOwnerOrg(form.targetTeams).then((res: any) => {
      form.targetTeams = res;
    });
  };

  const onSubmitAssignerStatus = (event: any) => {
    // @ts-ignore
    if ($isReadOnlyMode$) {
      return;
    }
    doSubmitAssignerStatus(event.detail);
  };

  const onSubmitAssigneeStatus = (event: any) => {
    // @ts-ignore
    if ($isReadOnlyMode$) {
      return;
    }
    doSubmitAssigneeStatus(event.detail);
  };

  const doSubmitAssignerStatus = (status: StatusDetail) => {
    if (selectedData) {
      status.taskId = selectedData.id;

      postprocessEditAssignerStatusDetail();
      const index = form.editAssignerStatusDetails.findIndex((st: StatusDetail) => st.id === status.id);
      if (index >= 0) {
        status = form.editAssignerStatusDetails[index];
      }
    }
    status.assignPosition = 'ASSIGNER';
    store.submitOrCancelSubmit(status).subscribe((res) => {
      if (res.data) {
        let index = form.assignerStatusDetails.findIndex((st: StatusDetail) => st.id === res.data.id);
        if (index < 0) {
          index = form.assignerStatusDetails.findIndex((st: StatusDetail) => st.id === status.id);
        }
        if (index >= 0) {
          form.assignerStatusDetails[index].submitStatus = res.data.submitStatus;
          form.assignerStatusDetails[index].closeable = res.data.submitStatus !== 1;
          form.assignerStatusDetails[index].id = res.data.id;
          form.assignerStatusDetails = [...form.assignerStatusDetails];

          console.log(res);
          console.log(form.assignerStatusDetails);
        }

        // save notification on submit or cancel submit
        const title =
          SDate.convertMillisecondToDateTimeString(status.startTime) +
          ' - ' +
          SDate.convertMillisecondToDateTimeString(status.endTime) +
          '</br>' +
          (status.status ? status.status + '</br>' : '') +
          status.note;
        if (res.data.submitStatus === 1) {
          saveNotification(title, status.taskId);
        } else if (res.data.submitStatus === 0) {
          saveNotification(title, status.taskId, true);
        }
      }

      // save init value for checking data change
      beforeForm = SObject.clone(form);
    });
  };

  const doSubmitAssigneeStatus = (status: StatusDetail) => {
    if (selectedData) {
      status.taskId = selectedData.id;

      postprocessEditAssigneeStatusDetail();
      const index = form.editAssigneeStatusDetails.findIndex((st: StatusDetail) => st.id === status.id);
      if (index >= 0) {
        status = form.editAssigneeStatusDetails[index];
      }
    }

    status.assignPosition = 'ASSIGNEE';
    store.submitOrCancelSubmit(status).subscribe((res) => {
      if (res.data) {
        let index = form.assigneeStatusDetails.findIndex((st: StatusDetail) => st.id === res.data.id);
        if (index < 0) {
          index = form.assigneeStatusDetails.findIndex((st: StatusDetail) => st.id === status.id);
        }
        if (index >= 0) {
          form.assigneeStatusDetails[index].submitStatus = res.data.submitStatus;
          form.assigneeStatusDetails[index].closeable = res.data.submitStatus !== 1;
          form.assigneeStatusDetails[index].id = res.data.id;
          form.assigneeStatusDetails = [...form.assigneeStatusDetails];
        }

        // save notification on submit or cancel submit
        const title =
          SDate.convertMillisecondToDateTimeString(status.startTime) +
          ' - ' +
          SDate.convertMillisecondToDateTimeString(status.endTime) +
          '</br>' +
          (status.status ? status.status + '</br>' : '') +
          status.note;
        if (res.data.submitStatus === 1) {
          saveNotification(title, status.taskId);
        } else if (res.data.submitStatus === 0) {
          saveNotification(title, status.taskId, true);
        }
      }

      // save init value for checking data change
      beforeForm = SObject.clone(form);
    });
  };

  const onEditAssignerStatus = (event: any) => {
    // @ts-ignore
    if ($isReadOnlyMode$) {
      return;
    }

    modalTitle = T('COMMON.LABEL.EDIT_STATUS');
    forAssigner = true;
    statusModalRef.show(event.detail).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        const editedData = statusModalRef.getData();
        const index = form.assignerStatusDetails.findIndex((it: StatusDetail) => it.id === editedData.id);
        if (index >= 0) {
          form.assignerStatusDetails[index] = editedData;
          form.assignerStatusDetails = [...form.assignerStatusDetails];
        }
      }
    });
  };

  const onViewAssignerStatus = (event: any) => {
    modalTitle = T('COMMON.LABEL.STATUS_DETAIL');
    forAssigner = true;
    statusModalRef.show(event.detail, true);
  };

  const onViewAssigneeStatus = (event: any) => {
    modalTitle = T('COMMON.LABEL.STATUS_DETAIL');
    forAssigner = false;
    statusModalRef.show(event.detail, true);
  };

  const onAddAssignerStatus = () => {
    // @ts-ignore
    if (readOnlyModeAssigner) {
      return;
    }

    modalTitle = T('COMMON.LABEL.ADD_STATUS');
    forAssigner = true;
    statusModalRef.show().then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        if (form.assignerStatusDetails && form.assignerStatusDetails.length > 0 && form.assignerStatusDetails[0].id) {
          form.assignerStatusDetails = [...form.assignerStatusDetails, { ...statusModalRef.getData() }];
        } else {
          form.assignerStatusDetails = [{ ...statusModalRef.getData() }];
        }
      }
    });
  };

  const onEditAssigneeStatus = (event: any) => {
    // @ts-ignore
    if (readOnlyModeAssignee) {
      return;
    }

    modalTitle = T('COMMON.LABEL.EDIT_STATUS');
    forAssigner = false;
    statusModalRef.show(event.detail).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        const editedData = statusModalRef.getData();
        const index = form.assigneeStatusDetails.findIndex((it: StatusDetail) => it.id === editedData.id);
        if (index >= 0) {
          form.assigneeStatusDetails[index] = editedData;
          form.assigneeStatusDetails = [...form.assigneeStatusDetails];
        }
      }
    });
  };

  const onAddAssigneeStatus = () => {
    // @ts-ignore
    if (readOnlyModeAssignee) {
      return;
    }

    modalTitle = T('COMMON.LABEL.ADD_STATUS');
    forAssigner = false;
    statusModalRef.show().then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        if (form.assigneeStatusDetails && form.assigneeStatusDetails.length > 0 && form.assigneeStatusDetails[0].id) {
          form.assigneeStatusDetails = [...form.assigneeStatusDetails, { ...statusModalRef.getData() }];
        } else {
          form.assigneeStatusDetails = [{ ...statusModalRef.getData() }];
        }
      }
    });
  };

  const onOpenModal = (menuPath: string) => {
    modalMenuPath = menuPath;
    view.loadModalComponent(menuPath).then((res) => {
      viewWrapperModalRef.show().then((res) => {
        console.log(res);
      });
    });
  };

  // ============================== // EVENT HANDLE ==========================

  // ============================== HELPER ==========================
  const addAssignHumanOrOrg = (source: any[]) => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (readOnlyMode) {
        return;
      }

      // @ts-ignore
      const _source: any[] = SObject.clone(source);
      selectHumanModalRef.show(_source).then((buttonPressed: ButtonPressed) => {
        if (buttonPressed === ButtonPressed.OK) {
          const checked = selectHumanModalRef.getCheckedLeafNodes();
          const result = checked.map((it: any) => {
            return {
              id: it.id.replace('human', ''),
              name: it.name,
            };
          });

          resolve(result);
        }
      });
    });
  };

  const addAssignOwnerOrg = (source: any[]) => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (readOnlyMode) {
        return;
      }

      // @ts-ignore
      const _source: any[] = SObject.clone(source);
      selectOrgModalRef.show(_source).then((buttonPressed: ButtonPressed) => {
        if (buttonPressed === ButtonPressed.OK) {
          const checked = selectOrgModalRef.getCheckedLeafNodes();
          const result = checked.map((it: any) => {
            return {
              id: it.id,
              name: it.name,
            };
          });

          resolve(result);
        }
      });
    });
  };

  const preprocessData = () => {};

  const postprocessData = () => {
    // task attach file
    [form.removeTaskAttachFiles, form.insertTaskAttachFiles] = findRemoveAndInsertFile(
      isUpdateMode$.value,
      beforeForm && beforeForm.taskAttachFiles,
      form.taskAttachFiles,
    );

    // assigner
    [form.removeAssigners, form.insertAssigners] = findRemoveAndInsertItem(
      isUpdateMode$.value,
      beforeForm && beforeForm.assigners,
      form.assigners,
    );

    // assignee
    [form.removeAssignees, form.insertAssignees] = findRemoveAndInsertItem(
      isUpdateMode$.value,
      beforeForm && beforeForm.assignees,
      form.assignees,
    );

    // evaluator
    [form.removeEvaluators, form.insertEvaluators] = findRemoveAndInsertItem(
      isUpdateMode$.value,
      beforeForm && beforeForm.evaluators,
      form.evaluators,
    );

    // characteristics
    [form.removeChars, form.insertChars] = findRemoveAndInsertItem(
      isUpdateMode$.value,
      beforeForm && beforeForm.chars,
      form.chars,
    );

    // Target Person
    [form.removeTargetPersons, form.insertTargetPersons] = findRemoveAndInsertItem(
      isUpdateMode$.value,
      beforeForm && beforeForm.targetPersons,
      form.targetPersons,
    );

    // Target Team
    [form.removeTargetTeams, form.insertTargetTeams] = findRemoveAndInsertItem(
      isUpdateMode$.value,
      beforeForm && beforeForm.targetTeams,
      form.targetTeams,
    );

    // Add or remove Assignee status detail
    [form.removeAssigneeStatusDetails, form.insertAssigneeStatusDetails] = findRemoveAndInsertStatusDetail(
      isUpdateMode$.value,
      beforeForm && beforeForm.assigneeStatusDetails,
      form.assigneeStatusDetails,
    );

    // Edit Assigner status detail
    postprocessEditAssigneeStatusDetail();

    // Add or remove Assigner status detail
    [form.removeAssignerStatusDetails, form.insertAssignerStatusDetails] = findRemoveAndInsertStatusDetail(
      isUpdateMode$.value,
      beforeForm && beforeForm.assignerStatusDetails,
      form.assignerStatusDetails,
    );

    // Edit Assigner status detail
    postprocessEditAssignerStatusDetail();

    if (submitType === 'submit') {
      form.submitStatus = 1;
    } else if (submitType === 'cancelSubmit') {
      form.submitStatus = 0;
    }
  };

  const postprocessEditAssignerStatusDetail = () => {
    if (isUpdateMode$.value) {
      const [a, b] = findEditStatusDetail(beforeForm.assignerStatusDetails, SObject.clone(form.assignerStatusDetails));
      const dataChange = view.checkObjectArrayChange(a, b);
      if (dataChange) {
        form.editAssignerStatusDetails = dataChange;

        for (let statusDetail of form.editAssignerStatusDetails) {
          const index = beforeForm.assignerStatusDetails.findIndex((it: StatusDetail) => {
            return it.id === statusDetail.id;
          });

          if (index >= 0) {
            [statusDetail.removeAttachFiles, statusDetail.insertAttachFiles] = findRemoveAndInsertFile(
              isUpdateMode$.value,
              beforeForm && beforeForm.assignerStatusDetails[index].attachFiles,
              statusDetail.attachFiles,
            );
          }
        }
      }
    }
  };

  const postprocessEditAssigneeStatusDetail = () => {
    if (isUpdateMode$.value) {
      const [a, b] = findEditStatusDetail(beforeForm.assigneeStatusDetails, SObject.clone(form.assigneeStatusDetails));
      const dataChange = view.checkObjectArrayChange(a, b);
      if (dataChange) {
        form.editAssigneeStatusDetails = dataChange;

        for (let statusDetail of form.editAssigneeStatusDetails) {
          const index = beforeForm.assigneeStatusDetails.findIndex((it: StatusDetail) => {
            return it.id === statusDetail.id;
          });

          if (index >= 0) {
            [statusDetail.removeAttachFiles, statusDetail.insertAttachFiles] = findRemoveAndInsertFile(
              isUpdateMode$.value,
              beforeForm && beforeForm.assigneeStatusDetails[index].attachFiles,
              statusDetail.attachFiles,
            );
          }
        }
      }
    }
  };

  const getHumanIds = () => {
    return [
      ...new Set([
        ...form.assigners.map((it: any) => it.id),
        ...form.assignees.map((it: any) => it.id),
        ...form.evaluators.map((it: any) => it.id),
      ]),
    ].filter((it) => it !== null);
  };

  const saveNotification = (title: string, targetId: string, isCancel = false) => {
    view.saveFunctionalNotification(getHumanIds(), title, targetId, isCancel).subscribe();
  };

  // ============================== // HELPER ==========================

  // ============================== CLIENT VALIDATION ==========================
  const verifySaveOrUpdate = () => {
    return fromPromise(
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
    );
  };

  const verifySubmit = () => {
    submitType = 'submit';
    return fromPromise(
      /* verify permission*/
      view.verifySubmitAction(ButtonId.Submit, scRef),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyCancelSubmit = () => {
    submitType = 'cancelSubmit';
    return fromPromise(
      /* verify permission*/
      view.verifyCancelSubmitAction(ButtonId.CancelSubmit, scRef),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

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
    if (isUpdateMode$.value) {
      const dataChanged = view.checkObjectChange(beforeForm, SObject.clone(form), scRef.snackbarRef());
      if (!dataChanged) {
        return false;
      }
    }

    return true;
  };

  const validateForSubmitOrCancelSubmit = () => {
    preprocessData();

    // client validation
    form.errors.errors = form.recordErrors(validation(form));
    if (form.errors.any()) {
      return false;
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

  const rollbackSubmitState = () => {
    if (submitType === 'submit') {
      form.submitStatus = 0;
    } else if (submitType === 'cancelSubmit') {
      form.submitStatus = 1;
    }
  };
  /**
   * Save or update form. Called by onSave and onUpdate event handle
   * @param {ob$} Observable event of the button click or shortcut key(fromEvent)
   * @return {void}.
   */
  const doSaveOrUpdate = (ob$: Observable<any>, verifyFunction, validateFunction = validate) => {
    saveOrUpdateSub = ob$
      .pipe(
        filter((_) => validateFunction()) /* filter if form pass client validation */,
        concatMap((_) => verifyFunction()),
        filter((value) => value !== 'fail') /* filter if pass verify permission*/,
        switchMap((_) => {
          /* submit data to API server*/
          saveRunning$.next(true);
          postprocessData();
          console.log('save data: ', form.data());
          return form.post(saveUpdateUri).pipe(
            catchError((error) => {
              rollbackSubmitState();
              return of(error);
            }),
          );
        }),
      )
      .subscribe({
        /* do something after form submit*/
        next: (res: any) => {
          if (res.response && res.response.data) {
            rollbackSubmitState();
            // if error
            if (res.response.data.message) {
              scRef.snackbarRef().showUnknownError(res.response.data.message);
            } else {
              form.errors.errors = form.recordErrors(res.response.data);
            }
          } else {
            // success

            // save notification on submit or cancel submit
            if (submitType === 'submit') {
              const title = res.data.name;
              saveNotification(title, res.data.id);
            } else if (submitType === 'cancelSubmit') {
              const title = res.data.name;
              saveNotification(title, res.data.id, true);
            }

            // @ts-ignore
            if ($isUpdateMode$) {
              // update
              scRef.snackbarRef().showUpdateSuccess();
              view.needSelectId$.next(selectedData.id);
              // save init value for checking data change
              beforeForm = SObject.clone(form);
            } else {
              // save
              scRef.snackbarRef().showSaveSuccess();
              doAddNew();
            }

            submitType = undefined;
          }
          saveRunning$.next(false);
        },
        error: (error) => {
          Debug.errorSection('Task - doSaveOrUpdate', error);
          saveRunning$.next(false);
          rollbackSubmitState();
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
        removeTaskAttachFiles: [],
        insertTaskAttachFiles: [],

        removeAssigners: [],
        insertAssigners: [],

        removeAssignees: [],
        insertAssignees: [],

        removeEvaluators: [],
        insertEvaluators: [],

        removeChars: [],
        insertChars: [],

        removeTargetPersons: [],
        insertTargetPersons: [],

        removeTargetTeams: [],
        insertTargetTeams: [],

        removeAssignerStatusDetails: [],
        insertAssignerStatusDetails: [],
        editAssignerStatusDetails: [],

        removeAssigneeStatusDetails: [],
        insertAssigneeStatusDetails: [],
        editAssigneeStatusDetails: [],
      });

      form.assigneeStatusDetails = SObject.distinctArrayObject(form.assigneeStatusDetails).map((it: StatusDetail) => {
        it.closeable = it.submitStatus !== 1;
        it.show = isAssigneeUser() ? true : it.submitStatus == 1;
        return it;
      });

      form.assignerStatusDetails = SObject.distinctArrayObject(form.assignerStatusDetails).map((it: StatusDetail) => {
        it.closeable = it.submitStatus !== 1;
        it.show = isAssignerUser() ? true : it.submitStatus == 1;
        return it;
      });

      // save init value for checking data change
      beforeForm = SObject.clone(form);
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

  /**
   * Use save or update action directive. Register click event for Save / Update button
   * @param {none}
   * @return {void}.
   */
  const useSaveOrUpdateAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifySaveOrUpdate);
    },
  };

  /**
   * Use submit action directive. Register click event for Submit button
   * @param {none}
   * @return {void}.
   */
  const useSubmitAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifySubmit, validateForSubmitOrCancelSubmit);
    },
  };

  /**
   * Use cancel submit action directive. Register click event for Cancel Submit button
   * @param {none}
   * @return {void}.
   */
  const useCancelSubmitAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyCancelSubmit, validateForSubmitOrCancelSubmit);
    },
  };

  const registerSubscription = () => {
    apolloClient
      .subscribe({
        query: ViewStore.createReloadSubscription('tsk_project'),
      })
      .subscribe((_) => {
        store.findProjects();
      });

    apolloClient
      .subscribe({
        query: ViewStore.createReloadSubscription('tsk_priority'),
      })
      .subscribe((_) => {
        store.findPriorities();
      });

    apolloClient
      .subscribe({
        query: ViewStore.createReloadSubscription('tsk_status'),
      })
      .subscribe((_) => {
        store.findStatus();
      });

    apolloClient
      .subscribe({
        query: ViewStore.createReloadSubscription('tsk_task_verification'),
      })
      .subscribe((_) => {
        store.findTaskVerification();
      });

    apolloClient
      .subscribe({
        query: ViewStore.createReloadSubscription('tsk_task_qualification'),
      })
      .subscribe((_) => {
        store.findTaskQualification();
      });
  };

  onMount(() => {
    registerSubscription();
    doAddNew();
    // Capture hot key (Ctrl - S) for save or update

    doSaveOrUpdate(view.registerHotKey$(document, isReadOnlyMode$), verifySaveOrUpdate);
  });

  onDestroy(() => {
    saveOrUpdateSub && saveOrUpdateSub.unsubscribe();
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
  //               view.doNotifyConflictData(form, res.data, selectedData.id, readOnlyMode, scRef);
  //             });
  //   }
  // });

  // when user click on work list. load selected data to the right form
  const selectDataSub = view.selectedData$.subscribe((data) => {
    doSelect(data);
  });

  let lastAssigneeSubmittedStatus: string;
  // @ts-ignore
  $: {
    const filtered = form.assigneeStatusDetails.filter((it: StatusDetail) => it.submitStatus === 1);
    if (filtered.length > 0) {
      lastAssigneeSubmittedStatus = filtered[filtered.length - 1].status;
    } else {
      lastAssigneeSubmittedStatus = T('TASK.LABEL.NO_STATUS');
    }
  }

  // ============================== //REACTIVE ==========================
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';
</style>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<SelectHumanModal id={view.getViewName() + 'SelectHumanModal'} {menuPath} bind:this={selectHumanModalRef} />
<SelectOrgModal id={view.getViewName() + 'SelectOrgModal'} {menuPath} bind:this={selectOrgModalRef} />
<StatusModal
  {view}
  title={modalTitle}
  {forAssigner}
  id={view.getViewName() + 'StatusModal'}
  {menuPath}
  bind:this={statusModalRef}
  {store} />

<ViewWrapperModal
  menuInfo={modalContentViewRef && modalContentViewRef.getMenuInfo$()}
  title={modalContentViewRef && modalContentViewRef.getViewTitle()}
  defaultWidth={600}
  defaultHeight={400}
  bind:this={viewWrapperModalRef}
  {menuPath}
  id={'modalWrapper' + view.getViewName() + 'ModalId'}>
  <svelte:component
    this={$ModalContentView$}
    showWorkList={false}
    bind:this={modalContentViewRef}
    showTitle={false}
    on:callback={addCallback}
    callFrom={menuPath}
    menuPath={modalMenuPath}
    fullControl={$modalFullControl$}
    roleControls={$modalRoleControls$} />
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

  {#if view.isRendered(ButtonId.Submit, form.submitStatus === 0)}
    <Button
      action={useSubmitAction}
      btnType={ButtonType.Submit}
      disabled={view.isDisabled(ButtonId.Submit, form.errors.any() || $isReadOnlyMode$ || !isEditTaskUser())} />
  {/if}

  {#if view.isRendered(ButtonId.CancelSubmit, form.submitStatus === 1)}
    <Button
      action={useCancelSubmitAction}
      btnType={ButtonType.CancelSubmit}
      disabled={(view.isDisabled(ButtonId.CancelSubmit), $isReadOnlyMode$ || !isEditTaskUser())} />
  {/if}

  {#if view.isRendered(ButtonId.Delete, $isUpdateMode$)}
    <Button
      btnType={ButtonType.Delete}
      on:click={onDelete}
      disabled={view.isDisabled(ButtonId.Delete, readOnlyMode)}
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
  <form class="form" on:keydown={(event) => form.errors.clear(event.target.name)}>
    <!-- Task Info-->
    <Section title={T('TASK.LABEL.TASK')} {menuPath} id={view.getViewName() + 'TaskSectionId'}>
      <div class="row">
        <!-- Name -->
        <div class="col-xs-24 col-md-12">
          <FloatTextInput
            bind:checked={form.isPrivate}
            rightCheck={true}
            checkTitle={T('COMMON.LABEL.PRIVATE_TASK')}
            bind:this={taskNameRef}
            placeholder={T('COMMON.LABEL.NAME')}
            name="name"
            disabled={readOnlyMode}
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
            disabled={readOnlyMode}
            data$={projects$} />
        </div>
        <!-- // Project -->
      </div>

      <div class="row">
        <!-- Task Description -->
        <div class="col-xs-24 col-md-12">
          <RichEditor bind:value={form.description} disabled={readOnlyMode}>
            {T('TASK.LABEL.TASK_DESCRIPTION')}:
          </RichEditor>
        </div>
        <!-- // Task Description -->
        <!-- Attach file -->
        <div class="col-xs-24 col-md-12" style="margin-top: 25px; min-height: 100px;">
          <UploadFiles
            savePath="upload_files/task"
            bind:list={form.taskAttachFiles}
            {menuPath}
            id={view.getViewName() + 'UploadFiles'}
            disabled={readOnlyMode} />
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
            disabled={readOnlyMode}
            data$={priority$} />
        </div>
        <!-- // Last status -->
        <!-- Last status -->
        <div class="col-xs-24 col-md-12">
          <FloatTextInput
            placeholder={T('COMMON.LABEL.STATUS')}
            disabled={true}
            value={lastAssigneeSubmittedStatus ? lastAssigneeSubmittedStatus : T('COMMON.LABEL.NO_STATUS')} />
        </div>
        <!-- // Last status -->
      </div>

      <div class="row">
        <!-- Start time -->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            bind:value={form.startTime}
            placeholder={T('COMMON.LABEL.START_TIME')}
            disabled={readOnlyMode} />
        </div>
        <!-- // tart time -->

        <!-- Deadline -->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.DEADLINE')}
            bind:value={form.deadline}
            disabled={readOnlyMode} />
        </div>
        <!-- // Deadline -->

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.FIRST_REMINDER')}
            bind:value={form.firstReminder}
            disabled={readOnlyMode} />
        </div>

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.SECOND_REMINDER')}
            bind:value={form.secondReminder}
            disabled={readOnlyMode} />
        </div>
      </div>

      <div class="row" style="margin-top: 15px;">
        <!-- Assigner -->
        <div class="col-xs-24 col-md-12">
          <CloseableList
            directClose={true}
            disabled={readOnlyMode}
            bind:list={form.assigners}
            {menuPath}
            id={view.getViewName() + 'AssignerId'}>
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
            <div style="margin-top: 5px; padding: 6px;">
              {form.creatorFullName ? form.creatorFullName : getUserFullName()}
            </div>
          </div>
        </div>
      </div>

      <div class="row" style="margin-top: 15px;">
        <!-- Assignee -->
        <div class="col-xs-24 col-md-12">
          <CloseableList
            directClose={true}
            disabled={readOnlyMode}
            bind:list={form.assignees}
            {menuPath}
            id={view.getViewName() + 'AssigneeId'}>
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
            directClose={true}
            disabled={readOnlyMode}
            bind:list={form.evaluators}
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

      <div class="row">
        <div class="col-24">
          <Section
            title={T('TASK.LABEL.CHARACTERISTIC_AND_TARGET')}
            id={view.getViewName() + 'CharAndTargetSectionId'}
            {menuPath}>
            <div class="row">
              <div class="col-xs-24 col-md-12 col-lg-8">
                <CloseableList
                  directClose={true}
                  disabled={readOnlyMode}
                  bind:list={form.chars}
                  {menuPath}
                  id={view.getViewName() + 'TaskCharacteristicId'}>

                  <div on:click={onAddCharacteristic}>
                    {T('COMMON.LABEL.TASK_CHARACTERISTIC')}
                    <i class="fa fa-angle-down" />
                    <div />
                  </div>
                </CloseableList>
              </div>

              <div class="col-xs-24 col-md-12 col-lg-8">
                <CloseableList
                  directClose={true}
                  disabled={readOnlyMode}
                  bind:list={form.targetPersons}
                  {menuPath}
                  id={view.getViewName() + 'TargetPersonId'}>
                  <div on:click={onAddTargetPerson}>
                    {T('COMMON.LABEL.TARGET_PERSON')}
                    <i class="fa fa-angle-down" />
                    <div />
                  </div>
                </CloseableList>
              </div>

              <div class="col-xs-24 col-md-12 col-lg-8">
                <CloseableList
                  directClose={true}
                  disabled={readOnlyMode}
                  bind:list={form.targetTeams}
                  {menuPath}
                  id={view.getViewName() + 'TargetTeamId'}>
                  <div on:click={onAddTargetTeam}>
                    {T('COMMON.LABEL.TARGET_TEAM')}
                    <i class="fa fa-angle-down" />
                    <div />
                  </div>
                </CloseableList>
              </div>
            </div>
          </Section>
        </div>
      </div>

    </Section>
    <!-- //Task Info-->
    <div style="height: 20px;" />

    <!-- Assignee Info-->
    <Section title={T('TASK.LABEL.ASSIGNEE')} id={view.getViewName() + 'AssigneeSectionId'} {menuPath}>
      <!-- Start date-->
      <div class="row">
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.START_TIME')}
            name="assigneeStartTime"
            bind:value={form.assigneeStartTime}
            disabled={readOnlyModeAssignee} />
        </div>

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatCheckbox
            text={T('COMMON.LABEL.CONFIRM')}
            disabled={readOnlyModeAssignee}
            bind:checked={form.assigneeStartConfirm} />
        </div>
      </div>
      <!-- // Start date-->

      {#if form.assigneeStartConfirm}
        <div class="row" style="margin-top: 6px;">
          <div
            class="label-link col-24 {readOnlyModeAssignee ? '' : 'label-button-hover'}"
            on:click={onAddAssigneeStatus}>
            {T('COMMON.LABEL.ADD_NEW_DETAIL')}
          </div>
        </div>
        <div class="row">
          <div class=" col-24">
            {#if form.assigneeStatusDetails.length > 0 && form.assigneeStatusDetails[0].startTime}
              <CloseableList
                on:edit={onEditAssigneeStatus}
                on:submit={onSubmitAssigneeStatus}
                on:view={onViewAssigneeStatus}
                directClose={true}
                disabled={readOnlyModeAssignee}
                bind:list={form.assigneeStatusDetails}
                className="closeable-list__floating-controller"
                customRender="modules/task/task/components/status/index.svelte"
                {menuPath}
                id={view.getViewName() + 'AssigneeStatusDetailId'} />
            {/if}
          </div>
        </div>

        <!-- End date-->
        <div class="row">
          <div class="col-xs-24 col-md-12 col-lg-6">
            <FloatDatePicker
              placeholder={T('COMMON.LABEL.END_TIME')}
              bind:value={form.assigneeEndTime}
              disabled={readOnlyModeAssignee} />
          </div>

          <div class="col-xs-24 col-md-12 col-lg-6">
            <FloatCheckbox
              text={T('COMMON.LABEL.CONFIRM')}
              disabled={$isReadOnlyMode$}
              bind:checked={form.assigneeEndConfirm} />
          </div>
        </div>
        <!-- // End date-->
      {/if}
    </Section>
    <!-- // Assignee Info-->

    <div style="height: 20px;" />

    <!-- Assigner Info-->
    <Section title={T('TASK.LABEL.ASSIGNER')} id={view.getViewName() + 'AssignerSectionId'} {menuPath}>
      <div class="row" style="margin-top: 6px;">
        <div
          class="label-link col-24 {readOnlyModeAssigner ? '' : 'label-button-hover'}"
          on:click={onAddAssignerStatus}>
          {T('COMMON.LABEL.ADD_NEW_DETAIL')}
        </div>
      </div>
      <div class="row">
        <div class=" col-24">
          {#if form.assignerStatusDetails.length > 0 && form.assignerStatusDetails[0].startTime}
            <CloseableList
              on:edit={onEditAssignerStatus}
              on:submit={onSubmitAssignerStatus}
              on:view={onViewAssignerStatus}
              directClose={true}
              disabled={readOnlyModeAssigner}
              bind:list={form.assignerStatusDetails}
              className="closeable-list__floating-controller"
              customRender="modules/task/task/components/status/index.svelte"
              {menuPath}
              id={view.getViewName() + 'AssignerStatusDetailId'} />
          {/if}
        </div>
      </div>
    </Section>
    <!-- // Assigner Info-->

    <div style="height: 20px;" />

    <!-- Evaluator Info-->
    <Section title={T('TASK.LABEL.EVALUATOR')} id={view.getViewName() + 'EvaluatorSectionId'} {menuPath}>
      <!-- Date-->
      <div class="row">
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.DATE')}
            name="evaluateTime"
            bind:value={form.evaluateTime}
            disabled={readOnlyModeEvaluator} />
        </div>
      </div>
      <!-- // Date-->

      <!-- Comment-->
      <div class="row">
        <div class="col-24">
          <RichEditor bind:value={form.evaluateComment} disabled={readOnlyModeEvaluator}>
            {T('TASK.LABEL.COMMENT')}:
          </RichEditor>
        </div>
      </div>
      <!-- // Comment-->

      <div class="row">
        <!-- Task Verification-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatSelect
            bind:value={form.evaluateVerificationId}
            on:clickLabel={() => onOpenModal('task/task-verification')}
            id={view.getViewName() + 'TaskVerificationId'}
            placeholder={T('TASK.LABEL.TASK_VERIFICATION') + '(+)'}
            {menuPath}
            disabled={readOnlyModeEvaluator}
            data$={taskVerification$} />
        </div>
        <!-- // Task Verification-->

        <!-- Task Qualification-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatSelect
            bind:value={form.evaluateQualificationId}
            on:clickLabel={() => onOpenModal('task/task-qualification')}
            id={view.getViewName() + 'TaskQualificationId'}
            placeholder={T('TASK.LABEL.TASK_QUALIFICATION') + '(+)'}
            {menuPath}
            disabled={readOnlyModeEvaluator}
            data$={taskQualification$} />
        </div>
        <!-- // Task Qualification-->

        <!-- Status-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatSelect
            bind:value={form.evaluateStatusId}
            on:clickLabel={() => onOpenModal('task/status')}
            id={view.getViewName() + 'EvaluateStatusId'}
            placeholder={T('TASK.LABEL.EVALUATE_STATUS') + '(+)'}
            {menuPath}
            disabled={readOnlyModeEvaluator}
            data$={taskStatus$} />
        </div>

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatCheckbox
            text={T('COMMON.LABEL.COMPLETE')}
            disabled={readOnlyModeEvaluator}
            bind:checked={form.evaluateComplete} />
        </div>
        <!-- // Status-->
      </div>

    </Section>
    <!-- // Evaluator Info-->
  </form>
</section>
<!--//Main content-->
