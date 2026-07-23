import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { extractErrorMessage } from '../../core/http/problem-details';
import { Label, LabelType } from '../../core/models/label.model';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { IconComponent } from '../../design-system/icons/icon';
import { LabelsService } from './labels.service';

@Component({
  selector: 'app-labels',
  imports: [FormsModule, DatePipe, IconComponent],
  templateUrl: './labels.html',
})
export class Labels {
  private readonly labelsService = inject(LabelsService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly labels = signal<Label[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly newName = signal('');
  protected readonly newType = signal<LabelType>('Variabel');
  protected readonly adding = signal(false);

  protected readonly editingId = signal<string | null>(null);
  protected readonly editName = signal('');
  protected readonly editType = signal<LabelType>('Fix');
  protected readonly editError = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.labels.set(await this.labelsService.getAll());
    } finally {
      this.loading.set(false);
    }
  }

  protected async addLabel(): Promise<void> {
    const name = this.newName().trim();
    if (!name) {
      return;
    }

    this.adding.set(true);
    this.errorMessage.set(null);
    try {
      const created = await this.labelsService.create({ name, type: this.newType() });
      this.labels.update((labels) => [...labels, created]);
      this.newName.set('');
    } catch (error) {
      this.errorMessage.set(extractErrorMessage(error, 'Bezeichnung konnte nicht erstellt werden.'));
    } finally {
      this.adding.set(false);
    }
  }

  protected startEdit(label: Label): void {
    this.editingId.set(label.id);
    this.editName.set(label.name);
    this.editType.set(label.type);
    this.editError.set(null);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editError.set(null);
  }

  protected async saveEdit(label: Label): Promise<void> {
    const name = this.editName().trim();
    if (!name) {
      return;
    }

    try {
      const updated = await this.labelsService.update(label.id, { name, type: this.editType() });
      this.labels.update((labels) => labels.map((l) => (l.id === label.id ? updated : l)));
      this.editingId.set(null);
    } catch (error) {
      this.editError.set(extractErrorMessage(error, 'Änderung konnte nicht gespeichert werden.'));
    }
  }

  protected async deleteLabel(label: Label): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Bezeichnung löschen?',
      message: `„${label.name}“ wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
      confirmLabel: 'Löschen',
    });
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    try {
      await this.labelsService.delete(label.id);
      this.labels.update((labels) => labels.filter((l) => l.id !== label.id));
    } catch (error) {
      this.errorMessage.set(extractErrorMessage(error, 'Bezeichnung konnte nicht gelöscht werden.'));
    }
  }
}
