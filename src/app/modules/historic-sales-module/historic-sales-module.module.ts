import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMaterialModule } from '../../app-material.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HISTORIC_SALES_MODULE_ROUTES } from './historic-sales-module.routing';
import { HistoricSalesModuleComponent } from './components/historic-sales-module.component';

@NgModule({
    imports: [
        CommonModule,
        AppMaterialModule,
        RouterModule.forChild(HISTORIC_SALES_MODULE_ROUTES),
        ReactiveFormsModule,
        FormsModule,
        HistoricSalesModuleComponent,
    ],
})
export class HistoricSalesModuleModule { }
