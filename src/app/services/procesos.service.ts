import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProcesosService {
  baseUrl  = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }    


  postProcesoMntoProcesos(data: any){
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNProceso/postProcesoMntoProcesos', data, { headers })
  }

  getListadoProcesos(sCodigoOrganizacion:string, sEstado:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sEstado', sEstado);
    params = params.append('sCodigoOrganizacion', sCodigoOrganizacion);
    return this.http.get(this.baseUrl + 'SNProceso/getListadoProcesos', { headers, params });
  } 
}
