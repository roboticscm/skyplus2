import { T } from '@/lib/js/locale/locale';
import { StringUtil } from '@/lib/js/string-util';

export const getMenuPathFromUrl = () => {
  return location.pathname.slice(1).replace('--', '/');
};

export const getMenuNameFromPath = (menuPath: string) => {
  return menuPath.includes('/') ? menuPath.split('/')[menuPath.split('/').length - 1] : menuPath;
};

export const getViewTitleFromMenuPath = (menuPath: string) => {
  return T(`COMMON.MENU.${StringUtil.replaceAll(getMenuNameFromPath(menuPath).toUpperCase(), '-', '_')}`);
};
