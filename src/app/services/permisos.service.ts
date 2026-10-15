import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalVariable } from '../VarGlobals';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  // Matriz de permisos estándar por nivel jerárquico [Contenido, Acción, Gerencial, Jefatura, Operativo]
  public readonly permTree: { [modulo: string]: Array<[string, string, number, number, number]> } = {
    'Inicio (Dashboard)': [
      ['Tablero general', 'Ver', 1, 1, 1],
      ['Tablero general', 'Exportar', 1, 1, 0],
      ['Accesos directos', 'Ver', 1, 1, 1]
    ],
    'Organización': [
      ['Política del SIG', 'Ver', 1, 1, 1],
      ['Política del SIG', 'Editar', 1, 0, 0],
      ['Política del SIG', 'Aprobar', 1, 0, 0],
      ['Gestión de Normas y certificaciones', 'Ver', 1, 1, 1],
      ['Gestión de Normas y certificaciones', 'Crear', 1, 0, 0],
      ['Gestión de Normas y certificaciones', 'Editar', 1, 0, 0],
      ['Gestión de Normas y certificaciones', 'Eliminar', 1, 0, 0],
      ['Certificados (archivo)', 'Descargar', 1, 1, 1],
      ['Estructura (sedes)', 'Ver', 1, 1, 1],
      ['Estructura (sedes)', 'Crear / Editar', 1, 0, 0]
    ],
    'Puestos': [
      ['Puestos y usuarios', 'Ver', 1, 1, 1],
      ['Puestos y usuarios', 'Crear usuario', 1, 1, 0],
      ['Puestos y usuarios', 'Editar', 1, 1, 0],
      ['Puestos y usuarios', 'Eliminar', 1, 0, 0],
      ['Permisos por módulo', 'Ver', 1, 1, 0],
      ['Permisos por módulo', 'Asignar / Editar', 1, 1, 0],
      ['Auditoría de cambios', 'Ver', 1, 1, 0]
    ],
    'Documentación': [
      ['Documentos', 'Ver', 1, 1, 1],
      ['Documentos', 'Crear', 1, 1, 0],
      ['Documentos', 'Editar', 1, 1, 0],
      ['Documentos', 'Eliminar / Obsoletar', 1, 0, 0],
      ['Documentos', 'Aprobar', 1, 1, 0],
      ['Documentos', 'Descargar', 1, 1, 1],
      ['Historial de versiones', 'Ver', 1, 1, 1],
      ['Historial de versiones', 'Restaurar versión', 1, 0, 0]
    ],
    'Auditorías': [
      ['Planificación', 'Ver', 1, 1, 1],
      ['Planificación', 'Crear / Planificar', 1, 1, 0],
      ['Planificación', 'Editar', 1, 1, 0],
      ['Hallazgos', 'Registrar', 1, 1, 0],
      ['Hallazgos', 'Ver', 1, 1, 1],
      ['Cierre de auditoría', 'Aprobar', 1, 0, 0],
      ['Programa anual', 'Ver', 1, 1, 1],
      ['Programa anual', 'Exportar', 1, 1, 0]
    ],
    'No conformidades': [
      ['Declaración de NC', 'Registrar', 1, 1, 1],
      ['Declaración de NC', 'Ver', 1, 1, 1],
      ['Acciones correctivas', 'Registrar', 1, 1, 1],
      ['Acciones correctivas', 'Editar', 1, 1, 1],
      ['Acciones correctivas', 'Ver', 1, 1, 1],
      ['Cierre de NC', 'Aprobar', 1, 1, 0]
    ],
    'Indicadores': [
      ['Alta de indicadores', 'Ver', 1, 1, 1],
      ['Alta de indicadores', 'Crear', 1, 1, 0],
      ['Alta de indicadores', 'Editar', 1, 1, 0],
      ['Alta de indicadores', 'Eliminar', 1, 0, 0],
      ['Medición', 'Registrar medición', 0, 1, 1],
      ['Medición', 'Ver', 1, 1, 1],
      ['Medición', 'Exportar', 1, 1, 0]
    ],
    'Objetivos': [
      ['Planificación', 'Ver', 1, 1, 1],
      ['Planificación', 'Crear / Editar', 1, 1, 0],
      ['Planificación', 'Aprobar', 1, 0, 0],
      ['Medición', 'Registrar medición', 0, 1, 1],
      ['Medición', 'Ver', 1, 1, 1]
    ],
    'Riesgos': [
      ['Declaración de riesgo', 'Ver', 1, 1, 1],
      ['Declaración de riesgo', 'Registrar', 1, 1, 1],
      ['Declaración de riesgo', 'Editar', 1, 1, 1],
      ['Control / estado', 'Aprobar', 1, 1, 0]
    ],
    'Portafolio de Mejora': [
      ['Iniciativas', 'Ver', 1, 1, 1],
      ['Iniciativas', 'Registrar', 1, 1, 1],
      ['Iniciativas', 'Editar', 1, 1, 1],
      ['Cierre', 'Aprobar', 1, 1, 0]
    ],
    'Gestión Legal': [
      ['Matriz legal', 'Ver', 1, 1, 1],
      ['Matriz legal', 'Crear / Editar', 1, 1, 0],
      ['Matriz legal', 'Aprobar', 1, 0, 0],
      ['Alertas', 'Ver', 1, 1, 1]
    ],
    'Proveedores': [
      ['Catálogo de proveedores', 'Ver', 1, 1, 1],
      ['Catálogo de proveedores', 'Registrar', 1, 1, 0],
      ['Catálogo de proveedores', 'Editar', 1, 1, 0],
      ['Homologación y contratos', 'Ver', 1, 1, 1],
      ['Homologación y contratos', 'Aprobar', 1, 0, 0],
      ['Evaluación de desempeño', 'Registrar', 1, 1, 0],
      ['Evaluación de desempeño', 'Ver', 1, 1, 1]
    ],
    'Ayuda': [
      ['Guías y FAQ', 'Ver', 1, 1, 1]
    ]
  };

  constructor(private http: HttpClient) {}

  getPoliticas() {
    return this.http.get(this.baseUrl + 'SNPermiso/getPoliticas', { headers: this.headers });
  }

  postGuardarPolitica(data: { Modulo: string; Nivel: string; Accion: string; Flg_Permitido: boolean }) {
    return this.http.post(this.baseUrl + 'SNPermiso/postGuardarPolitica', data, { headers: this.headers });
  }

  getPermisosUsuarioModulo(sCodigo_Puesto_Usuario: string) {
    let params = new HttpParams().append('sCodigo_Puesto_Usuario', sCodigo_Puesto_Usuario || '');
    return this.http.get(this.baseUrl + 'SNPermiso/getPermisosUsuarioModulo', { headers: this.headers, params });
  }

  postGuardarUsuarioModulo(data: { Codigo_Puesto_Usuario: string; Modulo_Clave: string; Nivel_Acceso: string }) {
    return this.http.post(this.baseUrl + 'SNPermiso/postGuardarUsuarioModulo', data, { headers: this.headers });
  }

  getPermisosUsuarioDetalle(sCodigo_Puesto_Usuario: string) {
    let params = new HttpParams().append('sCodigo_Puesto_Usuario', sCodigo_Puesto_Usuario || '');
    return this.http.get(this.baseUrl + 'SNPermiso/getPermisosUsuarioDetalle', { headers: this.headers, params });
  }

  postGuardarUsuarioDetalle(data: { Codigo_Puesto_Usuario: string; Modulo: string; Contenido: string; Accion: string; Flg_Permitido: boolean }) {
    return this.http.post(this.baseUrl + 'SNPermiso/postGuardarUsuarioDetalle', data, { headers: this.headers });
  }

  /**
   * Obtiene el nivel de jerarquía del usuario actual ('ger' | 'jef' | 'ope')
   */
  getUserLevelKey(): 'ger' | 'jef' | 'ope' {
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    if (codRol === 1) return 'ger';

    const puestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:puesto') : '') || '').toLowerCase().trim();
    if (puestoSaved.includes('geren')) return 'ger';
    if (puestoSaved.includes('jef') || puestoSaved.includes('mando') || puestoSaved.includes('jefe') || puestoSaved.includes('jefat')) return 'jef';

    // Buscar en listado de puestos
    const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();
    const rawList = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:listado') : null;
    if (rawList) {
      try {
        const list: any[] = JSON.parse(rawList);
        const match = list.find((p: any) =>
          (p.cod_Usuario && p.cod_Usuario.toLowerCase() === userLogin) ||
          (p.usuario && p.usuario.toLowerCase().includes(userLogin))
        );
        if (match) {
          const rawNivel = (match.nivelRiesgo || match.codigo_Nivel_Riesgo || match.nivel || '').toLowerCase();
          const pName = (match.puesto || '').toLowerCase();
          if (rawNivel.includes('geren') || pName.includes('geren')) return 'ger';
          if (rawNivel.includes('jef') || rawNivel.includes('mando') || pName.includes('jefe') || pName.includes('jefat')) return 'jef';
        }
      } catch (e) { }
    }

    return 'ope';
  }

  /**
   * Determina si el usuario tiene permiso para una acción específica en un módulo.
   * 1. Administrador (vCod_Rol === 1): siempre true.
   * 2. Ajuste fino interactivo (SN_Permiso_Usuario_Detalle): si existe switch explícito, prevalece de forma estricta.
   * 3. Fallback inteligente: si no hay switch manual, toma el valor por defecto de su nivel (Gerencial, Jefatura u Operativo).
   */
  hasFinePermission(modulo: string, contenido: string, accion: string, defaultVal?: boolean): boolean {
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    if (codRol === 1) {
      return true; // Administrador siempre tiene acceso total
    }

    // Normalizaciones para búsqueda flexible (con y sin tildes, case-insensitive)
    const cleanMod = modulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanCont = contenido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanAcc = accion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // 1. Obtener fallback por defecto del nivel jerárquico
    let resolvedDefault = defaultVal !== undefined ? defaultVal : false;
    const lvlKey = this.getUserLevelKey();
    const colIdx = lvlKey === 'ger' ? 2 : (lvlKey === 'jef' ? 3 : 4);

    for (const [mName, items] of Object.entries(this.permTree)) {
      const cleanMName = mName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (cleanMName === cleanMod) {
        for (const [cName, aName, g, j, o] of items) {
          const cClean = cName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          const aClean = aName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (cClean === cleanCont && aClean === cleanAcc) {
            resolvedDefault = (lvlKey === 'ger' ? g : (lvlKey === 'jef' ? j : o)) === 1;
            break;
          }
        }
        break;
      }
    }

    // 2. Consultar Ajuste Fino explícito (SN_Permiso_Usuario_Detalle / precotex:puestos:accesos_fino)
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:accesos_fino') : null;
    if (!raw) {
      return resolvedDefault;
    }

    try {
      const accFine = JSON.parse(raw);
      const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();
      const puestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:puesto') : '') || '').trim();
      const codPuestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:codigo_puesto') : '') || '').trim();

      const identifiers: string[] = [userLogin, puestoSaved, codPuestoSaved].filter(Boolean);

      // Resolver también por listado de puestos
      const rawList = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:listado') : null;
      if (rawList) {
        try {
          const list: any[] = JSON.parse(rawList);
          const match = list.find((p: any) =>
            (p.cod_Usuario && p.cod_Usuario.toLowerCase() === userLogin) ||
            (p.usuario && p.usuario.toLowerCase().includes(userLogin))
          );
          if (match) {
            if (match.puesto) identifiers.push(match.puesto.trim());
            if (match.codigo_Puesto) identifiers.push(match.codigo_Puesto.trim());
          }
        } catch (e) { }
      }

      for (const id of Array.from(new Set(identifiers))) {
        let userObj = accFine[id];
        if (!userObj) {
          const matchedKey = Object.keys(accFine).find(k => k.trim().toLowerCase() === id.toLowerCase());
          if (matchedKey) userObj = accFine[matchedKey];
        }

        if (userObj) {
          // Coincidencia exacta
          const exactKey = `${modulo}||${contenido}||${accion}`;
          if (exactKey in userObj) {
            return userObj[exactKey] === 1 || userObj[exactKey] === true;
          }

          // Coincidencia normalizada
          for (const [k, v] of Object.entries(userObj)) {
            const parts = k.split('||');
            if (parts.length === 3) {
              const kMod = parts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              const kCont = parts[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              const kAcc = parts[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

              if (kMod === cleanMod && kCont === cleanCont && kAcc === cleanAcc) {
                return v === 1 || v === true;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('[PermisosService] Error consultando permisos finos:', e);
    }

    return resolvedDefault;
  }
}
