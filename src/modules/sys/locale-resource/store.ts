import { ViewStore } from '@/store/view';
import { toSnackCase } from '@/lib/js/util';
import { RxHttp } from '@/lib/js/rx-http';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Language } from '@/modules/sys/language/model';
import OwnerOrgStore from '@/modules/sys/owner-org/store';
import { OwnerOrg } from '@/modules/sys/owner-org/model';
import { Http } from '@/lib/js/http';

const BASE_URL = 'sys/locale-resource/';

export class Store {
  usedLanguages$ = new BehaviorSubject<Language[]>([]);
  companies$ = new BehaviorSubject<OwnerOrg[]>([]);

  constructor(public viewStore: ViewStore) {}

  sysGetUsedLanguages() {
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

  getCompaniesList = () => {
    OwnerOrgStore.sysGetCompanyList()
      .pipe(take(1))
      .subscribe((res) => {
        this.companies$.next(res.data);
      });
  };

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
}
