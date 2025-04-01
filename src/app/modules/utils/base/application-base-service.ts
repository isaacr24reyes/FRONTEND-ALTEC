import { HttpClient } from '@angular/common/http';
import {environmentQa} from "../../../../environments/environment.qa";


export class ApplicationBaseService {
  protected apiUrl: string;

  constructor(protected http: HttpClient) {
    this.apiUrl = environmentQa.apiALTEC;
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
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }
  }
}
