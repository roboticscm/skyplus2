// @ts-ignore
import { Token } from '@/lib/js/constants';
import axios from 'axios';
import { AppStore, appStore } from '@/store/app';

export const getBrowserID = (): string => {
  let nav = window.navigator;
  let screen = window.screen;
  let guid = nav.mimeTypes.length + '';
  guid += nav.userAgent.replace(/\D+/g, '');
  guid += nav.plugins.length;
  guid += screen.height || '';
  guid += screen.width || '';
  guid += screen.pixelDepth || '';

  return guid;
};

// export const getLoginInfo = function() {
//   let username: string | null = '';
//   let lastName: string | null = '';
//   let firstName: string | null = '';
//   let avatarUrl: string | null = '';
//
//   username = localStorage.getItem('username');
//   if (!username) {
//     let href = new URL((window as any).location.href);
//     username = href.searchParams.get('username');
//   }
//
//   lastName = localStorage.getItem('lastName');
//   if (!lastName) {
//     let href = new URL((window as any).location.href);
//     lastName = href.searchParams.get('lastName');
//   }
//
//   firstName = localStorage.getItem('firstName');
//   if (!firstName) {
//     let href = new URL((window as any).location.href);
//     firstName = href.searchParams.get('firstName');
//   }
//
//   return {
//     username: username,
//     lastName: lastName,
//     firstName: firstName,
//     avatarUrl: avatarUrl,
//
//
//   };
// };

export const getLanguage = (): string => {
  return localStorage.getItem('localeLanguage') || 'vi-VN';
};

export const getCompanyId = (): string | null => {
  return localStorage.getItem('companyId');
};

export const getUserId = () => {
  return localStorage.getItem('userId');
};

export const getToken = () => {
  return localStorage.getItem(Token.TOKEN_KEY);
};

export const getRememberLogin = () => {
  return localStorage.getItem('remember');
};

export const loginSuccess = function(userId: string, rawToken: string) {
  localStorage.setItem('userId', userId);
  localStorage.setItem(Token.TOKEN_KEY, rawToken);
  AppStore.isLogged$.next(true);
  if (AppStore.rememberLogin) {
    localStorage.setItem('remember', 'true');
  }
};

export const logout = function() {
  localStorage.removeItem('userId');
  localStorage.removeItem('remember');
  localStorage.removeItem(Token.TOKEN_KEY);
  AppStore.isLogged$.next(false);
  AppStore.screenLock$.next(0);
  appStore.theme$.next(null);
};

export const setHeader = function(userId: string, rawToken: string) {
  const token = rawToken.replace(getBrowserID(), '');
  const authHeader = `${userId}||| ${token}`;

  axios.defaults.headers['Authorization'] = authHeader;
  axios.defaults.headers = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  };
};
