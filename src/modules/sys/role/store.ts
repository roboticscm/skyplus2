import { OrgStore, orgStore } from 'src/store/org';
import { catchError, first, skip, take, withLatestFrom, zipAll } from 'rxjs/operators';
import { BehaviorSubject, forkJoin, of, zip } from 'rxjs';
import { ViewStore } from 'src/store/view';

export class Store {
  constructor(public viewStore: ViewStore) {}
  orgData$ = new BehaviorSubject<any[]>([]);

  completeLoading$ = forkJoin([
    this.orgData$.pipe(
      skip(1),
      catchError((error) => of([])),
      first(),
    ),
    this.viewStore.completeLoading$,
  ]);

  loadOrgTree() {
    OrgStore.sysGetOwnerOrgTree().subscribe((res) => {
      this.orgData$.next(res.data);
    });
  }
}
