<script lang="ts">
  import {AppStore, appStore } from '@/store/app';
  // import { menuStore } from '@/store/menu';
  import { onMount, setContext } from 'svelte';
  import MainLayout from '@/components/layout/main-layout';
  // import MainNavBar from '@/components/layout/main-nav-bar';
  // import BranchDropdown from '@/components/layout/branch-dropdown';
  // import ModulesDropdown from '@/components/layout/modules-dropdown';
  // import UserProfiles from '@/components/layout/user-profiles';
  // import HistoryNavBar from '@/components/layout/history-nav-bar';
  import SearchBar from '@/components/ui/input/search-bar';
  import { T } from '@/lib/js/locale/locale';
  import RouterView from '@/components/ui/router-view';
  // import { skip, take } from 'rxjs/operators';

  const {isLogged$} = AppStore;

  let searchPlaceholder: string;
  let searchType = "text";


  onMount(() => {

  });

  const onSearch = (event: any) => {
      console.log(event.detail);
  };
  const onRealtimeSearch = (event: any) => {};

  const onClick = () => {
      isLogged$.next(!$isLogged$);
      searchType='password';
  }



</script>

<MainLayout>
  <nav slot="header" class="layout-header">
    <div class="header-left">
<!--      <BranchDropdown />-->
<!--      <MainNavBar />-->
        <button on:click={onClick}></button>
    </div>

    <div class="header-center w-100">
      <SearchBar
              id="mainSearchBarId"
              menuPath="intro"/>
    </div>

    <div class="header-right">
      <!--      <HistoryNavBar />-->
      <div class="seperator" />
<!--      <ModulesDropdown id="moduleId" />-->
<!--      <UserProfiles />-->
    </div>
  </nav>

  <div slot="default" style="height: 100%;">
    <RouterView hashbang={false} />
  </div>
</MainLayout>