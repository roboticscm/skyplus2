import { RxHttp } from 'src/lib/js/rx-http';
import { AuthRequest } from 'src/model/base';
import { SJSON } from 'src/lib/js/sjson';
import { Http } from 'src/lib/js/http';
import axios from 'axios';

export class AuthStore {
  static login(loginReq: AuthRequest) {
    axios.defaults.headers = {
      'Content-Type': 'application/json',
    };
    return Http.post('sys/auth/login', SJSON.stringify(loginReq));
  }
}
