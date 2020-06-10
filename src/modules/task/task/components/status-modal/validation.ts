import { CommonValidation } from 'src/lib/js/common-validation';

export const validation = (form: any) => {
  const error: any = {};

  if (form.startTime && form.endTime && form.startTime > form.endTime) {
    error.endTime = CommonValidation.END_TIME_MUST_AFTER_START_TIME;
  }

  return error;
};
