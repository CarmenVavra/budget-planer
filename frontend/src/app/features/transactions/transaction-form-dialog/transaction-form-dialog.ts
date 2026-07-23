import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { extractErrorMessage } from '../../../core/http/problem-details';
import { Label, LabelType } from '../../../core/models/label.model';
import { Transaction } from '../../../core/models/transaction.model';
import { IconComponent } from '../../../design-system/icons/icon';
import { LabelsService } from '../../labels/labels.service';
import { TransactionsService } from '../transactions.service';

export interface TransactionDialogData {
  transaction?: Transaction;
}

type ArtSelection = 'Einnahme' | LabelType;

function amountValidator(control: AbstractControl): ValidationErrors | null {
  const parsed = parseAmount(control.value);
  return parsed !== null && parsed > 0 ? null : { invalidAmount: true };
}

function parseAmount(text: string | null | undefined): number | null {
  if (!text) return null;
  const normalized = text.trim().replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function formatAmount(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

@Component({
  selector: 'app-transaction-form-dialog',
  imports: [ReactiveFormsModule, FormsModule, IconComponent],
  templateUrl: './transaction-form-dialog.html',
})
export class TransactionFormDialog {
  private readonly data = inject<TransactionDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly fb = inject(FormBuilder);
  private readonly transactionsService = inject(TransactionsService);
  private readonly labelsService = inject(LabelsService);

  protected readonly isEdit = !!this.data.transaction;

  protected readonly art = signal<ArtSelection>(
    this.data.transaction ? (this.data.transaction.art ?? 'Einnahme') : 'Variabel',
  );
  protected readonly labels = signal<Label[]>([]);
  protected readonly labelsLoading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly addingLabel = signal(false);
  protected readonly newLabelName = signal('');
  protected readonly newLabelError = signal<string | null>(null);

  protected readonly selectedLabelId = signal<string | null>(this.data.transaction?.labelId ?? null);

  protected readonly filteredLabels = computed(() =>
    this.labels().filter((l) => l.type === this.art()),
  );

  protected readonly form = this.fb.nonNullable.group({
    amount: [
      this.data.transaction ? formatAmount(this.data.transaction.amount) : '',
      [Validators.required, amountValidator],
    ],
    date: [this.data.transaction?.date ?? todayIso(), Validators.required],
    description: [
      this.data.transaction?.type === 'Einnahme' ? this.data.transaction.bezeichnung : '',
    ],
    note: [this.data.transaction?.note ?? ''],
  });

  constructor() {
    this.loadLabels();
  }

  private async loadLabels(): Promise<void> {
    this.labelsLoading.set(true);
    try {
      this.labels.set(await this.labelsService.getAll());
    } finally {
      this.labelsLoading.set(false);
    }
  }

  protected setArt(value: ArtSelection): void {
    this.art.set(value);
    if (value === 'Einnahme') {
      this.selectedLabelId.set(null);
    } else if (this.selectedLabelId()) {
      const stillValid = this.labels().some(
        (l) => l.id === this.selectedLabelId() && l.type === value,
      );
      if (!stillValid) {
        this.selectedLabelId.set(null);
      }
    }
    this.addingLabel.set(false);
  }

  protected selectLabel(label: Label): void {
    this.selectedLabelId.set(label.id);
  }

  protected startAddLabel(): void {
    this.addingLabel.set(true);
    this.newLabelName.set('');
    this.newLabelError.set(null);
  }

  protected async confirmAddLabel(): Promise<void> {
    const name = this.newLabelName().trim();
    const art = this.art();
    if (!name || art === 'Einnahme') {
      return;
    }

    try {
      const created = await this.labelsService.create({ name, type: art });
      this.labels.update((labels) => [...labels, created]);
      this.selectedLabelId.set(created.id);
      this.addingLabel.set(false);
    } catch (error) {
      this.newLabelError.set(extractErrorMessage(error, 'Bezeichnung konnte nicht erstellt werden.'));
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || (this.art() !== 'Einnahme' && !this.selectedLabelId())) {
      this.form.markAllAsTouched();
      if (this.art() !== 'Einnahme' && !this.selectedLabelId()) {
        this.errorMessage.set('Bitte wähle eine Bezeichnung aus.');
      }
      return;
    }

    const { amount, date, description, note } = this.form.getRawValue();
    const parsedAmount = parseAmount(amount)!;

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const request = {
        type: this.art() === 'Einnahme' ? ('Einnahme' as const) : ('Ausgabe' as const),
        amount: parsedAmount,
        date,
        labelId: this.art() === 'Einnahme' ? null : this.selectedLabelId(),
        description: this.art() === 'Einnahme' ? description.trim() : null,
        note: note?.trim() || null,
      };

      if (this.data.transaction) {
        await this.transactionsService.update(this.data.transaction.id, request);
      } else {
        await this.transactionsService.create(request);
      }

      this.dialogRef.close(true);
    } catch (error) {
      this.errorMessage.set(extractErrorMessage(error, 'Speichern fehlgeschlagen.'));
    } finally {
      this.submitting.set(false);
    }
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
