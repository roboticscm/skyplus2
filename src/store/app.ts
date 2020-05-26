import { BehaviorSubject, of } from 'rxjs';
import { User } from '@/model/user';
import { settingsStore } from '@/store/settings';
import HumanOrOrgStore from '@/modules/sys/user/store';
import { NavBarConfig } from '@/model/nav-bar-config';
import { catchError } from 'rxjs/operators';

export class AppStore {
  static isLogged$ = new BehaviorSubject<boolean>(false);
  static screenLock$ = new BehaviorSubject<number>(0);
  static rememberLogin = false;

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
          const [companyId, departmentId, menuPath, lang, theme, alpha, headerHeight] = res.data.split('#');
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
