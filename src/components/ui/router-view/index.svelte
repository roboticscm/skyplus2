<script lang="ts">
  import { routerLinkStore } from '../router-link/store';
  import Page404 from '@/pages/404/index.svelte';
  import PageLoading from '@/pages/loading/index.svelte';
  import PageIntro from '@/pages/intro/index.svelte';
  import { roleControlStore } from '@/store/role-control';
  import { take } from 'rxjs/operators';
  import { AppStore, appStore } from '@/store/app';
  import { menuStore } from '@/store/menu';
  import { onMount } from 'svelte';
  import { Subscription } from 'rxjs';

  let TheComponent;
  const { currentComponentUri$ } = routerLinkStore;
  let menuPath: string;
  let fullControl = false;
  let roleControls = [];

  const { isLogged$ } = AppStore;
  let selectedId: string;

  const loadComponent = (uri: string) => {
    if (uri && uri.length > 0) {
      import(`@/${uri}`)
        .then((res) => {
          const { default: com } = res;
          TheComponent = com;
        })
        .catch((error) => {
          TheComponent = Page404;
        });
    }
  };

  const loadRoleControl = (uri: string) => {
    roleControlStore
      .sysGetControlListByDepIdAndUserIdAndMenuPath(appStore.org.departmentId, menuPath)
      .pipe(take(1))
      .subscribe((res) => {
        if (res.data.fullControl) {
          fullControl = true;
        } else {
          roleControls = res.data;
        }
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
        loadRoleControl(res);
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
  <svelte:component this={TheComponent} {menuPath} {fullControl} {roleControls} {selectedId} />
{:else}
  <svelte:component this={PageIntro} />
{/if}
