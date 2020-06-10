import { RxHttp } from 'src/lib/js/rx-http';
import { toSnackCase } from 'src/lib/js/util';
import { SJSON } from 'src/lib/js/sjson';

const BASE_URL = 'sys/search-util/';

export class SearchUtilStore {
  static findSearchFieldListByMenuPath(menuPath: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('findSearchFieldListByMenuPath')}`, {
      menuPath,
    });
  }

  static updateCounter(field: string, menuPath: string) {
    return RxHttp.post(
      `${BASE_URL}${toSnackCase('updateCounter')}`,
      SJSON.stringify({
        field,
        menuPath,
      }),
    );
  }
}
