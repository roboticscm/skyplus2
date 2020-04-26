<script lang="ts">
  import { AppStore } from '@/store/app';

  // @ts-ignore
  const { isLogged$ } = AppStore;
</script>

<div class="notification">
  {#if $isLogged$}
    <div>
      <i class="notification__chat fa fa-comment" />
    </div>

    <div>
      <i class="notification__functional fa fa-bell" />
    </div>
  {/if}
</div>
