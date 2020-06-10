import { RxHttp } from 'src/lib/js/rx-http';
import { toSnackCase } from 'src/lib/js/util';
import { Http } from 'src/lib/js/http';
import { Settings } from 'src/model/settings';
import { appStore } from 'src/store/app';
import { SJSON } from 'src/lib/js/sjson';

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
