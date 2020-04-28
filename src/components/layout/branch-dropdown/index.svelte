<script lang="ts">
  import { OrgStore } from '@/store/org';
  import { AppStore } from '@/store/app';
  import { App } from '@/lib/js/constants';

  // @ts-ignore
  const { isLogged$ } = AppStore;
  // @ts-ignore
  const { currentCompany$ } = OrgStore;
</script>

<div class="branch">
  <div class="branch__logo">
    {#if $currentCompany$}
      <span style="display: flex; align-content: center; align-items: center;">
        {#if $isLogged$}
          <i class="fa fa-sort-down" style="padding-right: 20px; " />
        {/if}
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
    {:else}
      {@html App.PROGRESS_BAR}
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
