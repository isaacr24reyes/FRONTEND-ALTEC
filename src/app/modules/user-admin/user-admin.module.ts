import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMaterialModule } from '../../app-material.module';
import { AppTranslationLanguageModule } from '../../app-translation-language.module';
import { ReactiveFormsModule } from '@angular/forms';
import {UserAdminComponent} from "./components/user-admin.component";
import {USER_ADMIN_ROUTES} from "./user-admin.routing";
@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    AppMaterialModule,
    AppTranslationLanguageModule,
    ReactiveFormsModule,
    RouterModule.forChild(USER_ADMIN_ROUTES),
    UserAdminComponent,

  ]
})
export class UserAdminModule {  }
