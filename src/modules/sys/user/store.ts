import { orgStore } from 'src/store/org';
import { catchError, first, skip, take, withLatestFrom, zipAll } from 'rxjs/operators';
import { BehaviorSubject, forkJoin, of, zip } from 'rxjs';
import { ViewStore } from 'src/store/view';
import { Http } from 'src/lib/js/http';
import { toSnackCase } from 'src/lib/js/util';
import { RxHttp } from 'src/lib/js/rx-http';

const BASE_URL = 'sys/human-or-org/';

export default class Store {
  constructor(public viewStore: ViewStore) {}
  availableDep$ = new BehaviorSubject<any[]>([]);
  assignedDep$ = new BehaviorSubject<any[]>([]);

  completeLoading$ = forkJoin([
    this.availableDep$.pipe(
      skip(1),
      catchError((error) => of([])),
      first(),
    ),
    this.viewStore.completeLoading$,
  ]);
  completeSelecting$ = zip(
    this.availableDep$.pipe(
      skip(1),
      catchError((error) => of([])),
    ),
    this.assignedDep$.pipe(
      skip(1),
      catchError((error) => of([])),
    ),
    this.viewStore.selectedData$.pipe(
      skip(1),
      catchError((error) => of([])),
    ),
  );

  static sysGetUserInfoById(userId: string) {
    return Http.get(`${BASE_URL}sys-get-user-info-by-id`, {
      userId,
    });
  }

  static sysGetUserListByOrgId(orgId: any) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetUserListByOrgId')}`, {
      orgId: orgId,
      includeDeleted: false,
      includeDisabled: false,
    });
  }

  loadAvailableDep(humanId: string) {
    return orgStore.sysGetHumanOrgTree(humanId);
  }

  loadAssignedDep(humanId: string) {
    return orgStore.sysGetAssignedHumanOrgTree(humanId);
  }

  static findAvatars(userIds: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('findAvatars')}`, {
      userIds,
    });
  }
}
