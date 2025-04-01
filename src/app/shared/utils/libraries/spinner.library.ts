import {BlockUI, NgBlockUI} from 'ng-block-ui';
import {SPINNER_DEFAULT_MESSAGES} from '../../../modules/utils/settings/general.settings';

export class SpinnerLibrary {
  private static _instance: SpinnerLibrary;
  @BlockUI()
  blockUI!: NgBlockUI;

  constructor() {}

  static get instance(): SpinnerLibrary {
    if (!this._instance) {
      this._instance = new SpinnerLibrary();
    }
    return this._instance;
  }

  public start(message?: string): void {
    if (!message) {
      message = SPINNER_DEFAULT_MESSAGES.loading;
    }
    this.blockUI.start(message);
  }

  public stop(): void {
    this.blockUI.stop();
  }
}
