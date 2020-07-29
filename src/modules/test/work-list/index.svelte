<script lang="ts">
    import SimpleWorkList from 'src/components/work-list/simple-work-list';
    import {ViewStore} from 'src/store/view';

    export let view: ViewStore;
    export let menuPath: string;
    export let tableId: string;
</script>

<SimpleWorkList {view} {menuPath} {tableId}></SimpleWorkList>