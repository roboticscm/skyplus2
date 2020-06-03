import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';
import { appStore } from '@/store/app';

const BASE_URL = 'sys/helper/';

export class HelperStore {
  static isManager(managerId: string, staffId: string, menuPath: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('isManager')}`, {
      managerId,
      staffId,
      menuPath,
      depId: appStore.org.departmentId,
    });
  }
}
