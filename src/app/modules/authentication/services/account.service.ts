import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationBaseService } from '../../utils/base/application-base-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService extends ApplicationBaseService {

  constructor(protected override http: HttpClient) {
    super(http);
  }

  public login(username: string, password: string): Observable<any> {
    const body = { username, password };
    return this.genericSend('post', 'api/auth/login', body);
  }
}
