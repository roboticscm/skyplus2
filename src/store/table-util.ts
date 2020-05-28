import { RxHttp } from '@/lib/js/rx-http';
import { Http } from '@/lib/js/http';
import { toSnackCase } from '@/lib/js/util';
import { SimpleListParam } from '@/model/base';

const BASE_URL = 'sys/table-util/';

export class TableUtilStore {
  static getSimpleList(param: SimpleListParam) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('getSimpleList')}`, param);
  }

  static getOneById(tableName: string, id: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('getOneById')}`, {
      tableName,
      id,
    });
  }

  static getAllColumnsOfTable(tableName: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('getAllColumnsOfTable')}`, {
      tableName,
    });
  }

  static softDeleteMany(tableName, deletedIds: string[]) {
    return RxHttp.delete(`${BASE_URL}${toSnackCase('softDeleteMany')}`, {
      tableName,
      deletedIds: deletedIds.join(','),
    });
  }

  static hasAnyDeletedRecord(tableName: string, onlyMe: boolean) {
    return Http.get(`${BASE_URL}${toSnackCase('hasAnyDeletedRecord')}`, {
      tableName,
      onlyMe,
    });
  }

  static getAllDeletedRecords(tableName: string, columns: string[], onlyMe: boolean) {
    return Http.get(`${BASE_URL}${toSnackCase('getAllDeletedRecords')}`, {
      tableName,
      columns: columns.map((it) => `t.${it}`).join(','),
      onlyMe,
    });
  }

  static restoreOrForeverDelete(tableName: string, deleteIds: string, restoreIds: string) {
    return Http.delete(`${BASE_URL}${toSnackCase('restoreOrForeverDelete')}`, {
      tableName,
      deleteIds,
      restoreIds,
    });
  }

  static jsonQuery(query: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('jsonQuery')}`, {
      query,
    });
  }
}
