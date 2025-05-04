import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationBaseService } from '../../utils/base/application-base-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends ApplicationBaseService {

  constructor(protected override http: HttpClient) {
    super(http);
  }

  // Método para crear un producto (ya lo tienes)
  createProduct(formData: FormData): Observable<any> {
    return this.genericSend(
      'post',
      'api/Products',
      formData
    );
  }

  getProducts(
    pageNumber: number,
    pageSize: number,
    filter: string = '',
    sortBy: string = 'descripcion',
    sortOrder: string = 'asc'
  ): Observable<any> {
    const queryParams = `pageNumber=${pageNumber}&pageSize=${pageSize}&filter=${filter}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return this.genericSend('get', `api/Products?${queryParams}`, null);
  }

}
