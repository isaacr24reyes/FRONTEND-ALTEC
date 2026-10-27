import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Cliente de la factura (cédula, RUC o pasaporte). */
export interface InvoiceCustomer {
  tipoIdentificacion?: string;
  identificacion: string;
  razonSocial: string;
  direccion?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export interface InvoiceItemRequest {
  productId?: string | null;
  codigo?: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

export interface CreateElectronicInvoiceRequest {
  saleInvoiceNumber?: string;
  /** Código SRI: '01' efectivo, '20' transferencia. */
  formaPago: string;
  cliente: InvoiceCustomer;
  items: InvoiceItemRequest[];
  createdBy?: string | null;
}

export interface SriMessage {
  identificador?: string;
  mensaje?: string;
  informacionAdicional?: string;
  tipo?: string;
}

export interface ElectronicInvoiceResult {
  id: string;
  numeroFactura: string;
  claveAcceso: string;
  ambiente: number;
  estado: string;
  autorizada: boolean;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  fechaEmision: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  importeTotal: number;
  emailComprador?: string;
  emailEnviado: boolean;
  mensajes: SriMessage[];
}

/** Datos para imprimir la factura en la térmica de 80 mm. */
export interface InvoiceTicketData {
  emisor: {
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    dirMatriz: string;
    dirEstablecimiento: string;
    obligadoContabilidad: string;
    contribuyenteRimpe?: string;
  };
  numeroFactura: string;
  ambiente: number;
  estado: string;
  claveAcceso: string;
  numeroAutorizacion?: string;
  fechaEmision: string;
  fechaAutorizacion?: string;
  comprador: InvoiceCustomer;
  items: { codigo: string; descripcion: string; cantidad: number; precioUnitario: number; descuento: number; total: number }[];
  pagos: { formaPago: string; total: number }[];
  totalSinImpuestos: number;
  totalDescuento: number;
  totalIva: number;
  importeTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class ElectronicInvoiceService {
  private apiUrl = `${environment.apiALTEC}/api/facturacion`;

  constructor(private http: HttpClient) { }

  emitir(request: CreateElectronicInvoiceRequest): Observable<ElectronicInvoiceResult> {
    return this.http.post<ElectronicInvoiceResult>(`${this.apiUrl}/facturas`, request);
  }

  reintentar(id: string): Observable<ElectronicInvoiceResult> {
    return this.http.post<ElectronicInvoiceResult>(`${this.apiUrl}/facturas/${id}/reintentar`, {});
  }

  enviarEmail(id: string, email?: string): Observable<ElectronicInvoiceResult> {
    return this.http.post<ElectronicInvoiceResult>(`${this.apiUrl}/facturas/${id}/enviar-email`, { email: email || null });
  }

  descargarPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/facturas/${id}/pdf`, { responseType: 'blob' });
  }

  getTicket(id: string): Observable<InvoiceTicketData> {
    return this.http.get<InvoiceTicketData>(`${this.apiUrl}/facturas/${id}/ticket`);
  }

  buscarCliente(identificacion: string): Observable<InvoiceCustomer> {
    return this.http.get<InvoiceCustomer>(`${this.apiUrl}/clientes/${encodeURIComponent(identificacion)}`);
  }
}
