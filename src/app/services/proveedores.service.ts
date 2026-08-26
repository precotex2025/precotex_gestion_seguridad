import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  postProveedorMnto(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNProveedor/postProveedorMnto', data, { headers });
  }

  getListadoProveedores(sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNProveedor/getListadoProveedores', { headers, params });
  }
}
