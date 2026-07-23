import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(Dialog);

  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<boolean>(ConfirmDialog, {
      data,
      backdropClass: 'dialog-backdrop-cdk',
    });
    const result = await firstValueFrom(ref.closed);
    return result ?? false;
  }
}
