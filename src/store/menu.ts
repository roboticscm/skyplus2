import { RxHttp } from '@/lib/js/rx-http';
import { Http } from '@/lib/js/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, skip, take } from 'rxjs/operators';
import { HistoryMenu, RoleMenu } from '@/modules/sys/menu/model';
import { toSnackCase } from '@/lib/js/util';
import { Debug } from '@/lib/js/debug';
import { SJSON } from '@/lib/js/sjson';

const BASE_URL = 'sys/menu/';
class MenuStore {
  menuPaths$ = new BehaviorSubject<string[]>([]);
  dataList$ = new BehaviorSubject<RoleMenu[]>([]);
  selectedData$ = new BehaviorSubject<RoleMenu>(undefined);
  selectedData: RoleMenu = undefined;

  sysGetRoledMenuPathListByUserId() {
    RxHttp.get(`${BASE_URL}${toSnackCase('sysGetRoledMenuPathListByUserId')}`, {
      includeDeleted: false,
      includeDisabled: false,
    })
      .pipe(
        take(1),
        catchError((e) => of(e)),
      )
      .subscribe(
        (res: any) => {
          this.menuPaths$.next(res.data.map((it: RoleMenu) => it.path));
        },
        (error) => Debug.errorSection('MenuStore - sysGetRoledMenuPathListByUserId', error),
      );
  }

  sysGetMenuByPath(menuPath: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetMenuByPath')}`, {
      menuPath,
    });
  }

  sysGetRoledMenuListByUserIdAndDepId(depId: any, isSubscribed = true) {
    const ob$ = RxHttp.get(`${BASE_URL}${toSnackCase('sysGetRoledMenuListByUserIdAndDepId')}`, {
      depId,
      includeDeleted: false,
      includeDisabled: false,
    });
    if (isSubscribed) {
      ob$.subscribe(
        (res: any) => {
          this.dataList$.next(res.data);
          if (res.data.length > 0) {
            this.selectedData = res.data[0];
            this.selectedData$.next(res.data[0]);
          }
        },
        (error) => Debug.errorSection('MenuStore - sysGetRoledMenuListByUserIdAndDepId', error),
      );
    }
    return ob$;
  }

  // setSelectedData(menuPath: string) {
  //   const path = menuPath.startsWith('/') ? menuPath.slice(1) : menuPath;
  //   this.dataList$.pipe(take(1)).subscribe((data: RoleMenu[]) => {
  //     const item = data.find((it) => it.path === path);
  //     if (item) {
  //       this.selectedData = item;
  //       this.selectedData$.next(item);
  //     }
  //   });
  // }
}
export const menuStore = new MenuStore();

const BASE_URL_HISTORY = 'sys/menu-history/';
class HistoryMenuStore {
  saveOrUpdate(obj: HistoryMenu) {
    return Http.post(`${BASE_URL_HISTORY}${toSnackCase('saveOrUpdate')}`, SJSON.stringify(obj));
  }
}
export const historyMenuStore = new HistoryMenuStore();
