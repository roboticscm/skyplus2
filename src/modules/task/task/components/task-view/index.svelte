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
    flex-wrap: wrap;
    justify-content: space-between;
    width: 100%;
    &__task {
      width: calc(100% - 100px);
      min-width: 100px;
      &:hover {
        color: var(--my-active-color);
        cursor: pointer;
      }
      &__name {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 1rem;
        font-weight: 500;
      }
      &__status {
        font-size: 0.9rem;
      }

      &__time {
        font-size: 0.9rem;
      }
    }
    &__project {
      width: 100px;
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: var(--readonly-text-color);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &.selected {
      /*font-weight: 500;*/
      background: var(--selection-bgcolor);
    }
  }
</style>

<div
  class="task-wrapper {selectedTask && task.id.toString() === selectedTask.id.toString() ? 'selected' : ''}"
  on:click={onClick}>
  <div class="task-wrapper__task">
    <div title={T('TASK.LABEL.TASK_NAME')} class="task-wrapper__task__name">{task.name}</div>
    <span title={T('TASK.LABEL.ASSIGNER')}>
      {task.assigners ? task.assigners.join(', ') : T('TASK.MSG.NO_ASSIGNER')}
    </span>
    -
    <span title={T('TASK.LABEL.EVALUATOR')}>
      {task.evaluators ? task.evaluators.join(', ') : T('TASK.MSG.NO_EVALUATOR')}
    </span>
    <br />
    <span title={T('TASK.LABEL.LAST_STATUS')} class="task-wrapper__task__status">
      {task.lastStatusName || T('TASK.LABEL.NO_STATUS')}
    </span>
    <span title={T('TASK.LABEL.ASSIGNEE')}>
      ({task.assignees ? task.assignees.join(', ') : T('TASK.MSG.NO_ASSIGNEE')})
    </span>
    <br />
    <span title={T('TASK.LABEL.START_TIME')} class="task-wrapper__task__time">
      {SDate.convertMillisecondToDateString(task.startTime)}
    </span>
    ~
    <span title={T('TASK.LABEL.DEADLINE')}>{SDate.convertMillisecondToDateString(task.deadline)}</span>
  </div>

  <div title={T('TASK.LABEL.PROJECT')} class="task-wrapper__project">
    ({task.projectName || T('TASK.LABEL.NO_PROJECT')})
  </div>
</div>
