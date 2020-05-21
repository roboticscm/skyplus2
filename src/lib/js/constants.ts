import {T} from '@/lib/js/locale/locale';


export class Token {
  static TOKEN_KEY = 'sessionId';
  static BLOWFISH_ENCRYPTION_KEY = '12345678910';
}

export class Protocol {
  static HTTP = 'http';
  static WS = 'ws';
}

export class Proxy {
  // static HOST_URL = '172.26.22.61:8200';
  // static HOST_URL = 'localhost:8081';
}

export class API {
  static API_DOMAIN = 'localhost';
  // static API_DOMAIN = '192.168.10.3';
  // static API_DOMAIN = '172.16.22.16';
  // static API_DOMAIN = 'frontend.com.vn';
  static API_SERVER = `${Protocol.HTTP}://${API.API_DOMAIN}:7581`;

  static BASE_URL = `${API.API_SERVER}/api/`;
}

export const GUTTER_WIDTH = 8; //pixel

export class Hasura {
  static HTTP_URL = `${Protocol.HTTP}://${API.API_DOMAIN}:7580/v1/graphql`;
  static WS_URL = `${Protocol.WS}://${API.API_DOMAIN}:7580/v1/graphql`;
}

export class App {
  static NAME = 'SkyHub';
  static POWERED_BY = 'Suntech';
  static DEFAULT_ICON = `<i class="fa fa-bars"></i>`;
  static USE_ANIMATION = true;
  static DEFAULT_PAGE_SIZE = 30;
  static AUTO_COMPLETE = 'off';
  static SNACKBAR_TIMEOUT = 3000;
  static PROGRESS_BAR = '<i class="fa fa-spinner fa-spin" />';
  static MIN_PASSWORD_LENGTH = 6;
  static MAX_HEADER_HEIGHT = 100;
  static MIN_HEADER_HEIGHT = 30;
  static UUID_LEN = 36;
  static DELAY_ON_INPUT = 50; //ms
  static FTS_OPTION = `
    ${T('COMMON.LABEL.FULL_TEXT_SEARCH_OPTION')}:
    1. ${T('COMMON.LABEL.EXACT')}: ${T('COMMON.LABEL.START_WITH')} " -> ${T('COMMON.LABEL.EX')}: "some text
    2. ${T('COMMON.LABEL.SEARCH_OR')}: | -> ${T('COMMON.LABEL.EX')}: some | text
    3. ${T('COMMON.LABEL.ADVANCED')}: ${T('COMMON.LABEL.START_WITH')} \` -> ${T('COMMON.LABEL.EX')}: \`Word<n>OtherWord (n: number)
  `
  static MIN_SEARCH_LENGTH = 2;
}

export class Image {
  // @ts-ignore
  static NO_IMAGE = require('../../../public/images/no-image.png').default;
}

export class Session {
  static SCREEN_LOCK_MINUTE = 15;
  static EXP_MINUTE = 30;
  static CHECK_TIME = 60 * 1000; // ms
  static DELAY_TIME = 10; // ms
}
