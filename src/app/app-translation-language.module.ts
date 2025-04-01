import { NgModule } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { TranslateService } from '@ngx-translate/core';
import {TRANSLATE_SETTINGS} from "./modules/utils/settings/general.settings";

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const translationOptions = {
    loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
    }
};

@NgModule({ exports: [TranslateModule], imports: [TranslateModule.forRoot(translationOptions)], providers: [TranslateService, provideHttpClient(withInterceptorsFromDi())] })
export class AppTranslationLanguageModule {
    constructor(private translate: TranslateService) {
        translate.setDefaultLang(TRANSLATE_SETTINGS.defaultLang);
    }
}
