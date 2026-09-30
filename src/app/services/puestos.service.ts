import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PuestosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }

  postProcesoMntoPuesto(data: any) {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNPuesto/postProcesoMntoPuesto', data, { headers })
  }

  getListadoPuesto(sCodigoOrganizacion: string, sCodigo_Sede: string, sCodigo_Nivel_Riesgo: string) {
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sCodigo_Organizacion', sCodigoOrganizacion);
    params = params.append('sCodigo_Sede', sCodigo_Sede);
    params = params.append('sCodigo_Nivel_Riesgo', sCodigo_Nivel_Riesgo);
    return this.http.get(this.baseUrl + 'SNPuesto/getListadoPuesto', { headers, params });
  }

  getLogAccesos(top: number = 20, soloUltimo: boolean = true) {
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('top', top.toString());
    params = params.append('soloUltimo', soloUltimo.toString());
    return this.http.get(this.baseUrl + 'SNUsuario/getLogAccesos', { headers, params });
  }

  // Integración con Spring ERP (192.168.1.86) ejecutando UP_MuestraDatosTrabajador
  getTrabajadoresSpring() {
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNUsuario/getTrabajadoresSpring', { headers });
  }

  // Ejecuta el Stored Procedure SN_Nivel_Jerarquico_Listado
  getListadoNivelJerarquico() {
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNUsuario/getListadoNivelJerarquico', { headers });
  }

  // Obtiene el listado de usuarios desde SN_Usuario integrados con los permisos de SN_Puesto
  getListadoUsuarios() {
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNUsuario/getListadoUsuarios', { headers });
  }

}
