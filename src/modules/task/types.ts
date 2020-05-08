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

  // one to many relation
  taskAttachFile?: any[] = [];
  removeTaskAttachFile?: any[] = [];
  insertTaskAttachFile?: any[] = [];
}

export class TaskStatus {
  id = '';
  name = '';
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
  fullPath = '';
}

export class TaskQualification {
  id = '';
  name = '';
}

export class TaskVerification {
  id = '';
  name = '';
}
