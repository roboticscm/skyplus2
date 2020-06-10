<script lang="ts">
  import SC from 'src/components/set-common';
  import { ViewStore } from 'src/store/view';

  // Props
  export let view: ViewStore;
  export let menuPath: string;

  let scRef: any;
</script>

<!--Invisible Element-->
<SC bind:this={scRef} {view} {menuPath} />
<!--//Invisible Element-->

<!--Form controller-->
<section class="view-content-controller">Controller</section>
<!--//Form controller-->

<!--Main content-->
<section class="view-content-main">Content</section>
<!--//Main content-->
