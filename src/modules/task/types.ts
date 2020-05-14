import { StringUtil } from '@/lib/js/string-util';
import { genNumberUUID } from '@/lib/js/util';

export class Task {
  id = '';
  name = '';
  description? = '';
  projectId? = '-1';
  projectName? = '';
  isPrivate? = false;
  priorityId? = '-1';
  lastStatusName = 'Open';
  startTime? = Date.now();
  deadline? = Date.now();
  startDateConfirm? = false;
  endDate? = Date.now();
  endDateConfirm? = false;
  evaluateDate? = Date.now();
  complete? = false;
  firstReminder? = Date.now();
  secondReminder? = Date.now();
  submitStatus? = 0;

  // one to many relation
  taskAttachFiles?: any[] = [];
  removeTaskAttachFiles?: any[] = [];
  insertTaskAttachFiles?: any[] = [];

  // Assigner
  assigners?: any[] = [];
  removeAssigners?: any[] = [];
  insertAssigners?: any[] = [];

  // Assignee
  assignees?: any[] = [];
  removeAssignees?: any[] = [];
  insertAssignees?: any[] = [];

  // Evaluator
  evaluators?: any[] = [];
  removeEvaluators?: any[] = [];
  insertEvaluators?: any[] = [];

  // Characteristic
  chars?: any[] = [];
  removeChars?: any[] = [];
  insertChars?: any[] = [];

  // Target Person
  targetPersons?: any[] = [];
  removeTargetPersons?: any[] = [];
  insertTargetPersons?: any[] = [];

  // Target Team
  targetTeams?: any[] = [];
  removeTargetTeams?: any[] = [];
  insertTargetTeams?: any[] = [];

  // assigner status detail
  assignerStatusDetails?: any[] = [];
  removeAssignerStatusDetails?: any[] = [];
  insertAssignerStatusDetails?: any[] = [];
  editAssignerStatusDetails?: any[] = [];
}

export class Status {
  id = '';
  code? = '';
  name = '';
  sort? = 0;
}

export class StatusDetail {
  id? = genNumberUUID();
  taskId? = '';
  statusId? = '';
  verificationId? = '';
  startTime? = Date.now();
  endTime? = Date.now();
  note? = '';
  assignPosition? = '';
  attachFiles: File[] = [];
  status? = '';
  percent? = '';
  submitStatus = 0;
  closeable? = true;
}

export class Priority {
  id = '';
  code? = '';
  name = '';
  sort? = 0;
}

export class Project {
  id = '';
  name = '';
  description? = '';
  sort? = 0;
  completedTask? = 0;
  inProgressTask? = 0;
  notStartedTask? = 0;
}

export class File {
  id = '';
  name = '';
  removeFiles: any[] = [];
  insertFiles: any[] = [];
}

export class TaskQualification {
  id = '';
  name = '';
}

export class TaskVerification {
  id = '';
  code? = '';
  name = '';
  percent? = 0;
  sort? = 0;
}
