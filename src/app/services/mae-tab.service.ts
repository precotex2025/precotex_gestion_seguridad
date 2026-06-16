import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MaeTabService {
  baseUrl  = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }  

 getListaMaeTab(sCodigoTipo:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sCodigoTipo', sCodigoTipo);
    return this.http.get(this.baseUrl + 'MaeTab/getListaMaeTab', { headers, params });
  }     
}
