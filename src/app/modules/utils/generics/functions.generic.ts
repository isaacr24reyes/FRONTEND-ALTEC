import {JwtLibrary} from '../../../shared/utils/libraries/jwt.library';


export class FunctionsGeneric {

  static initialize() {}

  public static getDecodedToken(): any {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    return JwtLibrary.instance.decode(token);
  }
}

FunctionsGeneric.initialize();
