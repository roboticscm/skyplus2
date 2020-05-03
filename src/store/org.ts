import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';
import { BehaviorSubject } from 'rxjs';
import { OwnerOrg } from '@/modules/sys/owner-org/model';

const BASE_URL = 'sys/owner-org/';
export class OrgStore {
  static currentCompany$ = new BehaviorSubject<OwnerOrg>(null);

  sysGetAvailableDepartmentTreeForMenu(menuId: any) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetAvailableDepartmentTreeForMenu')}`, {
      menuId,
    });
  }

  sysGetDepartmentTreeByMenuId(menuId: any) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetDepartmentTreeByMenuId')}`, {
      menuId,
    });
  }

  sysGetRoledDepartmentListByUserId() {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetRoledDepartmentListByUserId')}`, {
      includeDeleted: false,
      includeDisabled: false,
    });
  }

  sysGetOwnerOrgRoleTree() {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetOwnerOrgRoleTree')}`);
  }

  sysGetOwnerOrgHumanTree(filter: string, excludeHumanIds: string) {
    console.log(filter);
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetOwnerOrgHumanTree')}`, {
      filter,
      excludeHumanIds,
    });
  }

  sysGetHumanOrgTree(humanId: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetHumanOrgTree')}`, {
      humanId,
    });
  }

  sysGetAssignedHumanOrgTree(humanId: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetAssignedHumanOrgTree')}`, {
      humanId,
    });
  }

  static sysGetOwnerOrgTree(parentId: string = undefined) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetOwnerOrgTree')}`, {
      parentId,
    });
  }
}

export const orgStore = new OrgStore();
