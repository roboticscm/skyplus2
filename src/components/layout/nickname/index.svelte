<script lang="ts">
  import { appStore } from '@/store/app';
  import { StringUtil } from '@/lib/js/string-util';

  const { user$ } = appStore;
</script>

<div class="nickname">
  {#if $user$}
    (
    {@html $user$.firstName + ', ' + StringUtil.getFirstWord($user$.lastName)}
    )
  {/if}
</div>
