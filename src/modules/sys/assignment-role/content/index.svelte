<script lang="ts">
  import { onMount, tick, onDestroy } from 'svelte';
  import TreeView from 'src/components/ui/tree-view';
  import SelectableTable from 'src/components/ui/selectable-table';
  import ExcelGrid from 'src/components/ui/excel-grid';
  import { ViewStore } from 'src/store/view';
  import { Store } from '../store';
  import { userColumns, roleColumns, applyAssignedRole } from './helper';
  import { T } from 'src/lib/js/locale/locale';
  import FlatButton from 'src/components/ui/flat-button';
  import Button from 'src/components/ui/button';
  import { ButtonType, ButtonId, ButtonPressed } from 'src/components/ui/button/types';
  import { catchError, concatMap, switchMap, take, filter } from 'rxjs/operators';
  import SC from 'src/components/set-common';
  import { fromEvent, zip, of, Observable } from 'rxjs';
  import { SObject } from 'src/lib/js/sobject';
  import { fromPromise } from 'rxjs/internal-compatibility';
  import { Debug } from 'src/lib/js/debug';
  import Split from 'split-grid';
  import { GUTTER_WIDTH } from 'src/lib/js/constants';
  import { settingsStore } from 'src/store/settings';
  import { Settings } from 'src/model/settings';
  import QuickSearch from 'src/components/ui/input/quick-search';

  export let view: ViewStore;
  export let store: Store;
  export let menuPath: string;

  const { isReadOnlyMode$, isUpdateMode$, saveRunning$ } = view;
  const { orgData$, userData$, roleData$, selectedUserRole$ } = store;

  const completeSelecting$ = zip(userData$, roleData$);

  let filterUserColumns: any[] = userColumns;

  let orgTreeViewRef: any;
  let userTableRef: any;
  let roleGridRef: any;
  let scRef: any;

  let beforeRoleData: any[];
  let dataChanged: any;
  let editedRoleData: any[];
  let selectedUser: any;
  let saveOrUpdateSub;

  const onOrgTreeClick = (event: any) => {
    const orgId = event.detail.treeNode.id;
    doOrgTreeClick(orgId.toString());

    if (event.detail.treeNode.isParent) {
      filterUserColumns = userColumns;
    } else {
      filterUserColumns = userColumns.filter((it: any) => it.name !== 'departmentName');
    }
  };

  const doOrgTreeClick = (orgId: string) => {
    view.loading$.next(true);

    store.loadUserList(orgId);
    store.loadRoleList(orgId);

    selectedUser = null;
  };

  const onSelectionUser = (event) => {
    let selectedUsers = event.detail;
    if (selectedUsers.length === 0) {
      return;
    }

    view.isReadOnlyMode$.next(true);
    view.isUpdateMode$.next(true);
    selectedUser = selectedUsers[0];
    view.loading$.next(true);
    Store.sysGetRoleListOfUsers(selectedUsers.map((it) => it.id).join(','))
      .pipe(take(1))
      .subscribe(
        (res: any) => {
          if (res.data) {
            // @ts-ignore
            roleData$.next(applyAssignedRole($roleData$, res.data, userTableRef.getSelectedRowCount()));
          } else {
            // @ts-ignore
            roleData$.next(applyAssignedRole($roleData$, [], userTableRef.getSelectedRowCount()));
          }

          tick().then(() => {
            beforeRoleData = SObject.clone(roleGridRef.getData());
          });

          view.loading$.next(false);
        },
        (error: Error) => {
          // @ts-ignore
          roleData$.next(applyAssignedRole($roleData$, []));
          scRef.snackbarRef().show(error.message);
          view.loading$.next(false);
        },
      );
  };

  /**
   * Event handle for Edit button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onEdit = (event) => {
    // verify permission
    // @ts-ignore
    view.verifyEditAction(event.currentTarget.id, scRef, selectedUser.username).then((_) => {
      // just switch to edit mode
      isReadOnlyMode$.next(false);
    });
  };

  const onReset = () => {
    // check for data change
    editedRoleData = roleGridRef.getData();

    dataChanged = view.checkObjectArrayChange(beforeRoleData, SObject.clone(editedRoleData));

    if (dataChanged) {
      scRef
        .confirmModalRef()
        .show(T('SYS.MSG.THE_DATA_HAS_BEEN_CHANGED') + '. ' + T('SYS.MSG.ARE_YOU_SURE_TO_RESET' + '?'))
        .then((buttonPressed: ButtonPressed) => {
          if (buttonPressed === ButtonPressed.OK) {
            doReset();
          }
        });
    } else {
      scRef.snackbarRef().showNoDataChange();
    }
  };

  const doReset = () => {
    if (selectedUser) {
      userTableRef.selectRowById(selectedUser.id);
    }
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
          // @ts-ignore
          return store.saveOrUpdateOrDelete(userTableRef.getSelectedData(), roleGridRef.getData()).pipe(
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
            }
          } else {
            // success
            // @ts-ignore
            beforeRoleData = SObject.clone(editedRoleData);
            scRef.snackbarRef().showUpdateSuccess();
          }
          saveRunning$.next(false);
          store.sysGetAllAssignmentRoleUserList();
        },
        error: (error) => {
          Debug.errorSection('Assignment Role - doSaveOrUpdate', error);
          saveRunning$.next(false);
        },
      });
  };

  // ============================== CLIENT VALIDATION ==========================
  /**
   * Client validation and check for no data change.
   * @param {none}
   * @return {boolean}. true if all of things are valid, false: otherwise
   */
  const validate = () => {
    // client validation
    // @ts-ignore
    if (selectedUser == null) {
      scRef.snackbarRef.show(T('SYS.MSG.PLEASE_SELECT_AT_LEAST_ONE_USER'));
      return false;
    }
    // check for data change
    editedRoleData = roleGridRef.getData();

    dataChanged = view.checkObjectArrayChange(beforeRoleData, SObject.clone(editedRoleData), scRef.snackbarRef());

    if (!dataChanged) {
      return false;
    }

    return true;
  };
  // ============================== //CLIENT VALIDATION ==========================

  const createSplit = () => {
    // loadSettings
    settingsStore.getUserSettings(`leftInsideFormAssignmentRole`, menuPath).then((res: any[]) => {
      const found = res.find((it) => it.key === 'lastLeftWidth');

      let leftWidth = '260px';
      if (found) {
        leftWidth = found.value;
      }

      let containerEle: any = document.querySelector('.view-container-inside-form-2-col');

      containerEle.style['grid-template-columns'] = `${leftWidth} ${GUTTER_WIDTH}px auto`;
    });

    return Split({
      columnGutters: [
        {
          track: 1,
          element: document.querySelector('.left-grid-vertical-gutter-inside-form'),
        },
      ],
      onDragEnd: (direction: any, track: number) => {
        let gridEle: any = document.querySelector('.view-container-inside-form-2-col');

        const [leftWidth] = gridEle.style['grid-template-columns'].split(' ');

        settingsStore.saveUserSettings(
          new Settings({
            menuPath: menuPath,
            controlId: `leftInsideFormAssignmentRole`,
            keys: ['left'],
            values: [leftWidth],
          }),
        );
      },
    });
  };

  onMount(() => {
    const splitter = createSplit();
    setTimeout(() => {
      // create check and button header
      roleGridRef && roleGridRef.createToggleCheckHeader(1);
      roleGridRef && roleGridRef.createToggleCheckHeader(4);
      roleGridRef && roleGridRef.createCheckboxHeader(1);
      roleGridRef && roleGridRef.createCheckboxHeader(4);
    }, 1000);

    const completeSub = completeSelecting$.subscribe((res) => {
      view.loading$.next(false);
      // @ts-ignore
      const selectedUserRole = $selectedUserRole$;
      setTimeout(() => {
        if (userTableRef && selectedUserRole) {
          userTableRef.selectRowById(selectedUserRole.id);
        }
      });
    });

    return () => {
      completeSub.unsubscribe();
      splitter.destroy();
    };
  });

  onDestroy(() => {
    if (saveOrUpdateSub) {
      saveOrUpdateSub.unsubscribe();
    }
  });

  // @ts-ignore
  $: {
    // @ts-ignore
    const selectedUserRole = $selectedUserRole$;
    if (selectedUserRole) {
      orgTreeViewRef.selectNodeById(selectedUserRole.defaultOwnerOrgId, true);
    }
  }

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
</script>

<style lang="sass">

</style>

<SC {view} {menuPath} bind:this={scRef} />
<section class="view-content-controller">
  {#if $roleData$ !== null}
    <FlatButton btnType={ButtonType.Reset} on:click={onReset} />
  {/if}

  {#if view.isRendered(ButtonId.Edit, $isReadOnlyMode$ && $isUpdateMode$ && selectedUser !== null)}
    <FlatButton btnType={ButtonType.Edit} on:click={onEdit} disabled={view.isDisabled(ButtonId.Edit)} />
  {/if}

  {#if view.isRendered(ButtonId.Update, !$isReadOnlyMode$ && $isUpdateMode$)}
    <FlatButton
      action={useSaveOrUpdateAction}
      btnType={ButtonType.Update}
      disabled={view.isDisabled(ButtonId.Update, selectedUser == null)}
      running={$saveRunning$} />
  {/if}

  {#if view.isRendered(ButtonId.Config)}
    <FlatButton btnType={ButtonType.Config} on:click={onConfig} disabled={view.isDisabled(ButtonId.Config)} />
  {/if}
</section>
<section class="view-content-main">
  <main class="view-container-inside-form-2-col">
    <div class="bg-primary default-border">
      <TreeView
        data={$orgData$}
        bind:this={orgTreeViewRef}
        id={'orgTreeView' + view.getViewName() + 'Id'}
        on:click={onOrgTreeClick}>
        <div slot="label">{T('COMMON.LABEL.ORG')}:</div>
      </TreeView>
    </div>
    <div class="left-grid-vertical-gutter-inside-form" />
    <div class="bg-primary">
      <div class="row">
        <div class="default-border col-sm-24 col-md-12">
          <SelectableTable
            columns={filterUserColumns}
            data={$userData$}
            {menuPath}
            bind:this={userTableRef}
            on:selection={onSelectionUser}
            id={'userTable' + view.getViewName() + 'Id'}>
            <span>{T('COMMON.LABEL.USER_LIST')}:</span>

            <span
              style="display: flex; padding-bottom: 6px;"
              slot="header"
              let:selectAll
              let:unSelectAll
              let:toggleSelection
              let:filter>
              <div style="width: 100%;">
                <QuickSearch on:input={(e) => filter(e.target.value)} />
              </div>
              <div style="height: 20px; white-space: nowrap; margin-top: 10px; margin-left: 5px;">
                <Button title={T('COMMON.BUTTON.SELECT_ALL')} btnType={ButtonType.SelectAll} on:click={selectAll} />
                <Button
                  title={T('COMMON.BUTTON.UNSELECT_ALL')}
                  btnType={ButtonType.UnSelectAll}
                  on:click={unSelectAll} />
                <Button
                  title={T('COMMON.BUTTON.TOGGLE_SELECTION')}
                  btnType={ButtonType.ToggleSelection}
                  on:click={toggleSelection} />
              </div>

            </span>
          </SelectableTable>
        </div>

        <div class="default-border col-sm-24 col-md-12">
          <ExcelGrid
            columns={roleColumns}
            data={$roleData$}
            {menuPath}
            bind:this={roleGridRef}
            id={'roleGrid' + view.getViewName() + 'Id'}>
            <div slot="label">{T('COMMON.LABEL.ROLE_LIST')}:</div>
          </ExcelGrid>
        </div>
      </div>
    </div>
  </main>
</section>
