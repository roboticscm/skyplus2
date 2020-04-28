import { BehaviorSubject } from 'rxjs';

export enum NotifyType {
  Chat,
  Functional,
}

export enum NotifyStatus {
  Unread,
  Read,
  Finished,
}

export interface Notify {
  type: NotifyType;
  status: NotifyStatus;
  title: string;
  dataMenuPath: string;
  dataId: string;
}

export default class NotifyStore {
  static notifyList$ = new BehaviorSubject<Notify[]>([]);

  static update(notifyList: Notify[]) {
    this.notifyList$.next(notifyList);
  }

  static fetch() {}
}
