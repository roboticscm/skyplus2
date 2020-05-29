<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { T } from '@/lib/js/locale/locale';
  import { StringUtil } from '@/lib/js/string-util';
  import { ButtonType, ButtonId } from '../button/types';
  import { ButtonDropdown } from '../button/model';
  import DropdownItem from '@/components/ui/dropdown-item';
  import { Dropdown } from '@/lib/js/dropdown';

  export let id: string = undefined;
  export let type = 'button';
  export let text = '';
  export let title = '';
  export let btnType = ButtonType.Custom;
  export let icon = '';
  export let className = 'btn-flat';
  export let disabled = false;
  export let running = false;
  export let action: any = undefined;
  export let showIcon = true;
  export let dropdownList: ButtonDropdown[] = [];
  export let uppercase = true;
  // export let dropdownList: ButtonDropdown[] = [
  //   { id: 'ITEM1', name: 'Demo Item1', useFontIcon: true, fontIcon: '<i class="fab fa-skyatlas"></i>' },
  //   { id: 'ITEM2', name: 'Demo Item2', useFontIcon: true, fontIcon: '<i class="fa fa-adjust"></i>' },
  //   { id: 'ITEM3', name: 'Demo Item3', useFontIcon: true, fontIcon: '<i class="fa fa-allergies"></i>' },
  // ];

  let IconComponent: any = undefined;

  const dispatch = createEventDispatcher();
  let btnRef: any;
  export const getTarget = () => {
    return btnRef;
  };

  const preset = (_id: string, _title: string, _icon: string, _className: string) => {
    if (StringUtil.isEmpty(id) && !StringUtil.isEmpty(_id)) {
      id = _id;
    }
    if (StringUtil.isEmpty(text) && !StringUtil.isEmpty(_title)) {
      text = T(`COMMON.BUTTON.${_title}`);
    }
    if (StringUtil.isEmpty(icon) && !StringUtil.isEmpty(_icon)) {
      icon = _icon;
    }

    if (StringUtil.isEmpty(className) && !StringUtil.isEmpty(_className)) {
      className = _className;
    }
  };

  // @ts-ignore
  $: {
    switch (+btnType) {
      case ButtonType.Reset:
        preset(undefined, 'RESET', '<i class="fa fa-redo-alt"></i>', 'btn-flat');
        break;
      case ButtonType.AddNew:
        preset(ButtonId.AddNew, 'ADD_NEW', 'add-new', 'btn-flat');
        break;
      case ButtonType.Save:
        preset(ButtonId.Save, 'SAVE', 'save', 'btn-flat');
        break;
      case ButtonType.Delete:
        preset(ButtonId.Delete, 'DELETE', 'delete', 'btn-flat');
        break;
      case ButtonType.Edit:
        preset(ButtonId.Edit, 'EDIT', 'edit', 'btn-flat');
        break;
      case ButtonType.Update:
        preset(ButtonId.Update, 'UPDATE', 'update', 'btn-flat');
        break;
      case ButtonType.Config:
        preset(ButtonId.Config, 'CONFIG', 'config', 'btn-flat');
        break;
      case ButtonType.TrashRestore:
        preset(ButtonId.TrashRestore, 'TRASH_RESTORE', 'trash-restore', 'btn-flat');
        break;
      case ButtonType.CloseModal:
        preset(undefined, undefined, '<i class="fa fa-times"></i>', 'btn-flat');
        break;
      case ButtonType.OkModal:
        preset(undefined, 'OK', '<i style="color:#20b04b;" class="fa fa-check"></i>', 'btn-success');
        break;
      case ButtonType.CancelModal:
        preset(undefined, 'CANCEL', '<i style="color:red;" class="fa fa-times"></i>', 'btn-danger');
        break;
      case ButtonType.Apply:
        preset(undefined, 'APPLY', '<i class="fa fa-check"></i>', 'btn-flat');
        break;
      case ButtonType.SelectAll:
        preset(undefined, undefined, '<i class="fa fa-check-double"></i>', 'btn-small-info');
        break;
      case ButtonType.UnSelectAll:
        preset(undefined, undefined, '<i class="fa fa-minus-square"></i>', 'btn-small-success');
        break;
      case ButtonType.ToggleSelection:
        preset(undefined, undefined, '<i class="fa fa-toggle-on"></i>', 'btn-small-primary');
        break;
      case ButtonType.Submit:
        preset(ButtonId.Submit, 'SUBMIT', 'submit', 'btn-flat');
        break;
      case ButtonType.CancelSubmit:
        preset(ButtonId.CancelSubmit, 'CANCEL_SUBMIT', 'cancel-submit', 'btn-flat');
        break;
      case ButtonType.Approve:
        preset(ButtonId.Approve, 'APPROVE', '<i class="fa fa-check"></i>', 'btn-flat');
        break;
      case ButtonType.CancelApprove:
        preset(ButtonId.CancelApprove, 'CANCEL_APPROVE', '', 'btn-flat');
        break;
      case ButtonType.Assign:
        preset(ButtonId.Assign, 'ASSIGN', 'assign', 'btn-flat');
        break;
      case ButtonType.UnAssign:
        preset(ButtonId.UnAssign, 'UN_ASSIGN', 'un-assign', 'btn-flat');
        break;

      case ButtonType.Hold:
        preset(ButtonId.Hold, 'HOLD', 'hold', 'btn-flat');
        break;
      case ButtonType.UnHold:
        preset(ButtonId.UnHold, 'UN_HOLD', 'un-hold', 'btn-flat');
        break;

      case ButtonType.Dashboard:
        preset(ButtonId.Dashboard, 'DASHBOARD', 'dashboard', 'btn-flat');
        break;
      default:
    }

    if (icon && !icon.includes('<')) {
      import(`@/icons/${icon}.svelte`).then((res: any) => {
        IconComponent = res.default;
      });
    }
  }

  const useAction = (component, param) => {
    if (action) {
      action.register(component, param);
    }
  };

  const onClickItem = (item: ButtonDropdown) => {
    dispatch('itemClick', item);
    console.log(item);
    Dropdown.hide(`dropdown${id}`);
  };

  const onMouseover = () => {
    Dropdown.show(`dropdown${id}`);
  };

  const onMouseout = () => {
    Dropdown.hide(`dropdown${id}`);
  };
</script>

<button
  {title}
  use:useAction
  bind:this={btnRef}
  {id}
  {type}
  class="{className}
  {uppercase ? 'uppercase' : ''}"
  {disabled}
  on:click|stopPropagation>
  {#if running}
    <i class="fa fa-spinner fa-spin" />
  {:else if showIcon}
    {#if icon && icon.includes('<')}
      {@html icon}
    {:else}
      <svelte:component this={IconComponent} className={disabled ? 'readonly-svg-color' : ''} />
      &nbsp; &nbsp;
    {/if}
  {/if}
  {text}
  {#if dropdownList && dropdownList.length > 0}
    <i on:mouseover={onMouseover} on:mouseout={onMouseout} class="dropdown-mark-icon fa fa-angle-down">
      <div id={`dropdown${id}`} class="dropdown-content">
        {#each dropdownList as item}
          <DropdownItem
            on:click={(e) => onClickItem(item)}
            useFontIcon={item.useFontIcon}
            fontIcon={item.fontIcon}
            iconData={item.iconData}
            text={item.name} />
        {/each}
      </div>
    </i>
  {/if}
</button>
