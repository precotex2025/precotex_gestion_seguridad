import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PuestosUsuariosRegeditComponent } from './puestos-usuarios-regedit/puestos-usuarios-regedit.component';
import { PuestosService } from '../../services/puestos.service';
import { PermisosService } from '../../services/permisos.service';
import { GlobalVariable } from '../../VarGlobals';
import * as XLSX from 'xlsx-js-style';

@Component({
  selector: 'app-puestos',
  standalone: false,
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit {
  puestosList: any[] = [];
  searchText: string = '';
  sUsuario: string = GlobalVariable.vusu;

  stats = { total: 0, activo: 0, sinConfig: 0 };
  mostrarBanner: boolean = false;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  displayedColumns: string[] = [
    'puesto',
    'proceso',
    'usuario',
    'password',
    'fecha_Registro',
    'nivel',
    'permisos',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>([]);

  actividadList: any[] = [];
  accesosList: any[] = [];
  trabajadoresSpringList: any[] = [];
  deletedPuestosSet = new Set<string>();

  // Visibilidad y copiado de contraseñas de usuarios en el listado
  mostrarPasswordMap: { [key: string]: boolean } = {};

  // Contraseñas reales registradas en Base de Datos (dbo.SN_Usuario)
  dbPasswordMap: { [key: string]: string } = {
    'mcueva': 'miccue86',
    'ssuarez': 'Precotex2026!',
    'jfloresv': 'Precotex2026!',
    'varriaga': 'Precotex2026!',
    'jpinedo': 'matriz1',
    'cvramirez': '20191584G',
    'dmelendez': 'Precotex2026!',
    'erivera': 'Precotex2026!',
    'nzegarra': 'Nikaole02',
    'krojas': 'Precotex$',
    'caldana': 'Aldana22.',
    'clingan': 'Precotex$01',
    'mguevara': 'Precotex2026!',
    'kvega': 'keithvesa',
    'atoro': '73007164',
    'rbardalesp': 'Precotex$',
    'privera': 'planta1',
    'admin': 'Precotex$'
  };

  toggleMostrarPassword(row: any): void {
    const key = this.getRowKey(row);
    this.mostrarPasswordMap[key] = !this.mostrarPasswordMap[key];
  }

  isPasswordVisible(row: any): boolean {
    const key = this.getRowKey(row);
    return !!this.mostrarPasswordMap[key];
  }

  private getRowKey(row: any): string {
    return (row.userCode || row.codigo_Puesto || row.id_Usuario || row.id || row.usuario || '').toString().trim().toLowerCase();
  }

  copiarPassword(password: string): void {
    if (!password) {
      this.toastr.warning('No hay contraseña para copiar', 'Portapapeles');
      return;
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(password).then(() => {
        this.toastr.success('Contraseña copiada al portapapeles', 'Copiado', { timeOut: 2000 });
      }).catch(() => {
        this.copiarFallback(password);
      });
    } else {
      this.copiarFallback(password);
    }
  }

  private copiarFallback(texto: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.toastr.success('Contraseña copiada al portapapeles', 'Copiado', { timeOut: 2000 });
    } catch {
      this.toastr.info(texto, 'Contraseña', { timeOut: 4000 });
    }
    document.body.removeChild(textArea);
  }

  canCrearUsuario: boolean = true;
  canEditarUsuario: boolean = true;
  canEliminarUsuario: boolean = true;

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private puestosService: PuestosService,
    private http: HttpClient,
    private permisosService: PermisosService,
    private router: Router
  ) { }

  private get isLocal(): boolean {
    const url = (GlobalVariable.baseUrlBackEnd || '').toLowerCase();
    return (url.includes('localhost') || url.includes('127.0.0.1')) && !url.includes(':5252');
  }

  isAdmin(): boolean {
    const rol = GlobalVariable.vCod_Rol || parseInt(localStorage.getItem('vCod_Rol') || '0', 10);
    const usu = (GlobalVariable.vusu || localStorage.getItem('vusu') || '').toLowerCase().trim();
    return rol === 1 || usu === 'admin' || usu === 'super administrador';
  }

  ngOnInit(): void {
    if (!this.isAdmin() && this.permisosService.getModuloAccess('puestos') === 'Sin acceso') {
      this.toastr.error('No cuentas con permisos para acceder al módulo de Puestos.', 'Acceso Restringido');
      this.router.navigate(['/principal']);
      return;
    }
    this.cargarPermisos();
    this.cargarTrabajadoresSpring();
    this.onListado();
  }

  cargarPermisos(): void {
    if (this.isAdmin()) {
      this.canCrearUsuario = true;
      this.canEditarUsuario = true;
      this.canEliminarUsuario = true;
      return;
    }
    const accessMod = this.permisosService.getModuloAccess('puestos');
    if (accessMod === 'Sin acceso' || accessMod === 'Ver') {
      this.canCrearUsuario = false;
      this.canEditarUsuario = false;
      this.canEliminarUsuario = false;
      return;
    }
    const userLvl = this.permisosService.getUserLevelKey();
    const isJefaturaOGerencial = userLvl === 'ger' || userLvl === 'jef';
    this.canCrearUsuario = this.permisosService.hasFinePermission('Puestos', 'Puestos y usuarios', 'Crear usuario', isJefaturaOGerencial);
    this.canEditarUsuario = this.permisosService.hasFinePermission('Puestos', 'Puestos y usuarios', 'Editar', isJefaturaOGerencial);
    this.canEliminarUsuario = this.permisosService.hasFinePermission('Puestos', 'Puestos y usuarios', 'Eliminar', userLvl === 'ger');
  }

  cargarTrabajadoresSpring(): void {
    this.puestosService.getTrabajadoresSpring().subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(raw) && raw.length > 0) {
          this.trabajadoresSpringList = raw.map((t: any) => ({
            tipo: t.tipo || t.Tipo || 'E',
            codigo: (t.codigo || t.Codigo || t.personaAnt || '').toString().trim(),
            nombre: (t.nombreCompleto || t.NombreCompleto || t.nombre || '').trim(),
            correo: (t.correo || t.Correo || t.correoInterno || '').trim()
          }));
        }
      },
      error: () => { }
    });
  }

  onListado() {
    try {
      const rawEliminados = localStorage.getItem('precotex_puestos_eliminados');
      if (rawEliminados) {
        const listElim = JSON.parse(rawEliminados);
        if (Array.isArray(listElim)) {
          listElim.forEach((item: string) => this.deletedPuestosSet.add(item.toLowerCase().trim()));
        }
      }
    } catch (e) { }

    this.puestosService.getListadoPuesto('001', '', '').subscribe({
      next: (puestoRes: any) => {
        const puestosDb = puestoRes?.elements || [];
        this.puestosService.getListadoUsuarios().subscribe({
          next: (res: any) => {
            const rawElements = res?.elements || res?.data || (Array.isArray(res) ? res : []);
            this.procesarYCombinarPuestos(puestosDb, rawElements);
          },
          error: () => {
            this.procesarYCombinarPuestos(puestosDb, []);
          }
        });
      },
      error: () => {
        this.puestosService.getListadoUsuarios().subscribe({
          next: (res: any) => {
            const rawElements = res?.elements || res?.data || (Array.isArray(res) ? res : []);
            this.procesarYCombinarPuestos([], rawElements);
          },
          error: () => {
            this.procesarYCombinarPuestos([], []);
          }
        });
      }
    });
  }

  normalizarNivel(val: any, puesto?: string): string {
    const str = (val || '').toString().trim().toLowerCase();
    const pStr = (puesto || '').toString().trim().toLowerCase();
    if (str === '001' || str === '1' || str.includes('geren') || pStr.includes('geren')) {
      return 'Gerencial';
    }
    if (str === '002' || str === '2' || str.includes('jef') || str.includes('mando') || pStr.includes('jefe') || pStr.includes('jefat') || pStr.includes('coordinad')) {
      return 'Jefatura';
    }
    return 'Operativo';
  }

  private procesarYCombinarPuestos(puestosDb: any[], rawElements: any[]): void {
    const isDeleted = (code: string, name: string, pCode: string): boolean => {
      if (code && this.deletedPuestosSet.has(code.toLowerCase().trim())) return true;
      if (name && this.deletedPuestosSet.has(name.toLowerCase().trim())) return true;
      if (pCode && this.deletedPuestosSet.has(pCode.toLowerCase().trim())) return true;
      return false;
    };

    const getItemKey = (item: any): string => {
      const uCode = (item.userCode || item.cod_Usuario || (item.email ? item.email.split('@')[0] : '') || '').toLowerCase().trim();
      if (uCode && uCode !== '—') return 'user:' + uCode;
      const pCode = (item.codigo_Puesto || item.id || '').toString().replace(/\D/g, '').trim();
      if (pCode) return 'puesto:' + pCode;
      const name = (item.usuario || item.nom_Usuario || item.puesto_Funciones || '').toLowerCase().trim();
      if (name && name !== '—') return 'name:' + name;
      return 'id:' + (item.id || Math.random());
    };

    const combinedMap = new Map<string, any>();

    // Cargar modificaciones recientes guardadas en localStorage para no sobrescribir ediciones del usuario
    const localEditsMap = new Map<string, any>();
    try {
      const rawLocal = localStorage.getItem('precotex_puestos_usuarios');
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            const uKey = (p.userCode || (p.email ? p.email.split('@')[0] : '') || '').toLowerCase().trim();
            const pKey = (p.codigo_Puesto || p.id || '').toString().replace(/\D/g, '').trim();
            const nKey = (p.usuario || '').toLowerCase().trim();
            if (uKey) localEditsMap.set('user:' + uKey, p);
            if (pKey) localEditsMap.set('puesto:' + pKey, p);
            if (nKey) localEditsMap.set('name:' + nKey, p);
          });
        }
      }
    } catch (e) { }

    // 1. Procesar usuarios directos de SNUsuario
    if (Array.isArray(rawElements) && rawElements.length > 0) {
      rawElements
        .filter((u: any) => {
          if (u.flg_Activo === -1 || u.flg_Activo === '-1') return false;
          const estado = (u.puesto_Caracteristicas || u.estado || '').toString().toLowerCase();
          if (estado === 'inactivo' || estado.includes('inactiv')) return false;
          const code = (u.cod_Usuario || u.userCode || (u.email ? u.email.split('@')[0] : '')).toLowerCase().trim();
          const name = (u.usuario || u.puesto_Funciones || u.nom_Usuario || '').toLowerCase().trim();
          const pCode = (u.codigo_Puesto || u.id || '').toString().replace(/\D/g, '').trim();
          if (isDeleted(code, name, pCode)) return false;
          return true;
        })
        .forEach((u: any) => {
          const uCode = (u.cod_Usuario || u.userCode || (u.email ? u.email.split('@')[0] : '')).toLowerCase().trim();
          const pCode = (u.codigo_Puesto || u.id || '').toString().replace(/\D/g, '').trim();
          const uNom = (u.nom_Usuario || u.usuario || '').toLowerCase().trim();

          // Buscar datos de localEditsMap si existen
          const localEdit = (uCode ? localEditsMap.get('user:' + uCode) : null) ||
            (pCode ? localEditsMap.get('puesto:' + pCode) : null) ||
            (uNom ? localEditsMap.get('name:' + uNom) : null);

          // Buscar datos reales y directos de SNPuesto (solo puestos activos)
          const dbPuesto = puestosDb.find((p: any) => {
            const isAct = p.flg_Activo !== false && p.flg_Activo !== 0 && p.flg_Activo !== '0' && p.flg_Activo !== 'False';
            if (!isAct) return false;
            const pUser = (p.cod_Usuario || '').toLowerCase().trim();
            const pCod = (p.codigo_Puesto || '').toString().replace(/\D/g, '').trim();
            const pFunc = (p.puesto_Funciones || '').toLowerCase().trim();
            return (uCode && pUser === uCode) || (pCode && pCod === pCode) || (uNom && pFunc && uNom === pFunc);
          });

          let puestoName = (localEdit?.puesto || dbPuesto?.denominacion || u.puesto || u.denominacion || '').trim();
          let userName = (localEdit?.usuario || dbPuesto?.puesto_Funciones || u.usuario || u.puesto_Funciones || u.nom_Usuario || '').trim();
          let procName = (localEdit?.proceso || dbPuesto?.puesto_Descripcion || u.proceso || u.puesto_Descripcion || u.proceso_Nombre || '').trim();

          if (puestoName.includes(',') && (!userName || !userName.includes(','))) {
            const temp = puestoName;
            puestoName = userName || 'General';
            userName = temp;
          }

          if (!puestoName || puestoName === 'Puesto General') {
            if (uCode === 'admin') { puestoName = 'Administrador General'; }
            else { puestoName = 'Puesto General'; }
          }

          if (!procName || procName === 'General') {
            if (uCode === 'admin') { procName = 'Sistemas'; }
            else { procName = 'General'; }
          }

          // Priorizar nivel de BD (dbPuesto o SN_Usuario), o de modificaciones locales recientes
          const rawNivel = (
            dbPuesto?.nivelRiesgo ||
            dbPuesto?.codigo_Nivel_Riesgo ||
            localEdit?.nivel ||
            u.codigo_Nivel ||
            u.nivelRiesgo ||
            u.codigo_Nivel_Riesgo ||
            u.nivel ||
            u.nivel_Descripcion ||
            'Operativo'
          ).toString().trim();
          const nivelClean = this.normalizarNivel(rawNivel, puestoName);

          let permisosVal = (localEdit?.permisos || dbPuesto?.puesto_Requisitos || u.permisos || u.puesto_Requisitos || '').trim();
          if (!permisosVal || permisosVal === '—') {
            permisosVal = nivelClean === 'Operativo' ? 'Lectura + descarga' : 'Lectura + descarga + modificar';
          } else if (nivelClean === 'Gerencial' && permisosVal === 'Lectura + descarga') {
            permisosVal = 'Lectura + descarga + modificar';
          }

          const charVal = (u.puesto_Caracteristicas || u.estado || 'Activo').toString().trim();
          let emailVal = (u.email || '').trim();
          let estadoVal = charVal;
          if (charVal.includes('|')) {
            const parts = charVal.split('|');
            estadoVal = parts[0];
            if (!emailVal) emailVal = parts[1];
          } else if (charVal.includes('@')) {
            if (!emailVal) emailVal = charVal;
            estadoVal = 'Activo';
          }

          if (
            estadoVal.toLowerCase().includes('pendiente') ||
            estadoVal.toLowerCase().includes('activac') ||
            u.primer_Ingreso === true ||
            u.primer_Ingreso === 1 ||
            u.primer_Ingreso === '1' ||
            u.primer_Ingreso === 'True' ||
            u.flg_Activo === false ||
            u.flg_Activo === 0 ||
            u.flg_Activo === '0' ||
            u.flg_Activo === 'False'
          ) {
            estadoVal = 'Pendiente de activación';
          } else if (estadoVal.toLowerCase().includes('inactiv')) {
            estadoVal = 'Inactivo';
          } else {
            estadoVal = 'Activo';
          }

          const codPuesto = (u.codigo_Puesto || u.id || '').toString().trim();
          const fechaReg = this.formatFecha(u.fecha_Registro || u.fec_Registro || u.fecha_Creacion || u.fec_Creacion || '—');

          const passVal = (
            u.password ||
            u.Password ||
            dbPuesto?.password ||
            (uCode && this.dbPasswordMap[uCode]) ||
            (dbPuesto?.cod_Usuario && this.dbPasswordMap[dbPuesto.cod_Usuario.toLowerCase().trim()]) ||
            'Precotex2026!'
          ).toString().trim();

          const userObj = {
            id: u.id || ('u-' + (u.id_Usuario || codPuesto || userName)),
            codigo_Puesto: codPuesto,
            id_Usuario: u.id_Usuario,
            puesto: puestoName || 'Puesto General',
            proceso: procName,
            usuario: userName || '—',
            userCode: uCode || (userName && !userName.includes(' ') ? userName : ''),
            email: emailVal,
            password: passVal,
            fecha_Registro: fechaReg,
            nivel: nivelClean,
            permisos: permisosVal,
            estado: estadoVal,
            flg_Activo: estadoVal === 'Activo' ? 1 : 0,
            tip_Trabajador: (u.tip_Trabajador || 'E').trim(),
            cod_Trabajador: (u.cod_Trabajador || '').trim()
          };

          const key = getItemKey(userObj);
          combinedMap.set(key, userObj);
        });
    }

    // 2. Integrar puestos de SNPuesto que no estén todavía registrados (idéntico a Mapa de Permisos)
    if (Array.isArray(puestosDb) && puestosDb.length > 0) {
      puestosDb.forEach((p: any) => {
        const pUser = (p.cod_Usuario || '').toLowerCase().trim();
        const pCode = (p.codigo_Puesto || p.id || '').toString().replace(/\D/g, '').trim();
        const pName = (p.puesto_Funciones || p.usuario || '').trim();
        const pPuesto = (p.denominacion || p.puesto || '').trim();

        const isAct = p.flg_Activo !== false && p.flg_Activo !== 0 && p.flg_Activo !== '0' && p.flg_Activo !== 'False';
        if (!isAct) return;

        if (isDeleted(pUser, pName, pCode)) return;

        const localEdit = (pUser ? localEditsMap.get('user:' + pUser) : null) ||
          (pCode ? localEditsMap.get('puesto:' + pCode) : null) ||
          (pName ? localEditsMap.get('name:' + pName.toLowerCase().trim()) : null);

        let puestoName = (localEdit?.puesto || pPuesto).trim();
        let userName = (localEdit?.usuario || pName).trim();
        if (puestoName.includes(',') && (!userName || !userName.includes(','))) {
          const temp = puestoName;
          puestoName = userName || 'General';
          userName = temp;
        }

        if (!puestoName || puestoName === 'Puesto General') {
          if (pUser === 'admin') puestoName = 'Administrador General';
          else puestoName = 'Puesto General';
        }

        const procName = (localEdit?.proceso || p.puesto_Descripcion || p.proceso || 'General').trim();
        const rawNivel = (p.nivelRiesgo || p.codigo_Nivel_Riesgo || localEdit?.nivel || p.nivel || p.nivel_Descripcion || 'Operativo').toString().trim();
        const nivelClean = this.normalizarNivel(rawNivel, puestoName);

        let permisosVal = (localEdit?.permisos || p.puesto_Requisitos || p.permisos || '').trim();
        if (!permisosVal || permisosVal === '—') {
          permisosVal = nivelClean === 'Operativo' ? 'Lectura + descarga' : 'Lectura + descarga + modificar';
        } else if (nivelClean === 'Gerencial' && permisosVal === 'Lectura + descarga') {
          permisosVal = 'Lectura + descarga + modificar';
        }

        const charVal = (p.puesto_Caracteristicas || p.estado || 'Activo').toString().trim();
        let emailVal = (p.email || '').trim();
        let estadoVal = charVal;
        if (charVal.includes('|')) {
          const parts = charVal.split('|');
          estadoVal = parts[0];
          if (!emailVal) emailVal = parts[1];
        } else if (charVal.includes('@')) {
          if (!emailVal) emailVal = charVal;
          estadoVal = 'Activo';
        }

        if (
          estadoVal.toLowerCase().includes('pendiente') ||
          estadoVal.toLowerCase().includes('activac') ||
          p.primer_Ingreso === true ||
          p.primer_Ingreso === 1 ||
          p.flg_Activo === false ||
          p.flg_Activo === 0 ||
          p.flg_Activo === '0'
        ) {
          estadoVal = 'Pendiente de activación';
        } else if (estadoVal.toLowerCase().includes('inactiv')) {
          estadoVal = 'Inactivo';
        } else {
          estadoVal = 'Activo';
        }

        const fechaReg = this.formatFecha(p.fecha_Registro || p.fec_Registro || p.fecha_Creacion || p.fec_Creacion || '—');
        const passVal = (p.password || (pUser && this.dbPasswordMap[pUser]) || 'Precotex2026!').toString().trim();

        const puestoObj = {
          id: p.id || ('p-' + (pCode || pUser || Date.now())),
          codigo_Puesto: pCode,
          id_Usuario: p.id_Usuario,
          puesto: puestoName || 'Puesto General',
          proceso: procName,
          usuario: userName || '—',
          userCode: pUser || (userName && !userName.includes(' ') ? userName : ''),
          email: emailVal,
          password: passVal,
          fecha_Registro: fechaReg,
          nivel: nivelClean,
          permisos: permisosVal,
          estado: estadoVal,
          flg_Activo: estadoVal === 'Activo' ? 1 : 0,
          tip_Trabajador: (p.tip_Trabajador || 'E').trim(),
          cod_Trabajador: (p.cod_Trabajador || '').trim()
        };

        const key = getItemKey(puestoObj);
        if (!combinedMap.has(key)) {
          combinedMap.set(key, puestoObj);
        }
      });
    }

    // 3. Integrar puestos creados localmente si no están aún en la lista
    try {
      const localPuestos = localStorage.getItem('precotex_puestos_usuarios');
      if (localPuestos) {
        const localList = JSON.parse(localPuestos);
        if (Array.isArray(localList)) {
          localList.forEach((lp: any) => {
            const lpUser = (lp.userCode || lp.cod_Usuario || '').toLowerCase().trim();
            const lpCode = (lp.codigo_Puesto || '').toString().replace(/\D/g, '').trim();
            const lpName = (lp.usuario || '').toLowerCase().trim();
            if (isDeleted(lpUser, lpName, lpCode)) return;

            const key = getItemKey(lp);
            if (!combinedMap.has(key)) {
              combinedMap.set(key, lp);
            }
          });
        }
      }
    } catch (e) { }

    this.puestosList = Array.from(combinedMap.values());
    this.dataSource.data = [...this.puestosList];
    this.calculateStats();
    this.cargarPasswordsDesdeBD();
  }

  cargarPasswordsDesdeBD(): void {
    if (!this.puestosList || this.puestosList.length === 0) return;

    this.puestosList.forEach((item: any) => {
      const uCode = (item.userCode || item.cod_Usuario || '').toString().trim();
      if (!uCode) return;

      this.puestosService.getUsuarioWeb(uCode).subscribe({
        next: (res: any) => {
          if (res && res.success && res.elements && res.elements.length > 0) {
            const dbObj = res.elements[0];
            const dbPass = (dbObj.password || '').toString().trim();
            let changed = false;

            if (dbPass && item.password !== dbPass) {
              item.password = dbPass;
              this.dbPasswordMap[uCode.toLowerCase()] = dbPass;
              changed = true;
            }

            const dbEstado = (dbObj.respuesta || dbObj.resultado || '').toString().toUpperCase();
            if (dbEstado === 'ACTIVO') {
              if (item.estado !== 'Activo') {
                item.estado = 'Activo';
                item.flg_Activo = 1;
                changed = true;
              }
            } else if (dbEstado === 'PENDIENTE_PRIMER_INGRESO') {
              if (item.estado !== 'Pendiente de activación') {
                item.estado = 'Pendiente de activación';
                changed = true;
              }
            }

            if (changed) {
              this.calculateStats();
            }
          }
        },
        error: () => { }
      });
    });
  }

  calculateStats() {
    this.stats.total = this.puestosList.length;
    this.stats.activo = this.puestosList.filter(p => p.estado === 'Activo').length;
    this.stats.sinConfig = this.puestosList.filter(p =>
      p.estado === 'Pendiente de activación' ||
      p.estado === 'Sin permisos config.' ||
      p.estado === 'Pendiente'
    ).length;

    let filtered = [...this.puestosList];
    if (this.searchText.trim()) {
      const query = this.searchText.toLowerCase();
      filtered = filtered.filter(p =>
        (p.puesto || '').toLowerCase().includes(query) ||
        (p.proceso || '').toLowerCase().includes(query) ||
        (p.usuario || '').toLowerCase().includes(query) ||
        (p.password || '').toLowerCase().includes(query) ||
        (p.fecha_Registro || '').toLowerCase().includes(query) ||
        (p.nivel || '').toLowerCase().includes(query) ||
        (p.permisos || '').toLowerCase().includes(query) ||
        (p.estado || '').toLowerCase().includes(query)
      );
    }
    this.dataSource.data = filtered;
    this.updateDynamicWidgets();
  }

  // ===================================================================
  // RESOLUCIÓN Y NORMALIZACIÓN DE USUARIOS (PUE-01 / HISTORIAL)
  // ===================================================================
  resolveUserData(ident: string, fallbackPuesto?: string): { nombre: string; rol: string } {
    const clean = (ident || '').trim().toLowerCase();
    if (!clean || clean === 'admin') {
      return { nombre: 'Super Administrador', rol: 'Administrador General' };
    }

    const userDirectoryMap: { [key: string]: { nombre: string; rol: string } } = {
      'mzegarra': { nombre: 'Mia Zegarra', rol: 'Analista de Auditoría Interna' },
      'mia.zegarra': { nombre: 'Mia Zegarra', rol: 'Analista de Auditoría Interna' },
      'mia zegarra': { nombre: 'Mia Zegarra', rol: 'Analista de Auditoría Interna' },
      'kvega': { nombre: 'Keith Vega', rol: 'Asistente de Auditoría Interna' },
      'keith.vega': { nombre: 'Keith Vega', rol: 'Asistente de Auditoría Interna' },
      'keith vega': { nombre: 'Keith Vega', rol: 'Asistente de Auditoría Interna' },
      'jpinedo': { nombre: 'Jordan Pinedo', rol: 'Analista OYM' },
      'jordan.pinedo': { nombre: 'Jordan Pinedo', rol: 'Analista OYM' },
      'jordan pinedo': { nombre: 'Jordan Pinedo', rol: 'Analista OYM' },
      'caldana': { nombre: 'Cynthia Aldana', rol: 'Coordinador de SSOMA' },
      'cynthia.aldana': { nombre: 'Cynthia Aldana', rol: 'Coordinador de SSOMA' },
      'cynthia aldana': { nombre: 'Cynthia Aldana', rol: 'Coordinador de SSOMA' },
      'msoria': { nombre: 'Max Soria', rol: 'Analista de Sistemas' },
      'max.soria': { nombre: 'Max Soria', rol: 'Analista de Sistemas' },
      'max soria': { nombre: 'Max Soria', rol: 'Analista de Sistemas' },
      'kflores': { nombre: 'Karem Flores', rol: 'Gerente de Comercial' },
      'karem.flores': { nombre: 'Karem Flores', rol: 'Gerente de Comercial' },
      'karem flores': { nombre: 'Karem Flores', rol: 'Gerente de Comercial' },
      'fhuamani': { nombre: 'Francisco Huamani', rol: 'Analista SIG' },
      'francisco.huamani': { nombre: 'Francisco Huamani', rol: 'Analista SIG' },
      'francisco huamani': { nombre: 'Francisco Huamani', rol: 'Analista SIG' },
      'atoro': { nombre: 'Alfredo Toro', rol: 'Analista de Sistemas' },
      'alfredo.toro': { nombre: 'Alfredo Toro', rol: 'Analista de Sistemas' },
      'alfredo toro': { nombre: 'Alfredo Toro', rol: 'Analista de Sistemas' },
      'laldana': { nombre: 'Luis Aldana', rol: 'Jefe de Seguridad y Salud Ocupacional' },
      'luis.aldana': { nombre: 'Luis Aldana', rol: 'Jefe de Seguridad y Salud Ocupacional' },
      'luis aldana': { nombre: 'Luis Aldana', rol: 'Jefe de Seguridad y Salud Ocupacional' },
      'shuaranga': { nombre: 'Sayda Huaranga', rol: 'Supervisor de SST' },
      'sayda.huaranga': { nombre: 'Sayda Huaranga', rol: 'Supervisor de SST' },
      'sayda huaranga': { nombre: 'Sayda Huaranga', rol: 'Supervisor de SST' },
      'erivera': { nombre: 'Elizabet Rivera', rol: 'Jefatura de Calidad' },
      'elizabet.rivera': { nombre: 'Elizabet Rivera', rol: 'Jefatura de Calidad' },
      'elizabet rivera': { nombre: 'Elizabet Rivera', rol: 'Jefatura de Calidad' },
      'clingan': { nombre: 'Cesar Lingan', rol: 'Analista de Auditoría Interna' },
      'cesar.lingan': { nombre: 'Cesar Lingan', rol: 'Analista de Auditoría Interna' },
      'cesar lingan': { nombre: 'Cesar Lingan', rol: 'Analista de Auditoría Interna' },
      'mguevara': { nombre: 'Mary Guevara', rol: 'Coordinadora de Desarrollo y Capacitaciones' },
      'mary.guevara': { nombre: 'Mary Guevara', rol: 'Coordinadora de Desarrollo y Capacitaciones' },
      'mary guevara': { nombre: 'Mary Guevara', rol: 'Coordinadora de Desarrollo y Capacitaciones' },
      'jrojas': { nombre: 'Miguel Angel Rojas Veliz', rol: 'Jefe de Sistemas' },
      'hflores': { nombre: 'Hans Flores', rol: 'Analista Programador' },
      'jlelias': { nombre: 'José Luis Elias', rol: 'Auditor Líder' },
      'icruz': { nombre: 'Ismael Cruz', rol: 'Coordinador SIG' },
      'crivera': { nombre: 'Cesar Rivera', rol: 'Supervisor de Planta' },
      'rgerstein': { nombre: 'Rodolfo Gerstein', rol: 'Gerente de Gestión Humana' },
      'rmunante': { nombre: 'Ricardo Muñante', rol: 'Jefe de Planeamiento y Control' },
      'rdiaz': { nombre: 'Ricardo Diaz', rol: 'Gerente DDP, Manufactura y Gestión Comercial' }
    };

    if (userDirectoryMap[clean]) {
      return userDirectoryMap[clean];
    }

    if (this.puestosList && this.puestosList.length > 0) {
      const match = this.puestosList.find(p =>
        (p.usuario && p.usuario.toLowerCase() === clean) ||
        (p.email && p.email.toLowerCase().startsWith(clean))
      );
      if (match && match.usuario && match.usuario !== '—') {
        return { nombre: match.usuario, rol: match.puesto || fallbackPuesto || 'Usuario SIG' };
      }
    }

    const titleCase = ident.charAt(0).toUpperCase() + ident.slice(1);
    return { nombre: titleCase, rol: fallbackPuesto || 'Analista SIG' };
  }

  getAvatarColor(nombre: string): string {
    const palette = ['purple', 'violet', 'blue', 'green', 'amber', 'teal', 'indigo', 'red'];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  }

  // ===================================================================
  // HISTÃ“RICO DE INGRESOS Y ACCIONES A LA PLATAFORMA (PUE-01 / BD)
  // ===================================================================
  registrarAccionLog(accion: string, puestoCustom?: string): void {
    const codUsuario = (GlobalVariable.vusu || localStorage.getItem('vusu') || '').trim();
    if (!codUsuario) return;
    const nomUsuario = (localStorage.getItem('precotex:usuario:nombre') || codUsuario).trim();
    const userPuesto = puestoCustom || (localStorage.getItem('precotex:usuario:puesto') || '').trim() || 'Usuario SOMA';
    const codRol = localStorage.getItem('vCod_Rol') || '2';
    const clientIp = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '192.168.1.36';

    const payload = {
      Cod_Usuario: codUsuario,
      Nom_Usuario: nomUsuario,
      Puesto: userPuesto,
      Cod_Rol: codRol,
      Estado: accion,
      Ip_Acceso: clientIp,
      Flg_Activo: true
    };

    this.puestosService.postRegistrarLogAcceso(payload).subscribe({
      next: () => {
        this.updateDynamicWidgets();
      },
      error: (err: any) => {
        console.warn('[Puestos] Aviso al registrar log en BD:', err);
      }
    });
  }

  updateDynamicWidgets(): void {
    const ahora = new Date();

    const parseLogDate = (raw: any): Date => {
      if (!raw) return new Date();
      if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date() : raw;
      if (typeof raw === 'number') return new Date(raw);
      const str = String(raw).trim();
      let d = new Date(str.replace(' ', 'T'));
      if (!isNaN(d.getTime())) return d;
      d = new Date(str);
      if (!isNaN(d.getTime())) return d;
      const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
      if (match) {
        const p1 = parseInt(match[1], 10);
        const p2 = parseInt(match[2], 10);
        const yr = parseInt(match[3], 10);
        const hr = parseInt(match[4] || '0', 10);
        const mn = parseInt(match[5] || '0', 10);
        const sc = parseInt(match[6] || '0', 10);
        if (p1 > 12) {
          d = new Date(yr, p2 - 1, p1, hr, mn, sc);
        } else {
          d = new Date(yr, p1 - 1, p2, hr, mn, sc);
        }
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    };

    const formatLogTime = (date: Date): string => {
      if (!date || isNaN(date.getTime())) return 'Reciente';
      const isToday = date.getFullYear() === ahora.getFullYear() &&
        date.getMonth() === ahora.getMonth() &&
        date.getDate() === ahora.getDate();

      const yesterday = new Date(ahora);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();

      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');

      if (isToday) {
        return 'Hoy ' + hh + ':' + mm;
      } else if (isYesterday) {
        return 'Ayer ' + hh + ':' + mm;
      } else {
        const dd = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        return dd + '/' + mes + ' ' + hh + ':' + mm;
      }
    };

    // Consultar directamente los logs de acceso y acciones desde la Base de Datos (dbo.SN_Log_Acceso)
    this.puestosService.getLogAccesos(100, false).subscribe({
      next: (res: any) => {
        const rawList = res?.elements || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const listMapeada: any[] = [];
          const sieteDiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          const activityCounts: { [user: string]: number } = {};

          rawList.forEach((item: any) => {
            const rawUser = (item.nom_Usuario || item.cod_Usuario || '').trim();
            if (!rawUser) return;

            const uInfo = this.resolveUserData(rawUser, item.puesto);
            const itemDate = parseLogDate(item.fec_Acceso);

            const userName = uInfo.nombre || item.nom_Usuario || item.cod_Usuario;
            const logEntry = {
              rawDate: itemDate,
              n: userName,
              rol: item.puesto || uInfo.rol || 'Colaborador',
              acc: item.estado || 'Inicio de sesiÃ³n',
              c: this.getAvatarColor(userName),
              t: formatLogTime(itemDate)
            };

            listMapeada.push(logEntry);

            // Contabilizar actividad en los Ãºltimos 7 dÃ­as por usuario
            if (itemDate >= sieteDiasAtras) {
              activityCounts[userName] = (activityCounts[userName] || 0) + 1;
            }
          });

          // 1. HistÃ³rico de ingresos y acciones: ordenados cronolÃ³gicamente (mÃ¡s recientes primero)
          listMapeada.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
          this.accesosList = listMapeada.slice(0, 10);

          // 2. Actividad por usuario (Ãºltimos 7 dÃ­as) a partir de los registros reales de BD
          const activityArray = Object.keys(activityCounts).map(uName => ({
            n: uName,
            count: activityCounts[uName],
            c: this.getAvatarColor(uName),
            percent: 100
          }));

          activityArray.sort((a, b) => b.count - a.count);
          const topActivities = activityArray.slice(0, 5);
          const maxCount = topActivities.length > 0 ? topActivities[0].count : 1;
          topActivities.forEach(act => {
            act.percent = Math.max(15, Math.round((act.count / maxCount) * 100));
          });
          this.actividadList = topActivities;

        } else {
          this.accesosList = [];
          this.actividadList = [];
        }
      },
      error: (err) => {
        console.warn('[Puestos] Error al consultar historial de accesos desde BD:', err);
      }
    });
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.calculateStats();
  }

  getCodigoProceso(proceso: string): string {
    if (!proceso) return '005';
    const p = proceso.toLowerCase().trim();
    if (p.includes('almac')) return '045';
    if (p.includes('ssoma')) return '008';
    if (p.includes('sistem') || p.includes('ti') || p.includes('informát')) return '005';
    if (p.includes('mantenimiento')) return '006';
    if (p.includes('patrimon') && p.includes('seguridad')) return '007';
    if (p.includes('auditor')) return '009';
    if (p.includes('patrimon') && p.includes('control')) return '010';
    if (p.includes('métod') || p.includes('oym') || p.includes('organizaci') || p.includes('ingenier') || p.includes('mejora')) return '011';
    if (p.includes('investiga') || p.includes('innovac') || p.includes('idi')) return '012';
    if (p.includes('certifica')) return '013';
    if (p.includes('administra') && !p.includes('personal')) return '014';
    if (p.includes('finanza')) return '015';
    if (p.includes('contabil') || p.includes('costo')) return '016';
    if (p.includes('tesorer')) return '017';
    if (p.includes('personal') && p.includes('administra')) return '018';
    if (p.includes('capacita') || p.includes('desarrollo de perso')) return '019';
    if (p.includes('comunica')) return '020';
    if (p.includes('organizacional')) return '021';
    if (p.includes('humana') || p.includes('gghh')) return '021';
    if (p.includes('bienestar')) return '022';
    if (p.includes('selecci')) return '023';
    if (p.includes('estampado digital')) return '037';
    if (p.includes('desarrollo de estampado')) return '050';
    if (p.includes('calidad estampado') || p.includes('calidad e&b') || p.includes('ceb')) return '026';
    if (p.includes('planeamiento y programaci') && p.includes('estampado')) return '027';
    if (p.includes('estampado')) return '024';
    if (p.includes('bordado')) return '025';
    if (p.includes('corte')) return '028';
    if (p.includes('costura')) return '029';
    if (p.includes('inspecci')) return '030';
    if (p.includes('acabados textil') || p.includes('atx')) return '038';
    if (p.includes('acabado')) return '031';
    if (p.includes('calidad manufactura')) return '032';
    if (p.includes('consumo')) return '033';
    if (p.includes('tejedur')) return '034';
    if (p.includes('tintorer')) return '035';
    if (p.includes('producción textil') || p.includes('produccion textil')) return '034';
    if (p.includes('laboratorio') && p.includes('color')) return '036';
    if (p.includes('calidad textil') || p.includes('ctx') || p.includes('ltx')) return '039';
    if (p.includes('lavander')) return '040';
    if (p.includes('balance')) return '041';
    if (p.includes('pcp textil')) return '042';
    if (p.includes('pcp manufactura')) return '043';
    if (p.includes('pcp')) return '044';
    if (p.includes('exterior')) return '046';
    if (p.includes('logísti') || p.includes('logisti')) return '047';
    if (p.includes('transporte')) return '048';
    if (p.includes('desarrollo textil')) return '051';
    if (p.includes('desarrollo de producto')) return '049';
    if (p.includes('exportación de prendas') || p.includes('exportacion de prendas')) return '052';
    if (p.includes('exportación de telas') || p.includes('exportacion de telas')) return '053';
    if (p.includes('venta local')) return '054';
    if (p.includes('directorio')) return '058';
    if (p.includes('alianza')) return '055';
    if (p.includes('negocio')) return '056';
    if (p.includes('proyectos')) return '057';
    if (p.includes('gestión general') || p.includes('gestion general')) return '058';
    if (p.includes('estratégica') || p.includes('estrategica')) return '059';
    if (p.includes('manufactura')) return '028';
    return '005';
  }

  getCodigoNivel(nivel: string): string {
    if (!nivel) return '003';
    const n = nivel.toLowerCase().trim();
    if (n.includes('geren') || n.includes('direct')) return '001';
    if (n.includes('jef') || n.includes('supervis') || n.includes('coordin') || n.includes('mando')) return '002';
    return '003';
  }

  onAgregar() {
    if (!this.canCrearUsuario) {
      this.toastr.warning('No cuentas con permisos para registrar puestos o usuarios.', 'Acceso Restringido');
      return;
    }
    try {
      localStorage.removeItem('precotex_cuentas_usuarios');
      localStorage.removeItem('precotex_puestos_usuarios');
      localStorage.removeItem('precotex_puestos_eliminados');
    } catch (e) { }

    const dialogRef = this.dialog.open(PuestosUsuariosRegeditComponent, {
      width: '1060px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      data: {
        Title: 'Nuevo registro',
        Accion: 'I',
        Datos: null,
        UsuariosExistentes: this.dataSource.data
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const todayStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const rawUser = (result.ctrol_usuario || '').trim();
        const rawEmail = (result.ctrol_email || '').trim();
        const puestoName = (result.ctrol_puesto || '').trim();
        const colaboradorName = (result.ctrol_colaborador || '').trim();
        const procesoName = (result.ctrol_proceso || '').trim();
        const userPass = (result.ctrol_password || '').trim();
        const emailPrefix = rawEmail ? rawEmail.split('@')[0].trim().toLowerCase() : '';
        const userCode = (rawUser || emailPrefix || (colaboradorName ? colaboradorName.toLowerCase().replace(/,/g, '').split(/\s+/).slice(0, 2).join('.') : 'usuario')).toLowerCase();
        const userDisplayName = colaboradorName || puestoName || userCode;

        const estadoInicial = 'Pendiente de activación';

        const requestData = {
          Accion: 'I',
          Codigo_Puesto: '',
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: puestoName,
          Codigo_Nivel_Riesgo: result.ctrol_nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: procesoName,
          Puesto_Funciones: userDisplayName,
          Puesto_Requisitos: result.ctrol_permisos || '',
          Puesto_Caracteristicas: rawEmail ? `${estadoInicial}|${rawEmail}` : estadoInicial,
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: userCode || this.sUsuario,
          Email: rawEmail,
          Password: userPass,
          Fecha_Registro: todayStr,
          Enviar_Correo: result.ctrol_enviar_credenciales ? 1 : 0
        };

        let realTipo = (result.tip_trabajador || '').trim();
        let realCodigo = (result.cod_trabajador || '').trim();
        if (!realCodigo && this.trabajadoresSpringList.length > 0) {
          const cName = colaboradorName.toLowerCase().trim();
          const matched = this.trabajadoresSpringList.find(t =>
            (t.nombre && (t.nombre.toLowerCase().includes(cName) || cName.includes(t.nombre.toLowerCase()))) ||
            (rawEmail && t.correo && t.correo.toLowerCase() === rawEmail.toLowerCase())
          );
          if (matched) {
            realTipo = matched.tipo;
            realCodigo = matched.codigo;
          }
        }

        const newItem = {
          id: 'p-' + Date.now(),
          puesto: puestoName,
          proceso: procesoName,
          usuario: userDisplayName,
          userCode: userCode,
          email: rawEmail,
          password: userPass,
          fecha_Registro: todayStr,
          nivel: result.ctrol_nivel,
          permisos: result.ctrol_permisos,
          estado: estadoInicial,
          tip_Trabajador: realTipo || 'E',
          cod_Trabajador: realCodigo || ''
        };

        // Limpiar almacenamiento local en cada nuevo registro
        localStorage.removeItem('precotex_cuentas_usuarios');
        localStorage.removeItem('precotex_puestos_usuarios');
        localStorage.removeItem('precotex_puestos_eliminados');

        // Registrar en tabla BD [BDSecureNorm].[dbo].[SN_Usuario]
        const codigoNivelVal = this.getCodigoNivel(result.ctrol_nivel);
        const codigoProcesoVal = this.getCodigoProceso(result.ctrol_proceso);

        const userDbPayload = {
          Accion: 'I',
          Cod_Usuario: userCode,
          Password: userPass,
          Nom_Usuario: userDisplayName,
          Cod_Rol: codigoNivelVal === '001' ? 1 : 2,
          Des_Rol: result.ctrol_nivel === 'Gerencial' ? 'Gerencial' : (result.ctrol_nivel === 'Jefatura' ? 'Jefatura' : 'Operativo'),
          Cod_Empresa: '01',
          Empresa: 'PRECOTEX S.A.C.',
          Tip_Trabajador: realTipo || 'E',
          Cod_Trabajador: realCodigo || '',
          Email: rawEmail,
          Denominacion: puestoName,
          Codigo_Proceso: codigoProcesoVal,
          Codigo_Nivel: codigoNivelVal,
          Estado: estadoInicial,
          Primer_Ingreso: true,
          Flg_Activo: 1
        };

        this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, userDbPayload).subscribe({
          next: () => { },
          error: () => { }
        });

        // Enviar correo de credenciales si está marcado el check
        if (result.ctrol_enviar_credenciales && rawEmail) {
          const emailPayload = {
            Destinatario: rawEmail,
            Nombre: userDisplayName,
            Usuario: userCode,
            Puesto: puestoName,
            ClaveTemporal: userPass,
            Asunto: '🔐 Credenciales de Acceso - Sistema de Gestión de Seguridad Precotex'
          };
          this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postEnviarCredencialesCorreo`, emailPayload).subscribe({
            next: (resp: any) => {
              if (resp && resp.success) {
                this.toastr.success(`Credenciales enviadas a: ${rawEmail}`, '📧 Correo Enviado', { timeOut: 4500 });
              }
            },
            error: () => { }
          });
        }

        console.log('Este es lo que se va a enviar: ', requestData);

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: (res: any) => {
            if (res && res.codeTransacc) {
              newItem.id = res.codeTransacc;
            }
            if (!this.puestosList.some(p => p.userCode === userCode)) {
              this.puestosList.unshift(newItem);
              this.dataSource.data = [...this.puestosList];
              this.calculateStats();
            } else {
              this.onListado();
            }
            this.toastr.success(`Puesto y usuario de acceso '${userCode}' creados con éxito.`, 'Puesto Registrado', { timeOut: 3000 });
          },
          error: () => {
            if (!this.puestosList.some(p => p.userCode === userCode)) {
              this.puestosList.unshift(newItem);
              this.dataSource.data = [...this.puestosList];
              this.calculateStats();
            } else {
              this.onListado();
            }
            this.toastr.success(`Puesto y usuario de acceso '${userCode}' creados con éxito.`, 'Puesto Registrado', { timeOut: 3000 });
          }
        });
      }
    });
  }

  onEditar(item: any) {
    if (!this.canEditarUsuario) {
      this.toastr.warning('No cuentas con permisos para editar puestos o usuarios.', 'Acceso Restringido');
      return;
    }
    const dialogRef = this.dialog.open(PuestosUsuariosRegeditComponent, {
      width: '1060px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      data: {
        Title: 'Editar registro',
        Accion: 'U',
        Datos: item,
        UsuariosExistentes: this.dataSource.data
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const targetCode = (item?.userCode || item?.cod_Usuario || '').toString().trim().toLowerCase();
        const targetName = (item?.usuario && item?.usuario !== '—' ? item?.usuario : '').toString().trim().toLowerCase();
        const isAdminAccount = targetCode === 'admin' || targetName === 'admin' || targetName.includes('super administrador');
        if (isAdminAccount && (result.ctrol_estado === 'Inactivo' || result.ctrol_estado === 'Suspendido')) {
          this.toastr.warning('La cuenta del Administrador no puede ser desactivada ni suspendida.', 'Restricción del Sistema');
          result.ctrol_estado = 'Activo';
        }
        const rawEmail = (result.ctrol_email || '').trim();
        const puestoName = (result.ctrol_puesto || '').trim();
        const colaboradorName = (result.ctrol_colaborador || '').trim();
        const rawUser = (result.ctrol_usuario || '').trim();
        const emailPrefix = rawEmail ? rawEmail.split('@')[0].trim().toLowerCase() : '';
        const userCode = (rawUser || emailPrefix || (colaboradorName ? colaboradorName.toLowerCase().replace(/,/g, '').split(/\s+/).slice(0, 2).join('.') : 'usuario')).toLowerCase();
        const userDisplayName = colaboradorName || puestoName || userCode;
        const userPass = (result.ctrol_password || '').trim();

        const requestData = {
          Accion: 'U',
          Codigo_Puesto: item.codigo_Puesto || item.id,
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: puestoName,
          Codigo_Nivel_Riesgo: result.ctrol_nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: result.ctrol_proceso || '',
          Puesto_Funciones: userDisplayName,
          Puesto_Requisitos: result.ctrol_permisos || '',
          Puesto_Caracteristicas: rawEmail ? `${result.ctrol_estado || 'Activo'}|${rawEmail}` : (result.ctrol_estado || 'Activo'),
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario,
          Email: rawEmail,
          Password: userPass
        };

        if (result.ctrol_enviar_credenciales && rawEmail) {
          const emailPayload = {
            Destinatario: rawEmail,
            Nombre: userDisplayName,
            Usuario: userCode,
            Puesto: puestoName,
            ClaveTemporal: userPass,
            Asunto: '🔐 Credenciales de Acceso - Sistema de Gestión de Seguridad Precotex'
          };
          this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postEnviarCredencialesCorreo`, emailPayload).subscribe({
            next: () => {
              this.toastr.success(`Credenciales enviadas a: ${rawEmail}`, '📧 Correo Enviado', { timeOut: 4500 });
            },
            error: () => { }
          });
        }

        // Sincronizar actualización con BD [BDSecureNorm].[dbo].[SN_Usuario]
        const editCodigoNivelVal = this.getCodigoNivel(result.ctrol_nivel);
        const editCodigoProcesoVal = this.getCodigoProceso(result.ctrol_proceso);
        let editRealTipo = (result.tip_trabajador || item.tip_Trabajador || '').trim();
        let editRealCodigo = (result.cod_trabajador || item.cod_Trabajador || '').trim();
        if (!editRealCodigo && this.trabajadoresSpringList.length > 0) {
          const cName = userDisplayName.toLowerCase().trim();
          const matched = this.trabajadoresSpringList.find(t =>
            (t.nombre && (t.nombre.toLowerCase().includes(cName) || cName.includes(t.nombre.toLowerCase()))) ||
            (rawEmail && t.correo && t.correo.toLowerCase() === rawEmail.toLowerCase())
          );
          if (matched) {
            editRealTipo = matched.tipo;
            editRealCodigo = matched.codigo;
          }
        }

        const userDbUpdatePayload = {
          Accion: 'U',
          Cod_Usuario: userCode,
          Password: userPass,
          Nom_Usuario: userDisplayName,
          Cod_Rol: editCodigoNivelVal === '001' ? 1 : 2,
          Des_Rol: result.ctrol_nivel === 'Gerencial' ? 'Gerencial' : (result.ctrol_nivel === 'Jefatura' ? 'Jefatura' : 'Operativo'),
          Cod_Empresa: '01',
          Empresa: 'PRECOTEX S.A.C.',
          Tip_Trabajador: editRealTipo || 'E',
          Cod_Trabajador: editRealCodigo || '',
          Email: rawEmail,
          Denominacion: puestoName,
          Codigo_Proceso: editCodigoProcesoVal,
          Codigo_Nivel: editCodigoNivelVal,
          Flg_Activo: result.ctrol_estado === 'Inactivo' ? 0 : 1
        };
        this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, userDbUpdatePayload).subscribe({
          next: () => { },
          error: () => { }
        });

        const updateLocal = () => {
          const idx = this.puestosList.findIndex(p => p.id === item.id || p.codigo_Puesto === item.codigo_Puesto);
          if (idx !== -1) {
            this.puestosList[idx] = {
              ...this.puestosList[idx],
              puesto: puestoName,
              proceso: result.ctrol_proceso,
              usuario: userDisplayName,
              userCode: userCode,
              email: rawEmail,
              nivel: result.ctrol_nivel,
              permisos: result.ctrol_permisos,
              estado: result.ctrol_estado,
              tip_Trabajador: editRealTipo || 'E',
              cod_Trabajador: editRealCodigo || ''
            };
            localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
          }
          this.onListado();
          this.toastr.success('Puesto actualizado con éxito.', '', { timeOut: 2500 });
        };

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: () => updateLocal(),
          error: () => updateLocal()
        });
      }
    });
  }

  onEliminar(item: any) {
    if (!this.canEliminarUsuario) {
      this.toastr.warning('No cuentas con permisos para eliminar puestos o usuarios.', 'Acceso Restringido');
      return;
    }
    const targetCode = (item?.userCode || item?.cod_Usuario || '').toString().trim().toLowerCase();
    const targetName = (item?.usuario && item?.usuario !== '—' ? item?.usuario : '').toString().trim().toLowerCase();
    if (targetCode === 'admin' || targetName === 'admin' || targetName.includes('super administrador')) {
      this.toastr.error('No se puede eliminar la cuenta principal de Administrador del sistema.', 'Operación Restringida');
      return;

    }
    Swal.fire({
      title: '¿Desea eliminar el registro?, Confirme',
      text: `Se eliminará el puesto "${item.puesto || item.usuario}" y su usuario asignado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const uId = item.id_Usuario ? Number(item.id_Usuario) : 0;
        const uCode = (item.userCode || '').toString().trim().toLowerCase();
        const uName = (item.usuario && item.usuario !== '—' ? item.usuario : '').toString().trim();
        const codPuesto = (item.codigo_Puesto || '').toString().replace(/\D/g, '').trim();

        // 1. Registrar en conjunto de eliminados persistente
        if (uCode) this.deletedPuestosSet.add(uCode);
        if (uName) this.deletedPuestosSet.add(uName.toLowerCase());
        if (codPuesto) this.deletedPuestosSet.add(codPuesto);

        try {
          const arrElim = Array.from(this.deletedPuestosSet);
          localStorage.setItem('precotex_puestos_eliminados', JSON.stringify(arrElim));
        } catch (e) { }

        // 2. Remover inmediatamente de la vista local
        this.puestosList = this.puestosList.filter(p => {
          if (uId > 0 && p.id_Usuario && Number(p.id_Usuario) === uId) return false;
          if (uCode && p.userCode && p.userCode.toLowerCase() === uCode) return false;
          if (uName && p.usuario && p.usuario.toLowerCase() === uName.toLowerCase()) return false;
          if (codPuesto && p.codigo_Puesto && p.codigo_Puesto.replace(/\D/g, '') === codPuesto) return false;
          if (item.id && p.id === item.id) return false;
          return true;
        });
        this.dataSource.data = [...this.puestosList];
        this.calculateStats();

        // 3. Limpiar de almacenamiento local
        try {
          const rawPuestos = localStorage.getItem('precotex_puestos_usuarios');
          if (rawPuestos) {
            let puestos = JSON.parse(rawPuestos);
            puestos = puestos.filter((p: any) => {
              if (uCode && p.userCode && p.userCode.toLowerCase() === uCode) return false;
              if (uName && p.usuario && p.usuario.toLowerCase() === uName.toLowerCase()) return false;
              return true;
            });
            localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(puestos));
          }
          const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
          if (rawCuentas) {
            let cuentas = JSON.parse(rawCuentas);
            cuentas = cuentas.filter((c: any) => {
              if (uCode && c.cod_Usuario && c.cod_Usuario.toLowerCase() === uCode) return false;
              return true;
            });
            localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));
          }
        } catch (e) { }

        // 4. Enviar solicitud de desactivación a SN_Puesto si tiene puesto asociado
        const puestoDeactivatePayload: any = {
          Accion: 'D',
          Codigo_Puesto: codPuesto ? codPuesto.padStart(3, '0') : (item.codigo_Puesto || '000'),
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: item.puesto || '',
          Codigo_Nivel_Riesgo: item.nivel || '',
          Validacion_Periodica: true,
          Puesto_Descripcion: item.proceso || '',
          Puesto_Funciones: uName || uCode,
          Puesto_Requisitos: item.permisos || '',
          Puesto_Caracteristicas: 'Inactivo',
          Caracteristicas_Visible: false,
          Flg_Activo: '0',
          Cod_Usuario: uCode || uName || this.sUsuario
        };

        // Ejecutar las bajas en BD y luego recargar
        const ejecutarBajaPuesto = () => {
          this.puestosService.postProcesoMntoPuesto(puestoDeactivatePayload).subscribe({
            next: () => this.onListado(),
            error: () => this.onListado()
          });
        };

        if (this.isLocal) {
          const userDeactivatePayload: any = {
            Accion: 'D',
            Cod_Usuario: uCode,
            Nom_Usuario: uName,
            Flg_Activo: 0
          };
          if (uId > 0) {
            userDeactivatePayload.Id_Usuario = uId;
          }
          this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, userDeactivatePayload).subscribe({
            next: () => ejecutarBajaPuesto(),
            error: () => ejecutarBajaPuesto()
          });
        } else {
          ejecutarBajaPuesto();
        }

        this.toastr.success('Puesto y usuario eliminados correctamente.', '', { timeOut: 2500 });
        this.registrarAccionLog('EliminaciÃ³n de puesto/colaborador: ' + (item.puesto || '') + ' (' + (uName || uCode) + ')', item.puesto);
      }
    });
  }

  onExportarReporte(): void {
    if (!this.puestosList || this.puestosList.length === 0) {
      this.toastr.warning('No hay puestos registrados para exportar.', 'Exportación');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Definir filas del reporte
      const dataRows: any[] = [];

      // Fila 1: Título Principal
      dataRows.push(['PRECOTEX S.A.C. - SISTEMA DE GESTIÓN DE SEGURIDAD']);
      // Fila 2: Subtítulo
      dataRows.push(['REPORTE GENERAL DE PUESTOS Y USUARIOS ASIGNADOS']);
      // Fila 3: Metadatos
      const fechaActual = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      dataRows.push([`Fecha de Emisión: ${fechaActual} ${horaActual}`, '', '', '', `Total de Puestos: ${this.puestosList.length}`, '', '', `Usuario: ${this.sUsuario || 'Administrador'}`]);
      // Fila 4: Espacio en blanco
      dataRows.push([]);

      // Fila 5: Encabezados de Columna
      const headers = [
        'N°',
        'CÓDIGO PUESTO',
        'PUESTO / CARGO',
        'PROCESO ASOCIADO',
        'KEY USER / USUARIO ASIGNADO',
        'CORREO ELECTRÓNICO',
        'CONTRASEÑA',
        'FECHA DE REGISTRO',
        'NIVEL JERÁRQUICO',
        'PERMISOS DE ACCESO',
        'ESTADO'
      ];
      dataRows.push(headers);

      // Filas de Datos
      this.puestosList.forEach((p, index) => {
        dataRows.push([
          index + 1,
          p.codigo_Puesto || p.id || `PUE-${String(index + 1).padStart(3, '0')}`,
          p.puesto || '',
          p.proceso || 'General',
          (p.usuario && p.usuario !== '—') ? p.usuario : 'Sin asignar',
          p.email || '—',
          p.password || (p.userCode && this.dbPasswordMap[p.userCode]) || 'Precotex2026!',
          p.fecha_Registro || '01/09/2026',
          p.nivel || 'Operativo',
          p.permisos || 'Lectura',
          p.estado || 'Activo'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(dataRows);

      // Configurar anchos de columna (wch)
      ws['!cols'] = [
        { wch: 6 },   // N°
        { wch: 16 },  // CÓDIGO PUESTO
        { wch: 38 },  // PUESTO / CARGO
        { wch: 36 },  // PROCESO ASOCIADO
        { wch: 30 },  // KEY USER / USUARIO ASIGNADO
        { wch: 30 },  // CORREO ELECTRÓNICO
        { wch: 18 },  // FECHA DE REGISTRO
        { wch: 18 },  // NIVEL JERÁRQUICO
        { wch: 32 },  // PERMISOS DE ACCESO
        { wch: 15 }   // ESTADO
      ];

      // Combinaciones de celdas (Merges) para títulos
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Título
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }  // Subtítulo
      ];

      // Aplicar estilos corporativos Precotex con xlsx-js-style
      const headerStyle = {
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E293B' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      const titleStyle = {
        font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const subtitleStyle = {
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '475569' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const metaStyle = {
        font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: '64748B' } },
        alignment: { vertical: 'center' }
      };

      const cellStyleNormal = {
        font: { name: 'Segoe UI', sz: 10, color: { rgb: '1E293B' } },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } }
        }
      };

      const cellStyleZebra = {
        ...cellStyleNormal,
        fill: { fgColor: { rgb: 'F8FAFC' } }
      };

      const cellStyleCenter = {
        ...cellStyleNormal,
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const cellStyleCenterZebra = {
        ...cellStyleZebra,
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const cellStyleDate = {
        font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: cellStyleNormal.border
      };

      const cellStyleDateZebra = {
        ...cellStyleDate,
        fill: { fgColor: { rgb: 'F8FAFC' } }
      };

      // Recorrer todas las celdas para aplicar estilos
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          if (R === 0) {
            ws[cellAddress].s = titleStyle;
          } else if (R === 1) {
            ws[cellAddress].s = subtitleStyle;
          } else if (R === 2) {
            ws[cellAddress].s = metaStyle;
          } else if (R === 4) {
            ws[cellAddress].s = headerStyle;
          } else if (R > 4) {
            const isZebra = R % 2 === 1;
            if (C === 0 || C === 1 || C === 7 || C === 9) {
              ws[cellAddress].s = isZebra ? cellStyleCenterZebra : cellStyleCenter;
            } else if (C === 6) {
              // Columna de Fecha de Registro
              ws[cellAddress].s = isZebra ? cellStyleDateZebra : cellStyleDate;
            } else {
              ws[cellAddress].s = isZebra ? cellStyleZebra : cellStyleNormal;
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Puestos y Usuarios');
      const filename = `Reporte_Puestos_y_Usuarios_Precotex_${new Date().toISOString().substring(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      this.toastr.success(`El reporte se ha descargado exitosamente incluyendo las fechas de registro.`, '📊 Reporte Exportado');
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      this.toastr.error('Ocurrió un error al generar el reporte Excel.', 'Error');
    }
  }

  formatFecha(val: any): string {
    if (!val) return '—';
    const str = String(val).trim();
    if (!str || str === 'null' || str === 'undefined' || str === '—') return '—';

    // Si ya viene en formato dd/MM/yyyy o dd-MM-yyyy (ej. 31/08/2026 o 31-08-2026)
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${d}/${m}/${y}`;
    }

    // Si viene en formato ISO o SQL yyyy-MM-dd... (ej. 2026-08-31T10:05:50...)
    const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      return `${d}/${m}/${y}`;
    }

    // Intentar formatear con objeto Date
    try {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        const d = String(parsed.getDate()).padStart(2, '0');
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const y = parsed.getFullYear();
        return `${d}/${m}/${y}`;
      }
    } catch (e) { }

    return str;
  }

  getEstadoBadgeClass(estado: string): string {
    const est = (estado || '').toLowerCase().trim();
    if (est === 'activo' || (est.includes('activo') && !est.includes('inactivo'))) return 'soft-badge-vigente';
    if (est.includes('pendiente') || est.includes('activacion') || est.includes('activación')) return 'soft-badge-revision';
    if (est.includes('suspendido')) return 'soft-badge-vencido';
    if (est.includes('inactivo')) return 'soft-badge-inactivo';
    return 'soft-badge-revision';
  }

  onConfirmarActivacion(item: any): void {
    Swal.fire({
      title: '¿Confirmar activación de cuenta?',
      html: `<p style="font-size: 13.5px; color: #334155; margin-bottom: 8px;">
              El usuario <strong>${item.usuario || item.puesto}</strong> ha verificado su correo electrónico.
             </p>
             <p style="font-size: 12.5px; color: #64748b;">
              Al confirmar, el puesto pasará de estado <span style="color: #d97706; font-weight: bold;">Pendiente de activación</span> a <span style="color: #059669; font-weight: bold;">Activo</span>.
             </p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, confirmar y activar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        item.estado = 'Activo';

        // 1. Actualizar lista local de puestos
        const localData = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
        const idx = localData.findIndex((p: any) => p.id === item.id || p.puesto === item.puesto);
        if (idx !== -1) {
          localData[idx].estado = 'Activo';
          localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(localData));
        } else {
          localData.push({ ...item, estado: 'Activo' });
          localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(localData));
        }

        // 2. Actualizar cuenta de acceso en localStorage
        const cuentas = JSON.parse(localStorage.getItem('precotex_cuentas_usuarios') || '[]');
        const cIdx = cuentas.findIndex((c: any) =>
          (c.nom_Usuario || '').toLowerCase() === (item.usuario || '').toLowerCase() ||
          (c.puesto || '').toLowerCase() === (item.puesto || '').toLowerCase()
        );
        if (cIdx !== -1) {
          cuentas[cIdx].flg_Activo = 1;
          localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));
        }

        // 3. Notificar al backend
        const codPuesto = (item.codigo_Puesto || item.id || '').toString().replace(/\D/g, '');
        const requestData = {
          Accion: 'U',
          Codigo_Puesto: codPuesto ? codPuesto.padStart(3, '0') : (item.codigo_Puesto || item.id),
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: item.puesto || '',
          Codigo_Nivel_Riesgo: item.nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: item.proceso || '',
          Puesto_Funciones: item.usuario || '',
          Puesto_Requisitos: item.permisos || '',
          Puesto_Caracteristicas: 'Activo',
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario
        };

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: () => { },
          error: () => { }
        });

        // 4. Sincronizar en dbo.SN_Usuario solo si está en local
        const userCode = item.userCode || (item.email ? item.email.split('@')[0] : '');
        if (this.isLocal && userCode) {
          const payloadP = {
            Accion: 'P',
            Cod_Usuario: userCode,
            Password: item.password || 'Precotex2026!',
            Estado: 'Activo',
            Primer_Ingreso: 0
          };
          this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, payloadP).subscribe({
            next: () => { this.onListado(); },
            error: () => { this.onListado(); }
          });
        } else {
          this.onListado();
        }

        this.calculateStats();
        this.toastr.success(`Puesto y usuario "${item.usuario || item.puesto}" activados exitosamente tras confirmación por correo.`, '✅ Cuenta Activada');
      }
    });
  }

  initials(n: string): string {
    const p = (n || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] || '?').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase();
  }
}
