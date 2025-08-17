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

  public getUserInfo(username: string): Observable<any> {
    return this.genericSend('get', `api/auth/by-username?username=${username}`);
  }
  searchUsersByName(q: string, page = 1, pageSize = 50): Observable<any> {
    const url = `api/auth/by-name?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`;
    return this.genericSend('get', url);
  }

  addPoints(name: string, points: number): Observable<any> {
    const body = { name, points };
    return this.genericSend('post', 'api/auth/add-points', body);
  }

}
