import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMaterialModule } from '../../app-material.module';
import { AppTranslationLanguageModule } from '../../app-translation-language.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SALES_MODULE_ROUTES } from './sales-module.routing';
import { SalesModuleComponent } from './components/sales-module.component';


@NgModule({
  imports: [
    CommonModule,
    AppMaterialModule,
    AppTranslationLanguageModule,
    RouterModule.forChild(SALES_MODULE_ROUTES),
    ReactiveFormsModule,
    SalesModuleComponent,
  ],
})
export class SalesModuleModule {}
