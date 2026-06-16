import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SedesService {
  baseUrl  = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }    

  postProcesoMntoSedes(data: any){
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNSede/postProcesoMntoSedes', data, { headers })
  }

  getListadoSedes(sCodigoOrganizacion:string, sEstado:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sCodigoOrganizacion', sCodigoOrganizacion);
    params = params.append('sEstado', sEstado);
    return this.http.get(this.baseUrl + 'SNSede/getListadoSedes', { headers, params });
  }   

  getComboSedes(sCodigoOrganizacion:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sCodigoOrganizacion', sCodigoOrganizacion);
    return this.http.get(this.baseUrl + 'SNSede/getComboSedes', { headers, params });
  }    
}
