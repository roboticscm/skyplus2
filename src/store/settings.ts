import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';
import { Http } from '@/lib/js/http';
import { Settings } from '@/model/settings';
import { appStore } from '@/store/app';
import { SJSON } from '@/lib/js/sjson';

const BASE_URL = 'sys/user-settings/';

class SettingsStore {
  sysGetUserSettings(companyId: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetUserSettings')}`, {
      companyId,
    });
  }

  getUserSettings(controlId: string, menuPath: string) {
    return Http.get(`${BASE_URL}${toSnackCase('getUserSettings')}`, {
      menuPath,
      controlId,
    });
  }

  saveUserSettings(obj: Settings) {
    return Http.post(`${BASE_URL}${toSnackCase('saveOrUpdate')}`, SJSON.stringify(obj));
  }
}

export const settingsStore = new SettingsStore();
