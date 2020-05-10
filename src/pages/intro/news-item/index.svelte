<script lang="ts">
  import { News } from '../model';
  import { App, Image } from '@/lib/js/constants';
  import { StringUtil } from '@/lib/js/string-util';
  import { SDate } from '@/lib/js/sdate';

  export let news: News;
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .news-item {
    border: $default-border;
    border-radius: $default-border-radius;
    background: var(--bg-primary);
    min-width: 350px;
    max-width: 350px;
    height: 450px;
    min-height: 450px;
    margin-bottom: calc(3 * #{$default-padding});
    margin-left: $large-padding;
    margin-right: $large-padding;
    display: flex;
    flex-direction: column;
    .thumbnail {
      width: 350px;
      height: 175px;
      display: block;
      border-top-left-radius: $default-border-radius;
      border-top-right-radius: $default-border-radius;
    }
    .news-body {
      padding: $large-padding;
      .news-title {
        font-weight: bold;
        font-size: 1.5rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .news-date {
        padding-bottom: $default-padding;
      }

      .news-intro {
        padding-top: $large-padding;
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.7rem;
      }
    }
  }
</style>

<div class="news-item">
  {#if news}
    <div>

      {#if StringUtil.isEmpty(news.thumbnail)}
        <img class="thumbnail" src={Image.NO_IMAGE} alt="" />
      {:else}
        <img class="thumbnail" src={news.thumbnail} alt="" />
      {/if}
    </div>
    <div class="news-body">
      <div class="news-date">{SDate.convertMillisecondToDateTimeString(news.startDate)}</div>
      <div class="news-title" title={news.title}>{news.title}</div>
      <div class="news-intro" title={news.intro}>{news.intro}</div>
    </div>
  {:else}
    {@html App.PROGRESS_BAR}
  {/if}
</div>
