import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { SaleDto } from '../models/sale.dto';
export { SaleDto };

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = `${environment.apiALTEC}/api/Sales`;

  constructor(private http: HttpClient) { }

  createSale(sale: SaleDto): Observable<number> {
    return this.http.post<number>(this.apiUrl, sale);
  }

  getHistoricSales(pageNumber: number, pageSize: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  cancelInvoice(invoiceNumber: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${invoiceNumber}/cancelar`, {});
  }
}
