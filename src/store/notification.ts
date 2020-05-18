import { BehaviorSubject, noop } from 'rxjs';
import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';
import { take } from 'rxjs/operators';
import { Notification } from '@/model/base';
import { SJSON } from '@/lib/js/sjson';
import { SObject } from '@/lib/js/sobject';

export enum NotifyType {
  Chat = 'CHAT',
  Functional = 'FUNCTIONAL',
  Alarm = 'ALARM',
}

const BASE_URL = 'sys/notification/';
export class NotificationStore {
  static data$ = new BehaviorSubject<Notification[]>([]);

  static findNotifications(textSearch: string) {
    RxHttp.get(`${BASE_URL}${toSnackCase('findNotifications')}`, {
      textSearch,
    }).subscribe((res: any) => {
      this.data$.next(res.data.map((it: any) => SObject.convertFieldsToCamelCase(it)));
    });
  }

  static save(data: Notification) {
    return RxHttp.post(`${BASE_URL}${toSnackCase('save')}`, SJSON.stringify(data));
  }

  static update(id: string, isRead: boolean = null, isFinished: boolean = null) {
    return RxHttp.put(
      `${BASE_URL}${toSnackCase('update')}`,
      SJSON.stringify({
        id,
        isRead,
        isFinished,
      }),
    );
  }
}
