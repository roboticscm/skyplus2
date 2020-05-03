export class Task {
  id = '';
  name = '';
  private = false;
  lastStatusName = 'Open';
  startDate = Date.now();
  startDateConfirm = false;
  endDate = Date.now();
  endDateConfirm = false;
  accessDate = Date.now();
  complete = false;
  firstPrompt = Date.now();
  secondPrompt = Date.now();
}

export class TaskStatus {
  id = '';
  name = '';
}


export class Project {
  id = '';
  name = '';
  desc = '';
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
