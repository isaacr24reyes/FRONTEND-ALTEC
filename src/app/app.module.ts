import {ErrorHandler, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GlobalErrorHandler} from "./global-error-handler";
import {SharedModule} from "./shared/shared.module";
import {BlockUIModule} from "ng-block-ui";
import {AppMaterialModule} from "./app-material.module";
import {AppBlankComponent} from "./layouts/blank/blank.component";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HeaderComponent} from "./layouts/full/header/header.component";
import {FullComponent} from "./layouts/full/full.component";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {AuthInterceptor} from "./core/interceptor/auth.interceptor";
import {OnlyNumbersDirective} from "./shared/directive/only-numbers.directive";
import {LoaderComponent} from "./shared/components/LoaderComponent";

@NgModule({ declarations: [
        AppComponent,
        HeaderComponent,
        FullComponent,
        AppBlankComponent,
        OnlyNumbersDirective
  ],
    bootstrap: [AppComponent], imports: [BrowserModule,
    AppRoutingModule,
    AppMaterialModule,
    BlockUIModule.forRoot(),
    SharedModule,
    BrowserAnimationsModule, LoaderComponent], providers: [
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {
}
