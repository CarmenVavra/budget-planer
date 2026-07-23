import { InjectionToken } from '@angular/core';

export interface BrowserStorage {
  local: Storage;
  session: Storage;
}

/** Abstracts window.localStorage/sessionStorage so AuthService is testable without real browser storage. */
export const BROWSER_STORAGE = new InjectionToken<BrowserStorage>('BROWSER_STORAGE', {
  factory: () => ({ local: window.localStorage, session: window.sessionStorage }),
});
