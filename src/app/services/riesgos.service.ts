import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RiesgosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  postProcesoMntoRiesgo(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNRiesgo/postProcesoMntoRiesgo', data, { headers });
  }

  getListadoRiesgos(sFiltro: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    if (sFiltro) {
      params = params.append('sFiltro', sFiltro);
    }
    return this.http.get(this.baseUrl + 'SNRiesgo/getListadoRiesgos', { headers, params });
  }

  uploadArchivo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(this.baseUrl + 'SNDocumentosControlados/uploadArchivo', formData);
  }

  getDownloadUrl(fileName: string): string {
    return this.baseUrl + 'SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(fileName);
  }
}
