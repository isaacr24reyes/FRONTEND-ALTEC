import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QUOTATION_HISTORY_ROUTES } from './quotation-history.routing';
import { QuotationHistoryComponent } from './components/quotation-history.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(QUOTATION_HISTORY_ROUTES),
    QuotationHistoryComponent
  ]
})
export class QuotationHistoryModule {}
