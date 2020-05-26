<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Split from 'split-grid';
  import { applyLayout } from './helper';
  import { appStore } from '@/store/app';
  // import { settingsStore } from '@/store/settings';
  import { App, GUTTER_WIDTH } from '@/lib/js/constants';
  import { AppStore } from '@/store/app';

  const { isLogged$ } = AppStore;

  const defaultHeaderHeight = '96px';

  onMount(async () => {
    Split({
      rowSnapOffset: App.MIN_HEADER_HEIGHT,
      rowGutters: [
        {
          track: 1,
          element: document.querySelector('.layout-horizontal-gutter'),
        },
      ],
      onDrag: (direction: any, track: number, gridTemplateStyle: string) => {
        applyLayout();
      },
      onDragEnd: (direction: any, track: number) => {
        const gridEle: any = document.querySelector('.layout-container');
        let [headerHeight] = gridEle.style['grid-template-rows'].split(' ');

        if (headerHeight && +headerHeight.replace('px', '') > App.MAX_HEADER_HEIGHT) {
          // @ts-ignore
          // headerHeight = $isLogged$ ? defaultHeaderHeight : '46px';
          headerHeight = defaultHeaderHeight;
          const gridEle: any = document.querySelector('.layout-container');
          gridEle.style['grid-template-rows'] = `${headerHeight} ${GUTTER_WIDTH}px auto`;
          // applyLayout();
        }
        // settingsStore.saveUserSettings({
        //   menuPath: 'sys/main-layout',
        //   controlId: 'mainLayoutId',
        //   keys: ['lastHeaderHeight'],
        //   values: [headerHeight],
        // });
      },
    });

    // apply main layout - header height
    const gridEle: any = document.querySelector('.layout-container');
    appStore.theme$.subscribe((theme) => {
      gridEle.style['grid-template-rows'] = `${defaultHeaderHeight} ${GUTTER_WIDTH}px auto`;

      // if (theme) {
      //   gridEle.style['grid-template-rows'] = `${defaultHeaderHeight} 10px auto`;
      // } else {
      //   gridEle.style['grid-template-rows'] = `46px ${gutterHeight} auto`;
      // }
    });

    // applyLayout();
  });
</script>

<div class="layout-container">
  <div class="layout-header-wrapper">
    <slot name="header">Header Section</slot>
  </div>
  <div class="layout-horizontal-gutter" />
  <div class="layout-content">
    <slot>Content Section</slot>
  </div>
</div>
