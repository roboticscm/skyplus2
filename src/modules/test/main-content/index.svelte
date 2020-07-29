<script lang="ts">
    import {store} from '../store';

    const {selectedUser$} = store;

</script>

<main class="row">
    {#if $selectedUser$}
        <div class="col-xs-24 col-md-8">
            <input value="{$selectedUser$.lastName}">
        </div>
        <div class="col-xs-24 col-md-8">
            <input value="{$selectedUser$.firstName}">
        </div>
        <div class="col-xs-24 col-md-8">
            <input value="{$selectedUser$.username}">
        </div>
    {:else}
        <div class="col-24">
            No selected data
        </div>
    {/if}
</main>


