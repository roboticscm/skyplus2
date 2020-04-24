<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {AppStore} from '@/store/app';
  import {StringUtil} from '@/lib/js/string-util';
  import {T} from '@/lib/js/locale/locale';
  import {of} from 'rxjs';
  import Autocomplete from '@/components/ui/input/autocomplete';
  import {SearchType} from './types';

  export let id: string;
  export let menuPath: string;

  let placeholder;
  let type = 'search';

  let inputRef: any;
  let searchWrapperRef: any;
  let searchWrapperWidth: number;
  const dispatch = createEventDispatcher();
  const {isLogged$} = AppStore;
  const passwordClass = ['suntech-circle', 'suntech-asterisk', 'suntech-x', 'suntech-run', 'suntech-heart'];
  let username: string;
  let password: string;
  let loginCount = 0;

  // @ts-ignore
  $: if($isLogged$){
    placeholder = T('SYS.MSG.WHAT_ARE_YOU_THINKING_ABOUT') + '?';
  } else {
    placeholder = T('SYS.MSG.YOU_CAN_LOGIN_OR_SEARCH') + '!';
  }

  const onLogin = (rawData: string) => {
    console.log(loginCount);
    // TODO username = extract(rawData)
    if (loginCount === 1) {
      placeholder = 'Enter your password';
      type = "password";
      inputRef.clear();
      inputRef.focus();
    } else {
      loginCount = 0;
      placeholder = placeholder;
      type = 'search';
      inputRef.clear();
      inputRef.focus();
      isLogged$.next(true);
      console.log('type ', type);
    }

  }

  const onSuggest = (event: any) => {
    console.log(event);
    // @ts-ignore
    if($isLogged$) {

    } else {
      switch (event.detail.id) {
        case SearchType.Login:
          loginCount++;
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
    let data: any [];
    if (StringUtil.isEmpty(textSearch)) {
      data=[];
      // @ts-ignore
    } else if (!$isLogged$) {
      data = [
        {id: SearchType.Login, name: `${T('SYS.LABEL.LOGIN_WITH')} <b>${textSearch}</b>`},
        {id: SearchType.Search, name: `${T('SYS.LABEL.SEARCH_WITH')} <b>${textSearch}</b>`},
      ];
    } else {
      // TODO
      data = [
        {id: SearchType.Search, name: `${T('SYS.LABEL.SEARCH_AFTER_LOGGED_IN')} <b>${textSearch}</b>`},
      ];
    }
    return of({data});
  }

  onMount(() => {
    searchWrapperWidth = window['$'](searchWrapperRef).width();
  });

  const onShowPopup = () => {
    if(searchWrapperRef) {
      searchWrapperRef.classList.remove('search-bar-wrapper-rounded-border');
      searchWrapperRef.classList.add('search-bar-wrapper-top-rounded-border');
    }
  }

  const onHidePopup = () => {
    if(searchWrapperRef) {
      searchWrapperRef.classList.remove('search-bar-wrapper-top-rounded-border');
      searchWrapperRef.classList.add('search-bar-wrapper-rounded-border');
    }
  }
</script>

<div class="search-bar-wrapper search-bar-wrapper-rounded-border" bind:this={searchWrapperRef}>


  <Autocomplete columns={[{ name: 'name', type: 'html' }]}
                on:showPopup={onShowPopup}
                on:hidePopup={onHidePopup}
                className="rounded-border-auto-dropdown"
                searchFunc={suggestFunction}
                popupWidth={searchWrapperWidth}
                {id}
                {menuPath}
                {type}
                {placeholder}
                bind:this={inputRef}
                on:change={onSuggest}></Autocomplete>
<!--  <input-->
<!--    class="form-control"-->
<!--    {type}-->
<!--    on:focus={onFocus}-->
<!--    on:keyup={onRealtimeSearch}-->
<!--    bind:this={inputRef}-->
<!--    {placeholder}-->
<!--    autocomplete="off"-->
<!--    readonly />-->
<!--  <i class="fa fa-search" on:click={onSearch} />-->
</div>

