import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guard/auth.guard';
import { QuotationHistoryComponent } from './components/quotation-history.component';

export const QUOTATION_HISTORY_ROUTES: Routes = [
  {
    path: '',
    component: QuotationHistoryComponent,
    canActivate: [AuthGuard]
  }
];
