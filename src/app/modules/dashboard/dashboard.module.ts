import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {DASHBOARD_ROUTES} from './dashboard.routing';
import {DemoComponent} from './components/demo/demo.component';
import {DemoDialogComponent} from './components/demo/demo-dialog/demo-dialog.component';
import {AppMaterialModule} from "../../app-material.module";
import {AppTranslationLanguageModule} from "../../app-translation-language.module";
import {HomeComponent} from "./components/home/home.component";
import {ReactiveFormsModule} from "@angular/forms";

@NgModule({
    declarations: [DashboardModule.COMPONENT],
  imports: [
    CommonModule,
    AppMaterialModule,
    AppTranslationLanguageModule,
    RouterModule.forChild(DASHBOARD_ROUTES),
    ReactiveFormsModule,
  ]
})
export class DashboardModule {

  static COMPONENT = [
    HomeComponent,
    DemoDialogComponent,
    DemoComponent
  ]
}
