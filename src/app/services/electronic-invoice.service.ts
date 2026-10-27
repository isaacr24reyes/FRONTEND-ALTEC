import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  fechaAnulacion?: string;
  motivoAnulacion?: string;
  mensajes: SriMessage[];
}

/** Fila del histórico de facturas. */
export interface ElectronicInvoiceListItem {
  id: string;
  numeroFactura: string;
  claveAcceso: string;
  ambiente: number;
  fechaEmision: string;
  fechaAutorizacion?: string;
  identificacionComprador: string;
  razonSocialComprador: string;
  emailComprador?: string;
  importeTotal: number;
  estado: string;
  emailEnviado: boolean;
  saleInvoiceNumber?: string;
  fechaAnulacion?: string;
  motivoAnulacion?: string;
  createdAt: string;
}

export interface ElectronicInvoicePage {
  items: ElectronicInvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  /** Facturas pendientes de autorizar (para el aviso de la pantalla). */
  pendientes: number;
}

export interface ElectronicInvoiceFilter {
  desde?: string;    // aaaa-mm-dd
  hasta?: string;    // aaaa-mm-dd
  /** AUTORIZADO, PENDIENTE, ANULADA, RECHAZADA o vacío (todas). */
  estado?: string;
  buscar?: string;
  page: number;
  pageSize: number;
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

  listar(filter: ElectronicInvoiceFilter): Observable<ElectronicInvoicePage> {
    let params = new HttpParams().set('page', filter.page).set('pageSize', filter.pageSize);
    if (filter.desde) params = params.set('desde', filter.desde);
    if (filter.hasta) params = params.set('hasta', filter.hasta);
    if (filter.estado) params = params.set('estado', filter.estado);
    if (filter.buscar?.trim()) params = params.set('buscar', filter.buscar.trim());
    return this.http.get<ElectronicInvoicePage>(`${this.apiUrl}/facturas`, { params });
  }

  /** Registra la anulación hecha en SRI en línea; cancelarVenta devuelve también el stock. */
  anular(id: string, motivo: string, cancelarVenta: boolean): Observable<ElectronicInvoiceResult> {
    return this.http.post<ElectronicInvoiceResult>(`${this.apiUrl}/facturas/${id}/anular`, { motivo, cancelarVenta });
  }

  descargarXml(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/facturas/${id}/xml`, { responseType: 'blob' });
  }

  getTicket(id: string): Observable<InvoiceTicketData> {
    return this.http.get<InvoiceTicketData>(`${this.apiUrl}/facturas/${id}/ticket`);
  }

  buscarCliente(identificacion: string): Observable<InvoiceCustomer> {
    return this.http.get<InvoiceCustomer>(`${this.apiUrl}/clientes/${encodeURIComponent(identificacion)}`);
  }
}
