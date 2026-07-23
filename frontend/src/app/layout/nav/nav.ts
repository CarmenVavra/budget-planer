import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { IconComponent } from '../../design-system/icons/icon';
import { TransactionDialogService } from '../../features/transactions/transaction-dialog.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './nav.html',
})
export class Nav {
  private readonly auth = inject(AuthService);
  private readonly transactionDialog = inject(TransactionDialogService);
  private readonly router = inject(Router);

  protected readonly userEmail = this.auth.userEmail;

  protected openNewExpense(): void {
    void this.transactionDialog.openCreate();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
