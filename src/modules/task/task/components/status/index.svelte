<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { createEventDispatcher } from 'svelte';

  export let data: any;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  const onEdit = (event: any) => {
    dispatch('edit', event);
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
    &__controller {
      position: absolute;
      right: 6px;
      bottom: 4px;
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

  {#if data.percent}
    <div>{data.percent}</div>
  {/if}

  {#if data.status}
    <div>{data.status}</div>
  {/if}

  <div>{data.note}</div>

  <div style="display:flex; justify-content: space-between;">
    <div>
      {#if data.attachFiles &&  data.attachFiles.length > 0}
        <i class="fa fa-paperclip" /> ({data.attachFiles.length})
      {/if}
    </div>
    <div class="label-link status-wrapper__controller" on:click|stopPropagation={() => onEdit(data)}>{T('COMMON.LABEL.EDIT')}</div>
  </div>

</div>
