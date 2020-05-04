<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';

  export let data: any;
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .status-wrapper {
    font-size: 0.9rem;
    font-family: $default-font-family;
  }
</style>

<div class="status-wrapper">
  <div>{SDate.convertMilisecondToDateTimeString(data.date)}</div>
  {#if data.percent}
    <div>{data.percent}</div>
  {/if}

  {#if data.status}
    <div>{data.status}</div>
  {/if}

  <div>{data.note}</div>
  {#if data.attach}
    <div>
      <i class="fa fa-paperclip" />
    </div>
  {/if}
</div>
