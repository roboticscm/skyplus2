import '@fortawesome/fontawesome-free/css/all.min.css';
import jQuery from 'jquery';
import 'jquery-ui';
(window as any).$ = jQuery;
(window as any).jQuery = jQuery;
import '../../sass/sass/index.scss';
import '@/lib/js/vendor/jquery.ztree.all';

import App from '@/App.svelte';

// import Color, { getThemeColors } from '@/lib/js/color';
import { Debug } from '@/lib/js/debug';
import { UrlUtil } from '@/lib/js/url-util';
// import { setHeader, getBrowserID, loginSuccess, logout } from '@/lib/js/security';
// import { Token, API } from '@/lib/js/constants';
// import { menuStore } from '@/store/menu';
import { sysGetLocaleResourceListByCompanyIdAndLocale } from '@/lib/js/locale/locale';
// import { appStore } from '@/store/app';
// import { take } from 'rxjs/operators';

import MobileDetect from 'mobile-detect';

const startApp = () => {
  const companyId = UrlUtil.getCompanyId();
  const locale = UrlUtil.getLanguage();

  sysGetLocaleResourceListByCompanyIdAndLocale(companyId, locale)
    .then((_: any) => {
      new App({
        target: document.body,
      });
    }).catch((error: any) => {
      Debug.error('Load resource error. Exit app');
    });
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
