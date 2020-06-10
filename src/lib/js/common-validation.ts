import { StringUtil } from 'src/lib/js/string-util';

export class CommonValidation {
  public static DEADLINE_MUST_AFTER_START_TIME = 'TASK.MSG.DEADLINE_MUST_AFTER_START_TIME';
  public static END_TIME_MUST_AFTER_START_TIME = 'TASK.MSG.END_TIME_MUST_AFTER_START_TIME';
  public static SECOND_REMINDER_MUST_AFTER_THE_FIRST = 'TASK.MSG.SECOND_REMINDER_MUST_AFTER_THE_FIRST';
  public static EVALUATE_TIME_MUST_AFTER_ASSIGNEE_START_TIME = 'TASK.MSG.EVALUATE_TIME_MUST_AFTER_ASSIGNEE_START_TIME';
  public static PASSWORD_DOES_NOT_MATCH = 'COMMON.MSG.PASSWORD_DOES_NOT_MATCH';
  public static NEW_PASSWORD_MUST_BE_NOT_THE_SAME_THE_CURRENT =
    'COMMON.MSG.NEW_PASSWORD_MUST_BE_NOT_THE_SAME_THE_CURRENT';

  public static REQUIRED_VALUE = 'COMMON.MSG.REQUIRED_VALUE';
  public static SELECT_AT_LEAST_ONE_LEAF_NODE = 'COMMON.MSG.LEASE_SELECT_AT_LEAST_ONE_LEAF_NODE';
  public static SELECT_AT_LEAST_ONE_NODE = 'COMMON.MSG.LEASE_SELECT_AT_LEAST_ONE_NODE';
  public static isEmptyString(source: string) {
    if (!source) {
      return true;
    }

    return source.trim().length === 0;
  }

  public static MIN_LENGTH = 'COMMON.MSG.VALUE_MUST_BE_AT_LEAST_%min%_CHARS';
  public static isMinLength(source: string, min: number) {
    if (!source) {
      return false;
    }

    return source.trim().length >= min;
  }

  public static LENGTH_BETWEEN = 'COMMON.MSG.VALUE_MUST_BE_BETWEEN_%min_AND_%max_CHARS';
  public static isLengthBetween(source: string, min: number, max: number) {
    if (!source && min === 0) {
      return true;
    }
    return source.trim().length >= min && source.trim().length <= max;
  }

  public static INTEGER_NUMBER = 'COMMON.MSG.REQUIRED_INTEGER_NUMBER';
  public static isIntegerNumber(source: string) {
    const reg = new RegExp(/^[-+]?[0-9]\d*$/);
    return reg.test(source);
  }

  public static INTEGER_NUMBER_IN_RANGE = 'COMMON.MSG.INTEGER_NUMBER_IN_RANGE';
  public static isIntegerInRange(source: string, from: number, to: number) {
    const reg = new RegExp(/^\d+$/);
    const isNumber = reg.test(source);

    if (!isNumber) {
      return false;
    }

    const number = Number(source);
    return number >= from && number <= to;
  }

  public static INVALID_EMAIL = 'COMMON.MSG.INVALID_EMAIL';
  public static isValidEmail(email: string) {
    if (StringUtil.isEmpty(email)) {
      return true;
    }
    const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return reg.test(String(email).toLowerCase());
  }
}
