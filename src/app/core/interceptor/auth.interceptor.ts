import {Injectable} from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = sessionStorage.getItem('token');
    if (!token) {
      return next.handle(req);
    }
    const authReq = req.clone({
      setHeaders: {
        Authorization:  `bearer ${token}`
      }
    });
    return next.handle(authReq);
  }
}
