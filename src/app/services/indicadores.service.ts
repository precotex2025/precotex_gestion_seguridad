import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndicadoresService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  postIndicadorMnto(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNIndicador/postIndicadorMnto', data, { headers });
  }

  getListadoIndicadores(sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNIndicador/getListadoIndicadores', { headers, params });
  }

  getListadoIndicadorMediciones(idIndicador?: number, sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (idIndicador) {
      params = params.append('idIndicador', idIndicador.toString());
    }
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNIndicador/getListadoIndicadorMediciones', { headers, params });
  }

  postProcesoMntoIndicadorMedicion(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNIndicador/postProcesoMntoIndicadorMedicion', data, { headers });
  }
}
