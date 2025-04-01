import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AuthenticationRoutes} from './authentication.routing';
import {ErrorComponent} from './components/error/error.component';
import {LoginComponent} from './components/login/login.component';
import {RegisterComponent} from './components/register/register.component';
import {AppMaterialModule} from "../../app-material.module";
import {AppTranslationLanguageModule} from "../../app-translation-language.module";
import {SharedModule} from "../../shared/shared.module";

@NgModule({
  declarations: [AuthenticationModule.COMPONENT],
  imports: [
    CommonModule,
    AppTranslationLanguageModule,
    AppMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(AuthenticationRoutes),
    SharedModule
  ]
})
export class AuthenticationModule {

  static COMPONENT = [
    ErrorComponent,
    LoginComponent,
    RegisterComponent
  ]
}
