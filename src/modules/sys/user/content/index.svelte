<script lang="ts">
  import { tick, onMount, onDestroy } from 'svelte';
  import { catchError, concatMap, switchMap, filter, take, finalize } from 'rxjs/operators';
  import { fromEvent, of, Observable, EMPTY } from 'rxjs';
  import { fromPromise } from 'rxjs/internal-compatibility';

  import { T } from 'src/lib/js/locale/locale';
  import Form from 'src/lib/js/form/form';
  import { ViewStore } from 'src/store/view';
  import { User } from 'src/model/user';
  import { SObject } from 'src/lib/js/sobject';
  import { apolloClient } from 'src/lib/js/hasura-client';
  import { ButtonType, ButtonId } from 'src/components/ui/button/types';
  import { validation } from './validation';
  import { StringUtil } from 'src/lib/js/string-util';

  import Button from 'src/components/ui/flat-button';
  import FloatTextInput from 'src/components/ui/float-input/text-input';
  import Error from 'src/components/ui/error';
  import FloatPasswordInput from 'src/components/ui/float-input/password-input';
  import FloatCheckbox from 'src/components/ui/float-input/checkbox';
  import SC from 'src/components/set-common';
  import SimpleImageSelector from 'src/components/ui/simple-image-selector';
  import TreeView from 'src/components/ui/tree-view';
  import Store from '../store';
  import { Debug } from 'src/lib/js/debug';
  import { SJSON } from 'src/lib/js/sjson';
  import { resizeBase64Img } from '../../../../lib/js/image';

  // Props
  export let view: ViewStore;
  export let store: Store;
  export let menuPath: string;

  // Observable
  // @ts-ignore
  const { selectedData$, hasAnyDeletedRecord$, deleteRunning$, saveRunning$, isReadOnlyMode$, isUpdateMode$ } = view;
  const { availableDep$, assignedDep$, completeSelecting$ } = store;

  // Refs
  let nameRef: any;
  let scRef: any;
  let btnSaveRef: any;
  let btnUpdateRef: any;
  let availableDepTreeRef: any;
  let defaultDepTreeRef: any;

  // Other vars
  let selectedData: User;
  let saveOrUpdateSub;
  /**
   * Reset form (reset input and errors)
   * @param {none}
   * @return {Form}. New Form
   */
  const resetForm = () => {
    return new Form({
      ...new User(),
    });
  };
  let form: any = resetForm();
  let beforeForm: Form;
  const saveUpdateUri = 'sys/human-or-org/save-or-update';
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
      doAddNew();
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
        nameRef.focus();
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

  /**
   * Event handle for Select Image button.
   * @param {event} data of image.
   * @return {void}.
   */
  const onImageChange = (event: any) => {
    (form as any).iconData = event.detail;
  };

  const onCheckAvailTree = (event) => {
    checkDefaultDepartment();
    onCheckAssignedDepTree(undefined);
  };

  const onCheckAssignedDepTree = (event) => {
    form.errors.clear('defaultOwnerOrgId');
    form.errors.errors = { ...form.errors.errors };
  };
  // ============================== //EVENT HANDLE ==========================

  // ============================== HELPER ==========================
  const checkDefaultDepartment = (defaultDepId: string = undefined) => {
    let checkedData = SObject.clone(availableDepTreeRef.getCheckedDataParent());
    const checkedLeafIds: any[] = availableDepTreeRef.getCheckedLeafIds(true);
    const defaultChecked = defaultDepTreeRef.getCheckedLeafIds(true);

    // check first department
    if (checkedLeafIds && checkedLeafIds.length > 0) {
      let firstCheck = false;
      checkedData = checkedData.map((it) => {
        if (
          !firstCheck &&
          ((defaultChecked.length === 1 && it.id.toString() === defaultChecked[0].toString()) ||
            (defaultChecked.length === 0 &&
              it.id.toString() === (defaultDepId ? defaultDepId.toString() : checkedLeafIds[0].toString())))
        ) {
          it.checked = true;
          firstCheck = true;
        } else {
          it.checked = false;
        }
        return it;
      });
      assignedDep$.next(checkedData);
    } else {
      assignedDep$.next([]);
    }
  };

  const preprocessData = () => {
    [form.lastName, form.firstName] = StringUtil.splitHumanName(form.name);
    // update data from tree
    form.insertDepartmentIds = availableDepTreeRef.getCheckedLeafIds(true);
    form.removeDepartmentIds = availableDepTreeRef.getCheckedLeafIds(false);
    const defaultIds: any[] = defaultDepTreeRef.getCheckedLeafIds(true);
    if (defaultIds && defaultIds.length > 0) {
      form.defaultOwnerOrgId = defaultIds[0];
    } else {
      form.defaultOwnerOrgId = undefined;
    }
  };

  // ============================== //HELPER ==========================
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

    // @ts-ignore
    if ($isUpdateMode$ && StringUtil.isEmpty(form.password)) {
      delete form.errors.errors.password;
    }

    if (form.errors.any()) {
      return false;
    }

    // check for data change
    // @ts-ignore
    // if ($isUpdateMode$) {
    //   const dataChanged = view.checkObjectChange(beforeForm, SObject.clone(form), scRef.snackbarRef());
    //   if (!dataChanged) {
    //     return false;
    //   }
    // }

    return true;
  };
  // ============================== //CLIENT VALIDATION ==========================

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

    store
      .loadAvailableDep(null)
      .pipe(take(1))
      .subscribe((res) => {
        availableDep$.next(res.data);
      });
    if (defaultDepTreeRef) {
      assignedDep$.next([]);
    }
    // moving focus to the first element after DOM updated
    tick().then(() => {
      nameRef.focus();
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
        concatMap((_) =>
          fromPromise(
            new Promise((resolve, reject) => {
              resizeBase64Img(form.iconData, 35, 35).then(function(newImg) {
                form.lowIconData = newImg;
                resolve('ok');
              });
            }),
          ),
        ),
        filter((value) => value !== 'fail') /* filter if pass verify permission*/,
        switchMap((_) => {
          /* submit data to API server*/
          saveRunning$.next(true);
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
              scRef.snackbarRef().showUnknownError(res.response.data.message || res.response.data);
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
          Debug.errorSection('User - doSaveOrUpdate', error);
          saveRunning$.next(false);
        },
      });
  };

  const doSelect = (data: any) => {
    selectedData = data;
    if (selectedData) {
      // check default department
      tick().then(() => {
        checkDefaultDepartment(selectedData.defaultOwnerOrgId);
        isReadOnlyMode$.next(true);
        isUpdateMode$.next(true);
        form = new Form({
          ...selectedData,
          insertDepartmentIds: availableDepTreeRef.getCheckedLeafIds(true),
          removeDepartmentIds: availableDepTreeRef.getCheckedLeafIds(false),
          password: '',
        });
        form.name = `${form.lastName} ${form.firstName}`;
        // save init value for checking data change
        beforeForm = SObject.clone(form);
      });
    }
  };
  // ============================== //FUNCTIONAL ==========================

  // ============================== REACTIVE ==========================
  // Monitoring selected data from other users
  // When other users edit on the same data, display a confirmation of the change with the current user
  view.allColumns$.subscribe((cols) => {
    if (cols && cols.length > 0) {
      const query = view.createQuerySubscription(true);
      view.selectedData$
        .pipe(
          switchMap((it: any) => {
            if (!it) return EMPTY;
            return apolloClient.subscribe({
              query,
              variables: {
                id: it.id.toString(),
                updatedBy: localStorage.getItem('userId'),
              },
            });
          }),
        )
        .subscribe(async (res) => {
          // @ts-ignore
          view.doNotifyConflictData(form, res.data, selectedData.id, $isReadOnlyMode$, scRef);
        });
    }
  });

  // when user click on work list. load selected data to the right form
  const selectDataSub = view.selectedData$.subscribe((data) => {
    doSelect(data);
  });
  // ============================== //REACTIVE ==========================

  // ============================== HOOK ==========================
  /**
   * onMount Hook.
   * @param {none}
   * @return {void}.
   */
  onMount(() => {
    // reset form
    doAddNew();
    // Capture hot key (Ctrl - S) for save or update
    const controlS$ = fromEvent(document, 'keydown').pipe(
      filter((e: any) => {
        if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
          e.preventDefault();
          // @ts-ignore
          if (!$isReadOnlyMode$) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }),
    );
    doSaveOrUpdate(controlS$);
  });

  /**
   * oDestroy Hook. Release subscription
   * @param {none}
   * @return {void}.
   */
  onDestroy(() => {
    selectDataSub.unsubscribe();
    if (saveOrUpdateSub) {
      saveOrUpdateSub.unsubscribe();
    }
  });

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
  // ============================== //HOOK ==========================
</script>

<style lang="scss">
  .image-container {
    height: 100px;
  }
  .menu-font-icon {
    font-size: 1.6rem !important;
  }
</style>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<!--//Invisible Element-->

<!--Form controller-->
<section class="view-content-controller">
  {#if view.isRendered(ButtonId.AddNew)}
    <Button btnType={ButtonType.AddNew} on:click={onAddNew} disabled={view.isDisabled(ButtonId.AddNew)} />
  {/if}

  {#if view.isRendered(ButtonId.Save, !$isUpdateMode$)}
    <Button
      action={useSaveOrUpdateAction}
      bind:this={btnSaveRef}
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
      bind:this={btnUpdateRef}
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
  <form class="form" on:keydown={(event) => form.errors.clear(event.target.name)}>
    <div class="row ">
      <div class="col-xs-24 col-lg-21">
        <div class="row">
          <!-- Full name -->
          <div class="col-xs-24 col-sm-12">
            <FloatTextInput
              bind:this={nameRef}
              placeholder={T('COMMON.LABEL.NAME')}
              name="name"
              disabled={$isReadOnlyMode$}
              bind:value={form.name} />
            <Error {form} field="name" />
          </div>
          <!-- //Full name -->

          <!-- Username -->
          <div class="col-xs-24 col-sm-12 pl-xs-0 pl-sm-2 pl-md-0">
            <FloatTextInput
              placeholder={T('COMMON.LABEL.USERNAME')}
              name="username"
              disabled={$isReadOnlyMode$}
              bind:value={form.username} />
            <Error {form} field="username" />
          </div>
          <!-- //Username -->
        </div>

        <div class="row">
          <!-- Email -->
          <div class="col-xs-24 col-sm-12">
            <FloatTextInput
              placeholder={T('COMMON.LABEL.EMAIL')}
              name="email"
              disabled={$isReadOnlyMode$}
              bind:value={form.email} />
            <Error {form} field="email" />
          </div>
          <!-- //Email -->

          <!-- Password -->
          <div class="col-xs-24 col-sm-12 pl-xs-0 pl-sm-2 pl-md-0">
            <FloatPasswordInput
              placeholder={T('COMMON.LABEL.PASSWORD')}
              name="password"
              disabled={$isReadOnlyMode$}
              bind:value={form.password} />
            <Error {form} field="password" />
          </div>
          <!--  //Password -->
        </div>

        <div class="row">
          <!--  Font Icon -->
          <div class="col-xs-24 col-sm-12 pl-xs-0 pl-sm-2 pl-md-0">
            <FloatTextInput
              bind:checked={form.useFontIcon}
              placeholder={T('COMMON.LABEL.FONT_ICON')}
              name="fontIcon"
              disabled={$isReadOnlyMode$}
              bind:value={form.fontIcon} />
            {#if form.fontIcon && form.fontIcon.includes('<')}
              <span
                style="display: flex; flex-direction: column; justify-content: flex-end; margin-bottom: 5px;"
                class="menu-font-icon">
                {@html form.fontIcon}
              </span>
            {/if}
          </div>
          <!--  //Font Icon -->

          <!--  Activated -->
          <div class="col-xs-24 col-sm-12 pl-xs-0 pl-sm-2 pl-md-0">
            <FloatCheckbox text={T('COMMON.LABEL.DISABLED')} disabled={$isReadOnlyMode$} bind:checked={form.disabled} />
          </div>
          <!-- //Activated -->
        </div>
      </div>

      <!-- Image Selector -->
      <div class="image-container col-xs-24 col-lg-3 mt-xs-0 mt-sm-6 mt-md-0">
        <SimpleImageSelector
          id={view.getViewName() + 'ViewerId'}
          src={form.iconData}
          disabled={$isReadOnlyMode$}
          on:imageChange={onImageChange} />
      </div>
      <!--  //Image Selector -->
    </div>

    <!--  Department Tree -->
    <div class="row" style="margin-top: 10px;">
      <div class="default-border col-sm-24 col-md-12">
        <TreeView
          on:check={onCheckAvailTree}
          bind:this={availableDepTreeRef}
          id={'availableDepTree' + view.getViewName() + 'Id'}
          data={$availableDep$}
          disabled={$isReadOnlyMode$}
          isCheckableNode={true}>
          <div slot="label" class="label">{T('SYS.LABEL.AVAILABLE_DEPARTMENT')}:</div>
        </TreeView>
      </div>
      <div class="default-border col-sm-24 col-md-12 pl-md-0 pl-lg-1 pt-md-1 pt-lg-0">
        <TreeView
          on:check={onCheckAssignedDepTree}
          bind:this={defaultDepTreeRef}
          id={'assignedDepTree' + view.getViewName() + 'Id'}
          data={$assignedDep$}
          disabled={$isReadOnlyMode$}
          radioType="all">
          <div slot="label" class="label">{T('SYS.LABEL.DEFAULT_DEPARTMENT')}:</div>
        </TreeView>
        {#if form.errors.has('defaultOwnerOrgId')}
          <span class="error">{form.errors.get('defaultOwnerOrgId')}</span>
        {/if}
      </div>
    </div>
  </form>
</section>
<!--//Main content-->
