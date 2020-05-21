import { T } from '@/lib/js/locale/locale';
import {StringUtil} from "@/lib/js/string-util";

export const filterColumns = [
  {
    id: 'taskName',
    name: T('TASK.LABEL.TASK_NAME'),
    type: 'text',
  },
  {
    id: 'projectName',
    name: T('TASK.LABEL.PROJECT_NAME'),
    type: 'text',
  },
  {
    id: 'assigneeName',
    name: T('TASK.LABEL.ASSIGNEE'),
    type: 'text',
  },
  {
    id: 'assignerName',
    name: T('TASK.LABEL.ASSIGNER'),
    type: 'text',
  },
  {
    id: 'evaluatorName',
    name: T('TASK.LABEL.EVALUATOR'),
    type: 'text',
  },
  {
    id: 'isCompleted',
    name: T('TASK.LABEL.COMPLETED'),
    type: 'boolean',
  },
  {
    id: 'isDelayDeadline',
    name: T('TASK.LABEL.DELAY_DEADLINE'),
    type: 'boolean',
  },
  {
    id: 'createdDate',
    name: T('TASK.LABEL.CREATED_DATE'),
    type: 'date',
  },
];


export  const convertArrayObjectToObject = (arrayObj: any[]) => {
  const objResult: any = {};
  for(let obj of arrayObj) {
    for(let field in obj) {
      if(!StringUtil.isEmpty(obj[field])) {
        objResult[field] = obj[field];
      }
    }
  }

  return objResult;
}