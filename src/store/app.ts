import { BehaviorSubject, of } from 'rxjs';
import { User } from 'src/model/user';
import { settingsStore } from 'src/store/settings';
import HumanOrOrgStore from 'src/modules/sys/user/store';
import { NavBarConfig } from 'src/model/nav-bar-config';
import { catchError } from 'rxjs/operators';
import {getDepIdFromUrlParam} from "src/lib/js/url-util";


export class AppStore {
  static isLogged$ = new BehaviorSubject<boolean>(false);
  static screenLock$ = new BehaviorSubject<number>(0);
  static rememberLogin = false;
  static urlParam: any = undefined;
  static isDetailPage$  =  new BehaviorSubject<boolean>(false);

  user$ = new BehaviorSubject<User>(null);
  user: User;
  org$ = new BehaviorSubject<any>(null);
  org: any = {};

  theme$ = new BehaviorSubject<any>(null);
  theme: any = {};

  navBarConfig$ = new BehaviorSubject<NavBarConfig>(new NavBarConfig());

  getCurrentUserInfo() {
    HumanOrOrgStore.sysGetUserInfoById(null)
      .then((res: any) => {
        if (res.length > 0) {
          this.user = res[0];
          this.user$.next(res[0]);
        }
      })
      .catch((error) => this.user$.error(error));
  }

  getUserSettings(companyId: string) {
    settingsStore
      .sysGetUserSettings(companyId)
      .pipe(catchError((e) => of(e)))
      .subscribe(
        (res: any) => {
          let [companyId, departmentId, menuPath, lang, theme, alpha, headerHeight] = res.data.split('#');

          const depIdFromUrlParam = getDepIdFromUrlParam();
          if(depIdFromUrlParam) {
              departmentId = depIdFromUrlParam;
          }
          // org
          this.org = {
            companyId,
            departmentId,
            lang,
            menuPath,
          };

          this.org$.next({
            companyId,
            departmentId,
            lang,
          });

          // theme
          this.theme$.next({
            theme,
            alpha,
            headerHeight,
          });

          // nav bar config
          this.navBarConfig$.next({
            mainNavBarViewCount: 3,
            showSearchBar: true,
            showHistory: true,
            historyNavBarViewCount: 2,
          });
        },
        (error) => this.org$.error(error),
      );
  }
}

export const appStore = new AppStore();
