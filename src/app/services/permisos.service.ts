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
   * Diccionario de equivalencias para mapear códigos cortos y nombres completos de módulos
   */
  public static readonly MODULO_ALIASES: { [key: string]: string[] } = {
    'inicio': ['inicio', 'inicio (dashboard)', 'dashboard', 'tablero general'],
    'organizacion': ['organizacion', 'organización', 'estructura', 'normas', 'estructura (sedes)', 'política del sig', 'politica del sig', 'gestion de normas y certificaciones', 'gestión de normas y certificaciones'],
    'puestos': ['puestos', 'puestos y usuarios', 'permisos por modulo', 'permisos por módulo', 'mapa de permisos', 'verificacion de accesos', 'log de accesos', 'configuracion de puestos'],
    'documentacion': ['documentacion', 'documentación', 'documentos', 'control documental', 'documentos controlados', 'documentos no controlados', 'mis documentos', 'carpetas por área'],
    'auditorias': ['auditorias', 'auditorías', 'auditoria', 'planificación de auditorías', 'ejecución y resultados', 'programa anual'],
    'noconf': ['noconf', 'no conformidades', 'noconformidades', 'declaración de nc', 'declaracion de nc', 'acciones correctivas', 'hallazgos'],
    'indicadores': ['indicadores', 'analytics', 'medicion', 'medición', 'alta de indicadores', 'medición de indicadores'],
    'objetivos': ['objetivos', 'planificación de objetivos', 'medición de objetivos', 'planificacion', 'mediciones', 'planificacionobjetivos'],
    'riesgos': ['riesgos', 'evaluacion de riesgos', 'evaluación de riesgos', 'identificación y evaluación', 'seguimiento de controles'],
    'mejora': ['mejora', 'portafolio de mejora', 'iniciativas'],
    'legal': ['legal', 'gestion legal', 'gestión legal', 'requisitos legales', 'matriz legal', 'documentos y evidencias legales'],
    'proveedores': ['proveedores', 'proveedores y contratistas', 'catálogo de proveedores', 'homologación y contratos', 'homologacion y contratos'],
    'ayuda': ['ayuda', 'centro de ayuda', 'guías y faq', 'guias y faq']
  };

  /**
   * Normaliza cualquier nombre o clave de módulo al identificador canónico estándar
   */
  normalizeModulo(mod: string): string {
    if (!mod) return '';
    const clean = mod.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const [key, aliases] of Object.entries(PermisosService.MODULO_ALIASES)) {
      if (key === clean) return key;
      for (const a of aliases) {
        const cleanA = a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (cleanA === clean || clean.includes(cleanA) || cleanA.includes(clean)) {
          return key;
        }
      }
    }
    return clean;
  }

  /**
   * Obtiene el nivel de jerarquía del usuario actual ('ger' | 'jef' | 'ope')
   */
  getUserLevelKey(): 'ger' | 'jef' | 'ope' {
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    if (codRol === 1) return 'ger';

    const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();
    if (userLogin === 'admin' || userLogin === 'super administrador') return 'ger';

    const puestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:puesto') : '') || '').toLowerCase().trim();
    if (puestoSaved.includes('geren') || puestoSaved.includes('direct')) return 'ger';
    if (puestoSaved.includes('jef') || puestoSaved.includes('mando') || puestoSaved.includes('jefe') || puestoSaved.includes('jefat') || puestoSaved.includes('supervis') || puestoSaved.includes('coordinad')) return 'jef';

    // Buscar en listado de puestos sincronizado
    const rawList = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:listado') : null;
    if (rawList) {
      try {
        const list: any[] = JSON.parse(rawList);
        const match = list.find((p: any) =>
          (p.cod_Usuario && p.cod_Usuario.toLowerCase() === userLogin) ||
          (p.usuario && p.usuario.toLowerCase().includes(userLogin))
        );
        if (match) {
          const rawNivel = (match.nivelRiesgo || match.codigo_Nivel_Riesgo || match.nivel || '').toString().toLowerCase().trim();
          const pName = (match.puesto || '').toLowerCase();
          if (rawNivel === '001' || rawNivel === '1' || rawNivel.includes('geren') || rawNivel.includes('direct') || pName.includes('geren') || pName.includes('direct')) return 'ger';
          if (rawNivel === '002' || rawNivel === '2' || rawNivel.includes('jef') || rawNivel.includes('mando') || rawNivel.includes('supervis') || rawNivel.includes('coordinad') || pName.includes('jefe') || pName.includes('jefat') || pName.includes('supervis') || pName.includes('coordinad')) return 'jef';
        }
      } catch (e) { }
    }

    return 'ope';
  }

  /**
   * Determina el nivel general de acceso a un módulo ('Sin acceso' | 'Ver' | 'Editar')
   * para el usuario actual o su puesto en la Matriz de Accesos.
   */
  getModuloAccess(modulo: string): 'Sin acceso' | 'Ver' | 'Editar' {
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();
    if (codRol === 1 || userLogin === 'admin' || userLogin === 'super administrador') {
      return 'Editar'; // Administrador cuenta con acceso total
    }

    const normTarget = this.normalizeModulo(modulo);
    const rawAccesos = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:accesos') : null;

    if (rawAccesos) {
      try {
        const accObj = JSON.parse(rawAccesos);
        const puestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:puesto') : '') || '').trim();
        const codPuestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:codigo_puesto') : '') || '').trim();

        const identifiers = Array.from(new Set([
          userLogin,
          userLogin ? 'usr-' + userLogin : '',
          puestoSaved,
          codPuestoSaved
        ].filter(Boolean)));

        for (const id of identifiers) {
          let userPerm = accObj[id];
          if (!userPerm) {
            const matchedKey = Object.keys(accObj).find(k => k.trim().toLowerCase() === id.toLowerCase());
            if (matchedKey) userPerm = accObj[matchedKey];
          }

          if (userPerm) {
            // 1. Coincidencia directa por clave normalizada
            if (userPerm[normTarget]) {
              const val = (userPerm[normTarget] || '').toLowerCase().trim();
              if (val === 'sin acceso' || val === '0' || val === 'bloqueado') return 'Sin acceso';
              if (val === 'editar' || val === 'modificar' || val === 'total') return 'Editar';
              if (val === 'ver' || val === 'lectura') return 'Ver';
            }

            // 2. Coincidencia por aliases del módulo
            for (const [k, v] of Object.entries(userPerm)) {
              if (this.normalizeModulo(k) === normTarget) {
                const val = (v as string || '').toLowerCase().trim();
                if (val === 'sin acceso' || val === '0' || val === 'bloqueado') return 'Sin acceso';
                if (val === 'editar' || val === 'modificar' || val === 'total') return 'Editar';
                if (val === 'ver' || val === 'lectura') return 'Ver';
              }
            }
          }
        }
      } catch (e) { }
    }

    // 3. Fallback inteligente según nivel jerárquico
    const lvlKey = this.getUserLevelKey();
    if (lvlKey === 'ger' || lvlKey === 'jef') return 'Editar';
    return 'Ver';
  }

  /**
   * Determina si el usuario tiene permiso para una acción específica en un módulo.
   * Restricciones al 100%:
   * 1. Administrador (vCod_Rol === 1 o usuario 'admin'): siempre true.
   * 2. Si el módulo está en "Sin acceso" en la matriz general: bloqueo estricto (false).
   * 3. Ajuste fino interactivo (SN_Permiso_Usuario_Detalle): si existe switch explícito para el usuario/puesto, prevalece.
   * 4. Políticas por nivel jerárquico configuradas (SN_Permiso_Politica): si la política fue personalizada por el admin, se honra.
   * 5. Si el módulo está configurado solo en modo 'Ver', las acciones de modificación/eliminación/aprobación se deniegan.
   * 6. Fallback inteligente: valor por defecto de la matriz estándar permTree y defaultVal.
   */
  hasFinePermission(modulo: string, contenido: string, accion: string, defaultVal?: boolean): boolean {
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();
    if (codRol === 1 || userLogin === 'admin' || userLogin === 'super administrador') {
      return true; // Administrador siempre tiene acceso total
    }

    // Normalizaciones para búsqueda flexible (con y sin tildes, case-insensitive)
    const normTarget = this.normalizeModulo(modulo);
    const cleanMod = modulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanCont = contenido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanAcc = accion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // 1. RESTRICCIÓN DE ACCESO AL MÓDULO: Si el módulo está en "Sin acceso", denegar automáticamente
    const modAccess = this.getModuloAccess(modulo);
    if (modAccess === 'Sin acceso') {
      return false;
    }

    // 2. CONSULTAR AJUSTE FINO EXPLÍCITO (SN_Permiso_Usuario_Detalle / precotex:puestos:accesos_fino)
    const rawFine = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:accesos_fino') : null;
    if (rawFine) {
      try {
        const accFine = JSON.parse(rawFine);
        const puestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:puesto') : '') || '').trim();
        const codPuestoSaved = ((typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:usuario:codigo_puesto') : '') || '').trim();

        const identifiers: string[] = Array.from(new Set([
          userLogin,
          userLogin ? 'usr-' + userLogin : '',
          puestoSaved,
          codPuestoSaved
        ].filter(Boolean)));

        // Buscar también en listado de puestos
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

            // Coincidencia normalizada con alias de módulo
            for (const [k, v] of Object.entries(userObj)) {
              const parts = k.split('||');
              if (parts.length === 3) {
                const kModNorm = this.normalizeModulo(parts[0]);
                const kCont = parts[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const kAcc = parts[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                if ((kModNorm === normTarget || parts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === cleanMod) &&
                    kCont === cleanCont && kAcc === cleanAcc) {
                  return v === 1 || v === true;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('[PermisosService] Error consultando permisos finos:', e);
      }
    }

    // 3. RESTRICCIÓN DE MODO SOLO LECTURA: Si el acceso al módulo es 'Ver' y la acción implica modificación/eliminación/aprobación
    const isEditAction = ['crear', 'editar', 'eliminar', 'aprobar', 'modificar', 'restaurar', 'obsoletar'].some(a => cleanAcc.includes(a));
    if (modAccess === 'Ver' && isEditAction) {
      return false; // Usuario en modo solo lectura no puede ejecutar acciones de modificación
    }

    // 4. CONSULTAR POLÍTICAS POR NIVEL JERÁRQUICO CONFIGURADAS (precotex:permisos_politica / Sección 1)
    const rawPol = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:permisos_politica') : null;
    const lvlKey = this.getUserLevelKey();
    if (rawPol) {
      try {
        const polObj = JSON.parse(rawPol);
        for (const [pMod, pLvls] of Object.entries(polObj)) {
          if (this.normalizeModulo(pMod) === normTarget) {
            const allowedActions = (pLvls as any)[lvlKey] || [];
            // Si la acción está explícitamente en la lista de permitidos por política
            if (Array.isArray(allowedActions)) {
              const hasAct = allowedActions.some((a: string) =>
                a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === cleanAcc ||
                cleanAcc.includes(a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim())
              );
              if (hasAct) return true;
            }
          }
        }
      } catch (e) { }
    }

    // 5. OBTENER FALLBACK POR DEFECTO DEL NIVEL JERÁRQUICO EN permTree
    let resolvedDefault = defaultVal !== undefined ? defaultVal : false;
    for (const [mName, items] of Object.entries(this.permTree)) {
      if (this.normalizeModulo(mName) === normTarget) {
        for (const [cName, aName, g, j, o] of items) {
          const cClean = cName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          const aClean = aName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (cClean === cleanCont && aClean === cleanAcc) {
            const bitPerm = (lvlKey === 'ger' ? g : (lvlKey === 'jef' ? j : o)) === 1;
            // Si defaultVal fue pasado explícitamente como false por regla de negocio, respetarlo
            resolvedDefault = (defaultVal === false) ? false : bitPerm;
            break;
          }
        }
        break;
      }
    }

    return resolvedDefault;
  }
}

