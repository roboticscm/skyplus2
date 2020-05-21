// @ts-ignore
import { App, Token } from '@/lib/js/constants';
import axios from 'axios';
import { AppStore, appStore } from '@/store/app';
import { menuStore } from '@/store/menu';

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

export const getLanguage = (): string => {
  return localStorage.getItem('localeLanguage') || 'vi-VN';
};

export const getCompanyId = (): string | null => {
  return localStorage.getItem('companyId');
};

export const getUserId = () => {
  return localStorage.getItem('userId');
};

export const getUserFullName = () => {
  return appStore.user.lastName + ' ' + appStore.user.firstName;
};

export const getToken = () => {
  return decodeToken(localStorage.getItem(Token.TOKEN_KEY));
};

export const isRememberLogin = () => {
  return localStorage.getItem('AppName') === App.NAME;
};

export const isLockScreen = () => {
  return localStorage.getItem('PoweredBy') === App.POWERED_BY;
};

export const lockScreen = () => {
  return localStorage.setItem('PoweredBy', App.POWERED_BY);
};

export const unlockScreen = () => {
  return localStorage.removeItem('PoweredBy');
};

export const encodeToken = (token: string) => {
  const index = token.length / 2;
  return token.slice(0, index) + getBrowserID() + token.slice(index);
};

export const decodeToken = (token: string) => {
  return token && token.replace(getBrowserID(), '');
};

export const loginSuccess = function(userId: string, token: string) {
  localStorage.setItem('userId', userId);
  localStorage.setItem(Token.TOKEN_KEY, encodeToken(token));
  AppStore.isLogged$.next(true);
  if (AppStore.rememberLogin) {
    localStorage.setItem('AppName', App.NAME);
  }
  unlockScreen();
};

export const logout = function() {
  localStorage.removeItem('userId');
  localStorage.removeItem('AppName');
  localStorage.removeItem(Token.TOKEN_KEY);
  // AppStore.isLogged$.next(false);
  // AppStore.screenLock$.next(0);
  // appStore.theme$.next(null);
  // window.history.pushState('', '', '/logout');
  // location.reload();
  location.href = '/logout';
  // menuStore.dataList$.next([]);
  // menuStore.selectedData$.next(undefined);
};

export const setHeader = function(userId: string, token: string) {
  const authHeader = `${userId}||| ${token}`;

  axios.defaults.headers['Authorization'] = authHeader;
  axios.defaults.headers = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  };
};
