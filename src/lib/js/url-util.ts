import { T } from 'src/lib/js/locale/locale';
import { StringUtil } from 'src/lib/js/string-util';
import { AppStore } from 'src/store/app';

export const getMenuPathFromUrl = () => {
  return location.pathname.slice(1).replace('--', '/');
};

export const getMenuPathFromUrlParam = () => {
  const url = new URL(AppStore.urlParam);
  if (url && !url.pathname.includes('logout')) {
    return url.pathname.slice(1).replace('--', '/');
  } else {
    return null;
  }
};

export const getDepIdFromUrlParam = () => {
  const url = new URL(AppStore.urlParam);
  if (url) {
    return url.searchParams.get('depId');
  } else {
    return null;
  }
};

export const getTargetIdFromUrlParam = () => {
  const url = new URL(AppStore.urlParam);
  if (url) {
    return url.searchParams.get('id');
  } else {
    return null;
  }
};

export const getMenuNameFromPath = (menuPath: string) => {
  return menuPath.includes('/') ? menuPath.split('/')[menuPath.split('/').length - 1] : menuPath;
};

export const getViewTitleFromMenuPath = (menuPath: string) => {
  if (StringUtil.isEmpty(menuPath)) {
    return T('COMMON.MSG.NO_MENU');
  }
  return T(`COMMON.MENU.${StringUtil.replaceAll(getMenuNameFromPath(menuPath).toUpperCase(), '-', '_')}`);
};
