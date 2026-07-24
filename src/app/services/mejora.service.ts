import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MejoraService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  postMejoraMnto(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNMejora/postMejoraMnto', data, { headers });
  }

  getListadoMejoras(sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNMejora/getListadoMejoras', { headers, params });
  }

  uploadArchivo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.baseUrl + 'SNMejora/uploadArchivo', formData);
  }

  getDownloadUrl(fileName: string): string {
    return `${this.baseUrl}SNMejora/downloadArchivo?fileName=${encodeURIComponent(fileName)}`;
  }
}
