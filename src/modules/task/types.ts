export class Task {
  id = '';
  name = '';
  projectId? = '';
  projectName? = '';
  private? = false;
  lastStatusName = 'Open';
  startDate? = Date.now();
  startDateConfirm? = false;
  endDate? = Date.now();
  endDateConfirm? = false;
  evaluateDate? = Date.now();
  complete? = false;
  firstPrompt? = Date.now();
  secondPrompt? = Date.now();
}

export class TaskStatus {
  id = '';
  name = '';
}

export class Project {
  id = '';
  name = '';
  desc? = '';
  completedTask? = 0;
  inProgressTask? = 0;
  notStartedTask? = 0;
}

export class File {
  id = '';
  name = '';
  fullPath = '';
}

export class QuantitativeComment {
  id = '';
  name = '';
}

export class QualitativeComment {
  id = '';
  name = '';
}
