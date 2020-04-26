<script lang="ts">
  import { routerLinkStore } from './store';
  import { createEventDispatcher } from 'svelte';
  import { take, skip } from 'rxjs/operators';
  import { T } from '@/lib/js/locale/locale';
  import { menuStore } from '@/store/menu';
  import { StringUtil } from '@/lib/js/string-util';

  // @ts-ignore
  const { currentComponentUri$ } = routerLinkStore;
  const dispatch = createEventDispatcher();

  export let __path: string = '/';
  export let activeClass: string = '';
  export let className: string = '';

  export let menuName: string;

  // @ts-ignore
  $: name = T(`COMMON.MENU.${menuName}`);

  const navigate = (ctx, next) => {
    const path = ctx.path.replace('--', '/');
    const comUri = `modules${path}/index.svelte`;
    dispatch('navigate', path);

    currentComponentUri$.next(comUri);
    // menuStore.dataList$.pipe(skip(1), take(1)).subscribe((_) => {
    //   currentComponentUri$.next(comUri);
    // });
  };

  let isActiveComponent;
  // @ts-ignore
  $: {
    // @ts-ignore
    const uri = StringUtil.replaceAll($currentComponentUri$, '/', '--');
    const path = __path.replace('/', '--') + '--';
    isActiveComponent = uri.includes(path);
  }

  const onMouseoverMore = (event, menuCode: string) => {
    console.log(menuCode);
    return false;
  };

  const onClick = (path: string) => {
    window.history.pushState('', '', path);
    const _path = path.replace('--', '/');
    const comUri = `modules${_path}/index.svelte`;
    dispatch('navigate', _path);
    currentComponentUri$.next(comUri);
  };
</script>

<div
  id={__path.replace('/', '')}
  on:click={() => onClick(__path)}
  class="nav-item {className}
  {isActiveComponent ? activeClass : ''}">
  {@html name}
  <span>&nbsp;&nbsp;</span>
  <i class="fa fa-angle-down" on:mouseover={(e) => onMouseoverMore(e, menuName)} />
</div>
