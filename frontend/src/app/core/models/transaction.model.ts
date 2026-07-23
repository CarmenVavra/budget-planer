import { LabelType } from './label.model';

export type TransactionType = 'Einnahme' | 'Ausgabe';
export type SummaryPeriod = 'Month' | 'Year';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  bezeichnung: string;
  art: LabelType | null;
  labelId: string | null;
  note: string | null;
}

export interface UpsertTransactionRequest {
  type: TransactionType;
  amount: number;
  date: string;
  labelId?: string | null;
  description?: string | null;
  note?: string | null;
}

export interface TransactionQuery {
  type?: TransactionType;
  art?: LabelType;
  labelId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface TransactionSummary {
  einnahmen: number;
  einnahmenCount: number;
  ausgaben: number;
  ausgabenCount: number;
  ausgabenFix: number;
  ausgabenVariabel: number;
  saldo: number;
  stand: string;
  letzteTransaktionen: Transaction[];
}
