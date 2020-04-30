import { AppStore } from '@/store/app';
import { Session } from '@/lib/js/constants';
import { lockScreen, logout } from '@/lib/js/security';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, startWith, tap, withLatestFrom } from 'rxjs/operators';

let expCounter = 0;
let screenLockCounter = 0;

let timer;
AppStore.isLogged$.subscribe((isLogged) => {
  if (isLogged) {
    timer = setInterval(() => {
      if (!AppStore.rememberLogin && screenLockCounter >= Session.SCREEN_LOCK_MINUTE) {
        AppStore.screenLock$.next(Date.now());
        lockScreen();
        screenLockCounter = 0;
      }

      if (!AppStore.rememberLogin && expCounter >= Session.EXP_MINUTE) {
        logout();
        if (timer) {
          clearInterval(timer);
        }
        expCounter = 0;
      }
      ++expCounter;
      ++screenLockCounter;
    }, Session.CHECK_TIME);
  } else {
    if (timer) {
      clearInterval(timer);
    }
    expCounter = 0;
    screenLockCounter = 0;
  }
});

fromEvent(window, 'mousemove')
  .pipe(
    debounceTime(Session.DELAY_TIME),
    withLatestFrom(AppStore.isLogged$),
    filter((value: any[]) => value[1] === true),
  )
  .subscribe(() => {
    expCounter = 0;
    screenLockCounter = 0;
  });

fromEvent(document, 'keyup')
  .pipe(
    debounceTime(Session.DELAY_TIME),
    withLatestFrom(AppStore.isLogged$),
    filter((value: any[]) => value[1] === true),
  )
  .subscribe(() => {
    expCounter = 0;
    screenLockCounter = 0;
  });
