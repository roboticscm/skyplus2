<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { AppStore } from '@/store/app';
  import { StringUtil } from '@/lib/js/string-util';
  import { T } from '@/lib/js/locale/locale';
  import { of } from 'rxjs';
  import Autocomplete from '@/components/ui/input/autocomplete';
  import { SearchType } from './types';
  import { extractTemplate } from './helper';
  import { AuthStore } from '@/store/auth';
  import Snackbar from '@/components/ui/snackbar';
  import { loginSuccess, setHeader } from '@/lib/js/security';
  import { loadMenuAndUserSettings } from '@/main';

  export let id: string;
  export let menuPath: string;

  let placeholder;
  let type = 'search';

  let snackbarRef: any;
  let inputRef: any;
  let searchWrapperRef: any;
  const dispatch = createEventDispatcher();
  const { isLogged$ } = AppStore;
  const passwordClass = ['suntech-circle', 'suntech-asterisk', 'suntech-x', 'suntech-run', 'suntech-heart'];
  let username: string;
  let password: string;
  let remember = false;
  let loginCount = 0;

  const recalcPlaceholder = (isLogged: boolean) => {
    if (isLogged) {
      placeholder = T('SYS.MSG.WHAT_ARE_YOU_THINKING_ABOUT') + '?';
    } else {
      placeholder = T('SYS.MSG.LOGIN_OR_SEARCH_HERE') + '!';
    }
  };
  // @ts-ignore
  $: recalcPlaceholder($isLogged$);

  const doLogin = (username: string, password: string) => {
    AuthStore.login({
      username,
      password,
    })
      .then((res: any) => {
        if (res && res.loginResult === 'SUCCESS') {
          didLogin(res);
        } else {
          snackbarRef && snackbarRef.show(T(`SYS.MSG.${res.loginResult}`));
        }
      })
      .catch((error: any) => {
        snackbarRef && snackbarRef.show(T(`SYS.MSG.${error.loginResult}`));
      });
  };

  const didLogin = (loginInfo: any) => {
    loginCount = 0;
    type = 'search';
    inputRef.clear();
    inputRef.focus();

    AppStore.rememberLogin = remember;
    loginSuccess(loginInfo.userId, loginInfo.token);
    setHeader(loginInfo.userId, loginInfo.token);
    loadMenuAndUserSettings(loginInfo.companyId);
  };

  const onLogin = (rawData: string) => {
    if (loginCount === 1) {
      username = extractTemplate(rawData, '<b>', '</b>');
      placeholder = T('SYS.MSG.ENTER_YOUR_PASSWORD');
      type = 'password';
      inputRef.clear();
      inputRef.focus();
    } else {
      if (loginCount > 1) {
        password = extractTemplate(rawData, '<b>', '</b>');
        if (!StringUtil.isEmpty(password)) {
          // do login
          doLogin(username, password);
        } else {
          // validate error
          snackbarRef && snackbarRef.show(T('SYS.MSG.PASSWORD_MUST_NOT_BE_BLANK'));
        }
      }
    }
  };

  const onSuggest = (event: any) => {
    // @ts-ignore
    if ($isLogged$) {
    } else {
      switch (event.detail.id) {
        case SearchType.Login:
          loginCount++;
          if (loginCount === 1) {
            remember = false;
          }
          onLogin(event.detail.name);
          break;
        case SearchType.LoginWithRemember:
          loginCount++;
          remember = true;
          onLogin(event.detail.name);
          break;
        case SearchType.Search:
          break;
        default:
          break;
      }
    }
  };

  const onFocus = (event) => {
    inputRef.removeAttribute('readonly');
  };

  const suggestFunction = (textSearch: string) => {
    let data: any[];
    if (StringUtil.isEmpty(textSearch)) {
      data = [];
      // @ts-ignore
    } else if (!$isLogged$) {
      data = [
        { id: SearchType.Login, name: `${T('SYS.LABEL.LOGIN_WITH')} <b>${textSearch}</b>` },
        {
          id: SearchType.LoginWithRemember,
          name: `${T('SYS.LABEL.LOGIN_WITH')} <b>${textSearch}</b> (${T('COMMON.LABEL.REMEMBER')})`,
        },
        { id: SearchType.Search, name: `${T('SYS.LABEL.SEARCH_WITH')} <b>${textSearch}</b>` },
      ];
    } else {
      // TODO
      data = [{ id: SearchType.Search, name: `${T('SYS.LABEL.SEARCH_AFTER_LOGGED_IN')} <b>${textSearch}</b>` }];
    }
    return of({ data });
  };

  const onShowPopup = () => {
    if (searchWrapperRef) {
      searchWrapperRef.classList.remove('search-bar-wrapper-rounded-border');
      searchWrapperRef.classList.add('search-bar-wrapper-top-rounded-border');
    }
  };

  const onHidePopup = () => {
    if (searchWrapperRef) {
      searchWrapperRef.classList.remove('search-bar-wrapper-top-rounded-border');
      searchWrapperRef.classList.add('search-bar-wrapper-rounded-border');
    }
  };

  const onClickBack = () => {
    // @ts-ignore
    recalcPlaceholder($isLogged$);
    type = 'search';
    inputRef.clear();
    inputRef.focus();
    loginCount = 0;
  };
</script>

<Snackbar bind:this={snackbarRef} />
<div class="search-bar-wrapper search-bar-wrapper-rounded-border" bind:this={searchWrapperRef}>

  <Autocomplete
    container={searchWrapperRef}
    columns={[{ name: 'name', type: 'html' }]}
    on:showPopup={onShowPopup}
    on:hidePopup={onHidePopup}
    className="rounded-border-auto-dropdown"
    searchFunc={suggestFunction}
    {id}
    {menuPath}
    {type}
    {placeholder}
    bind:this={inputRef}
    on:clickBack={onClickBack}
    on:change={onSuggest} />
</div>
