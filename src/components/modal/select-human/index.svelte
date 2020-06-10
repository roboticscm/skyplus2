<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from 'src/components/ui/modal/base/index.svelte';
  import { T } from 'src/lib/js/locale/locale';
  import TreeView from 'src/components/ui/tree-view';
  import { orgStore } from 'src/store/org';
  import QuickSearch from 'src/components/ui/float-input/quick-search';
  import { fromEvents } from 'src/lib/js/rx';
  import { map, switchMap } from 'rxjs/operators';
  import { Observable } from 'rxjs';

  export let menuPath: string;
  export let id: string;
  export let excludeHumanIds = '';

  let modalRef: any;
  const defaultWidth = 800;
  const defaultHeight = 400;
  let data: any[] = [];
  let quickSearchRef: any;
  let treeRef: any;

  export const show = (human: any[]) => {
    setTimeout(() => {
      quickSearchRef && quickSearchRef.focus();
      treeRef.checkNodeByIds(human.map((it: any) => 'human' + it.id));
    }, 100);

    return new Promise((resolve, reject) => {
      resolve(modalRef.show());
    });
  };

  onMount(() => {
    orgStore.sysGetOwnerOrgHumanTree('', excludeHumanIds).subscribe((res) => {
      data = res.data;
    });
  });

  const doFilter = (ob$: Observable<any>) => {
    ob$
      .pipe(switchMap(() => orgStore.sysGetOwnerOrgHumanTree(quickSearchRef.getTextSearch(), excludeHumanIds)))
      .subscribe((res) => {
        data = res.data;
      });
  };

  const useFilterAction = {
    register(component: HTMLElement, param: any) {
      const events$ = fromEvents(component, 'keyup', 'click').pipe(
        map((event: any) => {
          return {
            type: event.type,
            value: event.target.value,
          };
        }),
      );
      doFilter(events$);
    },
  };

  export const getCheckedLeafNodes = (checked = true) => {
    return treeRef.getCheckedLeafNodes(checked);
  };
</script>

<Modal
  {defaultWidth}
  {defaultHeight}
  {menuPath}
  contentClass="full-modal-content"
  fontIcon="<i class='fa fa-cog'></i>"
  title={T('COMMON.LABEL.SELECT_HUMAN')}
  {id}
  bind:this={modalRef}>
  <QuickSearch action={useFilterAction} bind:this={quickSearchRef} placeholder={T('COMMON.LABEL.FILTER') + '...'} />
  <TreeView bind:this={treeRef} {data} radioType="checkbox" isCheckableNode={true} />
</Modal>
