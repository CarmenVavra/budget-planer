import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Transaction } from '../../core/models/transaction.model';
import {
  TransactionDialogData,
  TransactionFormDialog,
} from './transaction-form-dialog/transaction-form-dialog';
import { TransactionsRefreshService } from './transactions-refresh.service';

@Injectable({ providedIn: 'root' })
export class TransactionDialogService {
  private readonly dialog = inject(Dialog);
  private readonly refresh = inject(TransactionsRefreshService);

  openCreate(): Promise<boolean> {
    return this.open({});
  }

  openEdit(transaction: Transaction): Promise<boolean> {
    return this.open({ transaction });
  }

  private async open(data: TransactionDialogData): Promise<boolean> {
    const ref = this.dialog.open<boolean>(TransactionFormDialog, {
      data,
      backdropClass: 'dialog-backdrop-cdk',
    });
    const result = (await firstValueFrom(ref.closed)) ?? false;
    if (result) {
      this.refresh.notifyChanged();
    }
    return result;
  }
}
