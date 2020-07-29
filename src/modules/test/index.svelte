<script lang="ts">
    import WorkList from './work-list/index.svelte';
    import {ViewStore} from 'src/store/view';

    export let menuPath: string;
    export let callFrom = 'Self';

    const view = new ViewStore(menuPath);
    const tableId = `workList${view.getViewName()}${callFrom.replace('/', '__')}Table`;
</script>

<WorkList {view} {menuPath} {tableId}>

</WorkList>
