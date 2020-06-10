import { T } from 'src/lib/js/locale/locale';
import { StringUtil } from 'src/lib/js/string-util';

export const functionalStatusFields = [
  {
    id: 'isNewStatus',
    status: 'INIT',
    statusCode: 0,
    title: T('COMMON.LABEL.NEW_STATUS'),
    counter: 0,
    active: false,
  },
  {
    id: 'isSubmittedStatus',
    status: 'SUBMITTED',
    statusCode: 1,
    title: T('COMMON.LABEL.SUBMITTED_STATUS'),
    counter: 0,
    active: false,
  },
  {
    id: 'isApprovedStatus',
    status: 'APPROVED',
    statusCode: 2,
    title: T('COMMON.LABEL.APPROVED_STATUS'),
    counter: 0,
    active: false,
  },
  {
    id: 'isProcessingStatus',
    status: 'PROCESSING',
    statusCode: 888,
    title: T('COMMON.LABEL.PROCESSING_STATUS'),
    counter: 0,
    active: true,
  },
  {
    id: 'isCompletedStatus',
    status: 'COMPLETED',
    statusCode: 999,
    title: T('COMMON.LABEL.COMPLETED_STATUS'),
    counter: 0,
    active: false,
  },
  {
    id: 'recent',
    status: 'RECENT',
    statusCode: 777,
    title: T('COMMON.LABEL.RECENT_TASK'),
    counter: undefined,
    active: false,
  },
];

export const getStatusCodeById = (id: string) => {
  const index = functionalStatusFields.findIndex((it: any) => it.id === id);

  if (index >= 0) {
    return functionalStatusFields[index].statusCode;
  }

  return null;
};

export const convertArrayObjectToObject = (arrayObj: any[]) => {
  const objResult: any = {};
  for (let obj of arrayObj) {
    for (let field in obj) {
      if (!StringUtil.isEmpty(obj[field])) {
        objResult[field] = obj[field];
      }
    }
  }

  return objResult;
};
