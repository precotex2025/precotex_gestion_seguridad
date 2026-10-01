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
    'Soporte (SOP)': [
      'Sistemas',
      'Mantenimiento General',
      'Seguridad Patrimonial',
      'SSOMA'
    ],
    'Auditoría Interna (AIO)': [
      'Auditoría Interna'
    ],
    'Control Patrimonial (CPT)': [
      'Control Patrimonial'
    ],
    'Ingeniería y Mejora Continua (IMC)': [
      'Ingeniería',
      'Organización y Métodos',
      'Investigación, Desarrollo e Innovación',
      'Certificaciones'
    ],
    'Administración y Finanzas (AFC)': [
      'Administración',
      'Finanzas',
      'Contabilidad y Costos',
      'Tesorería'
    ],
    'Gestión Humana (GGHH)': [
      'Administración de Personal',
      'Capacitación',
      'Comunicaciones',
      'Desarrollo Organizacional',
      'Gestión Humana',
      'Bienestar Social',
      'Selección de Personal'
    ],
    'Servicio de Estampado y Bordado (SEB)': [
      'Estampado',
      'Bordado',
      'Calidad Estampado y Bordado',
      'Planeamiento y Programación de la Producción E&B'
    ],
    'Operaciones Manufactura (OPM)': [
      'Corte',
      'Costura',
      'Inspección',
      'Acabados',
      'Aseguramiento de la Calidad Manufactura',
      'Manufactura',
      'Consumos'
    ],
    'Operaciones Textil (OPT)': [
      'Tejeduría',
      'Tintorería',
      'Producción Textil',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Laboratorio de Calidad Textil',
      'Aseguramiento de la Calidad Textil',
      'Lavandería'
    ],
    'Balance de Materia (BM)': [
      'Balance de Materia'
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
    'Gestión Comercial (GCOM)': [
      'Desarrollo de Producto',
      'Desarrollo de Estampado y Bordado',
      'Desarrollo Textil',
      'Comercial Exportación de Prendas',
      'Comercial Exportación de Telas',
      'Comercial Venta Local Textil'
    ],
    'Gerencia General (GG)': [
      'Directorio',
      'Alianzas Estratégicas',
      'Desarrollo de Negocios',
      'Proyectos Gerenciales',
      'Sistema de Gestión General',
      'Gestión Estratégica'
    ]
  };

  /**
   * Normaliza nombres de procesos para evitar duplicidades por comas o conjunciones
   */
  normalizarNombreProceso(nombre: string): string {
    if (!nombre) return '';
    const clean = nombre.trim();
    const lower = clean.toLowerCase();
    if (lower === 'costuras' || lower === 'costura') {
      return 'Costura';
    }
    if (lower.includes('investiga') && lower.includes('innova')) {
      return 'Investigación, Desarrollo e Innovación';
    }
    if (lower === 'capacitaciones y desarrollo' || lower === 'capacitacion' || lower === 'capacitación') {
      return 'Capacitación';
    }
    if (lower === 'aseguramiento de calidad textil' || lower === 'aseguramiento de la calidad textil') {
      return 'Aseguramiento de la Calidad Textil';
    }
    if (lower.includes('planeamiento') && (lower.includes('estampado') || lower.includes('e&b') || lower.includes('pceb'))) {
      return 'Planeamiento y Programación de la Producción E&B';
    }
    return clean;
  }

  /**
   * Retorna los procesos agrupados en el formato { [tipoLabel]: string[] }
   * compatible con PROCESOS_GROUPS que usaban los componentes
   */
  getProcesosAgrupados(sCodigoOrganizacion: string = '001'): Observable<{ [key: string]: string[] }> {
    return this.getListadoProcesos(sCodigoOrganizacion, '1').pipe(
      map((response: any) => {
        const groups: { [key: string]: string[] } = {};
        for (const k in this.DEFAULT_PROCESOS) {
          groups[k] = this.DEFAULT_PROCESOS[k].map(p => this.normalizarNombreProceso(p));
        }
        if (response && response.success && response.elements && response.elements.length > 0) {
          for (const proc of response.elements) {
            const rawNom = (proc.proceso || proc.denominacion || proc.des_Proceso || '').trim();
            const pNom = this.normalizarNombreProceso(rawNom);
            if (!pNom) continue;

            const pLower = pNom.toLowerCase();
            if (pLower === 'hilanderia' || pLower === 'hilandería' || pLower === 'capacitaciones y desarrollo') {
              continue;
            }

            let tipoCode = (proc.codigo_Tipo_Proceso || '').trim();
            if (pLower.startsWith('comercial') || pLower.includes('exportacion de telas') || pLower.includes('venta local')) {
              tipoCode = 'GC';
            }

            let label = this.TIPO_PROCESO_LABELS[tipoCode] || tipoCode || 'Operativos / Cadena de Valor';
            if (label === 'Gerencia General (GG)' && pLower.includes('comercial')) {
              label = 'Gestión Comercial (GCOM)';
            }

            if (!groups[label]) {
              groups[label] = [];
            }

            const alreadyExists = groups[label].some(existing => 
              existing.toLowerCase() === pNom.toLowerCase() ||
              this.normalizarNombreProceso(existing).toLowerCase() === pNom.toLowerCase()
            );
            if (!alreadyExists) {
              groups[label].push(pNom);
            }
          }
        }

        // Deduplicación estricta final en cada grupo y exclusión de procesos no deseados
        for (const k in groups) {
          const seen = new Set<string>();
          groups[k] = groups[k]
            .filter(item => {
              const itmLower = item.toLowerCase();
              if (itmLower === 'hilanderia' || itmLower === 'hilandería' || itmLower === 'capacitaciones y desarrollo') return false;
              if (k === 'Gerencia General (GG)' && itmLower.includes('comercial')) return false;
              return true;
            })
            .filter(item => {
              const norm = this.normalizarNombreProceso(item).toLowerCase();
              if (seen.has(norm)) return false;
              seen.add(norm);
              return true;
            });
        }

        return groups;
      })
    );
  }
}
