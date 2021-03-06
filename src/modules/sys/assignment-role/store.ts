import { ViewStore } from 'src/store/view';
import { RxHttp } from 'src/lib/js/rx-http';
import { toSnackCase } from 'src/lib/js/util';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError, first, skip, zip } from 'rxjs/operators';
import { User } from 'src/model/user';
import { OwnerOrg } from 'src/modules/sys/owner-org/model';
import { OrgStore } from 'src/store/org';
import HumanOrOrgStore from 'src/modules/sys/user/store';
import { RoleStore } from 'src/store/role';
import { Role } from 'src/modules/sys/role-detail/model';

const BASE_URL = 'sys/assignment-role/';
export class Store {
  dataList$ = new BehaviorSubject<User[]>([]);
  orgData$ = new BehaviorSubject<OwnerOrg[]>([]);
  userData$ = new BehaviorSubject<User[]>([]);
  roleData$ = new BehaviorSubject<Role[]>([]);
  selectedUserRole$ = new BehaviorSubject<Role>(null);

  completeLoading$ = forkJoin([
    this.dataList$.pipe(
      skip(1),
      catchError((error) => of([])),
      first(),
    ),
    this.orgData$.pipe(
      skip(1),
      catchError((error) => of([])),
      first(),
    ),
  ]);

  constructor(public viewStore: ViewStore) {}

  sysGetAllAssignmentRoleUserList() {
    RxHttp.get(`${BASE_URL}${toSnackCase('sysGetAllAssignmentRoleUserList')}`, {
      includeDeleted: false,
      includeDisabled: true,
    }).subscribe((res) => {
      this.dataList$.next(res.data);
      this.viewStore.fullCount$.next(20);
    });
  }

  loadOrgTree() {
    OrgStore.sysGetOwnerOrgTree().subscribe((res) => {
      this.orgData$.next(res.data);
    });
  }

  loadUserList(orgId: string) {
    HumanOrOrgStore.sysGetUserListByOrgId(orgId).subscribe((res) => {
      this.userData$.next(res.data);
    });
  }

  loadRoleList(orgId: string) {
    RoleStore.sysGetRoleListByOrgId(orgId).subscribe((res) => {
      this.roleData$.next(res.data);
    });
  }

  static sysGetRoleListOfUsers(userIds: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetRoleListOfUsers')}`, {
      userIds,
      includeDeleted: false,
      includeDisabled: true,
    });
  }

  saveOrUpdateOrDelete(users: any[], roles: any[]) {
    return RxHttp.post(
      `${BASE_URL}${toSnackCase('saveOrUpdateOrDelete')}`,
      JSON.stringify({
        users,
        roles,
      }),
    );
  }
}
