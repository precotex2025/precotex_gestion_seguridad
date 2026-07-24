import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ObjetivosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  postObjetivoMnto(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNObjetivo/postObjetivoMnto', data, { headers });
  }

  getListadoObjetivos(sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNObjetivo/getListadoObjetivos', { headers, params });
  }

  getListadoObjetivoMediciones(idObjetivo?: number, sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (idObjetivo) {
      params = params.append('idObjetivo', idObjetivo.toString());
    }
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNObjetivo/getListadoObjetivoMediciones', { headers, params });
  }

  postProcesoMntoObjetivoMedicion(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNObjetivo/postProcesoMntoObjetivoMedicion', data, { headers });
  }
}
