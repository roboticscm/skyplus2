import { RxHttp } from '@/lib/js/rx-http';
import { Http } from '@/lib/js/http';
import { getMethodNameInSnackCase } from '@/lib/js/util';
import { SimpleListParam } from '@/model/base';

const BASE_URL = 'sys/table-util/';

export class TableUtilStore {
  static getSimpleList(param: SimpleListParam) {
    return RxHttp.get(`${BASE_URL}${getMethodNameInSnackCase()}`, param);
  }

  static getOneById(tableName: string, id: string) {
    return RxHttp.get(`${BASE_URL}${getMethodNameInSnackCase()}`, {
      tableName,
      id,
    });
  }

  static getAllColumnsOfTable(tableName: string) {
    return RxHttp.get(`${BASE_URL}${getMethodNameInSnackCase()}`, {
      tableName,
    });
  }

  static softDeleteMany(tableName, deletedIds: string[]) {
    return RxHttp.delete(`${BASE_URL}${getMethodNameInSnackCase()}`, {
      tableName,
      deletedIds: deletedIds.join(','),
    });
  }

  static hasAnyDeletedRecord(tableName: string, onlyMe: boolean) {
    return Http.get(`${BASE_URL}${getMethodNameInSnackCase()}`, {
      tableName,
      onlyMe,
    });
  }

  static getAllDeletedRecords(tableName: string, columns: string[], onlyMe: boolean) {
    return Http.get(`${BASE_URL}${getMethodNameInSnackCase()}`, {
      tableName,
      columns: columns.map((it) => `t.${it}`).join(','),
      onlyMe,
    });
  }

  static restoreOrForeverDelete(tableName: string, deleteIds: string, restoreIds: string) {
    return Http.delete(`${BASE_URL}${getMethodNameInSnackCase()}`, {
      tableName,
      deleteIds,
      restoreIds,
    });
  }
}
