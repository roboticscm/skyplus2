import { SJSON } from '@/lib/js/sjson';
// @ts-ignore
const axios = require('axios');
import { API } from './constants';
import { getToken, getUserId, logout } from '@/lib/js/security';
import { StringUtil } from '@/lib/js/string-util';

export class Http {
  public static async callApi(method: string, url: string, params: any, jsonData: any) {
    let fullUrl: string | null = null;
    if (params) {
      fullUrl = `${API.BASE_URL}${url}${Http.paramParser(params)}`;
    } else {
      fullUrl = `${API.BASE_URL}${url}`;
    }

    return new Promise<any>((resolve, reject) => {
      axios({
        url: fullUrl,
        method: method,
        data: jsonData,
        transformResponse: (res: any) => {
          if (res.includes('{') || res.includes('[')) {
            return SJSON.parse(res);
          } else {
            return res;
          }
        },
      })
        .then((res: any) => {
          resolve(res.data);
        })
        .catch((error: any) => {
          console.error(error);
          if (error.response) {
            reject(error.response.data);
          } else {
            reject(error);
          }
          logout();
        });
    });
  }

  public static upload(url: string, formData: any) {
    let fullUrl = `${API.BASE_URL}${url}`;
    return new Promise<any>((resolve, reject) => {
      axios({
        url: fullUrl,
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then((res: any) => {
          resolve(res.data);
        })
        .catch((error: any) => {
          console.error(error);
          if (error.response) {
            reject(error.response.data);
          } else {
            reject(error);
          }
          logout();
        });
    });
  }

  public static async get(url: string, params: any = null) {
    return Http.callApi('get', url, params, null);
  }

  public static async options(url: string, params: any = null) {
    return Http.callApi('options', url, params, null);
  }

  public static async post(url: string, jsonData: string) {
    return Http.callApi('post', url, null, jsonData);
  }

  public static async delete(url: string, params: any = null) {
    return Http.callApi('delete', url, params, null);
  }

  public static paramParser(paramObj: any) {
    if (StringUtil.isEmpty(paramObj)) {
      return '';
    }

    let paramsString = '?';
    for (let key in paramObj) {
      let value = paramObj[key];
      if (typeof value === 'string') {
        value = encodeURIComponent(StringUtil.replaceAll(value, '%', ''));
      }

      paramsString += `${key}=${value}&`;
    }
    // remove last &
    return paramsString.substring(0, paramsString.length - 1);
  }
}
