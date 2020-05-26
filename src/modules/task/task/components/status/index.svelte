<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { createEventDispatcher } from 'svelte';
  import EditIcon from '@/components/layout/icons/common/edit.svelte';
  import SubmitIcon from '@/components/layout/icons/common/submit.svelte';
  import CancelSubmitIcon from '@/components/layout/icons/common/cancel-submit.svelte';

  export let data: any;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  const onEdit = (event: any) => {
    if (disabled || event.submitStatus === 1) {
      return;
    }

    dispatch('edit', event);
  };

  const onSubmit = (event: any) => {
    if (disabled) {
      return;
    }
    dispatch('submit', event);
  };

  const onView = (event: any) => {
    dispatch('view', event);
  };
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .status-wrapper {
    font-size: 0.9rem;
    font-family: $default-font-family;
    width: 300px;
    position: relative;
    height: 100%;
    &__submit {
      position: absolute;
      right: 46px;
      bottom: 0px;
      width: 16px;
      height: 16px;
    }

    &__edit {
      position: absolute;
      right: 6px;
      bottom: 0px;
      width: 16px;
      height: 16px;
    }
  }

  .status-wrapper-hover {
    .status-wrapper__controller:hover {
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }
  }
</style>

<div class="status-wrapper {disabled ? '' : 'status-wrapper-hover'}" on:click|stopPropagation={() => onView(data)}>
  <div style="display:flex;">
    <div style="width: 50%;">{T('COMMON.LABEL.START')}: {SDate.convertMillisecondToDateTimeString(data.startTime)}</div>
    <div style="width: 50%;">{T('COMMON.LABEL.END')}: {SDate.convertMillisecondToDateTimeString(data.endTime)}</div>
  </div>

  <div style="overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; margin-top: 5px;" title={data.note}>
    {@html data.note}
  </div>

  {#if data.status}
    <div>{data.status}</div>
  {:else}{T('TASK.MSG.NO_STATUS')}{/if}

  <div style="display:flex; justify-content: space-between;">
    <div>
      {#if data.attachFiles && data.attachFiles.length > 0}
        <i class="fa fa-paperclip" />
        ({data.attachFiles.length})
      {/if}
    </div>
    <div class="label-link status-wrapper__submit" on:click|stopPropagation={() => onSubmit(data)}>
      {#if data.submitStatus === 1}
        <CancelSubmitIcon />
      {:else}
        <!--        <SubmitIcon />-->
        <i class="primary fa fa-arrow-up" style="font-size: 1.3rem;" />
      {/if}
    </div>
    <div class="label-link status-wrapper__edit" on:click|stopPropagation={() => onEdit(data)}>
      <EditIcon disabled={data.submitStatus === 1} />
    </div>
  </div>

</div>
