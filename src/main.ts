import '@fortawesome/fontawesome-free/css/all.min.css';
import jQuery from 'jquery';
import 'jquery-ui';
(window as any).$ = jQuery;
(window as any).jQuery = jQuery;
import '../../sass/sass/index.scss';
import '@/lib/js/vendor/jquery.ztree.all';

import App from '@/App.svelte';

import { Debug } from '@/lib/js/debug';
import { sysGetLocaleResourceListByCompanyIdAndLocale } from '@/lib/js/locale/locale';

import MobileDetect from 'mobile-detect';
import { TableUtilStore } from '@/store/table-util';
import { take } from 'rxjs/operators';
import { OrgStore } from '@/store/org';
import { SObject } from '@/lib/js/sobject';
import { AppStore, appStore } from '@/store/app';
import { menuStore } from '@/store/menu';
import { Color, getThemeColors } from '@/lib/js/color';
import {
  getCompanyId,
  getLanguage,
  isRememberLogin,
  getToken,
  getUserId,
  loginSuccess,
  logout,
  setHeader,
  isLockScreen,
} from '@/lib/js/security';
import '@/lib/js/session';

const startApp = () => {
  AppStore.urlParam = location.href;
  const companyId = getCompanyId();
  const locale = getLanguage();

  sysGetLocaleResourceListByCompanyIdAndLocale(companyId, locale)
    .then((res: any) => {
      const _companyId = res[0].companyId;
      TableUtilStore.getOneById('owner_org', _companyId)
        .pipe(take(1))
        .subscribe((res) => {
          OrgStore.currentCompany$.next(SObject.convertFieldsToCamelCase(res.data[0]));
          const userId = getUserId();
          const token = getToken();
          if (!isLockScreen() && userId && token) {
            AppStore.rememberLogin = isRememberLogin();
            loginSuccess(userId, token);
            setHeader(userId, token);
            setTimeout(() => {
              loadMenuAndUserSettings(_companyId);
            }, 100);
          } else {
            if ((window as any).location.pathname === '/logout') {
              logout();
            }
          }
        });
      new App({
        target: document.body,
      });
    })
    .catch((error: any) => {
      Debug.error('Load resource error. Exit app', error);
    });
};

export const applyAlphaColor = (alpha: number) => {
  Color.applyAlpha(getThemeColors(), alpha);
};

export const loadMenuAndUserSettings = (companyId) => {
  menuStore.sysGetRoledMenuPathListByUserId();

  menuStore.menuPaths$.pipe(take(1)).subscribe(
    (_) => {
      appStore.getCurrentUserInfo();
      appStore.getUserSettings(companyId);

      // load last menu
      appStore.org$.subscribe((org) => {
        if (org) {
          menuStore.sysGetRoledMenuListByUserIdAndDepId(org.departmentId);
        }
      });

      // load last theme
      appStore.theme$.subscribe((theme: any) => {
        if (theme) {
          document.querySelector('body').classList.add(theme.theme);
          applyAlphaColor(theme.alpha);
        }
      });
    },
    (error) => {
      Debug.errorSection('Main App - menuStore.sysGetRoledMenuPathListByUserId', error);
      logout();
    },
  );
};

startApp();

// Typescript types for ResizeObserver
// @ts-ignore
class ResizeObserver {
  // constructor(callback: ResizeObserverCallback);
  disconnect: () => void;
  observe: (target: Element, options?: ResizeObserverObserveOptions) => void;
  unobserve: (target: Element) => void;
}

interface ResizeObserverObserveOptions {
  box?: 'content-box' | 'border-box';
}
type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

interface ResizeObserverEntry {
  readonly borderBoxSize: ResizeObserverEntryBoxSize;
  readonly contentBoxSize: ResizeObserverEntryBoxSize;
  // node_modules/typescript/lib/lib.dom.d.ts
  readonly contentRect: DOMRectReadOnly;
  readonly target: Element;
}
interface ResizeObserverEntryBoxSize {
  blockSize: number;
  inlineSize: number;
}

interface Window {
  ResizeObserver: ResizeObserver;
}
// @ts-ignore
declare var ResizeObserver: ResizeObserver;

// mobile detect
const md = new MobileDetect(window.navigator.userAgent);
(window as any).isSmartPhone = md.mobile() !== null && md.phone() !== null;
