<script lang="ts">
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '@/lib/js/sdate';
  import { Task } from '../../../types';
  import { onMount, createEventDispatcher } from 'svelte';
  import { SObject } from '@/lib/js/sobject';
  import { appStore } from '@/store/app';
  import { User } from '@/model/user';

  export let task: Task;
  export let selectedTask: Task = undefined;

  const { user$ } = appStore;
  const user = user$.value;

  const dispatch = createEventDispatcher();
  let taskTimeRef, assigneeTimeRef: any;

  let progressRatio: number = undefined;

  const onClick = () => {
    dispatch('click', task);
  };

  onMount(() => {});

  // @ts-ignore
  $: {
    const minTime = task.startTime;
    const length = Math.max(task.deadline, task.assigneeEndTime ? task.assigneeEndTime : Date.now()) - minTime;

    if (taskTimeRef) {
      const taskTimeWidth = ((task.deadline - minTime) / length) * 100;
      taskTimeRef.style.width = `${taskTimeWidth}%`;
    }

    if (assigneeTimeRef) {
      const time = task.assigneeEndTime ? task.assigneeEndTime : Date.now();
      const assigneeTimeWidth = ((time - minTime) / length) * 100;
      assigneeTimeRef.style.right = `${100 - assigneeTimeWidth}%`;
      const left = ((task.assigneeStartTime - minTime) / length) * 100;
      if (left >= 0) {
        assigneeTimeRef.style.left = `${left}%`;
      }
    }

    if (task.startTime && task.deadline) {
      const assigneeEndTime = task.assigneeEndTime ? task.assigneeEndTime : Date.now();
      const extraDoingTime = task.deadline - assigneeEndTime;

      progressRatio = Math.round((extraDoingTime / (task.deadline - task.startTime)) * 100);
    }
  }

  const getHuman = (humanNames: string[]) => {
    let index = humanNames.findIndex((humanName: string) => humanName === user.lastName + ' ' + user.firstName);
    if (index < 0) {
      index = 0;
    }
    const tmp = SObject.clone(humanNames);
    tmp.splice(index, 1);
    return [humanNames[index], tmp];
  };

  let moreAssignees: string[] = [];
  let firstAssignee: string = undefined;
  // @ts-ignore
  $: {
    [firstAssignee, moreAssignees] = getHuman(task.assignees);
  }

  let moreAssigners: string[] = [];
  let firstAssigner: string = undefined;
  // @ts-ignore
  $: {
    [firstAssigner, moreAssigners] = getHuman(task.assigners);
  }

  let moreEvaluators: string[] = [];
  let firstEvaluator: string = undefined;
  // @ts-ignore
  $: {
    [firstEvaluator, moreEvaluators] = getHuman(task.evaluators);
  }
</script>

<style lang="scss">
  @import '../sass/sass/helpers/variables.scss';

  .task-wrapper {
    margin-top: $large-padding;
    margin-bottom: $large-padding;
    padding: $default-padding;
    font-size: 1rem;
    font-family: $default-font-family;
    border: $default-border;
    border-radius: $default-border-radius;
    width: 100%;
    &:hover {
      color: var(--my-active-color);
      cursor: pointer;
    }
    &__task {
      position: relative;
      &__name {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 1.1rem;
        font-weight: 500;
      }
      &__status {
        font-size: 0.9rem;
      }

      &__task-time {
        position: absolute;
        left: 0;
        bottom: 0px;
        height: 4px;
        background: rgba(0, 0, 0, 0.3);
      }

      &__assignee-time {
        position: absolute;
        left: 0px;
        bottom: 0px;
        height: 4px;
        background: rgba(255, 0, 0, 0.5);
      }

      &__item {
        display: flex;
        align-content: space-between;
        justify-content: space-between;
        &__assignee {
          font-weight: 500;
        }
      }
    }
    &__project {
      color: var(--readonly-text-color);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 1.1rem;
      text-align: right;
      font-weight: 500;
    }

    &.selected {
      background: var(--selection-bgcolor);
      border: 1px solid var(--my-active-color);
    }

    .horizontal-separator {
      margin-top: $default-padding;
      margin-bottom: $default-padding;
    }
  }
</style>

<div
  class="task-wrapper {selectedTask && task.id.toString() === selectedTask.id.toString() ? 'selected' : ''}"
  on:click={onClick}>
  <div class="task-wrapper__task">
    <div title={T('TASK.LABEL.TASK_NAME') + ': ' + task.name} class="task-wrapper__task__name">{@html task.name}</div>
    <div title={T('TASK.LABEL.PROJECT')} class="task-wrapper__project">
      ({task.projectName || T('TASK.LABEL.NO_PROJECT')})
    </div>

    <div class="task-wrapper__task__item">
      <span class="task-wrapper__task__item__assignee" title={T('TASK.LABEL.ASSIGNEE')}>
        {firstAssignee ? firstAssignee : T('TASK.MSG.NO_ASSIGNEE')}
        {#if moreAssignees && moreAssignees.length > 0}
          <span title={moreAssignees.join(', ')}>(+{moreAssignees.length})</span>
        {/if}
      </span>
      <span title={T('TASK.LABEL.DEADLINE')}>{SDate.convertMillisecondToDateString(task.deadline)}</span>
    </div>

    <div class="horizontal-separator" />

    <div class="task-wrapper__task__item">
      <span title={T('TASK.LABEL.EVALUATOR')}>
        {firstAssigner ? firstAssigner : T('TASK.MSG.NO_ASSIGNER')}
        {#if moreAssigners && moreAssigners.length > 0}
          <span title={moreAssigners.join(', ')}>(+{moreAssigners.length})</span>
        {/if}
      </span>
      <span title={T('TASK.LABEL.LAST_STATUS')} class="task-wrapper__task__status">
        {task.lastStatusName[0] || T('TASK.LABEL.NO_STATUS')}
      </span>
    </div>

    <div class="task-wrapper__task__item">
      <span title={T('TASK.LABEL.ASSIGNER')}>
        {firstEvaluator ? firstEvaluator : T('TASK.MSG.NO_EVALUATOR')}
        {#if moreEvaluators && moreEvaluators.length > 0}
          <span title={moreEvaluators.join(', ')}>(+{moreEvaluators.length})</span>
        {/if}
      </span>

      <span title={T('TASK.LABEL.PRIORITY')}>{task.priorityName ? task.priorityName : T('TASK.MSG.NO_PRIORITY')}</span>
    </div>

    <div style="min-height: 10px; height: 10px;" />

    <div
      title={(progressRatio > 0 ? `EARLY: ${progressRatio}%` : progressRatio === 0 ? `BE ON TIME` : `DELAY: ${-progressRatio}%`) + '\n' + T('COMMON.LABEL.TASK_START_TIME') + ': ' + SDate.convertMillisecondToDateTimeString(task.startTime) + '\n' + T('COMMON.LABEL.TASK_DEADLINE') + ': ' + SDate.convertMillisecondToDateTimeString(task.deadline)}
      bind:this={taskTimeRef}
      class="task-wrapper__task__task-time" />

    {#if task.assigneeStartTime}
      <div
        title={(progressRatio > 0 ? `EARLY: ${progressRatio}%` : progressRatio === 0 ? `BE ON TIME` : `DELAY: ${-progressRatio}%`) + '\n' + T('COMMON.LABEL.ASSIGNEE_START_TIME') + ': ' + SDate.convertMillisecondToDateTimeString(task.assigneeStartTime) + '\n' + (task.assigneeEndTime ? T('COMMON.LABEL.ASSIGNEE_END_TIME') + ': ' + SDate.convertMillisecondToDateTimeString(task.assigneeEndTime) : T('COMMON.LABEL.CURRENT_TIME') + ': ' + SDate.convertMillisecondToDateTimeString(Date.now()))}
        bind:this={assigneeTimeRef}
        class="task-wrapper__task__assignee-time" />
    {/if}
  </div>
</div>
