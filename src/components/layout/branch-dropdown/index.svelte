<script lang="ts">
  import { OrgStore } from 'src/store/org';
  import { AppStore } from 'src/store/app';
  import { App } from 'src/lib/js/constants';
  import OrgIconMark from 'src/components/layout/icons/org-mark';
  import SkyhubLogo from 'src/components/layout/icons/skyhub';
  import NewsStore from 'src/pages/intro/store';

  // @ts-ignore
  const { dataList$ } = NewsStore;
  // @ts-ignore
  const { isLogged$ } = AppStore;
  // @ts-ignore
  const { currentCompany$ } = OrgStore;
</script>

<div class="branch">
  <div class="branch__logo">
    {#if $isLogged$}
      <span style="display: flex; align-content: center; align-items: center;">
        <OrgIconMark />
        {#if $currentCompany$.useFontIcon}
          <span>
            {@html $currentCompany$.fontIcon}
          </span>
        {:else if $currentCompany$.iconData}
          <img src={$currentCompany$.iconData} alt="" />
        {:else}
          <span>
            <i class="fa fa-bars" />
          </span>
        {/if}
      </span>
    {:else if $dataList$ && $dataList$.length > 0}
      <SkyhubLogo className="skyhub-small-logo" />
    {/if}
  </div>
</div>
