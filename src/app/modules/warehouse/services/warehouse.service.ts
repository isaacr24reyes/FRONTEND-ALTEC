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
  updateProduct(id: string, producto: any): Observable<any> {
    const formData = new FormData();

    formData.append('Id', producto.id);
    formData.append('Categoria', producto.categoria);
    formData.append('Codigo', producto.codigo);
    formData.append('Stock', String(producto.stock));
    formData.append('Pvp', String(producto.pvp));
    formData.append('PrecioMayorista', String(producto.precioMayorista));
    formData.append('PrecioImportacion', String(producto.precioImportacion));
    formData.append('Descripcion', producto.descripcion);
    formData.append('UpdatedBy', 'ADMIN');

    if (producto.archivo) {
      formData.append('Foto', producto.archivo);
    }

    return this.genericSend('put', `api/Products/${id}`, formData);
  }
}
