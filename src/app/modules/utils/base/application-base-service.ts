import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";


export class ApplicationBaseService {
  protected apiUrl: string;

  constructor(protected http: HttpClient) {
    this.apiUrl = environment.apiALTEC;
  }

  public genericSend(method: string, endpoint: string = '', body: any = null): any {
    const url = `${this.apiUrl}/${endpoint}`;

    switch (method.toLowerCase()) {
      case 'post':
        return this.http.post(url, body);
      case 'get':
        return this.http.get(url);
      case 'put':
        return this.http.put(url, body);
      case 'delete':
        return this.http.delete(url);
      case 'patch':
        return this.http.patch(url, body);
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }
  }
}
