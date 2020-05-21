import { T } from '@/lib/js/locale/locale';
import { StringUtil } from '@/lib/js/string-util';

export const getMenuPathFromUrl = () => {
  return location.pathname.slice(1).replace('--', '/');
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
