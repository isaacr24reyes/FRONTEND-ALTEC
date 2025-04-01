import {ErrorHandler, Injectable} from '@angular/core';
import {ApplicationBase} from './modules/utils/base/application.base';
import {AlertifyLibrary} from './shared/utils/libraries/alertify.library';

@Injectable()
export class GlobalErrorHandler extends ApplicationBase implements ErrorHandler {

  private _strategyErrorManagement: any;

  constructor() {
    super();
    this._strategyErrorManagement = {
      ['400']: (message: string) => {
        AlertifyLibrary.instance.error(message);
      },
      ['500']: () => {
        AlertifyLibrary.instance.error();
      },
      ['404']: () => {
        AlertifyLibrary.instance.error();
      }
    };
  }


  handleError(error: any) {
    console.error(error);
    if (!error || !error.error || !error.error.code) {
      return;
    }
    this._strategyErrorManagement[error.error.code](error.error.message);
  }
}
