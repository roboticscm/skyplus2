import { T } from '@/lib/js/locale/locale';

export const filterColumns = [
    {
        id: 'taskName',
        name: T('TASK.LABEL.TASK_NAME'),
        type: 'text'
    },
    {
        id: 'projectName',
        name: T('TASK.LABEL.PROJECT_NAME'),
        type: 'text'
    },
    {
        id: 'assignee',
        name: T('TASK.LABEL.ASSIGNEE'),
        type: 'text'
    },
    {
        id: 'assigner',
        name: T('TASK.LABEL.ASSIGNER'),
        type: 'text'
    },
    {
        id: 'evaluator',
        name: T('TASK.LABEL.EVALUATOR'),
        type: 'text'
    },
    {
        id: 'completed',
        name: T('TASK.LABEL.COMPLETED'),
        type: 'boolean'
    },
    {
        id: 'createdDate',
        name: T('TASK.LABEL.CREATED_DATE'),
        type: 'date'
    },
];