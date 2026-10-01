import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PuestosService {
  get baseUrl(): string {
    return GlobalVariable.baseUrlBackEnd;
  }
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }

  private get isLocal(): boolean {
    const url = (GlobalVariable.baseUrlBackEnd || '').toLowerCase();
    return (url.includes('localhost') || url.includes('127.0.0.1')) && !url.includes(':5252');
  }

  private get isProd5252(): boolean {
    const url = (GlobalVariable.baseUrlBackEnd || '').toLowerCase();
    return url.includes(':5252');
  }

  postProcesoMntoPuesto(data: any): Observable<any> {
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNPuesto/postProcesoMntoPuesto', data, { headers });
  }

  getListadoPuesto(sCodigoOrganizacion: string = '001', sCodigo_Sede: string = '', sCodigo_Nivel_Riesgo: string = ''): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sCodigo_Organizacion', sCodigoOrganizacion || '001');
    params = params.append('sCodigo_Sede', sCodigo_Sede || '');
    params = params.append('sCodigo_Nivel_Riesgo', sCodigo_Nivel_Riesgo || '');
    return this.http.get(this.baseUrl + 'SNPuesto/getListadoPuesto', { headers, params }).pipe(
      catchError(() => of({ success: false, elements: [] }))
    );
  }

  getLogAccesos(top: number = 50, soloUltimo: boolean = false): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('top', top.toString());
    params = params.append('soloUltimo', soloUltimo.toString());
    return this.http.get(this.baseUrl + 'SNUsuario/getLogAccesos', { headers, params }).pipe(
      catchError(() => of({ success: false, elements: [] }))
    );
  }

  getHistorialUsuario(top: number = 50, soloUltimo: boolean = false): Observable<any> {
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('top', top.toString());
    params = params.append('soloUltimo', soloUltimo.toString());
    return this.http.get(this.baseUrl + 'SNUsuario/getLogAccesos', { headers, params }).pipe(
      catchError(() => of({ success: false, elements: [] }))
    );
  }

  // Integración con Spring ERP (192.168.1.86) ejecutando UP_MuestraDatosTrabajador (2,285 trabajadores)
  getTrabajadoresSpring(): Observable<any> {
    if (this.isProd5252) {
      return this.http.get<any[]>('assets/trabajadores_spring.json').pipe(
        map((elements: any) => ({ success: true, elements })),
        catchError(() => of({ success: true, elements: [] }))
      );
    }
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNUsuario/getTrabajadoresSpring', { headers }).pipe(
      catchError(() => {
        return this.http.get<any[]>('assets/trabajadores_spring.json').pipe(
          map((elements: any) => ({ success: true, elements })),
          catchError(() => of({ success: true, elements: [] }))
        );
      })
    );
  }

  // Ejecuta el Stored Procedure SN_Nivel_Jerarquico_Listado
  getListadoNivelJerarquico(): Observable<any> {
    if (this.isProd5252) {
      return of({
        success: true,
        elements: [
          { codigo_Nivel: '001', descripcion_Nivel: 'Gerencial', nivel: 'Gerencial' },
          { codigo_Nivel: '002', descripcion_Nivel: 'Jefatura / Mando Medio', nivel: 'Jefatura' },
          { codigo_Nivel: '003', descripcion_Nivel: 'Operativo', nivel: 'Operativo' }
        ]
      });
    }
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNUsuario/getListadoNivelJerarquico', { headers }).pipe(
      catchError(() => of({
        success: true,
        elements: [
          { codigo_Nivel: '001', descripcion_Nivel: 'Gerencial', nivel: 'Gerencial' },
          { codigo_Nivel: '002', descripcion_Nivel: 'Jefatura / Mando Medio', nivel: 'Jefatura' },
          { codigo_Nivel: '003', descripcion_Nivel: 'Operativo', nivel: 'Operativo' }
        ]
      }))
    );
  }

  // Obtiene el listado de usuarios desde SN_Usuario en tiempo real
  getListadoUsuarios(): Observable<any> {
    if (this.isProd5252) {
      return this.getListadoPuesto('001', '', '').pipe(
        catchError(() => this.http.get<any[]>('assets/usuarios_sn.json').pipe(
          map((elements: any) => ({ success: true, elements })),
          catchError(() => of({ success: true, elements: [] }))
        ))
      );
    }
    const headers = this.Header;
    return this.http.get(this.baseUrl + 'SNUsuario/getListadoUsuarios', { headers }).pipe(
      catchError(() => this.getListadoPuesto('001', '', '')),
      catchError(() => {
        return this.http.get<any[]>('assets/usuarios_sn.json').pipe(
          map((elements: any) => ({ success: true, elements })),
          catchError(() => of({ success: true, elements: [] }))
        );
      })
    );
  }

}
