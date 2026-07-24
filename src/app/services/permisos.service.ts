import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalVariable } from '../VarGlobals';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getPoliticas() {
    return this.http.get(this.baseUrl + 'SNPermiso/getPoliticas', { headers: this.headers });
  }

  postGuardarPolitica(data: { Modulo: string; Nivel: string; Accion: string; Flg_Permitido: boolean }) {
    return this.http.post(this.baseUrl + 'SNPermiso/postGuardarPolitica', data, { headers: this.headers });
  }

  getPermisosUsuarioModulo(sCodigo_Puesto_Usuario: string) {
    let params = new HttpParams().append('sCodigo_Puesto_Usuario', sCodigo_Puesto_Usuario || '');
    return this.http.get(this.baseUrl + 'SNPermiso/getPermisosUsuarioModulo', { headers: this.headers, params });
  }

  postGuardarUsuarioModulo(data: { Codigo_Puesto_Usuario: string; Modulo_Clave: string; Nivel_Acceso: string }) {
    return this.http.post(this.baseUrl + 'SNPermiso/postGuardarUsuarioModulo', data, { headers: this.headers });
  }

  getPermisosUsuarioDetalle(sCodigo_Puesto_Usuario: string) {
    let params = new HttpParams().append('sCodigo_Puesto_Usuario', sCodigo_Puesto_Usuario || '');
    return this.http.get(this.baseUrl + 'SNPermiso/getPermisosUsuarioDetalle', { headers: this.headers, params });
  }

  postGuardarUsuarioDetalle(data: { Codigo_Puesto_Usuario: string; Modulo: string; Contenido: string; Accion: string; Flg_Permitido: boolean }) {
    return this.http.post(this.baseUrl + 'SNPermiso/postGuardarUsuarioDetalle', data, { headers: this.headers });
  }
}
