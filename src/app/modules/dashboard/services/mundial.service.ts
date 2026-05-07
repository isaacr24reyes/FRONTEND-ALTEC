import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationBaseService } from '../../utils/base/application-base-service';
import { Observable } from 'rxjs';

export interface PronosticoPayload {
  codigoUnico:    string;
  nombre:         string;
  telefono:       string;
  campeon:        string;
  subcampeon:     string;
  tercerLugar:    string;
  cuartoLugar:    string;
  goleador:       string;
  resultadoFinal: string;
}

@Injectable({
  providedIn: 'root'
})
export class MundialService extends ApplicationBaseService {

  constructor(protected override http: HttpClient) {
    super(http);
  }

  // ── Admin: códigos ────────────────────────────────────────────────────────
  saveCode(codigo: string, createdBy: string): Observable<any> {
    return this.genericSend('post', 'api/Mundial/codes', { codigo, createdBy });
  }

  getCodes(): Observable<any> {
    return this.genericSend('get', 'api/Mundial/codes', null);
  }

  // ── Público: validar código ───────────────────────────────────────────────
  validateCode(codigo: string): Observable<{ valid: boolean; message: string }> {
    return this.genericSend('get', `api/Mundial/codes/validate/${encodeURIComponent(codigo)}`, null);
  }

  // ── Público: pronósticos ──────────────────────────────────────────────────
  savePronostico(payload: PronosticoPayload): Observable<any> {
    return this.genericSend('post', 'api/Mundial/pronosticos', payload);
  }

  getPronosticos(): Observable<any[]> {
    return this.genericSend('get', 'api/Mundial/pronosticos', null);
  }
}
