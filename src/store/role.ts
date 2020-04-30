import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';

const BASE_URL = 'sys/role/';
export class RoleStore {
  static sysGetMenuRoleControlList(ownerOrgId: string, roleId: string) {
    return RxHttp.get(`sys/role-detail/${toSnackCase('sysGetMenuRoleControlList')}`, {
      ownerOrgId,
      roleId,
      includeDeleted: true,
      includeDisabled: true,
    });
  }

  static sysGetRoleListByOrgId(orgId: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetRoleListByOrgId')}`, {
      orgId,
      includeDeleted: true,
      includeDisabled: true,
    });
  }
}

export const roleStore = new RoleStore();
