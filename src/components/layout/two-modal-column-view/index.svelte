<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Split from 'split-grid';
  import { GUTTER_WIDTH } from 'src/lib/js/constants';
  import { settingsStore } from 'src/store/settings';
  import { Settings } from 'src/model/settings';

  export let showTitle: boolean = true;
  export let id: string = '';
  export let menuPath: string;
  export let minLeftPane = false;
  export let defaultLeftWidth = '260px'; // in pixel

  let contentSplit: any;

  const createSplit = () => {
    // loadSettings
    settingsStore.getUserSettings(`left${id}`, menuPath).then((res: any[]) => {
      const found = res.find((it) => it.key === 'lastLeftWidth');

      let leftWidth = defaultLeftWidth;
      if (found) {
        leftWidth = found.value;
      }

      let containerEle: any;
      if (showTitle) {
        containerEle = document.querySelector('.view-container-2-col');
      } else {
        containerEle = document.querySelector('.view-container-2-col-modal');
      }

      containerEle.style['grid-template-columns'] = `${minLeftPane ? 0 : leftWidth} ${GUTTER_WIDTH}px auto`;
    });

    return Split({
      columnGutters: [
        {
          track: 1,
          element: document.querySelector('.left-modal-grid-vertical-gutter'),
        },
      ],
      onDragEnd: (direction: any, track: number) => {
        let gridEle: any;
        if (showTitle) {
          gridEle = document.querySelector('.view-container-2-col');
        } else {
          gridEle = document.querySelector('.view-container-2-col-modal');
        }

        const [leftWidth] = gridEle.style['grid-template-columns'].split(' ');

        settingsStore.saveUserSettings(
          new Settings({
            menuPath: menuPath,
            controlId: `left${id}`,
            keys: ['lastLeftWidth'],
            values: [leftWidth],
          }),
        );
      },
    });
  };

  onMount(() => {
    contentSplit = createSplit();
  });

  onDestroy(() => {
    if (contentSplit) {
      contentSplit.destroy();
    }
  });
</script>

<main class={showTitle ? 'view-container-2-col' : 'view-container-2-col-modal'}>
  <div class="view-left">
    <slot name="viewLeft" />
  </div>
  <div class="left-modal-grid-vertical-gutter" />
  <div class="view-content">
    <slot />
  </div>
</main>
