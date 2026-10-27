import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guard/auth.guard';
import { ElectronicInvoicesComponent } from './components/electronic-invoices.component';

export const ELECTRONIC_INVOICES_ROUTES: Routes = [
  {
    path: '',
    component: ElectronicInvoicesComponent,
    canActivate: [AuthGuard],
  },
];
