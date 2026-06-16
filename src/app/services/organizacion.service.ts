import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {
  baseUrl  = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }  

  postProcesoMntoOrganizacion(data: any){
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNOrganizacion/postProcesoMntoOrganizacion', data, { headers })
  }  

  getListadoOrganizacion(sEstado:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sEstado', sEstado);
    return this.http.get(this.baseUrl + 'SNOrganizacion/getListadoOrganizacion', { headers, params });
  }    
  
  getObtenerOrganizacion(sCodigoOrganizacion:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sCodigoOrganizacion', sCodigoOrganizacion);
    return this.http.get(this.baseUrl + 'SNOrganizacion/getObtenerOrganizacion', { headers, params });
  }   
  
  getComboOrganizacion(){
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNOrganizacion/getComboOrganizacion', { headers });
  }      
}
