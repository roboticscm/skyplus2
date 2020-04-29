<script lang="ts">
  import { routerLinkStore } from './store';
  import { createEventDispatcher } from 'svelte';
  import { take, skip } from 'rxjs/operators';
  import { T } from '@/lib/js/locale/locale';
  import { menuStore } from '@/store/menu';
  import { StringUtil } from '@/lib/js/string-util';
  import { Dropdown } from '../../../lib/js/dropdown';
  import { ButtonDropdown } from '@/components/ui/button/model';
  import DropdownItem from '@/components/ui/dropdown-item';

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

  const onMouseoverMore = (menuCode: string) => {
    console.log(menuCode);
    Dropdown.show('dropdown' + menuCode);
  };

  const onMouseoutMore = (menuCode: string) => {
    Dropdown.hide('dropdown' + menuCode);
  };

  const onClick = (path: string) => {
    window.history.pushState('', '', path);
    const _path = path.replace('--', '/');
    const comUri = `modules${_path}/index.svelte`;
    dispatch('navigate', _path);
    currentComponentUri$.next(comUri);
  };

  const exampleDropdownList: ButtonDropdown[] = [
    { id: 'ITEM1', name: 'Demo Item1', useFontIcon: true, fontIcon: '<i class="fab fa-skyatlas"></i>' },
    { id: 'ITEM2', name: 'Demo Item2', useFontIcon: true, fontIcon: '<i class="fa fa-adjust"></i>' },
    { id: 'ITEM3', name: 'Demo Item3', useFontIcon: true, fontIcon: '<i class="fa fa-allergies"></i>' },
  ];

  const onClickItem = (menuCode: String, item: ButtonDropdown) => {
    console.log(item);
    Dropdown.hide('dropdown' + menuCode);
  };
</script>

<div
  id={__path.replace('/', '')}
  on:click={() => onClick(__path)}
  class="nav-item {className}
  {isActiveComponent ? activeClass : ''}">
  {@html name}

  <!--  <i-->
  <!--    class="dropdown-mark-icon fa fa-angle-down"-->
  <!--    on:mouseover={() => onMouseoverMore(menuName)}-->
  <!--    on:mouseout={() => onMouseoutMore(menuName)}>-->
  <!--    {#if menuName === 'MENU'}-->
  <!--      <div id="dropdownMENU" class="dropdown-content">-->
  <!--        {#each exampleDropdownList as item}-->
  <!--          <DropdownItem-->
  <!--            on:click={(e) => onClickItem('MENU', item)}-->
  <!--            useFontIcon={item.useFontIcon}-->
  <!--            fontIcon={item.fontIcon}-->
  <!--            iconData={item.iconData}-->
  <!--            text={item.name} />-->
  <!--        {/each}-->
  <!--      </div>-->
  <!--    {:else if menuName === 'ROLE_DETAIL'}-->
  <!--      <div id="dropdownROLE_DETAIL" class="dropdown-content">-->
  <!--        {#each exampleDropdownList as item}-->
  <!--          <DropdownItem-->
  <!--            on:click={(e) => onClickItem('ROLE_DETAIL', item)}-->
  <!--            useFontIcon={item.useFontIcon}-->
  <!--            fontIcon={item.fontIcon}-->
  <!--            iconData={item.iconData}-->
  <!--            text={item.name} />-->
  <!--        {/each}-->
  <!--      </div>-->
  <!--    {:else if menuName === 'ASSIGNMENT_ROLE'}-->
  <!--      <div id="dropdownASSIGNMENT_ROLE" class="dropdown-content">-->
  <!--        {#each exampleDropdownList as item}-->
  <!--          <DropdownItem-->
  <!--            on:click={(e) => onClickItem('ASSIGNMENT_ROLE', item)}-->
  <!--            useFontIcon={item.useFontIcon}-->
  <!--            fontIcon={item.fontIcon}-->
  <!--            iconData={item.iconData}-->
  <!--            text={item.name} />-->
  <!--        {/each}-->
  <!--      </div>-->
  <!--    {/if}-->
  <!--  </i>-->
</div>
