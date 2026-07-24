import { Injectable } from '@angular/core';
import { GlobalVariable } from '../VarGlobals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProcesosService {
  baseUrl  = GlobalVariable.baseUrlBackEnd;
  Header = new HttpHeaders({
    'Content-type': 'application/json'
  });
  constructor(private http: HttpClient) { }    

  // Mapeo de Codigo_Tipo_Proceso a nombre legible
  private TIPO_PROCESO_LABELS: { [key: string]: string } = {
    'SP': 'Soporte (SOP)',
    'AI': 'Auditoría Interna (AIO)',
    'CP': 'Control Patrimonial (CPT)',
    'IM': 'Ingeniería y Mejora Continua (IMC)',
    'AF': 'Administración y Finanzas (AFC)',
    'GH': 'Gestión Humana (GGHH)',
    'SE': 'Servicio de Estampado y Bordado (SEB)',
    'OM': 'Operaciones Manufactura (OPM)',
    'OT': 'Operaciones Textil (OPT)',
    'BM': 'Balance de Materia (BM)',
    'PC': 'Planeamiento y Control de la Producción (PCP)',
    'LO': 'Logística (LOG)',
    'GC': 'Gestión Comercial (GCOM)',
    'GG': 'Gerencia General (GG)'
  };

  postProcesoMntoProcesos(data: any){
    const headers = this.Header;
    return this.http.post(this.baseUrl + 'SNProceso/postProcesoMntoProcesos', data, { headers })
  }

  getListadoProcesos(sCodigoOrganizacion:string, sEstado:string){
    const headers = this.Header;
    let params = new HttpParams();
    params = params.append('sEstado', sEstado);
    params = params.append('sCodigoOrganizacion', sCodigoOrganizacion);
    return this.http.get(this.baseUrl + 'SNProceso/getListadoProcesos', { headers, params });
  } 

  /**
   * Retorna los procesos agrupados en el formato { [tipoLabel]: string[] }
   * compatible con PROCESOS_GROUPS que usaban los componentes
   */
  getProcesosAgrupados(sCodigoOrganizacion: string = '001'): Observable<{ [key: string]: string[] }> {
    return this.getListadoProcesos(sCodigoOrganizacion, '1').pipe(
      map((response: any) => {
        const groups: { [key: string]: string[] } = {};
        if (response && response.success && response.elements) {
          for (const proc of response.elements) {
            const tipoCode = (proc.codigo_Tipo_Proceso || '').trim();
            const label = this.TIPO_PROCESO_LABELS[tipoCode] || tipoCode;
            if (!groups[label]) {
              groups[label] = [];
            }
            groups[label].push(proc.proceso);
          }
        }
        return groups;
      })
    );
  }
}
