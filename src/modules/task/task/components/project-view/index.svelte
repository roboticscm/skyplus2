<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { Project } from '../../../types';
  import Chart from 'chart.js';
  import { onMount } from 'svelte';

  export let project: Project;

  let canvasRef: any;

  onMount(() => {
    const ctx = canvasRef.getContext('2d');

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [T('TASK.LABEL.DONE'), T('TASK.LABEL.IN_PROGRESS'), T('TASK.LABEL.NOT_STARTED')],
        datasets: [
          {
            data: [project.completedTask, project.inProgressTask, project.notStartedTask],
            backgroundColor: ['green', 'red', 'yellow'],
          },
        ],
      },
    });
  });
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .project-wrapper {
    font-size: 1rem;
    font-family: $default-font-family;
    border: $default-border;
    border-radius: $default-border-radius;
  }
</style>

<div class="project-wrapper">
  <div>
    <div>{project.name}</div>
    <div>{T('TASK.LABEL.TOTAL_TASK')}: {project.completedTask + project.inProgressTask + project.notStartedTask}</div>
    <div>{T('TASK.LABEL.COMPLETE_TASK')}: {project.completedTask}</div>
    <div>{T('TASK.LABEL.IN_PROGRESS_TASK')}: {project.inProgressTask}</div>
    <div>{T('TASK.LABEL.NOT_STARTED_TASK')}: {project.notStartedTask}</div>
  </div>
  <canvas bind:this={canvasRef} width="200" height="200" />
</div>
