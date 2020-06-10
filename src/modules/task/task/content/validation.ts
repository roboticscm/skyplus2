import { CommonValidation } from 'src/lib/js/common-validation';

export const validation = (form: any) => {
  const error: any = {};

  if (CommonValidation.isEmptyString(form.name)) {
    error.name = CommonValidation.REQUIRED_VALUE;
  }

  if (form.startTime && form.deadline && form.startTime >= form.deadline) {
    error.deadline = CommonValidation.DEADLINE_MUST_AFTER_START_TIME;
  }

  if (form.firstReminder && form.secondReminder && form.firstReminder >= form.secondReminder) {
    error.secondReminder = CommonValidation.SECOND_REMINDER_MUST_AFTER_THE_FIRST;
  }

  if (form.assigneeStartTime && form.assigneeEndTime && form.assigneeStartTime >= form.assigneeEndTime) {
    error.assigneeEndTime = CommonValidation.END_TIME_MUST_AFTER_START_TIME;
  }

  if (form.assigneeStartTime && form.evaluateTime && form.assigneeStartTime >= form.evaluateTime) {
    error.evaluateTime = CommonValidation.EVALUATE_TIME_MUST_AFTER_ASSIGNEE_START_TIME;
  }
  return error;
};
