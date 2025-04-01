import {SpinnerLibrary} from '../../../shared/utils/libraries/spinner.library';
import {FunctionsGeneric} from '../generics/functions.generic';
import {AlertifyLibrary} from "../../../shared/utils/libraries/alertify.library";

export class ApplicationBase {
  protected alertify: AlertifyLibrary;
  protected spinner: SpinnerLibrary;
  protected decodedToken: any;

  constructor() {
    this.alertify = AlertifyLibrary.instance;
    this.spinner = SpinnerLibrary.instance;
    this.decodedToken = FunctionsGeneric.getDecodedToken();
  }
}
