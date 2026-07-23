import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SummaryPeriod, TransactionSummary } from '../../core/models/transaction.model';
import { IconComponent } from '../../design-system/icons/icon';
import { TransactionsRefreshService } from '../transactions/transactions-refresh.service';
import { TransactionsService } from '../transactions/transactions.service';

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, CurrencyPipe, IconComponent, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly transactionsService = inject(TransactionsService);
  private readonly refresh = inject(TransactionsRefreshService);

  protected readonly period = signal<SummaryPeriod>('Month');
  protected readonly referenceDate = signal(new Date());
  protected readonly summary = signal<TransactionSummary | null>(null);
  protected readonly loading = signal(true);

  protected readonly periodLabel = computed(() => {
    const date = this.referenceDate();
    return this.period() === 'Year'
      ? String(date.getFullYear())
      : new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(date);
  });

  protected readonly fixPercent = computed(() => {
    const s = this.summary();
    if (!s || s.ausgaben === 0) return 0;
    return (s.ausgabenFix / s.ausgaben) * 100;
  });

  protected readonly variabelPercent = computed(() => {
    const s = this.summary();
    if (!s || s.ausgaben === 0) return 0;
    return (s.ausgabenVariabel / s.ausgaben) * 100;
  });

  private requestId = 0;

  constructor() {
    effect(() => {
      const period = this.period();
      const date = this.referenceDate();
      this.refresh.version();
      void this.load(period, date);
    });
  }

  private async load(period: SummaryPeriod, date: Date): Promise<void> {
    const myRequestId = ++this.requestId;
    this.loading.set(true);
    try {
      const summary = await this.transactionsService.getSummary(period, toIsoDate(date));
      if (myRequestId === this.requestId) {
        this.summary.set(summary);
      }
    } finally {
      if (myRequestId === this.requestId) {
        this.loading.set(false);
      }
    }
  }

  protected setPeriod(value: SummaryPeriod): void {
    this.period.set(value);
  }

  protected stepPeriod(direction: -1 | 1): void {
    const date = new Date(this.referenceDate());
    if (this.period() === 'Year') {
      date.setFullYear(date.getFullYear() + direction);
    } else {
      date.setMonth(date.getMonth() + direction);
    }
    this.referenceDate.set(date);
  }
}
