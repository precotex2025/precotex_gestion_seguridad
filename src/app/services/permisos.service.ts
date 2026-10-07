import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalVariable } from '../VarGlobals';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  baseUrl = GlobalVariable.baseUrlBackEnd;
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });

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

  hasFinePermission(modulo: string, contenido: string, accion: string, defaultVal: boolean = false): boolean {
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    if (codRol === 1) {
      return true; // Administrador siempre tiene acceso total
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:puestos:accesos_fino') : null;
    if (!raw) {
      return defaultVal;
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

      const cleanMod = modulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const cleanCont = contenido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const cleanAcc = accion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      for (const id of Array.from(new Set(identifiers))) {
        let userObj = accFine[id];
        if (!userObj) {
          const matchedKey = Object.keys(accFine).find(k => k.trim().toLowerCase() === id.toLowerCase());
          if (matchedKey) userObj = accFine[matchedKey];
        }

        if (userObj) {
          // 1. Coincidencia directa
          const exactKey = `${modulo}||${contenido}||${accion}`;
          if (exactKey in userObj) {
            return userObj[exactKey] === 1 || userObj[exactKey] === true;
          }

          // 2. Coincidencia normalizada sin tildes ni diferencias de casing
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

    return defaultVal;
  }
}
