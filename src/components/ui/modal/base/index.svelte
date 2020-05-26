<script lang="ts">
  import Button from '@/components/ui/flat-button';
  import { ButtonType, ButtonPressed } from '@/components/ui/button/types';
  import { ModalType, ModalId } from '@/components/ui/modal/types';
  import { createModal } from '../use-modal';
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { StringUtil } from '@/lib/js/string-util';
  import { T } from '@/lib/js/locale/locale';
  import CustomPasswordInput from '@/components/ui/input/custom-password-input';
  import TextInput from '@/components/ui/input/text-input';
  import NumberInput from '@/components/ui/float-input/number-input';
  import { appStore } from '@/store/app';
  import Form from '@/lib/js/form/form';
  import { toSnackCase } from '@/lib/js/util';
  import { catchError } from 'rxjs/operators';
  import { of } from 'rxjs';
  import { App } from '@/lib/js/constants';
  import { passwordChar } from '@/components/ui/input/autocomplete/helper';
  import { Browser } from '@/lib/js/browser';
  import CloseIcon from '@/components/layout/icons/common/cancel-submit.svelte';
  import Error from '@/components/ui/error';

  const dispatch = createEventDispatcher();
  export let id: string;
  export let title = '';
  export let fontIcon = '';
  export let iconData = '';
  export let showControlButton = true;
  export let menuPath: string;
  export let modalType: ModalType = ModalType.Custom;
  export let showOkButton = true;
  export let showCancelButton: boolean = undefined;
  export let showCloseButton = true;
  export let contentClass = 'modal-content';
  export let okButtonTitle: string = undefined;
  export let cancelButtonTitle: string = undefined;
  export let defaultHeight: number = undefined; // in pixel
  export let defaultWidth: number = undefined; // in pixel
  export let transparent = true;
  export let wrapperClass = '';
  export let beforeOK: Function = undefined;

  let modalWrapperRef: any;
  let modalRef: any;
  let passwordRef, inputNumberRef: any;
  let displayPasswordChar = passwordChar();
  let disabled = false;
  let minValue = 1,
    maxValue: number = undefined;
  const useModal = createModal(menuPath, defaultWidth, defaultHeight);

  const onResize = (event: any) => {
    if (modalRef) {
      useModal.state.width = modalRef.style.width;
      useModal.state.height = modalRef.style.height;
      dispatch('containerResize', {
        width: useModal.state.width,
        height: useModal.state.height,
      });
    }
  };

  const debounceTime = (ms, fn) => {
    let timer;
    return function() {
      clearTimeout(timer);
      let args = Array.prototype.slice.call(arguments);
      // @ts-ignore
      args.unshift(this);
      timer = setTimeout(fn.bind.apply(fn, args), ms);
    };
  };

  // @ts-ignore
  let resizeObserver: any;

  if (Browser.getBrowser() !== 'Safari') {
    // @ts-ignore
    resizeObserver = new ResizeObserver(debounceTime(100, onResize));
  }
  let form: any = new Form({
    username: appStore.user && appStore.user.username,
    password: '',
    inputNumber: 1,
  });

  const onMouseUp = (event) => {
    useModal.saveModalState(modalRef);
    dispatch('mouseUp', undefined);
  };

  export const show = (content: string = '', _disabled = false, min = 0, max = undefined, defaultValue = undefined) => {
    minValue = min;
    maxValue = max;
    form.errors.errors = {};

    disabled = _disabled;
    return new Promise((resolve, reject) => {
      useModal.state.content = content;
      useModal.state.resolve = resolve;
      form.reset();
      form = new Form({
        username: appStore.user.username,
        password: '',
        inputNumber: defaultValue || 1,
      });

      setTimeout(() => {
        passwordRef && passwordRef.focus();
        passwordRef && passwordRef.clear();
      }, 200);

      setTimeout(() => {
        inputNumberRef && inputNumberRef.focus();
      }, 200);

      modalWrapperRef.classList.add('show-modal');
    });
  };

  const onCLose = () => {
    useModal.closeModal(modalWrapperRef, ButtonPressed.Close);
  };

  const onCancel = () => {
    useModal.closeModal(modalWrapperRef, ButtonPressed.Cancel);
  };

  const onOK = () => {
    if (beforeOK) {
      beforeOK().then((res) => {
        if (res) {
          useModal.closeModal(modalWrapperRef, ButtonPressed.OK);
        }
      });
    } else {
      useModal.closeModal(modalWrapperRef, ButtonPressed.OK);
    }
  };

  onMount(() => {
    useModal.loadSettings(modalRef);
    useModal.dragElement(modalRef);
    resizeObserver && resizeObserver.observe(modalRef);
  });

  onDestroy(() => {
    if (modalRef) {
      resizeObserver && resizeObserver.unobserve(modalRef);
    }
  });

  function loginWithoutGenToken() {
    if (passwordRef) {
      form.password = passwordRef && passwordRef.getPassword();

      form
        .post(`sys/auth/${toSnackCase('loginWithoutGenToken')}`)
        .pipe(
          catchError((error) => {
            return of(error);
          }),
        )
        .subscribe((res: any) => {
          if (res.response && res.response.data) {
            // error
            form.errors.errors = form.recordErrors(res.response.data);
          } else {
            if (useModal.state.resolve) {
              modalWrapperRef.classList.remove('show-modal');
              useModal.state.resolve(ButtonPressed.OK);
            }
          }
        });
    }

    if (inputNumberRef) {
      onOK();
    }
  }

  export const getHeight = () => {
    return useModal.state.height;
  };

  const preset = (
    _id: string,
    _title: string,
    _fontIcon: string,
    _showCancelButton: boolean,
    _okButtonTitle: string = undefined,
    _cancelButtonTitle: string = undefined,
  ) => {
    if (StringUtil.isEmpty(id) && !StringUtil.isEmpty(_id)) {
      id = _id;
    }
    if (StringUtil.isEmpty(title) && !StringUtil.isEmpty(_title)) {
      title = T(`COMMON.LABEL.${_title}`);
    }
    if (StringUtil.isEmpty(fontIcon) && !StringUtil.isEmpty(_fontIcon)) {
      fontIcon = _fontIcon;
    }

    if (showCancelButton === undefined && _showCancelButton !== undefined) {
      showCancelButton = _showCancelButton;
    }

    if (okButtonTitle === undefined && _okButtonTitle !== undefined) {
      okButtonTitle = T(`COMMON.BUTTON.${_okButtonTitle}`);
    }

    if (cancelButtonTitle === undefined && _cancelButtonTitle !== undefined) {
      cancelButtonTitle = T(`COMMON.BUTTON.${_cancelButtonTitle}`);
    }
  };

  // @ts-ignore
  $: {
    switch (+modalType) {
      case ModalType.Alert:
        preset(ModalId.Alert, 'ALERT', '<i class="fa fa-exclamation-circle"></i>', false);
        break;

      case ModalType.Confirm:
        preset(ModalId.Confirm, 'CONFIRM', '<i class="fa fa-question-circle"></i>', true, 'YES', 'NO');
        break;

      case ModalType.ConfirmPassword:
        preset(ModalId.ConfirmPassword, 'CONFIRM_PASSWORD', '<i class="fa fa-key"></i>', true, 'YES', 'NO');
        break;

      case ModalType.InputText:
        preset(ModalId.InputText, 'INPUT_TEXT', '<i class="fab fa-adn"></i>', true);
        break;

      case ModalType.InputNumber:
        preset(ModalId.InputNumber, 'INPUT_NUMBER', '<i class="fa fa-sort-numeric-up"></i>', true);
        break;

      case ModalType.Custom:
        preset(undefined, undefined, undefined, true);
        break;
    }
  }

  export const getInputNumber = () => {
    return form.inputNumber;
  };

  export const raiseError = (err: string) => {
    form.errors.errors = form.recordErrors({
      inputNumber: err,
    });
  };
</script>

<style lang="scss">

</style>

<div bind:this={modalWrapperRef} class="modal-wrapper {wrapperClass} {transparent ? '' : 'modal-wrapper-background'}">
  <form on:submit|preventDefault={loginWithoutGenToken} on:keydown={(e) => form.errors.clear(e.currentTarget.name)}>
    <div bind:this={modalRef} {id} class="modal" on:mouseup={onMouseUp}>
      <div id={id + 'header'} class="modal-header">
        <div class="modal-title">
          <div>
            {#if iconData}
              <img src={iconData} alt="No Image" />
            {:else if fontIcon}
              {@html fontIcon}
            {:else}
              {@html App.DEFAULT_ICON}
            {/if}
            {@html title}
          </div>
        </div>
        <div>
          {#if showCloseButton}
            <div class="modal-header__close" on:click={onCLose}>
              <CloseIcon />
            </div>
          {/if}
        </div>
      </div>

      <div class={contentClass}>
        {@html useModal.state.content}

        {#if modalType === ModalType.ConfirmPassword}
          <div class="row">
            <div style="text-align: right;" class="label col-6">{T('COMMON.LABEL.USERNAME')}:</div>
            <div class="col-18">
              <TextInput name="username" bind:value={form.username} disabled={true} />
              {#if form.errors.has('username')}
                <div class="error">{form.errors.get('username')}</div>
              {/if}
            </div>
          </div>

          <div class="row">
            <div style="text-align: right;" class="label col-6">{T('COMMON.LABEL.PASSWORD')}:</div>
            <div class="col-18">
              <CustomPasswordInput displayChar={displayPasswordChar} name="password" bind:this={passwordRef} />
              {#if form.errors.has('password')}
                <div class="error">{form.errors.get('password')}</div>
              {/if}
            </div>
          </div>
        {/if}

        {#if modalType === ModalType.InputNumber}
          <NumberInput
            bind:this={inputNumberRef}
            name="inputNumber"
            placeholder={T('COMMON.LABEL.INPUT_NUMBER')}
            min={minValue}
            max={maxValue}
            bind:value={form.inputNumber} />
          <Error {form} field="inputNumber" />
        {/if}

        <slot />
      </div>

      {#if showControlButton}
        <div class="modal-controller">
          {#if showOkButton}
            {#if modalType === ModalType.ConfirmPassword}
              <Button showIcon={true} type="submit" btnType={ButtonType.OkModal} title={okButtonTitle} {disabled} />
            {:else}
              <Button showIcon={true} on:click={onOK} btnType={ButtonType.OkModal} title={okButtonTitle} {disabled} />
            {/if}
          {/if}
          {#if showCancelButton}
            <Button showIcon={true} on:click={onCancel} btnType={ButtonType.CancelModal} title={cancelButtonTitle} />
          {/if}
        </div>
      {/if}
    </div>
  </form>
</div>
