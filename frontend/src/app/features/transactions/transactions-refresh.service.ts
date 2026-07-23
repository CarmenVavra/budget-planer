import { Injectable, signal } from '@angular/core';

/**
 * Transactions can be created/edited from the nav's global "+ Neue Ausgabe" button on
 * any page. Pages that display transaction data depend on `version()` so they reload
 * when a mutation happens somewhere else in the app.
 */
@Injectable({ providedIn: 'root' })
export class TransactionsRefreshService {
  private readonly versionSignal = signal(0);
  readonly version = this.versionSignal.asReadonly();

  notifyChanged(): void {
    this.versionSignal.update((v) => v + 1);
  }
}
