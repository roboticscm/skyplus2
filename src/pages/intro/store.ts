import { RxHttp } from '@/lib/js/rx-http';
import { getMethodNameInSnackCase } from '@/lib/js/util';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Http } from '@/lib/js/http';

const BASE_URL = 'sys/news/';

export default class Store {
  static dataList$ = new BehaviorSubject<any[]>([]);

  static getList() {
    Http.get(`${BASE_URL}${getMethodNameInSnackCase()}`).then((res) => {
      this.dataList$.next(res);
    });
  }
}
