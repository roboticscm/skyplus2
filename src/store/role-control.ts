import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';

const BASE_URL = 'sys/role-control/';

class RoleControlStore {
  sysGetControlListByDepIdAndUserIdAndMenuPath(depId: any, menuPath: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetControlListByDepIdAndUserIdAndMenuPath')}`, {
      depId,
      menuPath,
    });
  }
}

export const roleControlStore = new RoleControlStore();
