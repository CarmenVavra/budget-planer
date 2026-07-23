import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/api-config';
import {
  PagedResult,
  SummaryPeriod,
  Transaction,
  TransactionQuery,
  TransactionSummary,
  UpsertTransactionRequest,
} from '../../core/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/transactions`;

  getAll(query: TransactionQuery): Promise<PagedResult<Transaction>> {
    let params = new HttpParams();
    if (query.type) params = params.set('type', query.type);
    if (query.art) params = params.set('art', query.art);
    if (query.labelId) params = params.set('labelId', query.labelId);
    if (query.search) params = params.set('search', query.search);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    params = params.set('page', query.page ?? 1).set('pageSize', query.pageSize ?? 20);

    return firstValueFrom(this.http.get<PagedResult<Transaction>>(this.baseUrl, { params }));
  }

  getSummary(period: SummaryPeriod, date: string): Promise<TransactionSummary> {
    const params = new HttpParams().set('period', period).set('date', date);
    return firstValueFrom(this.http.get<TransactionSummary>(`${this.baseUrl}/summary`, { params }));
  }

  create(request: UpsertTransactionRequest): Promise<Transaction> {
    return firstValueFrom(this.http.post<Transaction>(this.baseUrl, request));
  }

  update(id: string, request: UpsertTransactionRequest): Promise<Transaction> {
    return firstValueFrom(this.http.put<Transaction>(`${this.baseUrl}/${id}`, request));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
