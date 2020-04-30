import { Http } from '@/lib/js/http';
import { toSnackCase } from '@/lib/js/util';
import { SJSON } from '@/lib/js/sjson';

const BASE_URL = 'sys/menu-control/';

class MenuControlStore {
  sysGetControlListByMenuPath(menuPath: string) {
    return Http.get(`${BASE_URL}${toSnackCase('sysGetControlListByMenuPath')}`, {
      menuPath: menuPath,
    });
  }
  saveOrUpdateOrDelete(obj: any) {
    return Http.post(`${BASE_URL}${toSnackCase('saveOrUpdateOrDelete')}`, SJSON.stringify(obj));
  }
}

export const menuControlStore = new MenuControlStore();
