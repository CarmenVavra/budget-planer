import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'registrieren',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'uebersicht',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'transaktionen',
        loadComponent: () =>
          import('./features/transactions/transaction-list/transaction-list').then((m) => m.TransactionList),
      },
      {
        path: 'bezeichnungen',
        loadComponent: () => import('./features/labels/labels').then((m) => m.Labels),
      },
      { path: '', pathMatch: 'full', redirectTo: 'uebersicht' },
    ],
  },
  { path: '**', redirectTo: '' },
];
