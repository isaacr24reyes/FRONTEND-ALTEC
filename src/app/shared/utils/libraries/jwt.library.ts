import {JwtHelperService} from '@auth0/angular-jwt';

export class JwtLibrary {
  private static _instance: JwtLibrary;

  constructor() {}

  static get instance(): JwtLibrary {
    if (!this._instance) {
      this._instance = new JwtLibrary();
    }
    return this._instance;
  }

  public decode(token: string): object | null {
    const helper = new JwtHelperService();
    return helper.decodeToken(token);
  }
}
