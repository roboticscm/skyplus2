<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from 'src/components/ui/modal/base/index.svelte';
  import { T } from 'src/lib/js/locale/locale';
  import TreeView from 'src/components/ui/tree-view';
  import { OrgStore } from 'src/store/org';
  import { fromEvents } from 'src/lib/js/rx';
  import { map, switchMap } from 'rxjs/operators';
  import { Observable } from 'rxjs';

  export let menuPath: string;
  export let id: string;

  let modalRef: any;
  const defaultWidth = 800;
  const defaultHeight = 400;
  let data: any[] = [];
  let treeRef: any;

  export const show = (human: any[]) => {
    setTimeout(() => {
      treeRef.checkNodeByIds(human.map((it: any) => it.id));
    }, 100);

    return new Promise((resolve, reject) => {
      resolve(modalRef.show());
    });
  };

  onMount(() => {
    OrgStore.sysGetOwnerOrgTree('').subscribe((res) => {
      data = res.data;
    });
  });

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
  title={T('COMMON.LABEL.SELECT_ORG')}
  {id}
  bind:this={modalRef}>
  <TreeView bind:this={treeRef} {data} radioType="checkbox" isCheckableNode={true} />
</Modal>
