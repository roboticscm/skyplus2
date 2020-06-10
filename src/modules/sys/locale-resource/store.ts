import { ViewStore } from 'src/store/view';
import { toSnackCase } from 'src/lib/js/util';
import { RxHttp } from 'src/lib/js/rx-http';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Language } from 'src/modules/sys/language/model';
import OwnerOrgStore from 'src/modules/sys/owner-org/store';
import { OwnerOrg } from 'src/modules/sys/owner-org/model';
import { Http } from 'src/lib/js/http';
import { SJSON } from 'src/lib/js/sjson';
import { StringUtil } from 'src/lib/js/string-util';

const BASE_URL = 'sys/locale-resource/';

export default class Store {
  static usedLanguages$ = new BehaviorSubject<Language[]>([]);
  static companies$ = new BehaviorSubject<OwnerOrg[]>([]);

  constructor(public viewStore: ViewStore) {}

  static sysGetUsedLanguages() {
    RxHttp.get(`${BASE_URL}${toSnackCase('sysGetUsedLanguages')}`)
      .pipe(take(1))
      .subscribe((res) => {
        this.usedLanguages$.next(res.data);
      });
  }

  static sysGetUsedLangCategories(textSearch: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetUsedLangCategories')}`, {
      textSearch,
    });
  }

  static sysGetUsedLangTypeGroups(textSearch: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetUsedLangTypeGroups')}`, {
      textSearch,
    });
  }

  static getCompaniesList() {
    OwnerOrgStore.sysGetCompanyList()
      .pipe(take(1))
      .subscribe((res) => {
        this.companies$.next(res.data);
      });
  }

  static sysGetAllLanguages(includeDeleted: boolean, includeDisabled: boolean) {
    return Http.get(`${BASE_URL}${toSnackCase('sysGetAllLanguages')}`, {
      includeDeleted,
      includeDisabled,
    });
  }

  static sysGetLocaleResourceByCompanyIdAndCatAndTypeGroup(
    companyId: any,
    category: string,
    typeGroup: string,
    textSearch: string,
    page: number,
    pageSize: number,
  ) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('sysGetLocaleResourceByCompanyIdAndCatAndTypeGroup')}`, {
      companyId,
      category,
      typeGroup,
      textSearch,
      page,
      pageSize,
    });
  }

  static saveOrUpdateOrDelete(obj: any) {
    return RxHttp.post(
      `${BASE_URL}${toSnackCase('saveOrUpdateOrDelete')}`,
      StringUtil.removeHtmlTag(SJSON.stringify(obj)),
    );
  }
}
