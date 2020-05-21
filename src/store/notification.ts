import { BehaviorSubject, noop } from 'rxjs';
import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';
import { take } from 'rxjs/operators';
import { Notification } from '@/model/base';
import { SJSON } from '@/lib/js/sjson';
import { SObject } from '@/lib/js/sobject';
import { getUserId } from '@/lib/js/security';

export enum NotifyType {
  Chat = 'CHAT',
  Functional = 'FUNCTIONAL',
  Alarm = 'ALARM',
}

const BASE_URL = 'sys/notification/';
class NotificationStore {
  data$ = new BehaviorSubject<Notification[]>([]);

  findNotifications(type, textSearch: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('findNotifications')}`, {
      type,
      textSearch,
    });
  }

  save(data: Notification) {
    return RxHttp.post(`${BASE_URL}${toSnackCase('save')}`, SJSON.stringify(data));
  }

  update(id: string, isRead: boolean = null, isFinished: boolean = null) {
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

export const notificationStore = new NotificationStore();
