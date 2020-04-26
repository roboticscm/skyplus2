import { RxHttp } from '@/lib/js/rx-http';
import { AuthRequest } from '@/model/base';
import { SJSON } from '@/lib/js/sjson';
import { Http } from '@/lib/js/http';
import axios from 'axios';

export class AuthStore {
  static login(loginReq: AuthRequest) {
    axios.defaults.headers = {
      'Content-Type': 'application/json',
    };
    return Http.post('sys/auth/login', SJSON.stringify(loginReq));
  }
}
