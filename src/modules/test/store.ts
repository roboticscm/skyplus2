import {BehaviorSubject} from 'rxjs';
import {RxHttp} from "src/lib/js/rx-http";
import {toSnackCase} from "src/lib/js/util";

class Store {
    userList$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(undefined);
    selectedUser$: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);

    findUserList (orgId: string) {
        return RxHttp.get(`sys/human-or-org/${toSnackCase('sysGetUserListByOrgId')}`, {
            orgId
        });
    }

    getUser(userId: string) {
        return RxHttp.get(`sys/human-or-org/${toSnackCase('sysGetUserInfoById')}`, {
            userId
        });
    }
}

export const store = new Store();