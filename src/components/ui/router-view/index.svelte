<script lang="ts">
  import { routerLinkStore } from '../router-link/store';
  import Page404 from 'src/pages/404/index.svelte';
  import PageLoading from 'src/pages/loading/index.svelte';
  import PageIntro from 'src/pages/intro/index.svelte';
  import { roleControlStore } from 'src/store/role-control';
  import { SearchUtilStore } from 'src/store/search-util';
  import { take } from 'rxjs/operators';
  import { AppStore, appStore } from 'src/store/app';
  import { menuStore } from 'src/store/menu';
  import { onMount } from 'svelte';
  import { Subscription, forkJoin } from 'rxjs';

  let TheComponent;
  const { currentComponentUri$ } = routerLinkStore;
  let menuPath: string;
  let fullControl = false;
  let roleControls = [];
  let searchFields: any[] = [];

  const { isLogged$ } = AppStore;
  let selectedId: string;

  const loadComponent = (uri: string) => {
    if (uri && uri.length > 0) {
      import(`src/${uri}`)
        .then((res) => {
          const { default: com } = res;
          TheComponent = com;
        })
        .catch((error) => {
          TheComponent = Page404;
        });
    }
  };

  const loadRoleControlAndSearchField = (uri: string) => {
    const roleControl$ = roleControlStore.sysGetControlListByDepIdAndUserIdAndMenuPath(
      appStore.org.departmentId,
      menuPath,
    );

    const searchField$ = SearchUtilStore.findSearchFieldListByMenuPath(menuPath);

    forkJoin([roleControl$, searchField$]).subscribe((res) => {
      if (res[0].data.fullControl) {
        fullControl = true;
      } else {
        roleControls = res[0].data;
      }

      searchFields = res[1].data;
      loadComponent(uri);
    });
  };

  export const show = (path: string) => {
    currentComponentUri$.next(`modules/${path}/index.svelte`);
  };

  export const show404 = () => {
    TheComponent = Page404;
  };

  export const showLoading = () => {
    TheComponent = PageLoading;
  };

  onMount(() => {
    const componentSub: Subscription = currentComponentUri$.subscribe((res: any) => {
      if (res) {
        menuPath = res.replace('modules/', '').replace('/index.svelte', '');
        loadRoleControlAndSearchField(res);
      }
    });

    const menuSub: Subscription = menuStore.selectedData$.subscribe((selectedMenu: any) => {
      if (selectedMenu === undefined) {
        window.history.pushState('', '', '/');
        showLoading();
      } else if (selectedMenu === null) {
        window.history.pushState('', '', '/');
        show404();
      } else {
        selectedId = selectedMenu.selectedId;
        window.history.pushState('', '', '/' + selectedMenu.path.replace('/', '--'));
        show(selectedMenu.path);
      }
    });

    return () => {
      componentSub.unsubscribe();
      menuSub.unsubscribe();
    };
  });
</script>

{#if $isLogged$}
  <svelte:component this={TheComponent} {menuPath} {fullControl} {roleControls} {selectedId} {searchFields} />
{:else}
  <svelte:component this={PageIntro} />
{/if}
