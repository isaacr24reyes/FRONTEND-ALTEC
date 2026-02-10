import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaleDto {
  invoiceNumber: string;
  customerID: number;
  employeeID: number;
  productID: number;
  saleDate: string; // ISO string
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = '/api/Sales';

  constructor(private http: HttpClient) {}

  createSale(sale: SaleDto): Observable<number> {
    return this.http.post<number>(this.apiUrl, sale);
  }
}
