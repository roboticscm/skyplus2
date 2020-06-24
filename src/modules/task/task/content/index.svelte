<script lang="ts">
  import { tick, onMount, onDestroy } from 'svelte';
  import SC from 'src/components/set-common';
  import { ViewStore } from 'src/store/view';
  import { ButtonType, ButtonId } from 'src/components/ui/button/types';
  import Button from 'src/components/ui/flat-button';
  import FloatingButton from 'src/components/ui/button/floating';
  import Store from '../store';
  import Form from 'src/lib/js/form/form';
  import { StatusDetail, Task } from '../../types';
  import FloatSelect from 'src/components/ui/float-input/select';
  import FloatCheckbox from 'src/components/ui/float-input/checkbox';
  import FloatLabel from 'src/components/ui/float-input/label';
  import RichEditor from 'src/components/ui/input/rich-editor';
  import { T } from 'src/lib/js/locale/locale';
  import Section from 'src/components/ui/section';
  import FloatTextInput from 'src/components/ui/float-input/text-input';
  import FloatDatePicker from 'src/components/ui/float-input/date-picker';
  import Error from 'src/components/ui/error';
  import CloseableList from 'src/components/ui/closeable-list';
  import UploadFiles from 'src/components/ui/upload-files';
  import SelectHumanModal from 'src/components/modal/select-human';
  import SelectOrgModal from 'src/components/modal/select-org';
  import { ButtonPressed } from 'src/components/ui/button/types';
  import { SObject } from 'src/lib/js/sobject';
  import StatusModal from '../components/status-modal/index.svelte';
  import ViewWrapperModal from 'src/components/modal/view-wrapper';
  import { roleControlStore } from 'src/store/role-control';
  import { appStore } from 'src/store/app';
  import { apolloClient } from 'src/lib/js/hasura-client';
  import { Debug } from 'src/lib/js/debug';
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
  import { StringUtil } from 'src/lib/js/string-util';
  import { SDate } from 'src/lib/js/sdate';
  import { getUserFullName } from 'src/lib/js/security';
  import { getUserId } from 'src/lib/js/security';
  import { SubmitStatus } from '../../types';
  import CustomSelect from 'src/components/ui/float-input/custom-select';
  import { MessageType } from 'src/store/notification';
  import { HelperStore } from '../../../../store/helper';
  import { getTargetIdFromUrlParam } from 'src/lib/js/url-util';
  import BackIcon from 'src/icons/back24x16.svelte';

  // Props
  export let view: ViewStore;
  export let menuPath: string;
  export let store: Store;
  export let backCallback: Function = undefined;
  export let detailTitle = '';

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
    needSelectId$,
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
  let isManager = false;
  let descriptionHeight = '100px';
  let uploadFileRef: any;
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
  let isCancelSubmit = false;
  let priorityRef, taskVerificationRef, taskQualificationRef: any;
  let taskSectionRef: any;

  const notAssignAssigner = () => {
    return form.assigners.length === 1 && form.assigners[0].id === null;
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

  // @ts-ignore
  $: {
    detailTitle = form.name + (form.code && form.code !== '---' ? ' (' + form.code + ')' : '');
  }

  let isTaskEditable = true;
  let _isUserCanEditTask = true;
  // @ts-ignore
  $: isTaskEditable = !$isReadOnlyMode$ && form.submitStatus !== SubmitStatus.Completed && _isUserCanEditTask;

  // @ts-ignore
  $: readOnlyMode = $isReadOnlyMode$ || form.submitStatus == 1 || !_isUserCanPressEditButton;

  let isAssigneeEditable = true;
  // @ts-ignore
  $: isAssigneeEditable = !$isReadOnlyMode$ && form.submitStatus === SubmitStatus.Assigned && isAssigneeUser();

  let isAssignerEditable = false;
  // @ts-ignore
  $: isAssignerEditable = !$isReadOnlyMode$ && form.submitStatus !== SubmitStatus.Completed && isAssigneeUser();

  let isEvaluatorEditable = false;
  // @ts-ignore
  $: isEvaluatorEditable = !$isReadOnlyMode$ && isEvaluatorUser() && form.assigneeEndConfirm;

  let disabledSave = false;
  // @ts-ignore
  $: disabledSave = view.isDisabled(ButtonId.Save, form.errors.any());

  let disabledUpdate = true;
  // @ts-ignore
  $: disabledUpdate = view.isDisabled(ButtonId.Update, form.errors.any());

  let disabledEdit = true;
  let _isUserCanPressEditButton = false;
  // @ts-ignore
  $: disabledEdit = view.isDisabled(ButtonId.Edit) || !_isUserCanPressEditButton;

  let disabledSubmit = false;
  let _isUserCanPressSubmitButton = true;
  // @ts-ignore
  $: disabledSubmit = view.isDisabled(ButtonId.Submit, form.errors.any() || !_isUserCanPressSubmitButton);

  let disabledCancelSubmit = true;
  let _isUserCanPressCancelSubmitButton = false;
  // @ts-ignore
  $: disabledCancelSubmit = view.isDisabled(ButtonId.CancelSubmit, !_isUserCanPressCancelSubmitButton);

  let disabledAssign = true;
  let _isUserCanPressAssignButton = false;
  // @ts-ignore
  $: disabledAssign = view.isDisabled(
    ButtonId.Assign,
    form.errors.any() ||
      form.assignees.length === 0 ||
      // @ts-ignore
      (!_isUserCanPressAssignButton && $isUpdateMode$),
  );

  let disabledUnAssign = false;
  let _isUserCanPressUnAssignButton = false;
  // @ts-ignore
  $: disabledUnAssign = view.isDisabled(ButtonId.UnAssign, !_isUserCanPressUnAssignButton);

  let disabledHold = true;
  let _isUserCanPressHoldButton = false;
  // @ts-ignore
  $: disabledHold = view.isDisabled(ButtonId.Hold, form.errors.any() || !_isUserCanPressHoldButton);

  let disabledUnHold = false;
  let _isUserCanPressUnHoldButton = false;
  // @ts-ignore
  $: disabledUnHold = view.isDisabled(ButtonId.UnHold, !_isUserCanPressUnHoldButton);

  let disabledDelete = true;
  let _isUserCanPressDeleteButton = false;
  // @ts-ignore
  $: disabledDelete = view.isDisabled(ButtonId.Delete, !_isUserCanPressDeleteButton);

  let disabledComplete = true;
  let _isUserCanPressCompleteButton = false;
  // @ts-ignore
  $: disabledComplete = view.isDisabled(ButtonId.Complete, form.errors.any() || !_isUserCanPressCompleteButton);

  let disabledUnComplete = true;
  let _isUserCanPressUnCompleteButton = false;
  // @ts-ignore
  $: disabledUnComplete = view.isDisabled(ButtonId.UnComplete, form.errors.any() || !_isUserCanPressUnCompleteButton);

  // @ts-ignore
  $: {
    if (!(window as any).isSmartPhone) {
      if (uploadFileRef) {
        uploadFileRef.style.height = descriptionHeight;
      }
    }
  }

  const isUserCanEditTask = () => {
    if (!selectedData) {
      return true;
    }

    const result =
      (selectedData && selectedData.createdBy == getUserId() && form.submitStatus === SubmitStatus.Init) ||
      isAssignerUser();

    return result;
  };

  const isUserCanPressEditButton = () => {
    const result =
      form.createdBy == getUserId() ||
      form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0 ||
      form.assignees.findIndex((it: any) => it.id == getUserId()) >= 0 ||
      form.evaluators.findIndex((it: any) => it.id == getUserId()) >= 0;

    return result;
  };

  const isUserCanPressCompleteButton = () => {
    const result = form.evaluators.findIndex((it: any) => it.id == getUserId()) >= 0;
    return result;
  };

  const isUserCanPressDeleteButton = () => {
    const result =
      (form.createdBy == getUserId() && form.submitStatus === SubmitStatus.Init) ||
      (form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0 && form.submitStatus === SubmitStatus.Init);

    return result;
  };

  const isUserCanPressSubmitButton = () => {
    const result = form.createdBy == getUserId() || form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0;

    return result;
  };

  const isUserCanPressAssignButton = () => {
    const result =
      form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0 ||
      form.assigners.length === 0 ||
      !form.assigners[0].id;

    return result;
  };

  const canCancelSubmit = () => {
    return (
      !selectedData ||
      selectedData.createdBy == getUserId() ||
      form.assigners.findIndex((it: any) => it.id == getUserId()) >= 0 ||
      form.evaluators.findIndex((it: any) => it.id == getUserId()) >= 0 ||
      !(form.assignees[0].id || form.assigners[0].id || form.evaluators[0].id)
    );
  };

  // ============================== EVENT HANDLE ==========================

  /**
   * Event handle for Edit button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onEdit = (event) => {
    // verify permission
    view.verifyEditAction(event.currentTarget.id, scRef, selectedData.name, disabledEdit).then((_) => {
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
    view.verifyDeleteAction(event.currentTarget.id, scRef, selectedData.name, disabledDelete).then((_) => {
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

  // @ts-ignore
  $: if (form.assignees) {
    _isUserCanPressAssignButton = isUserCanPressAssignButton() && form.assignees.length > 0 && form.assignees[0].id; //&& (form.assigners.length === 0 || isAssignerUser());
  }
  const onAddAssigner = () => {
    addAssignHumanOrOrg(form.assigners).then((res: any) => {
      form.assigners = res;
    });
  };

  // @ts-ignore
  $: if (form.assignees) {
    _isUserCanPressAssignButton =
      isUserCanPressAssignButton() &&
      form.assignees.length > 0 &&
      form.assignees[0].id &&
      (form.assigners.length === 0 || isAssignerUser());
  }
  const onAddAssignee = () => {
    addAssignHumanOrOrg(form.assignees).then((res: any) => {
      form.assignees = res;
    });
  };

  // @ts-ignore
  $: if (form.evaluators) {
    _isUserCanPressCompleteButton = isUserCanPressCompleteButton();
  }
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

          form.assignerStatusDetails = [...form.assignerStatusDetails];
          beforeForm.assignerStatusDetails[index] = form.assignerStatusDetails[index];
        }

        // save notification on submit or cancel submit
        const title = `
          ${form.name} <br>
          ${status.status || ''}
          (${SDate.convertMillisecondToDateTimeString(status.startTime)} - ${SDate.convertMillisecondToDateTimeString(
          status.endTime,
        )})<br>
          ${status.note}
        `;

        if (res.data.submitStatus === 1) {
          saveNotification(MessageType.Submit, title, status.taskId);
        } else if (res.data.submitStatus === 0) {
          saveNotification(MessageType.Submit, title, status.taskId, true);
        }
      }
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
    status.completed = form.assigneeEndConfirm;

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
          beforeForm.assigneeStatusDetails[index] = form.assigneeStatusDetails[index];
        }

        // save notification on submit or cancel submit
        const title = `
          ${form.name} <br>
          ${status.status || ''}
          (${SDate.convertMillisecondToDateTimeString(status.startTime)} - ${SDate.convertMillisecondToDateTimeString(
          status.endTime,
        )})<br>
          ${status.note}
        `;

        if (res.data.submitStatus === 1) {
          saveNotification(MessageType.Submit, title, status.taskId);
        } else if (res.data.submitStatus === 0) {
          saveNotification(MessageType.Submit, title, status.taskId, true);
        }
      }
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
    if (!isAssignerEditable) {
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
    if (!isAssigneeEditable) {
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

        if (form.assigneeStatusDetails.findIndex((it: StatusDetail) => it.statusCode === 'COMPLETE') >= 0) {
          form.assigneeEndConfirm = true;
          form.assigneeEndTime = Date.now();
        } else {
          form.assigneeEndConfirm = false;
          form.assigneeEndTime = null;
        }
      }
    });
  };

  const onAddAssigneeStatus = () => {
    // @ts-ignore
    if (!isAssigneeEditable) {
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

        if (form.assigneeStatusDetails.findIndex((it: StatusDetail) => it.statusCode === 'COMPLETE') >= 0) {
          form.assigneeEndConfirm = true;
          form.assigneeEndTime = Date.now();
        } else {
          form.assigneeEndConfirm = false;
          form.assigneeEndTime = null;
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

  const onChangeDeadline = () => {
    form.errors.clear('deadline');
    if (!form.deadline && !form.startTime) {
      return;
    }
    const period = form.deadline - form.startTime;
    if (period <= 0) {
      return;
    }

    form.firstReminder = form.startTime + period * 0.5;
    form.secondReminder = form.startTime + period * 0.8;
  };

  const onChangeSecondReminder = () => {
    form.errors.clear('secondReminder');
  };

  const onChangeAssigneeEndTime = (event: any) => {
    form.errors.clear('assigneeEndTime');
    form.assigneeEndConfirm = event.detail !== null;
  };

  const onChangeEvaluateTime = () => {
    form.errors.clear('evaluateTime');
  };
  // ============================== // EVENT HANDLE ==========================

  // ============================== HELPER ==========================
  const addAssignHumanOrOrg = (source: any[]) => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (!isTaskEditable) {
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
      if (!isTaskEditable) {
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

    if (['cancelSubmit'].includes(submitType)) {
      form.submitStatus = SubmitStatus.Init;
    } else if (['submit', 'unAssign'].includes(submitType)) {
      form.submitStatus = SubmitStatus.Submitted;
    } else if (['assign', 'unHold', 'unComplete'].includes(submitType)) {
      form.submitStatus = SubmitStatus.Assigned;
    } else if (['hold'].includes(submitType)) {
      form.submitStatus = SubmitStatus.Held;
    } else if (['complete'].includes(submitType)) {
      form.submitStatus = SubmitStatus.Completed;
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
    const ret = [
      ...new Set([
        ...form.assigners.map((it: any) => (it.id ? it.id.toString() : it.id)),
        ...form.assignees.map((it: any) => (it.id ? it.id.toString() : it.id)),
        ...form.evaluators.map((it: any) => (it.id ? it.id.toString() : it.id)),
      ]),
    ].filter((it) => it !== null && it != getUserId());
    return ret;
  };

  const saveNotification = (messageType: string, title: string, targetId: string, isCancel = false) => {
    view.saveFunctionalNotification(getHumanIds(), messageType, title, targetId, isCancel).subscribe();
  };

  // ============================== // HELPER ==========================

  // ============================== CLIENT VALIDATION ==========================
  const verifySaveOrUpdate = () => {
    submitType = 'update';
    return fromPromise(
      /* verify permission*/
      view.verifySaveAction(
        // @ts-ignore
        $isUpdateMode$ ? ButtonId.Update : ButtonId.Save,
        scRef,
        undefined,
        disabledSave || disabledUpdate,
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
      view.verifySubmitAction(ButtonId.Submit, scRef, undefined, disabledSubmit),
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
      view.verifyCancelSubmitAction(ButtonId.CancelSubmit, scRef, undefined, disabledCancelSubmit),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyAssign = () => {
    submitType = 'assign';
    if (form.assigners.length === 0 || !form.assigners[0].id) {
      form.assigners = [{ id: getUserId(), name: getUserFullName() }];
    }

    if (form.evaluators.length === 0 || !form.evaluators[0].id) {
      form.evaluators = [{ id: getUserId(), name: getUserFullName() }];
    }

    return fromPromise(
      /* verify permission*/
      view.verifyAssignAction(ButtonId.Assign, scRef, undefined, disabledAssign),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyUnAssign = () => {
    submitType = 'unAssign';
    return fromPromise(
      /* verify permission*/
      view.verifyUnAssignAction(ButtonId.UnAssign, scRef, undefined, disabledUnAssign),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyHold = () => {
    submitType = 'hold';
    return fromPromise(
      /* verify permission*/
      view.verifyHoldAction(ButtonId.Hold, scRef, undefined, disabledHold),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyUnHold = () => {
    submitType = 'unHold';
    return fromPromise(
      /* verify permission*/
      view.verifyUnHoldAction(ButtonId.UnHold, scRef, undefined, disabledUnHold),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyComplete = () => {
    submitType = 'complete';
    return fromPromise(
      /* verify permission*/
      view.verifyCompleteAction(ButtonId.Complete, scRef, undefined, disabledComplete),
    ).pipe(
      catchError((error) => {
        return of(error);
      }),
    );
  };

  const verifyUnComplete = () => {
    submitType = 'unComplete';
    return fromPromise(
      /* verify permission*/
      view.verifyUnCompleteAction(ButtonId.UnComplete, scRef, undefined, disabledUnComplete),
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
    // @ts-ignore
    if ($isUpdateMode$) {
      console.log('before ', beforeForm);
      console.log('current ', SObject.clone(form));
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
  export const doAddNew = async () => {
    selectedData = undefined;
    isManager = false;
    _isUserCanPressSubmitButton = true;
    _isUserCanEditTask = true;
    taskSectionRef.openSection();
    await tick();
    // reset status flag
    isReadOnlyMode$.next(false);
    isUpdateMode$.next(false);
    view.selectedData$.next(null);

    // reset form
    form = resetForm();

    // moving focus to the first element after DOM updated
    await tick();
    taskNameRef && taskNameRef.focus();
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

            // rollback prev submit status
            form.submitStatus = (beforeForm && beforeForm.submitStatus) || SubmitStatus.Init;

            // rollback prev assigner list
            if (submitType === 'assign') {
              form.assigners = (beforeForm && beforeForm.assigners) || [];
            }
          } else {
            // success

            // save notification on submit or cancel submit
            const title = res.data.name;
            if (
              submitType === 'update' &&
              [SubmitStatus.Submitted, SubmitStatus.Assigned].includes(form.submitStatus)
            ) {
              saveNotification(MessageType.Update, title, res.data.id, false);
            } else if (['submit', 'cancelSubmit'].includes(submitType)) {
              saveNotification(MessageType.Submit, title, res.data.id, submitType === 'cancelSubmit');
            } else if (['assign', 'unAssign'].includes(submitType)) {
              saveNotification(MessageType.Assign, title, res.data.id, submitType === 'unAssign');
            } else if (['hold', 'unHold'].includes(submitType)) {
              saveNotification(MessageType.Hold, title, res.data.id, submitType === 'unHold');
            } else if (['complete', 'unComplete'].includes(submitType)) {
              saveNotification(MessageType.Complete, title, res.data.id, submitType === 'unComplete');
            }

            // @ts-ignore
            if ($isUpdateMode$) {
              // update
              //view.needSelectId$.next(selectedData.id);
              scRef.snackbarRef().showUpdateSuccess();
              // save init value for checking data change
              beforeForm = SObject.clone(form);
            } else {
              // save
              scRef.snackbarRef().showSaveSuccess();
              // doAddNew();
            }

            view.needSelectId$.next(res.data.id);
          }
          submitType = undefined;
          saveRunning$.next(false);
        },
        error: (error) => {
          Debug.errorSection('Task - doSaveOrUpdate', error);
          saveRunning$.next(false);
        },
      });
  };

  const doSelect = (data: any) => {
    console.log('...data...... ', data);
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

      form.taskAttachFiles = form.taskAttachFiles.filter((it) => it !== null);

      // save init value for checking data change
      beforeForm = SObject.clone(form);

      isCancelSubmit = canCancelSubmit();

      HelperStore.isManager(getUserId(), form.createdBy, menuPath).subscribe((res: any) => {
        isManager = StringUtil.toBoolean(res.data);

        _isUserCanEditTask =
          isUserCanEditTask() || (isManager && (form.assigners.length === 0 || !form.assigners[0].id));

        _isUserCanPressEditButton = isUserCanPressEditButton() || isManager;
        _isUserCanPressSubmitButton = isUserCanPressSubmitButton() || isManager;
        _isUserCanPressCancelSubmitButton = isUserCanPressSubmitButton() || isManager;

        _isUserCanPressAssignButton =
          isUserCanPressAssignButton() && form.assignees.length > 0 && form.assignees[0].id !== null; //&& (form.assigners.length === 0 || isAssignerUser());

        _isUserCanPressUnAssignButton = isUserCanPressAssignButton() || isManager;
        _isUserCanPressHoldButton = isUserCanPressAssignButton() || isManager;
        _isUserCanPressUnHoldButton = isUserCanPressAssignButton() || isManager;
        _isUserCanPressDeleteButton =
          isUserCanPressDeleteButton() || (isManager && form.submitStatus === SubmitStatus.Init);

        _isUserCanPressCompleteButton = isUserCanPressCompleteButton();
        _isUserCanPressUnCompleteButton = isUserCanPressCompleteButton();
      });
    }
  };
  // ============================== // FUNCTIONAL ==========================

  const addCallback = (event) => {
    if (modalMenuPath === 'task/project') {
      form.projectId = event.detail;
    } else if (modalMenuPath === 'task/priority') {
      form.priorityId = event.detail;
    } else if (modalMenuPath === 'task/task-verification') {
      form.evaluateVerificationId = event.detail;
    } else if (modalMenuPath === 'task/task-qualification') {
      form.evaluateQualificationId = event.detail;
    } else if (modalMenuPath === 'task/status') {
      form.evaluateStatusId = event.detail;
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

  const useAssignAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyAssign, validateForSubmitOrCancelSubmit);
    },
  };

  const useUnAssignAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyUnAssign, validateForSubmitOrCancelSubmit);
    },
  };

  const useHoldAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyHold, validateForSubmitOrCancelSubmit);
    },
  };

  const useUnHoldAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyUnHold, validateForSubmitOrCancelSubmit);
    },
  };

  const useCompleteAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyComplete, validateForSubmitOrCancelSubmit);
    },
  };

  const useUnCompleteAction = {
    register(component: HTMLElement, param: any) {
      const ob$ = fromEvent(component, 'click');
      doSaveOrUpdate(ob$, verifyUnComplete, validateForSubmitOrCancelSubmit);
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
    if (!(window as any).isSmartPhone) {
      doAddNew();
    }

    // Capture hot key (Ctrl - S) for save or update
    doSaveOrUpdate(view.registerHotKey$(document, isReadOnlyMode$), verifySaveOrUpdate);

    const needSelectIdSub = needSelectId$.subscribe((id: string) => {
      if (id) {
        setTimeout(() => {
          isReadOnlyMode$.next(false);
        }, 1000);
      }
    });

    return () => {
      needSelectIdSub.unsubscribe();
    };
  });

  onDestroy(() => {
    saveOrUpdateSub && saveOrUpdateSub.unsubscribe();
    selectDataSub && selectDataSub.unsubscribe();
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
    if (data) {
      doSelect(data);
    }
  });

  let lastAssigneeSubmittedStatus: string;
  // @ts-ignore
  $: {
    const filtered = form.assigneeStatusDetails.filter((it: StatusDetail) => it.submitStatus === 1);
    if (filtered.length > 0) {
      lastAssigneeSubmittedStatus = filtered[filtered.length - 1].status;
    } else {
      lastAssigneeSubmittedStatus = T('COMMON.LABEL.STATUS') + ' ' + T('TASK.LABEL.NO_STATUS');
    }
  }

  // @ts-ignore
  // $: {
  //   // @ts-ignore
  //   const needSelectId = $needSelectId$;
  //   if (needSelectId) {
  //     setTimeout(() => {
  //       isReadOnlyMode$.next(false);
  //     }, 1000);
  //   }
  // }
  // ============================== //REACTIVE ==========================

  const onChangeAssigneeStartTimeConfirm = (event: any) => {
    if (event.target.checked) {
      form.assigneeStartTime = Date.now();
    } else {
      form.assigneeStartTime = null;
    }
  };

  const onChangeAssigneeStartTime = (event: any) => {
    form.assigneeStartConfirm = event.detail !== null;
  };

  const onChangeAssigneeEndTimeConfirm = (event: any) => {
    if (event.target.checked) {
      form.assigneeEndTime = Date.now();
    } else {
      form.assigneeEndTime = null;
    }
  };

  const onClickBack = () => {
    backCallback && backCallback();
  };
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .section-sub-title {
    display: flex;
    align-content: space-between;
    flex-wrap: wrap;
    .col1 {
      margin-left: 10px;
      flex: 1;
      white-space: nowrap;
    }

    .col2 {
      flex: 1;
      text-align: right;
      white-space: nowrap;
    }

    .col3 {
      flex: 1;
      text-align: right;
      white-space: nowrap;
    }
  }
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

<!--Form navigation controller-->
{#if window.isSmartPhone}
  <section class="view-navigation-controller">
    <div class="view-navigation-controller__arrow" on:click={onClickBack}>
      <BackIcon />
    </div>

    <div title={detailTitle} class="view-navigation-controller__title">{detailTitle}</div>

  </section>
{/if}
<!--//Form navigation controller-->

<!--Form controller-->
<section class="view-content-controller" style="display: flex; justify-content: space-between; flex-wrap: nowrap">
  <div style="width: 70%; display: flex; flex-wrap: nowrap">

    {#if view.isRendered(ButtonId.Save, !$isUpdateMode$)}
      <Button
        action={useSaveOrUpdateAction}
        btnType={ButtonType.Save}
        disabled={disabledSave}
        running={$saveRunning$} />
    {/if}

    {#if view.isRendered(ButtonId.Edit, $isReadOnlyMode$ && $isUpdateMode$)}
      <Button btnType={ButtonType.Edit} on:click={onEdit} disabled={disabledEdit} />
    {/if}

    {#if view.isRendered(ButtonId.Update, !$isReadOnlyMode$ && $isUpdateMode$)}
      <Button
        action={useSaveOrUpdateAction}
        btnType={ButtonType.Update}
        disabled={disabledUpdate}
        running={$saveRunning$} />
    {/if}

    {#if view.isRendered(ButtonId.Submit, form.submitStatus === SubmitStatus.Init)}
      <Button action={useSubmitAction} btnType={ButtonType.Submit} disabled={disabledSubmit} />
    {/if}

    {#if view.isRendered(ButtonId.CancelSubmit, form.submitStatus === SubmitStatus.Submitted)}
      <Button action={useCancelSubmitAction} btnType={ButtonType.CancelSubmit} disabled={disabledCancelSubmit} />
    {/if}

    {#if view.isRendered(ButtonId.Assign, [SubmitStatus.Init, SubmitStatus.Submitted].includes(form.submitStatus))}
      <Button action={useAssignAction} btnType={ButtonType.Assign} disabled={disabledAssign} />
    {/if}

    {#if view.isRendered(ButtonId.UnAssign, [SubmitStatus.Assigned, SubmitStatus.Held].includes(form.submitStatus))}
      <Button action={useUnAssignAction} btnType={ButtonType.UnAssign} disabled={disabledUnAssign} />
    {/if}

    {#if view.isRendered(ButtonId.Hold, form.submitStatus === SubmitStatus.Assigned)}
      <Button action={useHoldAction} btnType={ButtonType.Hold} disabled={disabledHold} />
    {/if}

    {#if view.isRendered(ButtonId.UnHold, form.submitStatus === SubmitStatus.Held)}
      <Button action={useUnHoldAction} btnType={ButtonType.UnHold} disabled={disabledUnHold} />
    {/if}

    {#if view.isRendered(ButtonId.Delete, $isUpdateMode$ && form.submitStatus !== SubmitStatus.Completed)}
      <Button btnType={ButtonType.Delete} on:click={onDelete} disabled={disabledDelete} running={$deleteRunning$} />
    {/if}

    {#if view.isRendered(ButtonId.Complete, form.submitStatus === SubmitStatus.Assigned)}
      <Button action={useCompleteAction} btnType={ButtonType.Complete} disabled={disabledComplete} />
    {/if}

    {#if view.isRendered(ButtonId.UnComplete, form.submitStatus === SubmitStatus.Completed)}
      <Button action={useUnCompleteAction} btnType={ButtonType.UnComplete} disabled={disabledUnComplete} />
    {/if}

  </div>

  <div style="width: 30%; white-space: nowrap; text-align: right">
    {#if view.isRendered(ButtonId.TrashRestore, $hasAnyDeletedRecord$)}
      <Button
        btnType={ButtonType.TrashRestore}
        on:click={onTrashRestore}
        disabled={view.isDisabled(ButtonId.TrashRestore)} />
    {/if}

    {#if view.isRendered(ButtonId.Config)}
      <Button btnType={ButtonType.Config} on:click={onConfig} disabled={view.isDisabled(ButtonId.Config)} />
    {/if}
  </div>
</section>
<!--//Form controller-->

<!--Main content-->
<section class="view-content-main">
  <form
    class="form"
    on:click={(event) => form.errors.clear(event.target.name)}
    on:keydown={(event) => form.errors.clear(event.target.name)}>
    <!-- Task Info-->
    <Section
      bind:this={taskSectionRef}
      title={T('TASK.LABEL.TASK')}
      {menuPath}
      id={view.getViewName() + 'TaskSectionId'}>
      <div slot="subTitle" class="section-sub-title">
        <div class="col1 bold-text large-font-sizer text-active-underline">
          {@html form.name + (form.submitStatus === SubmitStatus.Completed ? ' (' + T('COMMON.LABEL.COMPLETE') + ')' : '')}
        </div>

        <div class="col2">
          {@html lastAssigneeSubmittedStatus}
        </div>

        <div class="col3 text-active-underline">
          {@html SDate.convertMillisecondToDateTimeString(form.deadline)}
        </div>
      </div>
      <div class="row">

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatTextInput placeholder={T('TASK.LABEL.TASK_CODE')} disabled={true} bind:value={form.code} />
        </div>

        <!-- Project-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <CustomSelect
            bind:value={form.projectId}
            placeholder={T('TASK.LABEL.PROJECT') + '(+)'}
            id={view.getViewName() + 'ProjectId'}
            on:clickLabel={() => onOpenModal('task/project')}
            {menuPath}
            disabled={!isTaskEditable}
            data={$projects$} />

          <!--          <FloatSelect-->
          <!--            className="large-font-size"-->
          <!--            saveState={true}-->
          <!--            autoLoad={true}-->
          <!--            bind:value={form.projectId}-->
          <!--            on:clickLabel={() => onOpenModal('task/project')}-->
          <!--            id={view.getViewName() + 'ProjectId'}-->
          <!--            placeholder={T('TASK.LABEL.PROJECT') + '(+)'}-->
          <!--            {menuPath}-->
          <!--            disabled={readOnlyMode}-->
          <!--            data$={projects$} />-->
        </div>
        <!-- // Project -->

        <!-- Name -->
        <div class="col-md-24 col-lg-12">
          <FloatTextInput
            className="large-font-size text-active-underline"
            bind:checked={form.isPrivate}
            rightCheck={true}
            checkTitle={T('COMMON.LABEL.PRIVATE_TASK')}
            bind:this={taskNameRef}
            placeholder={T('COMMON.LABEL.NAME')}
            name="name"
            disabled={!isTaskEditable}
            bind:value={form.name} />
          <Error {form} field="name" />
        </div>
        <!-- // Name -->
      </div>

      <div class="row" style="margin-top: 6px;">
        <!-- Task Description -->
        <div class="col-xs-24 col-md-12">
          <RichEditor bind:height={descriptionHeight} bind:value={form.description} disabled={!isTaskEditable}>
            {T('TASK.LABEL.TASK_DESCRIPTION')}:
          </RichEditor>
        </div>
        <!-- // Task Description -->
        <!-- Attach file -->
        <div bind:this={uploadFileRef} class="col-xs-24 col-md-12" style="margin-top: 25px; height: 100px;">
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
            bind:this={priorityRef}
            saveState={true}
            autoLoad={true}
            bind:value={form.priorityId}
            on:clickLabel={() => onOpenModal('task/priority')}
            id={view.getViewName() + 'PriorityId'}
            placeholder={T('TASK.LABEL.PRIORITY') + '(+)'}
            {menuPath}
            disabled={!isTaskEditable}
            data$={priority$} />
        </div>
        <!-- // Last status -->
        <!-- Last status -->
        <div class="col-xs-24 col-md-12">
          <FloatTextInput placeholder={T('COMMON.LABEL.STATUS')} disabled={true} value={lastAssigneeSubmittedStatus} />
        </div>
        <!-- // Last status -->
      </div>

      <div class="row">
        <!-- Start time -->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            bind:value={form.startTime}
            placeholder={T('COMMON.LABEL.START_TIME')}
            disabled={!isTaskEditable} />

        </div>
        <!-- // tart time -->

        <!-- Deadline -->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            className="text-active-underline"
            on:change={onChangeDeadline}
            placeholder={T('COMMON.LABEL.DEADLINE')}
            bind:value={form.deadline}
            name="deadline"
            disabled={!isTaskEditable} />
          <Error {form} field="deadline" />
        </div>
        <!-- // Deadline -->

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            placeholder={T('COMMON.LABEL.FIRST_REMINDER')}
            bind:value={form.firstReminder}
            disabled={!isTaskEditable} />
        </div>

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            on:change={onChangeSecondReminder}
            placeholder={T('COMMON.LABEL.SECOND_REMINDER')}
            bind:value={form.secondReminder}
            name="secondReminder"
            disabled={!isTaskEditable} />
          <Error {form} field="secondReminder" />
        </div>
      </div>

      <div class="row" style="margin-top: 15px;">
        <!-- Assigner -->
        <div class="col-xs-24 col-md-12">
          <CloseableList
            linkClass="task-assigner"
            directClose={true}
            disabled={!isTaskEditable}
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
            <div style="margin-top: 11px; padding: 6px;">
              {form.creatorFullName ? form.creatorFullName : getUserFullName()}
            </div>
          </div>
        </div>
      </div>

      <div class="row" style="margin-top: 15px;">
        <!-- Assignee -->
        <div class="col-xs-24 col-md-12">
          <CloseableList
            linkClass="task-assignee"
            directClose={true}
            disabled={!isTaskEditable}
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
            linkClass="task-evaluator"
            directClose={true}
            disabled={!isTaskEditable}
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
                  disabled={!isTaskEditable}
                  bind:list={form.chars}
                  {menuPath}
                  id={view.getViewName() + 'TaskCharacteristicId'}>

                  <div on:click={onAddCharacteristic}>
                    {T('TASK.LABEL.TASK_CHARACTERISTIC')}
                    <i class="fa fa-angle-down" />
                    <div />
                  </div>
                </CloseableList>
              </div>

              <div class="col-xs-24 col-md-12 col-lg-8">
                <CloseableList
                  directClose={true}
                  disabled={!isTaskEditable}
                  bind:list={form.targetPersons}
                  {menuPath}
                  id={view.getViewName() + 'TargetPersonId'}>
                  <div on:click={onAddTargetPerson}>
                    {T('TASK.LABEL.TARGET_PERSON')}
                    <i class="fa fa-angle-down" />
                    <div />
                  </div>
                </CloseableList>
              </div>

              <div class="col-xs-24 col-md-12 col-lg-8">
                <CloseableList
                  directClose={true}
                  disabled={!isTaskEditable}
                  bind:list={form.targetTeams}
                  {menuPath}
                  id={view.getViewName() + 'TargetTeamId'}>
                  <div on:click={onAddTargetTeam}>
                    {T('TASK.LABEL.TARGET_TEAM')}
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
    <Section
      titleClass="task-assignee"
      title={T('COMMON.LABEL.ASSIGNEE')}
      id={view.getViewName() + 'AssigneeSectionId'}
      {menuPath}>

      <div slot="subTitle" class="section-sub-title w-100">
        <div class="col1">{form.assignees.map((it) => it.name).join(', ')}</div>

        <div class="col2">
          {form.submitStatus === SubmitStatus.Held ? ' (' + T('TASK.MSG.HOLD') + ')' : form.submitStatus !== SubmitStatus.Assigned ? ' (' + T('TASK.MSG.TASK_NOT_ASSIGN_YET') + ')' : ''}
        </div>

        <div class="col3">
          {SDate.convertMillisecondToDateTimeString(form.assigneeStartTime)} - {SDate.convertMillisecondToDateTimeString(form.assigneeEndTime)}
        </div>
      </div>

      <!-- Start date-->
      <div class="row">
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            on:change={onChangeAssigneeStartTime}
            placeholder={T('COMMON.LABEL.START_TIME')}
            name="assigneeStartTime"
            bind:value={form.assigneeStartTime}
            disabled={!isAssigneeEditable || (form.assigneeStatusDetails.length > 0 && form.assigneeStatusDetails[0].id)} />
        </div>

        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatCheckbox
            text={T('COMMON.LABEL.CONFIRM')}
            disabled={!isAssigneeEditable || (form.assigneeStatusDetails.length > 0 && form.assigneeStatusDetails[0].id)}
            on:change={onChangeAssigneeStartTimeConfirm}
            bind:checked={form.assigneeStartConfirm} />
        </div>
      </div>
      <!-- // Start date-->

      {#if form.assigneeStartConfirm}
        <div class="row" style="margin-top: 6px;">
          <div
            class="label-link col-24 {!isAssigneeEditable ? '' : 'label-button-hover'}"
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
                disabled={!isAssigneeEditable}
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
              on:change={onChangeAssigneeEndTime}
              placeholder={T('COMMON.LABEL.END_TIME')}
              bind:value={form.assigneeEndTime}
              name="assigneeEndTime"
              disabled={!isAssigneeEditable} />
            <Error {form} field="assigneeEndTime" />
          </div>

          <div class="col-xs-24 col-md-12 col-lg-6">
            <FloatCheckbox
              text={T('COMMON.LABEL.CONFIRM')}
              disabled={!isAssigneeEditable}
              on:change={onChangeAssigneeEndTimeConfirm}
              bind:checked={form.assigneeEndConfirm} />
          </div>
        </div>
        <!-- // End date-->
      {/if}
    </Section>
    <!-- // Assignee Info-->

    <div style="height: 20px;" />

    <!-- Assigner Info-->
    <Section
      titleClass="task-assigner"
      title={T('COMMON.LABEL.ASSIGNER')}
      id={view.getViewName() + 'AssignerSectionId'}
      {menuPath}>
      <div slot="subTitle" class="section-sub-title w-100">
        <div class="col1">{form.assigners.map((it) => it.name).join(', ')}</div>

        <div class="col2">{form.priorityName || ''}</div>

        <div class="col3">&nbsp;</div>
      </div>
      <div class="row" style="margin-top: 6px;">
        <div class="label-link col-24 {!isAssignerEditable ? '' : 'label-button-hover'}" on:click={onAddAssignerStatus}>
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
              disabled={!isAssignerEditable}
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
    <Section
      titleClass="task-evaluator"
      title={T('COMMON.LABEL.EVALUATOR')}
      id={view.getViewName() + 'EvaluatorSectionId'}
      {menuPath}>
      <div slot="subTitle" class="section-sub-title w-100">
        <div class="col1">{form.evaluators.map((it) => it.name).join(', ')}</div>
        <div class="col2">{form.evaluateQualificationName || ''}</div>
        <div class="col3">{form.evaluateVerificationName || ''}</div>
      </div>
      <div class="row">
        <!-- Date-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatDatePicker
            on:change={onChangeEvaluateTime}
            placeholder={T('COMMON.LABEL.DATE')}
            name="evaluateTime"
            bind:value={form.evaluateTime}
            disabled={!isEvaluatorEditable} />
          <Error {form} field="evaluateTime" />
        </div>
        <!-- // Date-->
        <!-- Task Verification-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatSelect
            bind:this={taskVerificationRef}
            bind:value={form.evaluateVerificationId}
            on:clickLabel={() => onOpenModal('task/task-verification')}
            id={view.getViewName() + 'TaskVerificationId'}
            placeholder={T('TASK.LABEL.TASK_VERIFICATION') + '(+)'}
            {menuPath}
            disabled={!isEvaluatorEditable}
            data$={taskVerification$} />
        </div>
        <!-- // Task Verification-->

        <!-- Task Qualification-->
        <div class="col-xs-24 col-md-12 col-lg-6">
          <FloatSelect
            bind:this={taskQualificationRef}
            bind:value={form.evaluateQualificationId}
            on:clickLabel={() => onOpenModal('task/task-qualification')}
            id={view.getViewName() + 'TaskQualificationId'}
            placeholder={T('TASK.LABEL.TASK_QUALIFICATION') + '(+)'}
            {menuPath}
            disabled={!isEvaluatorEditable}
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
            disabled={!isEvaluatorEditable}
            data$={taskStatus$} />
        </div>
        <!-- // Status-->
      </div>
      <!-- // Date-->

      <!-- Comment-->
      <div class="row">
        <div class="col-24">
          <RichEditor bind:value={form.evaluateComment} disabled={!isEvaluatorEditable}>
            {T('TASK.LABEL.COMMENT')}:
          </RichEditor>
        </div>
      </div>
      <!-- // Comment-->
    </Section>
    <!-- // Evaluator Info-->
  </form>
</section>
<!--//Main content-->
