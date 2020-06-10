import { CommonValidation } from 'src/lib/js/common-validation';
import { App } from 'src/lib/js/constants';

export const validation = (form: any) => {
  const error: any = {};

  if (!CommonValidation.isMinLength(form.currentPassword, App.MIN_PASSWORD_LENGTH)) {
    error.currentPassword = CommonValidation.MIN_LENGTH.replace('%min%', App.MIN_PASSWORD_LENGTH + '');
  }

  if (!CommonValidation.isMinLength(form.newPassword, App.MIN_PASSWORD_LENGTH)) {
    error.newPassword = CommonValidation.MIN_LENGTH.replace('%min%', App.MIN_PASSWORD_LENGTH + '');
  }

  if (form.currentPassword == form.newPassword) {
    error.newPassword = CommonValidation.NEW_PASSWORD_MUST_BE_NOT_THE_SAME_THE_CURRENT;
  }

  if (form.newPassword !== form.confirmPassword) {
    error.confirmPassword = CommonValidation.PASSWORD_DOES_NOT_MATCH;
  }

  return error;
};
