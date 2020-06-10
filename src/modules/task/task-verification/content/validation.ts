import { CommonValidation } from 'src/lib/js/common-validation';

export const validation = (form: any) => {
  const error: any = {};

  if (!CommonValidation.isLengthBetween(form.code, 0, 10)) {
    error.code = CommonValidation.LENGTH_BETWEEN.replace('%min', '0').replace('%max', '10');
  }

  if (CommonValidation.isEmptyString(form.name)) {
    error.name = CommonValidation.REQUIRED_VALUE;
  }

  if (!CommonValidation.isIntegerNumber((form as any).percent)) {
    error.percent = CommonValidation.INTEGER_NUMBER;
  }

  if (!CommonValidation.isIntegerNumber((form as any).sort)) {
    error.sort = CommonValidation.INTEGER_NUMBER;
  }

  return error;
};
