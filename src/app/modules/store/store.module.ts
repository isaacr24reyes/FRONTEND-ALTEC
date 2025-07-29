import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { STORE_ROUTES } from './store.routing';
import { AppMaterialModule } from "../../app-material.module";
import { AppTranslationLanguageModule } from "../../app-translation-language.module";
import { ReactiveFormsModule } from "@angular/forms";
import {StoreComponent} from "./components/store.component";


@NgModule({
  imports: [
    CommonModule,
    AppMaterialModule,
    AppTranslationLanguageModule,
    RouterModule.forChild(STORE_ROUTES),
    ReactiveFormsModule,
    StoreComponent
  ]
})
export class StoreModule { }
