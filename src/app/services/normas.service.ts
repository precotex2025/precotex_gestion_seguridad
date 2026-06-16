import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NormasService {
  baseUrl  = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }  

  postProcesoMntoNormas(data: any){
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNNorma/postProcesoMntoNormas', data, { headers })
  }

  getListadoNormas(sEstado:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sEstado', sEstado);
    return this.http.get(this.baseUrl + 'SNNorma/getListadoNormas', { headers, params });
  }   

}
