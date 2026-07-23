import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
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

// ~4 rows by default; clamped down further if the viewport doesn't have that much room on the chosen side.
const AUTOCOMPLETE_MAX_HEIGHT = 180;
// Below this much room, prefer flipping the panel to the other side of the input (if it has more space)
// rather than shrinking further — keeps the panel usable without ever eating into the viewport margin.
const AUTOCOMPLETE_PREFERRED_MIN_HEIGHT = 90;
const AUTOCOMPLETE_VIEWPORT_MARGIN = 16;

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

  protected readonly selectedLabelId = signal<string | null>(this.data.transaction?.labelId ?? null);
  protected readonly labelSearch = signal(
    this.data.transaction?.type === 'Ausgabe' ? this.data.transaction.bezeichnung : '',
  );
  protected readonly dropdownOpen = signal(false);
  protected readonly creatingLabel = signal(false);
  protected readonly labelError = signal<string | null>(null);
  protected readonly panelMaxHeight = signal(AUTOCOMPLETE_MAX_HEIGHT);
  protected readonly panelPosition = signal<'below' | 'above'>('below');

  private readonly labelInput = viewChild<ElementRef<HTMLInputElement>>('labelInput');

  protected readonly filteredLabels = computed(() => {
    const term = this.labelSearch().trim().toLowerCase();
    const candidates = this.labels().filter((l) => l.type === this.art());
    return term ? candidates.filter((l) => l.name.toLowerCase().includes(term)) : candidates;
  });

  protected readonly showCreateOption = computed(() => {
    const term = this.labelSearch().trim();
    if (!term || this.art() === 'Einnahme') {
      return false;
    }
    return !this.labels().some((l) => l.type === this.art() && l.name.toLowerCase() === term.toLowerCase());
  });

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
    this.dropdownOpen.set(false);
    this.labelError.set(null);
    if (value === 'Einnahme') {
      this.selectedLabelId.set(null);
      this.labelSearch.set('');
      return;
    }
    const selected = this.labels().find((l) => l.id === this.selectedLabelId());
    if (!selected || selected.type !== value) {
      this.selectedLabelId.set(null);
      this.labelSearch.set('');
    }
  }

  protected onLabelSearchInput(value: string): void {
    this.labelSearch.set(value);
    this.dropdownOpen.set(true);
    this.labelError.set(null);
    this.updatePanelLayout();
    const selected = this.labels().find((l) => l.id === this.selectedLabelId());
    if (!selected || selected.name !== value) {
      this.selectedLabelId.set(null);
    }
  }

  protected openDropdown(): void {
    this.dropdownOpen.set(true);
    this.updatePanelLayout();
  }

  // Positions the panel below the input by default; if there isn't much room there, it flips above
  // instead (provided that side has more space) — the panel's height is always clamped to whichever
  // side it renders on, so it never eats into the viewport margin.
  private updatePanelLayout(): void {
    const input = this.labelInput()?.nativeElement;
    if (!input) {
      return;
    }
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - AUTOCOMPLETE_VIEWPORT_MARGIN;
    const spaceAbove = rect.top - AUTOCOMPLETE_VIEWPORT_MARGIN;

    if (spaceBelow >= AUTOCOMPLETE_PREFERRED_MIN_HEIGHT || spaceBelow >= spaceAbove) {
      this.panelPosition.set('below');
      this.panelMaxHeight.set(Math.max(0, Math.min(AUTOCOMPLETE_MAX_HEIGHT, spaceBelow)));
    } else {
      this.panelPosition.set('above');
      this.panelMaxHeight.set(Math.max(0, Math.min(AUTOCOMPLETE_MAX_HEIGHT, spaceAbove)));
    }
  }

  protected closeDropdownDelayed(): void {
    // Delay so a mousedown-selected option/create-button click registers before blur closes the panel.
    setTimeout(() => this.dropdownOpen.set(false), 150);
  }

  protected selectLabel(label: Label): void {
    this.selectedLabelId.set(label.id);
    this.labelSearch.set(label.name);
    this.dropdownOpen.set(false);
    this.labelError.set(null);
  }

  protected onLabelInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.dropdownOpen.set(false);
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    const term = this.labelSearch().trim().toLowerCase();
    if (!term) {
      return;
    }
    const exact = this.labels().find((l) => l.type === this.art() && l.name.toLowerCase() === term);
    if (exact) {
      this.selectLabel(exact);
    } else if (this.showCreateOption()) {
      void this.createLabelFromSearch();
    }
  }

  protected async createLabelFromSearch(): Promise<void> {
    const name = this.labelSearch().trim();
    const art = this.art();
    if (!name || art === 'Einnahme' || this.creatingLabel()) {
      return;
    }

    this.creatingLabel.set(true);
    this.labelError.set(null);
    try {
      const created = await this.labelsService.create({ name, type: art });
      this.labels.update((labels) => [...labels, created]);
      this.selectLabel(created);
    } catch (error) {
      this.labelError.set(extractErrorMessage(error, 'Bezeichnung konnte nicht erstellt werden.'));
    } finally {
      this.creatingLabel.set(false);
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
