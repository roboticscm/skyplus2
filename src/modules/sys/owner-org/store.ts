import { RxHttp } from 'src/lib/js/rx-http';
import { toSnackCase } from 'src/lib/js/util';
import { ViewStore } from 'src/store/view';
import { OrgStore } from 'src/store/org';
import { OwnerOrg } from 'src/modules/sys/owner-org/model';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { T } from 'src/lib/js/locale/locale';
import { skip, take } from 'rxjs/operators';

const BASE_URL = 'sys/owner-org/';

export default class Store {
  static orgType = [
    { id: 10000, name: T('COMMON.LABEL.COMPANY') },
    { id: 1000, name: T('COMMON.LABEL.BRANCH') },
    { id: 100, name: T('COMMON.LABEL.DEPARTMENT') },
    { id: 10, name: T('COMMON.LABEL.GROUP') },
  ];

  orgData$ = new BehaviorSubject<OwnerOrg[]>([]);
  completeLoading$ = forkJoin([this.orgData$.pipe(skip(1), take(1))]);
  constructor(public viewStore: ViewStore) {}
  static sysGetCompanyList() {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetCompanyList')}`);
  }

  loadOrgTree() {
    OrgStore.sysGetOwnerOrgTree().subscribe((res) => {
      this.orgData$.next(res.data);
    });
  }
}
