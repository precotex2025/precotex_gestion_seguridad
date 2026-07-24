import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalVariable } from '../VarGlobals';

@Injectable({
  providedIn: 'root'
})
export class DocumentosControladosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getListadoDocumentosControlados(sCodigo_Organizacion: string = '001', sCodigo_Sede: string = '001', sCodigo_Puesto: string = '', sCodigo_Proceso: string = '') {
    let params = new HttpParams()
      .append('sCodigo_Organizacion', sCodigo_Organizacion)
      .append('sCodigo_Sede', sCodigo_Sede)
      .append('sCodigo_Puesto', sCodigo_Puesto)
      .append('sCodigo_Proceso', sCodigo_Proceso);
    return this.http.get(this.baseUrl + 'SNDocumentosControlados/getListadoDocumentosControlados', { headers: this.headers, params });
  }

  postProcesoMnto(data: any) {
    return this.http.post(this.baseUrl + 'SNDocumentosControlados/postProcesoMnto', data, { headers: this.headers });
  }

  uploadArchivo(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(this.baseUrl + 'SNDocumentosControlados/uploadArchivo', formData);
  }

  getDownloadUrl(fileName: string): string {
    return this.baseUrl + 'SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(fileName);
  }
}
