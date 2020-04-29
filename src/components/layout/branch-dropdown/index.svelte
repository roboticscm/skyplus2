<script lang="ts">
  import { OrgStore } from '@/store/org';
  import { AppStore } from '@/store/app';
  import { App } from '@/lib/js/constants';
  import OrgIconMark from '@/components/layout/icons/org-mark';
  import SkyhubLogo from '@/components/layout/icons/skyhub';
  import NewsStore from '@/pages/intro/store';

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

    <!--    {#if $isLogged$}-->
    <!--      <div class="left-dropdown-content">-->
    <!--        <a class="left-dropdown-content__text" href="'#'">-->
    <!--          <i class="fa fa-cog" />-->
    <!--          setting-->
    <!--        </a>-->
    <!--        <a class="left-dropdown-content__text" href="'#'">-->
    <!--          <i class="fa fa-folder" />-->
    <!--          directory-->
    <!--        </a>-->
    <!--      </div>-->
    <!--    {/if}-->
  </div>
</div>
