import { RxHttp } from 'src/lib/js/rx-http';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Http } from 'src/lib/js/http';
import { toSnackCase } from '../../lib/js/util';
import { Browser, getClientInfo } from 'src/lib/js/browser';

const BASE_URL = 'sys/news/';

export default class Store {
  static dataList$ = new BehaviorSubject<any[]>([]);

  static getList() {
    Http.get(`${BASE_URL}${toSnackCase('getList')}`).then((res) => {
      Store.dataList$.next(res);
    });
  }
}
