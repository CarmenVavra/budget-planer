import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LabelType } from '../../../core/models/label.model';
import { PagedResult, Transaction, TransactionType } from '../../../core/models/transaction.model';
import { IconComponent } from '../../../design-system/icons/icon';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { TransactionDialogService } from '../transaction-dialog.service';
import { TransactionsRefreshService } from '../transactions-refresh.service';
import { TransactionsService } from '../transactions.service';

type TypeFilter = 'Alle' | TransactionType;

const PAGE_SIZE = 10;

@Component({
  selector: 'app-transaction-list',
  imports: [FormsModule, DatePipe, CurrencyPipe, IconComponent],
  providers: [DatePipe],
  templateUrl: './transaction-list.html',
})
export class TransactionList {
  private readonly transactionsService = inject(TransactionsService);
  private readonly transactionDialog = inject(TransactionDialogService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly refresh = inject(TransactionsRefreshService);
  private readonly datePipe = inject(DatePipe);

  protected readonly typeFilter = signal<TypeFilter>('Alle');
  protected readonly artFilter = signal<LabelType | null>(null);
  protected readonly search = signal('');
  protected readonly page = signal(1);

  protected readonly result = signal<PagedResult<Transaction> | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  private requestId = 0;

  constructor() {
    effect(() => {
      const type = this.typeFilter();
      const art = this.artFilter();
      const search = this.search();
      const page = this.page();
      this.refresh.version();
      void this.load(type, art, search, page);
    });
  }

  private async load(type: TypeFilter, art: LabelType | null, search: string, page: number): Promise<void> {
    const myRequestId = ++this.requestId;
    this.loading.set(true);
    try {
      const result = await this.transactionsService.getAll({
        type: type === 'Alle' ? undefined : type,
        art: art ?? undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      if (myRequestId === this.requestId) {
        this.result.set(result);
      }
    } finally {
      if (myRequestId === this.requestId) {
        this.loading.set(false);
      }
    }
  }

  protected setTypeFilter(value: TypeFilter): void {
    this.typeFilter.set(value);
    if (value === 'Einnahme') {
      this.artFilter.set(null);
    }
    this.page.set(1);
  }

  protected toggleArtFilter(value: LabelType): void {
    this.artFilter.set(this.artFilter() === value ? null : value);
    this.page.set(1);
  }

  protected onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected previousPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  protected nextPage(): void {
    const result = this.result();
    if (result && this.page() * PAGE_SIZE < result.totalCount) {
      this.page.update((p) => p + 1);
    }
  }

  protected openNewExpense(): void {
    void this.transactionDialog.openCreate();
  }

  protected editTransaction(transaction: Transaction): void {
    void this.transactionDialog.openEdit(transaction);
  }

  protected async deleteTransaction(transaction: Transaction): Promise<void> {
    const formattedDate = this.datePipe.transform(transaction.date, 'dd.MM.yyyy');
    const confirmed = await this.confirmDialog.confirm({
      title: 'Transaktion löschen?',
      message: `„${transaction.bezeichnung}“ vom ${formattedDate} wirklich löschen?`,
      confirmLabel: 'Löschen',
    });
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    try {
      await this.transactionsService.delete(transaction.id);
      this.refresh.notifyChanged();
    } catch {
      this.errorMessage.set('Transaktion konnte nicht gelöscht werden.');
    }
  }

  protected rangeStart(): number {
    const result = this.result();
    return result && result.totalCount > 0 ? (result.page - 1) * result.pageSize + 1 : 0;
  }

  protected rangeEnd(): number {
    const result = this.result();
    if (!result) return 0;
    return Math.min(result.page * result.pageSize, result.totalCount);
  }
}
