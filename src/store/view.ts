import { menuStore } from 'src/store/menu';
import { T } from 'src/lib/js/locale/locale';
import { StringUtil } from 'src/lib/js/string-util';
import { BehaviorSubject, forkJoin, fromEvent, Observable, of, Subscription } from 'rxjs';
import { TableUtilStore } from 'src/store/table-util';
import { catchError, concatMap, filter, first, skip, switchMap, take } from 'rxjs/operators';
import { App } from 'src/lib/js/constants';
import { AxiosResponse } from 'axios';
import { PayloadRes, RoleControl } from 'src/model/base';
import gql from 'graphql-tag';
import { Debug } from 'src/lib/js/debug';
import { ButtonId, ButtonPressed } from 'src/components/ui/button/types';
import { menuControlStore } from 'src/store/menu-control';
import { getDiffFieldsObject, SObject } from 'src/lib/js/sobject';
import { SDate } from 'src/lib/js/sdate';
import { Language } from 'src/modules/sys/language/model';
import { fromPromise } from 'rxjs/internal-compatibility';
import Form from 'src/lib/js/form/form';
import { Menu } from 'src/modules/sys/menu/model';
import HumanOrOrgStore from 'src/modules/sys/user/store';
import { roleControlStore } from 'src/store/role-control';
import { appStore } from 'src/store/app';
import { notificationStore, NotifyType } from 'src/store/notification';
import { getUserId } from 'src/lib/js/security';
import { getMenuNameFromPath, getViewTitleFromMenuPath } from 'src/lib/js/url-util';

export class ViewStore {
  tableName: string;
  columns: string[] = ['name'];
  orderBy: string[] = ['updated_or_created_date desc nulls last'];
  trashRestoreColumns: string[] = ['name'];
  page = 1;
  pageSize = App.DEFAULT_PAGE_SIZE;
  onlyMe = false;
  includeDisabled = true;
  fullCount$ = new BehaviorSubject<number>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  saveRunning$ = new BehaviorSubject<boolean>(false);
  deleteRunning$ = new BehaviorSubject<boolean>(false);

  isReadOnlyMode$ = new BehaviorSubject<boolean>(false); // true: form can edit, false form disable
  isUpdateMode$ = new BehaviorSubject<boolean>(false); // true: update mode, false: save mode
  dataList$ = new BehaviorSubject<any[]>([]);
  hasAnyDeletedRecord$ = new BehaviorSubject<boolean>(false);
  roleControls: RoleControl[];
  fullControl: boolean;
  searchFields: any[];

  needSelectId$ = new BehaviorSubject<string>(null);
  needHighlightId$ = new BehaviorSubject<string>(null);

  selectedData$ = new BehaviorSubject<any>(null);

  menuInfo$ = new BehaviorSubject<Menu>(null);

  allColumns$ = new BehaviorSubject<any[]>([]);
  allColumns: any[] = [];

  ModalContentView$ = new BehaviorSubject<any>(undefined);
  modalFullControl$ = new BehaviorSubject<boolean>(undefined);
  modalRoleControls$ = new BehaviorSubject<any[]>([]);

  completeLoading$ = forkJoin([
    this.dataList$.pipe(
      skip(1),
      catchError((error) => of([])),
      first(),
    ),
  ]);

  constructor(public menuPath: string) {
    menuStore
      .sysGetMenuByPath(menuPath)
      .pipe(take(1))
      .subscribe((res) => {
        this.menuInfo$.next(res.data);
      });
  }

  loadTableMetaData = () => {
    TableUtilStore.getAllColumnsOfTable(this.tableName).subscribe((res) => {
      this.allColumns = res.data;
      this.allColumns$.next(res.data);
    });
  };

  static loadTableMetaData$ = (tableName: string) => {
    return TableUtilStore.getAllColumnsOfTable(tableName);
  };

  getMenuNameFromPath = () => {
    return getMenuNameFromPath(this.menuPath);
  };

  getViewTitle = () => {
    return getViewTitleFromMenuPath(this.menuPath);
  };

  getViewName = () => {
    return StringUtil.replaceAll(
      StringUtil.toTitleCase(StringUtil.replaceAll(this.getMenuNameFromPath(), '-', '')),
      ' ',
      '',
    );
  };

  getSimpleList = (textSearch = '') => {
    TableUtilStore.getSimpleList({
      tableName: this.tableName,
      columns: this.columns.join(','),
      orderBy: this.orderBy.join(','),
      textSearch: textSearch,
      page: this.page,
      pageSize: this.pageSize,
      onlyMe: this.onlyMe,
      includeDisabled: this.includeDisabled,
    })
      .pipe(take(1))
      .subscribe((res: AxiosResponse) => {
        const data: PayloadRes = res.data;
        if (res.data.payload.length === 0 && this.page > 1) {
          this.page--;
          this.getSimpleList(textSearch);
        } else {
          this.dataList$.next(data.payload);
          this.fullCount$.next(data.fullCount);
        }
        this.dataList$.next(data.payload);
        this.fullCount$.next(data.fullCount);
      });
  };

  createWorkListColumns = () => {
    return this.columns.map((it) => {
      return {
        type: ['id', 'sort', 'code'].indexOf(it) >= 0 ? 'hidden' : 'text',
        name: it,
        title: T(`COMMON.LABEL.${it.toUpperCase()}`),
      };
    });
  };

  createWorkListColumnsForHandsonTable = () => {
    return this.columns.map((it) => {
      return {
        hidden: it !== 'id' && it !== 'sort' ? false : true,
        name: it,
        title: T(`COMMON.LABEL.${it}`),
      };
    });
  };

  // createQuerySubscription = (withVar: boolean = false) => {
  //   const query = `
  //     subscription ${this.tableName}Subscription ${withVar ? '($id: bigint!, $updatedBy: bigint!)' : ''} {
  //       ${this.tableName} ${
  //     withVar ? '(where: {_and: [ {id: { _eq: $id }}, {updated_by: { _neq: $updatedBy }}]})' : ''
  //   } {
  //         ${this.allColumns.map((it) => it.columnName).join('\n')}
  //       }
  //     }
  //   `;
  //
  //   return gql(query);
  // };

  createQuerySubscription = (withVar: boolean = false) => {
    return ViewStore.createCustomQuerySubscription(this.tableName, this.allColumns, withVar);
  };

  static createCustomQuerySubscription = (table: string, columns: any[], withVar: boolean = false) => {
    const query = `
      subscription ${table}Subscription ${withVar ? '($id: bigint!, $updatedBy: bigint!)' : ''} {
        ${table} ${withVar ? '(where: {_and: [ {id: { _eq: $id }}, {updated_by: { _neq: $updatedBy }}]})' : ''} {
          ${columns.map((it) => it.columnName).join('\n')}
        }
      }
    `;

    return gql(query);
  };

  static createReloadSubscription = (table: string) => {
    const query = `
      subscription ${table}Subscription {
        ${table}(limit: 1, order_by: {access_date: desc_nulls_last}) {
          id
          access_date
        }
      }
    `;

    return gql(query);
  };

  // Begin control state
  isDisabled = (controlCode: string, hasError: boolean = false) => {
    if (hasError) {
      return true;
    }
    if (this.fullControl) {
      return false;
    } else {
      if (!this.roleControls) return true;
      return (
        this.roleControls.filter((item: any) => item.controlCode === controlCode && item.disableControl === false)
          .length === 0
      );
    }
  };

  isRendered = (controlCode: string, isRendered: boolean = true) => {
    if (!isRendered) {
      return false;
    }

    if (this.fullControl) {
      return true;
    } else {
      if (!this.roleControls) return false;

      return (
        this.roleControls.filter((item: any) => item.controlCode === controlCode && item.renderControl === true)
          .length > 0
      );
    }
  };

  hasPermission = (event: any) => {
    let eleId = null;
    if (typeof event === 'object') {
      if (StringUtil.isEmpty(event.currentTarget.id)) {
        Debug.errorSection('hasPermission', `ID of ${event.currentTarget} was not set`);
        return false;
      }
      eleId = event.currentTarget.id;
    } else {
      eleId = event;
    }
    return !this.isDisabled(eleId);
  };

  checkControlProperty = (event: any, property: string) => {
    let eleId = null;
    if (typeof event === 'object') {
      if (StringUtil.isEmpty(event.currentTarget.id)) {
        Debug.errorSection(property, `ID of ${event.currentTarget} was not set`);
        return false;
      }
      eleId = event.currentTarget.id;
    } else {
      eleId = event;
    }

    if (!this.fullControl) {
      if (this.roleControls.filter((item: any) => item.controlCode === eleId && item[property] === false).length > 0) {
        return false;
      }
    } else {
      return false;
    }

    return true;
  };

  requirePassword = (event: any) => {
    return this.checkControlProperty(event, 'requirePassword');
  };

  confirm = (event: any) => {
    return this.checkControlProperty(event, 'confirm');
  };

  verifyAction = (id: string, confirmCallback: Function, passwordConfirmModal: any, disabled = false) => {
    if (disabled) {
      return new Promise((resolve, reject) => {
        reject('fail');
      });
    }

    return new Promise((resolve, reject) => {
      if (StringUtil.isEmpty(id)) {
        Debug.errorSection('Verify Action', 'ID not defined');
        reject('fail');
      }
      // check permission
      if (!this.hasPermission(id)) {
        reject('fail');
      }

      // confirm
      if (confirmCallback && this.confirm(id)) {
        confirmCallback().then((confirmButtonPressed: ButtonPressed) => {
          if (confirmButtonPressed === ButtonPressed.OK) {
            if (this.requirePassword(id)) {
              passwordConfirmModal &&
                passwordConfirmModal.show().then((buttonPressed: ButtonPressed) => {
                  if (buttonPressed === ButtonPressed.OK) {
                    resolve('ok');
                  } else {
                    reject('fail');
                  }
                });
            } else {
              resolve('ok');
            }
          } else {
            reject('fail');
          }
        });
      } else {
        // no confirm
        if (this.requirePassword(id)) {
          passwordConfirmModal &&
            passwordConfirmModal.show().then((buttonPressed: ButtonPressed) => {
              if (buttonPressed === ButtonPressed.OK) {
                resolve('ok');
              } else {
                reject('fail');
              }
            });
        } else {
          resolve('ok');
        }
      }
    });
  };

  verifySimpleAction = (
    buttonId: string,
    confirmModalRef: any,
    confirmPasswordModalRef: any,
    msg: string,
    extraMessage: string = '',
    disabled = false,
  ) => {
    return this.verifyAction(
      buttonId,
      () => confirmModalRef.show(`${T(`COMMON.MSG.${msg}`)} <b>${extraMessage}</b>. ${T('COMMON.MSG.ARE_YOU_SURE')}?`),
      confirmPasswordModalRef,
      disabled,
    );
  };

  verifyAddNewAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'ADD_NEW',
      extraMessage,
      disabled,
    );
  };

  verifySaveAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'SAVE',
      extraMessage,
      disabled,
    );
  };

  verifyEditAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'EDIT',
      extraMessage,
      disabled,
    );
  };

  verifyUpdateAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'UPDATE',
      extraMessage,
      disabled,
    );
  };

  verifyDeleteAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'DELETE',
      extraMessage,
      disabled,
    );
  };

  verifySubmitAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'SUBMIT',
      extraMessage,
      disabled,
    );
  };

  verifyCancelSubmitAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'CANCEL_SUBMIT',
      extraMessage,
      disabled,
    );
  };

  verifyAssignAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'ASSIGN',
      extraMessage,
      disabled,
    );
  };

  verifyUnAssignAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'UN_ASSIGN',
      extraMessage,
      disabled,
    );
  };

  verifyHoldAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'HOLD',
      extraMessage,
      disabled,
    );
  };

  verifyUnHoldAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'UN_HOLD',
      extraMessage,
      disabled,
    );
  };

  verifyCompleteAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'COMPLETE',
      extraMessage,
      disabled,
    );
  };

  verifyUnCompleteAction = (buttonId: string, scRef: any, extraMessage: string = '', disabled = false) => {
    return this.verifySimpleAction(
      buttonId,
      scRef.confirmModalRef(),
      scRef.confirmPasswordModalRef(),
      'UN_COMPLETE',
      extraMessage,
      disabled,
    );
  };

  checkObjectArrayChange = (beforeData: any, currentData: any, snackbar: any = undefined) => {
    let changedObject = SObject.getDiffRowObjectArray(beforeData, currentData);

    if (SObject.isEmptyField(changedObject)) {
      if (snackbar) {
        snackbar.showNoDataChange();
      }

      return null;
    }
    return changedObject;
  };

  checkObjectChange = (beforeData: any, currentData: any, snackbar: any = undefined) => {
    let changedObject = getDiffFieldsObject(beforeData, currentData);

    if (SObject.isEmptyField(changedObject)) {
      if (snackbar) {
        snackbar.showNoDataChange();
      }
      return null;
    }
    return changedObject;
  };

  checkObjectArrayChange2 = (beforeData: any[], currentData: any[], keyFields: any[], snackbar: any = undefined) => {
    let changedObject = SObject.getDiffRowObjectArray2(beforeData, currentData, keyFields);

    if (SObject.isEmptyField(changedObject)) {
      snackbar && snackbar.showNoDataChange();
      return null;
    }

    return changedObject;
  };

  showViewConfigModal = (buttonId: string, scRef: any) => {
    const confirmCallback = () => {
      return scRef.confirmModalRef().show(`${T('COMMON.MSG.SHOW_VIEW_CONFIG')}. ${T('COMMON.MSG.ARE_YOU_SURE')}?`);
    };

    this.verifyAction(buttonId, confirmCallback, scRef.confirmPasswordModalRef()).then((_) => {
      menuControlStore.sysGetControlListByMenuPath(this.menuPath).then((data: any) => {
        scRef
          .configModalRef()
          .show(data)
          .then((buttonPressed: ButtonPressed) => {
            if (buttonPressed === ButtonPressed.OK) {
              const newData = scRef.configModalRef().getData();
              let dataChanged = this.checkObjectArrayChange(data, newData, scRef.snackbarRef());
              if (dataChanged) {
                dataChanged = dataChanged.filter(
                  (item: any) => item.code !== 'btnConfig' || (item.code === 'btnConfig' && item.checked),
                );

                if (dataChanged.length > 0) {
                  menuControlStore
                    .saveOrUpdateOrDelete({
                      menuPath: this.menuPath,
                      menuControls: dataChanged,
                    })
                    .then((_: any) => {
                      // location.reload();
                    });
                }
              }
            }
          });
      });
    });
  };

  showTrashRestoreModal = (buttonId: string, onlyMe: boolean, scRef: any) => {
    this.verifyAction(
      buttonId,
      () => {
        scRef.confirmModalRef().show(`${T('COMMON.MSG.SHOW_TRUSH_RESTORE')}. ${T('COMMON.MSG.ARE_YOU_SURE')}?`);
      },
      scRef.confirmPasswordModalRef(),
    ).then(() => {
      this.doShowTrashRestoreModal(onlyMe, scRef.trashRestoreModalRef(), scRef.snackbarRef());
    });
  };

  doShowTrashRestoreModal = (onlyMe: boolean, trashRestoreModalRef: any, snackbarRef: any) => {
    TableUtilStore.getAllDeletedRecords(this.tableName, this.trashRestoreColumns, onlyMe).then((res: any) => {
      const newData = res
        ? res.map((item: any, index: any) => {
            item.restore = false;
            item.foreverDelete = false;
            item.deletedDate = SDate.convertMillisecondToDateTimeString(item.deletedDate);
            return item;
          })
        : [];

      trashRestoreModalRef.show(newData).then((buttonPressed: ButtonPressed) => {
        if (buttonPressed === ButtonPressed.OK) {
          const newData = trashRestoreModalRef.getData();
          if (newData && newData.length > 0) {
            const filter = newData
              .filter((item: any) => item.restore === true || item.foreverDelete === true)
              .map((item: any) => {
                delete item.deletedBy;
                delete item.deletedDate;
                return item;
              });
            if (filter && filter.length > 0) {
              const deletedIds = filter
                .filter((item: any) => item.foreverDelete === true)
                .map((it: any) => it.id)
                .join(',');

              const restoreIds = filter
                .filter((item: any) => item.restore === true)
                .map((it: any) => it.id)
                .join(',');

              TableUtilStore.restoreOrForeverDelete(this.tableName, deletedIds, restoreIds).then(() => {
                if (deletedIds && deletedIds.split(',').length === newData.length) {
                  snackbarRef.showTrashEmpty();
                } else {
                  if (restoreIds) {
                    snackbarRef.showTrashRestoreSuccess();
                  }
                }
              });
            } else {
              snackbarRef.showNoDataChange();
            }
          }
        }
      });
    });
  };

  checkDeletedRecord = (onlyMe: boolean) => {
    TableUtilStore.hasAnyDeletedRecord(this.tableName, onlyMe).then((data: any) => {
      if (data.length > 0) {
        this.hasAnyDeletedRecord$.next(data[0].exists);
      }
    });
  };

  getOneById = (id: string) => {
    return TableUtilStore.getOneById(this.tableName, id);
  };

  doDelete = (id: string, snackbarRef: any, doAddNew: Function) => {
    this.deleteRunning$.next(true);
    TableUtilStore.softDeleteMany(this.tableName, [id])
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          snackbarRef.showDeleteSuccess(res.data + ' ' + T('COMMON.LABEL.RECORD'));
        },
        error: (err: Error) => {
          snackbarRef.show(err.message);
        },
        complete: () => {
          doAddNew();
          this.deleteRunning$.next(false);
        },
      });
  };

  restructureChangedData = (changedData: any) => {
    const result = [];
    for (let field in changedData) {
      result.push({
        field: T('COMMON.LABEL.' + StringUtil.toUpperCaseWithUnderscore(field)),
        oldValue: field.toLowerCase().includes('date')
          ? SDate.convertMillisecondToDateTimeString(changedData[field].oldValue)
          : changedData[field].oldValue,
        newValue: field.toLowerCase().includes('date')
          ? SDate.convertMillisecondToDateTimeString(changedData[field].newValue)
          : changedData[field].newValue,
      });
    }

    return result;
  };

  getEditedUserDetail = async (userId: string) => {
    const user = await HumanOrOrgStore.sysGetUserInfoById(userId);
    return `${user[0].lastName} ${user[0].firstName} - <b>${user[0].username} </b>`;
  };

  doNotifyConflictData = async (form, data: any, selectedId: string, isReadOnlyMode, scRef: any) => {
    if (data[this.tableName].length === 0) {
      return;
    }

    const hasuraObj = SObject.convertFieldsToCamelCase(data[this.tableName][0]);
    delete hasuraObj._Typename;
    delete hasuraObj.id;
    delete hasuraObj.password;
    const obj = SObject.clone(form);
    const formObj = {};
    for (const field in hasuraObj) {
      formObj[field] = obj[field];
    }

    const changed = this.checkObjectChange(formObj, hasuraObj);
    if (changed) {
      // @ts-ignore
      if (!isReadOnlyMode) {
        const editedUser = await this.getEditedUserDetail(hasuraObj.updatedBy);
        scRef
          .confirmConflictDataModalRef()
          .show(this.restructureChangedData(changed), editedUser, hasuraObj.updatedDate)
          .then((buttonPressed: number) => {
            if (buttonPressed === ButtonPressed.OK) {
              this.needSelectId$.next(selectedId);
              setTimeout(() => {
                this.isReadOnlyMode$.next(false);
              }, 2000);
            } else {
              this.needHighlightId$.next(selectedId);
            }
          });
      } else {
        this.needSelectId$.next(selectedId);
      }
    }
  };

  loadModalComponent = (menuPath: string) => {
    return new Promise((resolve, reject) => {
      roleControlStore
        .sysGetControlListByDepIdAndUserIdAndMenuPath(appStore.org.departmentId, menuPath)
        .pipe(take(1))
        .subscribe((res) => {
          if (res.data.fullControl) {
            this.modalFullControl$.next(true);
          } else {
            this.modalRoleControls$.next(res.data);
          }
          import('src/modules/' + menuPath + '/index.svelte')
            .then((res) => {
              this.ModalContentView$.next(res.default);
              resolve('ok');
            })
            .catch((error) => reject(error));
        });
    });
  };

  registerHotKey$ = (container: any, isReadOnlyMode$: Observable<boolean>) => {
    const controlS$ = fromEvent(container, 'keydown').pipe(
      filter((e: any) => {
        if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
          e.preventDefault();
          // @ts-ignore
          if (!isReadOnlyMode$.value) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }),
    );

    return controlS$;
  };

  saveNotification(
    type: string,
    toHumanListIds: string[],
    messageType: string,
    title: string,
    targetId: string,
    isCancel = false,
    sendEmail = false,
  ) {
    const notification = {
      fromHumanId: getUserId(),
      toHumanListIds,
      menuPath: this.menuPath,
      departmentId: appStore.org.departmentId,
      targetId,
      messageType,
      title,
      type,
      isCancel,
      sendEmail,
    };
    return notificationStore.save(notification);
  }

  saveChatNotification(
    toHumanListIds: string[],
    messageType: string,
    title: string,
    targetId: string,
    isCancel = false,
    sendEmail = false,
  ) {
    return this.saveNotification(NotifyType.Chat, toHumanListIds, messageType, title, targetId, isCancel, sendEmail);
  }

  saveAlarmNotification(
    toHumanListIds: string[],
    messageType: string,
    title: string,
    targetId: string,
    isCancel = false,
  ) {
    return this.saveNotification(NotifyType.Alarm, toHumanListIds, messageType, title, targetId, isCancel);
  }

  saveFunctionalNotification(
    toHumanListIds: string[],
    messageType: string,
    title: string,
    targetId: string,
    isCancel = false,
    sendEmail = false,
  ) {
    return this.saveNotification(
      NotifyType.Functional,
      toHumanListIds,
      messageType,
      title,
      targetId,
      isCancel,
      sendEmail,
    );
  }
}
