import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalVariable } from '../VarGlobals';

@Injectable({
  providedIn: 'root'
})
export class BackupService {

  private get baseUrl(): string {
    return GlobalVariable.baseUrlBackEnd;
  }

  constructor(private http: HttpClient) { }

  getBackupStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SNBackup/getBackupStatus`);
  }

  generarBackup(usuario: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SNBackup/postGenerarBackup`, { usuario });
  }

  descargarBackupUrl(): string {
    return `${this.baseUrl}SNBackup/getDescargarBackup`;
  }
}
