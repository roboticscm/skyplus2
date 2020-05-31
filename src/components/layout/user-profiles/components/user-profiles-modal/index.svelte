<script lang="ts">
  import Modal from '@/components/ui/modal/base/index.svelte';
  import { T } from '@/lib/js/locale/locale';
  import Tabs from '@/components/ui/tabs';
  import PasswordField from '@/components/ui/float-input/custom-password-field';
  import InputField from '@/components/ui/float-input/text-input';
  import Error from '@/components/ui/error';
  import Form from '@/lib/js/form/form';
  import { themes, getThemeColors } from './helper';
  import { appStore } from '@/store/app';
  import { ButtonPressed } from '@/components/ui/button/types';
  import { settingsStore } from '@/store/settings';
  import RangeSlider from '@/components/ui/range-slider';
  import { Color } from '@/lib/js/color';
  import { SObject } from '@/lib/js/sobject';
  import { validation } from './validation';
  import Snackbar from '@/components/ui/snackbar';
  import { catchError } from 'rxjs/operators';
  import { of } from 'rxjs';
  import { StringUtil } from '@/lib/js/string-util';
  import FloatSelect from '@/components/ui/float-input/select';
  import LanguageStore from '@/modules/sys/locale-resource/store';
  import { onMount } from 'svelte';
  import { Debug } from '@/lib/js/debug';

  const { usedLanguages$ } = LanguageStore;
  const { user$ } = appStore;
  const { theme$ } = appStore;

  let containerWidth = '300px';

  const defaultWidth = 800;
  const defaultHeight = 400;

  let modalRef, excelGridRef, rangeSliderRef, languageDropdownRef: any;
  let ExcelGridComponent: any;
  let height = '200px';

  const tabTitleKeys = ['GENERAL', 'THEME', 'ACCOUNT'];
  let activeTab = 'GENERAL';
  const menuPath = 'sys/user-profiles-modal';

  let currentTheme: string;
  let currentAlpha = 1;
  const MAX_STEP = 100;

  let snackbarRef: any;

  const columns = [
    {
      type: 'hidden',
      name: 'key',
    },
    {
      type: 'text',
      title: T('COMMON.LABEL.AVAILABLE_THEME'),
      name: 'theme',
      width: 120,
      readOnly: true,
    },
    {
      type: 'color',
      title: T('COMMON.LABEL.PREVIEW'),
      name: 'preview',
      width: 120,
      readOnly: true,
      render: 'square',
    },
    {
      type: 'radio',
      title: T('COMMON.LABEL.CHOOSE'),
      name: 'choose',
      width: 80,
    },
  ];

  const resetForm = () => {
    return new Form({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };
  let form: any = resetForm();

  let mappedThemes: any[] = SObject.clone(themes);

  const onResize = (event) => {
    containerWidth = event.detail.width;
    // calcHeight();
    //
  };

  const calcHeight = () => {
    const h = modalRef.getHeight().replace('px', '');
    height = `${h - 100}px`;
  };

  export const show = () => {
    form = resetForm();
    calcHeight();
    return new Promise((resolve, reject) => {
      import('@/components/ui/excel-grid/index.svelte').then((res) => {
        ExcelGridComponent = res.default;
        resolve(modalRef.show());
      });
      // @ts-ignore
    }).then((buttonPressed: ButtonPressed) => {
      if (buttonPressed === ButtonPressed.OK) {
        appStore.theme$.next({
          theme: currentTheme,
          alpha: currentAlpha,
        });
        saveTheme();
      } else {
        // reset theme
        // @ts-ignore
        applyTheme($theme$.theme);
        mappedThemes = SObject.clone(themes);
      }
    });
  };

  const applyTheme = (theme: string) => {
    const body: any = document.querySelector('body');
    body.className = '';
    body.style = '';
    // add new theme
    if (theme !== 'theme-ivory') {
      body.classList.add(theme);
    }
  };

  const onThemeChanged = (event: any) => {
    const selectedRow = +event.detail.y;
    currentTheme = themes[selectedRow].key;
    applyTheme(currentTheme);
    rangeSliderRef.setValue(MAX_STEP);
  };

  const saveTheme = () => {
    settingsStore.saveUserSettings({
      menuPath: 'sys/theme',
      controlId: 'themeId',
      keys: ['lastTheme', 'lastAlpha'],
      values: [currentTheme, currentAlpha + ''],
    });
  };

  const saveAccountSettings = () => {
    return new Promise((resolve, reject) => {
      // client validation
      if (StringUtil.isEmpty(form.currentPassword) && StringUtil.isEmpty(form.newPassword)) {
        resolve(true);
        return;
      }
      form.errors.errors = form.recordErrors(validation(form));
      if (form.errors.any()) {
        if (activeTab !== 'ACCOUNT') {
          snackbarRef.show(T('SYS.MSG.ACCOUNT_SETTING_ERROR'));
          activeTab = 'ACCOUNT';
        }
        resolve(false);
      } else {
        form
          .post('sys/auth/change-pw')
          .pipe(catchError((error) => of(error)))
          .subscribe(
            (res: any) => {
              if (res.response && res.response.data) {
                if (res.response.data.message) {
                  snackbarRef.showUnknownError(res.response.data.message || res.response.data);
                } else {
                  form.errors.errors = form.recordErrors(res.response.data);
                }
                resolve(false);
              } else {
                form = resetForm();
                resolve(true);
              }
            },
            (error) => reject(false),
          );
      }
    });
  };

  const onInputAlpha = (event: any) => {
    currentAlpha = +event.target.value / MAX_STEP;

    const beforeColor = getThemeColors();
    Color.applyAlpha(beforeColor, currentAlpha);
  };

  // @ts-ignore
  $: {
    // @ts-ignore
    const theme: any = $theme$;
    if (theme) {
      mappedThemes.map((it: any) => {
        it.choose = theme.theme === it.key;
        if (it.choose) {
          currentTheme = theme.theme;
        }

        return it;
      });
      currentAlpha = theme.alpha;
    }
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

  let username = '';
  onMount(() => {
    LanguageStore.sysGetUsedLanguages();
    const userSub = user$.subscribe((res: any) => {
      username = res && res.username;
    });

    return () => {
      userSub.unsubscribe;
    };
  });
</script>

<Snackbar bind:this={snackbarRef} />
<Modal
  beforeOK={saveAccountSettings}
  {defaultWidth}
  {defaultHeight}
  on:containerResize={onResize}
  {menuPath}
  contentClass="full-modal-content"
  fontIcon="<i class='fa fa-user-circle'></i>"
  title={T('COMMON.LABEL.USER_PROFILES')}
  id="userProfilesModalId"
  bind:this={modalRef}>

  <Tabs titleKeys={tabTitleKeys} bind:activeTab>
    {#if activeTab === 'GENERAL'}
      <FloatSelect
        on:change={onApplyLanguage}
        autoLoad={true}
        saveState={true}
        {menuPath}
        bind:this={languageDropdownRef}
        id="localeResourceUsedLanguageSelectId"
        data={$usedLanguages$}
        placeholder={T('COMMON.LABEL.LANGUAGE')} />
    {:else if activeTab === 'ACCOUNT'}
      <form class="form" on:keydown={(event) => form.errors.clear(event.target.name)}>
        <div>
          <InputField readonly={true} bind:value={username} placeholder={T('COMMON.LABEL.USERNAME')} />
        </div>

        <div>
          <PasswordField
            name="currentPassword"
            bind:value={form.currentPassword}
            placeholder={T('COMMON.LABEL.CURRENT_PASSWORD')} />
          <Error {form} field="currentPassword" />
        </div>

        <div>
          <PasswordField
            name="newPassword"
            bind:value={form.newPassword}
            placeholder={T('COMMON.LABEL.NEW_PASSWORD')} />
          <Error {form} field="newPassword" />
        </div>

        <div>
          <PasswordField
            name="confirmPassword"
            bind:value={form.confirmPassword}
            placeholder={T('COMMON.LABEL.CONFIRM_PASSWORD')} />
          <Error {form} field="confirmPassword" />
        </div>
      </form>
    {:else if activeTab === 'THEME'}
      <div style="margin-top: 10px;">
        <svelte:component
          this={ExcelGridComponent}
          {height}
          {menuPath}
          bind:this={excelGridRef}
          id={'gridUserProfilesModal'}
          {columns}
          data={mappedThemes}
          {containerWidth}
          on:changed={onThemeChanged}
          fullWidth={true}>
          <span slot="label" class="label">{T('COMMON.LABEL.CONTROL_LIST')}:</span>
        </svelte:component>
      </div>
      <div>
        <RangeSlider
          on:input={onInputAlpha}
          max={MAX_STEP}
          bind:this={rangeSliderRef}
          value={currentAlpha * MAX_STEP} />
      </div>
    {/if}
  </Tabs>
</Modal>
