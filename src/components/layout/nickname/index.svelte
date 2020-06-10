<script lang="ts">
  import { appStore } from 'src/store/app';
  import { StringUtil } from 'src/lib/js/string-util';

  const { user$ } = appStore;
</script>

<div class="nickname">
  {#if $user$}
    {@html '(' + $user$.firstName + ', ' + StringUtil.getFirstWord($user$.lastName) + ')'}
  {/if}
</div>
