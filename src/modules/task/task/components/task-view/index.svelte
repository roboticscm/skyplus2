<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { Task } from '../../../types';
  import { createEventDispatcher } from 'svelte';

  export let task: Task;
  export let selectedTask: Task = undefined;

  const dispatch = createEventDispatcher();

  const onClick = () => {
    dispatch('click', task);
  };
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .task-wrapper {
    margin-top: $default-padding;
    padding: $default-padding;
    font-size: 1rem;
    font-family: $default-font-family;
    border: $default-border;
    border-radius: $default-border-radius;
    display: flex;
    justify-content: space-between;
    &__task {
      &:hover {
        font-weight: 500;
        color: var(--my-active-color);
        cursor: pointer;
      }
    }
    &__project {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: var(--readonly-text-color);
    }

    &.selected {
      font-weight: 500;
    }
  }
</style>

<div
  class="task-wrapper {selectedTask && task.id.toString() === selectedTask.id.toString() ? 'selected' : ''}"
  on:click={onClick}>
  <div class="task-wrapper__task">
    <div>{task.name}</div>
    <div>{task.lastStatusName}</div>
    <div>
      {SDate.convertMilisecondToDateString(task.startTime)} ~ {SDate.convertMilisecondToDateString(task.deadline)}
    </div>
  </div>

  <div class="task-wrapper__project">({task.projectName})</div>
</div>
