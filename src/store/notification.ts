import { BehaviorSubject, noop } from 'rxjs';
import { RxHttp } from 'src/lib/js/rx-http';
import { toSnackCase } from 'src/lib/js/util';
import { take } from 'rxjs/operators';
import { Notification } from 'src/model/base';
import { SJSON } from 'src/lib/js/sjson';
import { SObject } from 'src/lib/js/sobject';
import { getUserId } from 'src/lib/js/security';

export enum NotifyType {
  Chat = 'CHAT',
  Functional = 'FUNCTIONAL',
  Alarm = 'ALARM',
}

export enum MessageType {
  Submit = 'SUBMIT',
  Assign = 'ASSIGN',
  Hold = 'HOLD',
  Update = 'UPDATE',
  Complete = 'COMPLETE',
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
