<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Button from '@/components/ui/flat-button';
  import ViewWrapperModal from '@/components/modal/view-wrapper';
  import { T } from '@/lib/js/locale/locale';
  import { ViewStore } from '@/store/view';
  import { roleControlStore } from '@/store/role-control';
  import { appStore } from '@/store/app';
  import { distinctUntilChanged, filter, switchMap, take, tap, map, concatMap, catchError } from 'rxjs/operators';
  import { BehaviorSubject, forkJoin, fromEvent, Observable, of } from 'rxjs';
  import FloatSelect from '@/components/ui/float-input/select';
  import Autocomplete from '@/components/ui/float-input/simple-autocomplete';
  import Store from '../store';
  import { settingsStore } from '@/store/settings';
  import { Debug } from '@/lib/js/debug';
  import QuickSearch from '@/components/ui/float-input/quick-search';
  import { TableColumn } from '@/model/base';
  import ProgressBar from '@/components/ui/progress-bar';
  import { StringUtil } from '@/lib/js/string-util';
  import { SObject } from '@/lib/js/sobject';
  import { fromEvents } from '@/lib/js/rx';
  import { markStringSearch } from '@/lib/js/util';
  import Pagination from '@/components/ui/pagination';
  import InputModal from '@/components/ui/modal/base';

  import { ModalType } from '@/components/ui/modal/types';
  import { ButtonType, ButtonId } from '@/components/ui/button/types';

  import SC from '@/components/set-common';
  import { ButtonPressed } from '../../../../components/ui/button/types';

  export let view: ViewStore;
  export let menuPath: string;

  view.loading$.next(true);
  // @ts-ignore
  const { selectedData$, hasAnyDeletedRecord$, deleteRunning$, saveRunning$, isReadOnlyMode$, isUpdateMode$ } = view;
  isReadOnlyMode$.next(true);
  isUpdateMode$.next(true);
  const { usedLanguages$, companies$ } = Store;

  let scRef, inputModalRef: any;

  let viewWrapperModalRef: any;
  let languageViewRef: any;
  let languageDropdownRef: any;
  let companyDropdownRef: any;
  let langCategoryAutoRef: any;
  let langTypeGroupAutoRef: any;
  let quickSearchRef: any;
  let languageGridRef: any;
  let ExcelGrid: any;

  let pageRef: any;
  const { fullCount$ } = view;

  let LanguageView: any = undefined;
  let tableHeight: string;
  let langFullControl: boolean = undefined;
  let langRoleControls: any[] = [];
  let data: any[] = [];
  let beforeData: any[] = [];
  let dataChanged: any | null = null;
  let lang: any[] = [];

  let columns: TableColumn[] = [];

  const filterProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  const dispatch = createEventDispatcher();
  const onAddNewLanguage = (event) => {
    loadLanguageView().then((res) => {
      viewWrapperModalRef.show().then((res) => {
        console.log(res);
      });
    });
  };

  const loadLanguageView = () => {
    return new Promise((resolve, reject) => {
      roleControlStore
        .sysGetControlListByDepIdAndUserIdAndMenuPath(appStore.org.departmentId, 'sys/language')
        .pipe(take(1))
        .subscribe((res) => {
          if (res.data.fullControl) {
            langFullControl = true;
          } else {
            langRoleControls = res.data;
          }
          import('@/modules/sys/language/index.svelte')
            .then((res) => {
              LanguageView = res.default;
              resolve('ok');
            })
            .catch((error) => reject(error));
        });
    });
  };

  const didSearch = (dt: any) => {
    view.fullCount$.next(dt.fullCount);
    //transform locale into column and add index to distinct object
    const _data = dt.payload;

    _data.map((item: any, index: number) => {
      item[item.locale] = item.value;
      item.index = index;
      delete item.value;
      return item;
    });

    // fill all missing locale value
    _data.map((item: any) => {
      lang.map((l: any) => {
        // eslint-disable-next-line no-prototype-builtins
        if (!item.hasOwnProperty(l.locale)) {
          const filter = _data.filter((d: any) => {
            return (
              d.category === item.category &&
              d.typeGroup === item.typeGroup &&
              d.key === item.key &&
              d.locale === l.locale
            );
          });
          if (filter.length > 0) {
            item[l.locale] = filter[0][l.locale];
          }
        }
        return l;
      });
      delete item.locale;

      return item;
    });

    //recalculate index
    _data.map((item: any) => {
      const filter = _data.filter((d: any) => {
        return d.category === item.category && d.typeGroup === item.typeGroup && d.key === item.key;
      });

      filter.map((it: any) => {
        it.index = item.index;
      });
    });

    // distinct array object
    const distinctObj = SObject.distinctArrayObject(_data);
    // const distinctObj = Array.from(new Set(_data.map((it: any) => it.index))).map((index) => {
    //   const ret = _data.find((s) => s.index === index);
    //   delete ret.index;
    //   return ret;
    // });

    const temp = distinctObj;
    // add blank row at the end
    temp.push({});

    mark(quickSearchRef.getTextSearch(), SObject.clone(temp));
    setTimeout(() => {
      beforeData = languageGridRef && languageGridRef.getData();
    }, 500);
    view.loading$.next(false);
  };

  const getSearchParam = () => {
    const selectedCompanyId = companyDropdownRef && companyDropdownRef.getSelectedId();

    let selectedCategoryId = langCategoryAutoRef && langCategoryAutoRef.getSelectedId();
    const categoryText = langCategoryAutoRef && langCategoryAutoRef.getInputText();

    if (StringUtil.isEmpty(selectedCategoryId) && !StringUtil.isEmpty(categoryText)) {
      selectedCategoryId = categoryText;
    }

    let selectedTypeGroupId = langTypeGroupAutoRef && langTypeGroupAutoRef.getSelectedId();
    const typeGroupText = langTypeGroupAutoRef && langTypeGroupAutoRef.getInputText();

    if (StringUtil.isEmpty(selectedTypeGroupId) && !StringUtil.isEmpty(typeGroupText)) {
      selectedTypeGroupId = typeGroupText;
    }

    const textSearch = quickSearchRef && quickSearchRef.getTextSearch();

    return [selectedCompanyId, selectedCategoryId, selectedTypeGroupId, textSearch];
  };

  const doSearch = () => {
    const [selectedCompanyId, selectedCategoryId, selectedTypeGroupId, textSearch] = getSearchParam();
    view.loading$.next(true);
    Store.sysGetLocaleResourceByCompanyIdAndCatAndTypeGroup(
      selectedCompanyId,
      selectedCategoryId,
      selectedTypeGroupId,
      textSearch,
      1, //view.page,
      9999, //view.pageSize,
    ).subscribe(
      (res: any) => {
        didSearch(res.data);
      },
      (error) => {
        Debug.errorSection('Load Locale Resource List', error);
        view.loading$.next(false);
      },
    );
  };

  const mark = (textSearch: string, source: any) => {
    data = Mark.mark(source, textSearch);

    // data = SObject.clone(source).map((item: any) => {
    //   const markedCategory = markStringSearch(item.category, textSearch, true);
    //   const markedTypeGroup = markStringSearch(item.typeGroup, textSearch, true);
    //   const markedKey = markStringSearch(item.key, textSearch, true);
    //   const markedVi = markStringSearch(item['vi-VN'], textSearch, true);
    //   const markedEn = markStringSearch(item['en-EN'], textSearch, true);
    //   if (markedCategory !== item.category) {
    //     item.category = markedCategory;
    //   }
    //   if (markedTypeGroup !== item.typeGroup) {
    //     item.typeGroup = markedTypeGroup;
    //   }
    //   if (markedKey !== item.key) {
    //     item.key = markedKey;
    //   }
    //   if (markedVi !== item['vi-VN']) {
    //     item['vi-VN'] = markedVi;
    //   }
    //   if (markedEn !== item['en-EN']) {
    //     item['en-EN'] = markedEn;
    //   }
    //   return item;
    // });
    //
  };

  onMount(() => {
    // Store.sysGetUsedLanguages();
    Store.getCompaniesList();

    const company$ = companyDropdownRef.loadSettings();
    const category$ = langCategoryAutoRef.loadSettings();
    const typeGroup$ = langTypeGroupAutoRef.loadSettings();

    forkJoin([company$, category$, typeGroup$]).subscribe(() => {
      doSearch();
      // pageRef.loadSettings().then(() => {
      //   doSearch();
      // });
    });

    calcTableHeight(31);

    let resizeTimer;
    window['$'](window).on('resize', function(e) {
      clearTimeout(resizeTimer);
      calcTableHeight(0);
      resizeTimer = setTimeout(function() {
        languageGridRef && languageGridRef.refresh();
      }, 250);
    });

    // loadLanguageView();
  });

  const calcTableHeight = (delta: number) => {
    const ele: any = document.querySelector('#languageGridContainer');
    tableHeight = window['$'](ele).height() - delta + 'px';
  };

  const langCallback = (event) => {
    // console.log(event);
  };

  let menuInfo$: any;
  // @ts-ignore
  $: {
    menuInfo$ = languageViewRef && languageViewRef.getMenuInfo$();
  }

  const onApplyLanguage = (event) => {
    let href = new URL((window as any).location.href);
    const selectedLangId = languageDropdownRef.getSelectedId();
    settingsStore
      .saveUserSettings({
        menuPath: 'system',
        controlId: 'localeResourceId',
        keys: ['lastLocaleResource'],
        values: [selectedLangId],
      })
      .then((_) => {
        localStorage.setItem('localeLanguage', selectedLangId);
        href.searchParams.set('localeLanguage', selectedLangId);
        (window as any).location.href = href;
      })
      .catch((error) => Debug.errorSection('onApplyLanguage', error));
  };

  const onSearch = (event) => {
    // pageRef.resetPage();
    view.page = 1;
    doSearch();
  };

  const doCategorySearch = (textSearch: string) => {
    return Store.sysGetUsedLangCategories(textSearch);
  };

  const doTypeGroupSearch = (textSearch: string) => {
    return Store.sysGetUsedLangTypeGroups(textSearch);
  };

  const onLangTableBeforeChange = (event) => {
    // if (dataChanged) {
    //   beforeData = languageGridRef.getData();
    //   dataChanged = null;
    // }
  };

  const onLangTableBeforeDeleteRow = (event) => {
    // if (dataChanged) {
    //   beforeData = languageGridRef.getData();
    //   dataChanged = null;
    // }
    return true;
  };

  const onLangTableUpdate = (event) => {
    // setTimeout(() => {
    //   const x = Number(event.x);
    //   if (x > 1) {
    //     // @ts-ignore
    //     if ($isReadOnlyMode$) {
    //       event.cell.classList.add('readonly');
    //     } else {
    //       event.cell.classList.remove('readonly');
    //     }
    //   }
    // });
  };

  Store.sysGetAllLanguages(false, false)
    .then((res: any) => {
      lang = res;
      columns = lang.map((item: any) => {
        return {
          type: 'text',
          title: item.name,
          name: item.locale,
          width: 100,
        };
      });

      columns.unshift({
        type: 'text',
        title: T('COMMON.LABEL.KEY'),
        name: 'key',
        width: 100,
      });
      columns.unshift({
        type: 'text',
        title: T('COMMON.LABEL.TYPE_GROUP'),
        name: 'typeGroup',
        width: 100,
        readOnly: true,
      });

      columns.unshift({
        type: 'text',
        title: T('COMMON.LABEL.CATEGORY'),
        name: 'category',
        width: 100,
        readOnly: true,
      });

      import('@/components/ui/excel-grid/index.svelte').then((res) => {
        ExcelGrid = res.default;
      });
    })
    .catch((error: any) => {
      Debug.errorSection('sysGetAllLanguages', error);
    });

  const doFilter = (events$: Observable<any>) => {
    events$
      .pipe(
        distinctUntilChanged((before: any, after: any) => {
          return before.value === after.value && after.type !== 'click';
        }),
        tap((event: string) => {
          // pageRef.resetPage();
          view.page = 1;
          filterProgress$.next(true);
        }),
        switchMap((event) => {
          const [selectedCompanyId, selectedCategoryId, selectedTypeGroupId, textSearch] = getSearchParam();
          return Store.sysGetLocaleResourceByCompanyIdAndCatAndTypeGroup(
            selectedCompanyId,
            selectedCategoryId,
            selectedTypeGroupId,
            textSearch,
            1, //view.page,
            9999, //view.pageSize,
          );
        }),
      )
      .subscribe({
        next: (res: any) => {
          didSearch(res.data);
          filterProgress$.next(false);
        },
        error: (error) => {
          filterProgress$.next(false);
        },
      });
  };

  const useFilterAction = {
    register(component: HTMLElement, param: any) {
      const events$ = fromEvents(component, 'keyup', 'click').pipe(
        map((event: any) => {
          return {
            type: event.type,
            value: event.target.value,
          };
        }),
      );
      doFilter(events$);
    },
  };

  const onLoadPage = (event) => {
    view.pageSize = event.detail.pageSize;
    view.page = event.detail.page;
    doSearch();
  };

  const onPaginationInit = (event) => {
    view.pageSize = event.detail;
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

  import { CommonValidation } from '@/lib/js/common-validation';
  import { fromPromise } from 'rxjs/internal-compatibility';
  import { Mark } from '../../../../lib/js/mark';
  let minNewRecord = 1,
    maxNewRecord = 100;

  const onAddNewResourceKey = () => {
    doAddNew();
  };

  const addNewRecord = (selectedCategoryId: string, selectedTypeGroupId: string) => {
    inputModalRef.show('', false, minNewRecord, maxNewRecord, 10).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        for (let i = 0; i < inputModalRef.getInputNumber(); i++) {
          languageGridRef.getGridInstance().insertRow([selectedCategoryId, selectedTypeGroupId], 0, true);
        }
      }
    });
  };

  const inputValidate = () => {
    return new Promise((resolve, reject) => {
      if (inputModalRef.getInputNumber() < minNewRecord || inputModalRef.getInputNumber() > maxNewRecord) {
        inputModalRef.raiseError(T(CommonValidation.INTEGER_NUMBER_IN_RANGE) + `: ${minNewRecord} - ${maxNewRecord}`);
        reject(false);
      } else {
        resolve(true);
      }
    });
  };

  const checkForTypeGroup = (selectedCategoryId: any, selectedTypeGroupId: any, typeGroupText) => {
    // if type group is blank
    if (StringUtil.isEmpty(selectedTypeGroupId)) {
      // if type group not existed in DB
      scRef
        .confirmModalRef()
        .show(
          `${T('SYS.MSG.LANG_TYPE_GROUP')} <b>${typeGroupText}</b> ${T('SYS.MSG.DOES_NOT_EXISTED')}. ${T(
            'SYS.MSG.DO_YOU_WANT_INSERT_NEW_ONE',
          )}?`,
        )
        .then((pressedButton: ButtonPressed) => {
          if (pressedButton === ButtonPressed.OK) {
            addNewRecord(selectedCategoryId, typeGroupText);
          }
        });
    } else {
      // if Type group existed
      addNewRecord(selectedCategoryId, selectedTypeGroupId);
    }
  };

  const doAddNew = () => {
    const selectedCategoryId = langCategoryAutoRef && langCategoryAutoRef.getSelectedId();
    const categoryText = langCategoryAutoRef.getInputText().trim();
    const selectedTypeGroupId = langTypeGroupAutoRef && langTypeGroupAutoRef.getSelectedId();
    const typeGroupText = langTypeGroupAutoRef.getInputText().trim();

    // if category is blank
    if (StringUtil.isEmpty(selectedCategoryId) && StringUtil.isEmpty(categoryText)) {
      scRef.snackbarRef().show(T('SYS.MSG.PLEASE_SELECT_LANG_CATEGORY'));
      langCategoryAutoRef.focus();
      return;
    } else if (StringUtil.isEmpty(selectedCategoryId)) {
      // if type group is blank
      if (StringUtil.isEmpty(selectedTypeGroupId) && StringUtil.isEmpty(typeGroupText)) {
        scRef.snackbarRef().show(T('SYS.MSG.PLEASE_SELECT_LANG_TYPE_GROUP'));
        langTypeGroupAutoRef.focus();
        return;
      }
      // if type group not existed in DB
      let isContinue = true;
      scRef
        .confirmModalRef()
        .show(
          `${T('SYS.MSG.LANG_CATEGORY')} <b>${categoryText}</b> ${T('SYS.MSG.DOES_NOT_EXISTED')}. ${T(
            'SYS.MSG.DO_YOU_WANT_INSERT_NEW_ONE',
          )}?`,
        )
        .then((pressedButton: ButtonPressed) => {
          if (pressedButton === ButtonPressed.OK) {
            checkForTypeGroup(categoryText, selectedTypeGroupId, typeGroupText);
          }
        });
    } else {
      if (StringUtil.isEmpty(selectedTypeGroupId) && StringUtil.isEmpty(typeGroupText)) {
        scRef.snackbarRef().show(T('SYS.MSG.PLEASE_SELECT_LANG_TYPE_GROUP'));
        langTypeGroupAutoRef.focus();
        return;
      }
      checkForTypeGroup(selectedCategoryId, selectedTypeGroupId, typeGroupText);
    }
  };

  /**
   * Event handle for Edit button.
   * @param {event} Mouse click event.
   * @return {void}.
   */
  const onEdit = (event) => {
    // verify permission
    view.verifyEditAction(event.currentTarget.id, scRef).then((_) => {
      // just switch to edit mode
      isReadOnlyMode$.next(false);
    });
  };

  const convertLangLocaleToRow = (data) => {
    const ret = [];

    for (let row of data) {
      for (let _lang of lang) {
        const newRow = {
          companyId: companyDropdownRef.getSelectedId(),
          category: row.category,
          typeGroup: row.typeGroup,
          key: row.key,
          locale: _lang.locale,
          value: row[_lang.locale],
        };
        ret.push(newRow);
      }
    }

    return ret;
  };

  const mergeLangLocaleToRow = (data1, data2) => {
    const ret = [];
    for (let i = 0; i < data1.length; i++) {
      for (let _lang of lang) {
        const newRow = {
          companyId: companyDropdownRef.getSelectedId(),
          category: data1[i].category,
          typeGroup: data1[i].typeGroup,
          key: data1[i].key,
          locale: _lang.locale,
          value: data1[i][_lang.locale],
          newValue: data2[i] && data2[i][_lang.locale],
        };
        ret.push(newRow);
      }
    }

    return ret;
  };

  const validate = () => {
    const _beforeData = SObject.clone(beforeData.filter((it) => it && it.key && it.key.trim() !== ''));
    const editedData = languageGridRef.getData().filter((it) => it && it.key && it.key.trim() !== '');

    dataChanged = view.checkObjectArrayChange2(
      _beforeData,
      editedData,
      ['category', 'typeGroup', 'key'],
      scRef.snackbarRef(),
    );

    if (
      !dataChanged ||
      (dataChanged.addArray.length === 0 &&
        dataChanged.editFromArray.length === 0 &&
        dataChanged.editToArray.length === 0 &&
        dataChanged.removeArray.length === 0)
    ) {
      scRef.snackbarRef().showNoDataChange();
      return false;
    }

    return true;
  };

  const doSaveOrUpdate = (ob$: Observable<any>) => {
    ob$
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
          const convertedData = {
            addArray: convertLangLocaleToRow(dataChanged.addArray).filter(
              (it) => it && it.value && it.value.trim() !== '',
            ),
            editArray: mergeLangLocaleToRow(dataChanged.editFromArray, dataChanged.editToArray).filter(
              (it) => (it && it.value && it.value.trim()) !== (it && it.newValue && it.newValue.trim()),
            ),
            removeArray: convertLangLocaleToRow(dataChanged.removeArray).filter(
              (it) => it && it.value && it.value.trim() !== '',
            ),
          };
          saveRunning$.next(true);

          /* submit data to API server*/

          return Store.saveOrUpdateOrDelete(convertedData);
        }),
      )
      .subscribe({
        /* do something after form submit*/
        next: (res: any) => {
          if (res.response && res.response.data) {
            // if error
            scRef.snackbarRef().showUnknownError(res.response.data.message);
          } else {
            // success
            scRef.snackbarRef().showUpdateSuccess();
            // useView.checkDeletedRecord(false);
          }
          saveRunning$.next(false);
        },
        error: (error) => {
          Debug.errorSection('Locale Resource - doSaveOrUpdate', error);
          saveRunning$.next(false);
        },
      });
  };

  const useSaveOrUpdateAction = {
    register(component: HTMLElement, param: any) {
      doSaveOrUpdate(fromEvent(component, 'click'));
    },
  };
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  #languageGridContainer {
    border: $default-border;
    width: 100%;
  }
  .language-grid {
    height: calc(100% - 2.2rem * 3 - #{$controller-height});
  }
  .full-language-grid {
    /*overflow: auto;*/
    height: calc(100% - 2.2rem * 3 - 13px);
  }
</style>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<InputModal bind:this={inputModalRef} modalType={ModalType.InputNumber} beforeOK={inputValidate} />
<ProgressBar loading$={view.loading$} />
<ViewWrapperModal
  menuInfo={$menuInfo$}
  title={languageViewRef && languageViewRef.getViewTitle()}
  defaultWidth={900}
  defaultHeight={500}
  bind:this={viewWrapperModalRef}
  {menuPath}
  id={'modalWrapper' + view.getViewName() + 'Id'}>
  <svelte:component
    this={LanguageView}
    showWorkList={false}
    bind:this={languageViewRef}
    showTitle={false}
    on:callback={langCallback}
    callFrom={menuPath}
    menuPath="sys/language"
    fullControl={langFullControl}
    roleControls={langRoleControls} />
</ViewWrapperModal>
<!--//Invisible Element-->

<section class="view-content-controller">
  <Button btnType={ButtonType.AddNew} title={T('COMMON.BUTTON.ADD_NEW_RESOURCE_KEY')} on:click={onAddNewResourceKey} />

  {#if view.isRendered(ButtonId.Edit, $isReadOnlyMode$ && $isUpdateMode$)}
    <Button btnType={ButtonType.Edit} on:click={onEdit} disabled={view.isDisabled(ButtonId.Edit)} />
  {/if}

  {#if view.isRendered(ButtonId.Update, !$isReadOnlyMode$ && $isUpdateMode$)}
    <Button
      action={useSaveOrUpdateAction}
      btnType={ButtonType.Update}
      disabled={view.isDisabled(ButtonId.Update)}
      running={$saveRunning$} />
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

<section class="view-content-main">
  <!-- Change language -->
  <div class="row">
    <div class="col-xs-24 col-md-12 col-lg-6">
      <FloatSelect
        on:clickLabel={onAddNewLanguage}
        on:change={onApplyLanguage}
        autoLoad={true}
        saveState={true}
        {menuPath}
        id="localeResourceUsedLanguageSelectId"
        bind:this={languageDropdownRef}
        data={$usedLanguages$}
        placeholder={T('COMMON.LABEL.LANGUAGE')} />
    </div>
  </div>
  <!-- //Change language -->

  <div class="row">
    <!-- Company -->
    <div class="col-xs-24 col-md-12 col-lg-6">
      <FloatSelect
        placeholder={T('COMMON.LABEL.COMPANY')}
        id={view.getViewName() + 'CompanySelectId'}
        {menuPath}
        on:change={onSearch}
        saveState={true}
        data={$companies$}
        bind:this={companyDropdownRef} />
    </div>
    <!-- //Company -->
    <!-- Category -->
    <div class="col-xs-24 col-md-12 col-lg-6">
      <Autocomplete
        placeholder={T('COMMON.LABEL.CATEGORY')}
        columns={[{ name: 'name', title: 'Name', type: 'html' }]}
        searchFunc={doCategorySearch}
        id={view.getViewName() + 'CategoryAutoId'}
        {menuPath}
        bind:this={langCategoryAutoRef}
        saveState={true}
        on:change={onSearch} />
    </div>
    <!-- //Category -->

    <!-- Type Group -->
    <div class="col-xs-24 col-md-12 col-lg-6">
      <Autocomplete
        placeholder={T('COMMON.LABEL.TYPE_GROUP')}
        columns={[{ name: 'name' }]}
        searchFunc={doTypeGroupSearch}
        id={view.getViewName() + 'TypeGroupAutoId'}
        {menuPath}
        bind:this={langTypeGroupAutoRef}
        saveState={true}
        on:change={onSearch} />
    </div>
    <!-- //Type Group -->
    <!-- Search or Filter-->
    <div class="col-md-24 col-md-12 col-lg-6">
      <QuickSearch
        loading$={filterProgress$}
        action={useFilterAction}
        bind:this={quickSearchRef}
        placeholder={T('COMMON.LABEL.FILTER') + '...'} />
    </div>
    <!-- //Search or Filter-->
  </div>

  <!--  <div style="margin-top: 10px;">-->
  <!--    <Pagination-->
  <!--      {menuPath}-->
  <!--      totalRecords={$fullCount$}-->
  <!--      on:loadPage={onLoadPage}-->
  <!--      on:init={onPaginationInit}-->
  <!--      bind:this={pageRef} />-->
  <!--  </div>-->
  <!--  Language Grid-->
  <div
    id="languageGridContainer"
    class="row {$fullCount$ > 0 ? 'language-grid' : 'full-language-grid'}
    "
    style="margin-top: 6px;">
    <div class="col-24">
      <svelte:component
        this={ExcelGrid}
        id="languageGridId"
        bind:this={languageGridRef}
        {menuPath}
        {columns}
        {data}
        fullWidth={true}
        height={tableHeight}
        on:beforeChange={onLangTableBeforeChange}
        on:beforeDeleteRow={onLangTableBeforeDeleteRow}
        on:updateTable={onLangTableUpdate} />
    </div>
  </div>
  <!--  //Language Grid -->
</section>
