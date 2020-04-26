<script lang="ts">
  import { routerLinkStore } from '../router-link/store';
  import Page404 from '@/pages/404/index.svelte';
  import PageIntro from '@/pages/intro/index.svelte';
  import { roleControlStore } from '@/store/role-control';
  import { take, first, catchError, skip } from 'rxjs/operators';
  import { AppStore, appStore } from '@/store/app';

  let TheComponent;
  const { currentComponentUri$ } = routerLinkStore;
  let menuPath: string;
  let fullControl = false;
  let roleControls = [];

  const { isLogged$ } = AppStore;

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

  // @ts-ignore
  $: {
    // @ts-ignore
    const uri = $currentComponentUri$;
    if (uri) {
      menuPath = uri.replace('modules/', '').replace('/index.svelte', '');
      loadRoleControl(uri);
    }
  }
</script>

{#if $isLogged$}
  <svelte:component this={TheComponent} {menuPath} {fullControl} {roleControls} />
{:else}
  <svelte:component this={PageIntro} />
{/if}
