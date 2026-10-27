import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ELECTRONIC_INVOICES_ROUTES } from './electronic-invoices.routing';
import { ElectronicInvoicesComponent } from './components/electronic-invoices.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ELECTRONIC_INVOICES_ROUTES),
    ElectronicInvoicesComponent,
  ],
})
export class ElectronicInvoicesModule {}
