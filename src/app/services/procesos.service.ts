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

  private DEFAULT_PROCESOS: { [key: string]: string[] } = {
    'Gerencia General (GG)': [
      'Sistema de Gestión General',
      'Gestión Estratégica',
      'Proyectos Gerenciales',
      'Desarrollo de Negocios',
      'Alianzas Estratégicas',
      'Comercial Exportación de Telas',
      'Comercial Venta Local Textil'
    ],
    'Gestión Comercial (GCOM)': [
      'Desarrollo de Producto',
      'Desarrollo de Estampado y Bordado',
      'Desarrollo Textil',
      'Comercial Exportación de Prendas'
    ],
    'Planeamiento y Control de la Producción (PCP)': [
      'PCP Textil',
      'PCP Manufactura',
      'PCP Estampado y Bordado'
    ],
    'Logística (LOG)': [
      'Almacén',
      'Comercio Exterior',
      'Logística',
      'Transporte'
    ],
    'Balance de Materia (BM)': [
      'Balance de Materia'
    ],
    'Operaciones Textil (OPT)': [
      'Hilandería',
      'Tejeduría',
      'Tintorería',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Aseguramiento de Calidad Textil',
      'Lavandería'
    ],
    'Operaciones Manufactura (OPM)': [
      'Corte',
      'Costura',
      'Inspección',
      'Acabados',
      'Aseguramiento de la Calidad Manufactura',
      'Consumos'
    ],
    'Servicio de Estampado y Bordado (SEB)': [
      'Estampado',
      'Bordado',
      'Calidad Estampado y Bordado',
      'Planeamiento y Programación de la Producción E&B'
    ],
    'Gestión Humana (GGHH)': [
      'Gestión Humana',
      'Administración de Personal',
      'Capacitaciones y Desarrollo',
      'Comunicaciones',
      'Bienestar Social',
      'Selección de Personal'
    ],
    'Administración y Finanzas (AFC)': [
      'Administración',
      'Finanzas',
      'Contabilidad y Costos',
      'Tesorería'
    ],
    'Ingeniería y Mejora Continua (IMC)': [
      'Organización y Métodos',
      'Mejora Continua',
      'Investigación, Desarrollo e Innovación',
      'Certificaciones'
    ],
    'Control Patrimonial (CPT)': [
      'Control Patrimonial'
    ],
    'Auditoría Interna (AIO)': [
      'Auditoría Interna'
    ],
    'Soporte (SOP)': [
      'Tecnologías de la Información (Sistemas)',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Seguridad Patrimonial',
      'Mantenimiento e Infraestructura'
    ]
  };

  /**
   * Retorna los procesos agrupados en el formato { [tipoLabel]: string[] }
   * compatible con PROCESOS_GROUPS que usaban los componentes
   */
  getProcesosAgrupados(sCodigoOrganizacion: string = '001'): Observable<{ [key: string]: string[] }> {
    return this.getListadoProcesos(sCodigoOrganizacion, '1').pipe(
      map((response: any) => {
        const groups: { [key: string]: string[] } = { ...this.DEFAULT_PROCESOS };
        if (response && response.success && response.elements && response.elements.length > 0) {
          for (const proc of response.elements) {
            const tipoCode = (proc.codigo_Tipo_Proceso || '').trim();
            const label = this.TIPO_PROCESO_LABELS[tipoCode] || tipoCode || 'Operativos / Cadena de Valor';
            if (!groups[label]) {
              groups[label] = [];
            }
            const pNom = (proc.proceso || proc.denominacion || proc.des_Proceso || '').trim();
            if (pNom && !groups[label].includes(pNom)) {
              groups[label].push(pNom);
            }
          }
        }
        return groups;
      })
    );
  }
}
