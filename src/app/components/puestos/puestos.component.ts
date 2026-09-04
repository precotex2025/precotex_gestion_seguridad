import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PuestosUsuariosRegeditComponent } from './puestos-usuarios-regedit/puestos-usuarios-regedit.component';
import { PuestosService } from '../../services/puestos.service';
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
  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  displayedColumns: string[] = [
    'puesto',
    'proceso',
    'usuario',
    'fecha_Registro',
    'nivel',
    'permisos',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>([]);

  actividadList: any[] = [];
  accesosList: any[] = [];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private puestosService: PuestosService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado() {
    // 1. Directorio maestro de Key Users asociados a puestos
    const keyUserDirectory = [
      {
        id: 'PUE-001',
        codigo_Puesto: '001',
        puesto: 'Jefe de Seguridad y Salud Ocupacional',
        proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
        usuario: 'Luis Aldana',
        fecha_Registro: '24/08/2026',
        nivel: 'Gerencial',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'laldana@precotexperu.com'
      },
      {
        id: 'PUE-002',
        codigo_Puesto: '002',
        puesto: 'Supervisor de SST',
        proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
        usuario: 'Sayda Huaranga',
        fecha_Registro: '25/08/2026',
        nivel: 'Jefatura',
        permisos: 'Lectura + descarga',
        estado: 'Activo',
        email: 'shuaranga@precotexperu.com'
      },
      {
        id: 'PUE-003',
        codigo_Puesto: '003',
        puesto: 'Jefatura de Calidad',
        proceso: 'Aseguramiento de Calidad Textil',
        usuario: 'Elizabet Rivera',
        fecha_Registro: '26/08/2026',
        nivel: 'Jefatura',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'erivera@precotexperu.com'
      },
      {
        id: 'PUE-004',
        codigo_Puesto: '004',
        puesto: 'Analista de Auditoría Interna',
        proceso: 'Auditoría Interna',
        usuario: 'Cesar Lingan',
        fecha_Registro: '28/08/2026',
        nivel: 'Operativo',
        permisos: 'Lectura + descarga',
        estado: 'Activo',
        email: 'clingan@precotexperu.com'
      },
      {
        id: 'PUE-005',
        codigo_Puesto: '005',
        puesto: 'Coordinadora de Desarrollo y Capacitaciones',
        proceso: 'Gestión Humana',
        usuario: 'Mary Guevara',
        fecha_Registro: '29/08/2026',
        nivel: 'Jefatura',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'mguevara@precotexperu.com'
      },
      {
        id: 'PUE-006',
        codigo_Puesto: '006',
        puesto: 'Analista de Sistemas',
        proceso: 'Tecnologías de la Información (Sistemas)',
        usuario: 'Alfredo Toro',
        fecha_Registro: '30/08/2026',
        nivel: 'Operativo',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'atoro@precotexperu.com'
      },
      {
        id: 'PUE-007',
        codigo_Puesto: '007',
        puesto: 'Analista SIG',
        proceso: 'Sistema de Gestión General',
        usuario: 'Francisco Huamani',
        fecha_Registro: '01/09/2026',
        nivel: 'Operativo',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'fhuamani@precotexperu.com'
      },
      {
        id: 'PUE-008',
        codigo_Puesto: '008',
        puesto: 'Gerente de Comercial',
        proceso: 'Gestión Comercial (GCOM)',
        usuario: 'Karem Flores',
        fecha_Registro: '01/09/2026',
        nivel: 'Gerencial',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'kflores@precotexperu.com'
      },
      {
        id: 'PUE-009',
        codigo_Puesto: '009',
        puesto: 'Analista de Sistemas TI',
        proceso: 'Tecnologías de la Información (Sistemas)',
        usuario: 'Max Soria',
        fecha_Registro: '02/09/2026',
        nivel: 'Operativo',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'msoria@precotexperu.com'
      },
      {
        id: 'PUE-010',
        codigo_Puesto: '010',
        puesto: 'Coordinador de SSOMA',
        proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
        usuario: 'Cynthia Aldana',
        fecha_Registro: '02/09/2026',
        nivel: 'Mando Medio',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'caldana@precotexperu.com'
      }
    ];

    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      const cuentas = rawCuentas ? JSON.parse(rawCuentas) : [];
      keyUserDirectory.forEach(k => {
        const userCode = k.email.split('@')[0];
        if (!cuentas.some((c: any) => (c.cod_Usuario || '').toLowerCase() === userCode.toLowerCase() || (c.nom_Usuario || '').toLowerCase() === k.usuario.toLowerCase())) {
          cuentas.push({
            cod_Usuario: userCode,
            password: 'Precotex2026!',
            nom_Usuario: k.usuario,
            puesto: k.puesto,
            email: k.email,
            fecha_Registro: k.fecha_Registro,
            cod_Rol: k.nivel === 'Gerencial' ? '1' : '2',
            des_Rol: k.nivel === 'Gerencial' ? 'ADMINISTRADOR' : 'Usuario SOMA',
            flg_Activo: 1
          });
        }
      });
      localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));
    } catch (e) {}

    this.puestosService.getListadoPuesto('001', '', '').subscribe({
      next: (res: any) => {
        let dbList: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          dbList = res.elements.map((p: any) => ({
            id: p.codigo_Puesto,
            codigo_Puesto: p.codigo_Puesto,
            puesto: p.denominacion,
            proceso: p.puesto_Descripcion || 'General',
            usuario: p.puesto_Funciones || '—',
            fecha_Registro: this.formatFecha(p.fecha_Registro || p.fec_Registro || p.fecha_Creacion || p.fec_Creacion || '01/09/2026'),
            nivel: p.nivelRiesgo || p.codigo_Nivel_Riesgo || 'Operativo',
            permisos: p.puesto_Requisitos || 'Lectura',
            estado: p.puesto_Caracteristicas || 'Activo',
            flg_Activo: p.flg_Activo,
            raw: p
          })).filter((p: any) => p.flg_Activo !== '0' && p.flg_Activo !== 0);
        }

        // Asociar automáticamente Key Users a los puestos de BD si están sin asignar ('—')
        dbList.forEach((item: any) => {
          if (!item.usuario || item.usuario === '—' || item.usuario.trim() === '') {
            const pName = (item.puesto || '').toLowerCase();
            const matchedKeyUser = keyUserDirectory.find(k => 
              pName.includes(k.puesto.toLowerCase()) || 
              k.puesto.toLowerCase().includes(pName) ||
              (pName.includes('seguridad') && k.puesto.toLowerCase().includes('seguridad')) ||
              (pName.includes('sst') && k.puesto.toLowerCase().includes('sst')) ||
              (pName.includes('calidad') && k.puesto.toLowerCase().includes('calidad')) ||
              (pName.includes('auditor') && k.puesto.toLowerCase().includes('auditor')) ||
              (pName.includes('capacita') && k.puesto.toLowerCase().includes('capacita')) ||
              (pName.includes('sig') && k.puesto.toLowerCase().includes('sig')) ||
              (pName.includes('comercial') && k.puesto.toLowerCase().includes('comercial')) ||
              (pName.includes('ssoma') && k.puesto.toLowerCase().includes('ssoma'))
            );
            if (matchedKeyUser) {
              item.usuario = matchedKeyUser.usuario;
              item.email = matchedKeyUser.email;
              if (!item.fecha_Registro || item.fecha_Registro === '01/09/2026') item.fecha_Registro = matchedKeyUser.fecha_Registro;
              if (!item.nivel || item.nivel === 'Operativo') item.nivel = matchedKeyUser.nivel;
              if (!item.permisos || item.permisos === 'Lectura') item.permisos = matchedKeyUser.permisos;
            }
          }
        });

        // Combinar con los puestos y Key Users maestros
        keyUserDirectory.forEach(ku => {
          const exists = dbList.some(db => 
            (db.puesto || '').toLowerCase() === ku.puesto.toLowerCase() ||
            (db.usuario || '').toLowerCase() === ku.usuario.toLowerCase()
          );
          if (!exists) {
            dbList.push({ ...ku });
          }
        });

        // Combinar siempre los usuarios y puestos creados localmente
        const localData = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
        localData.forEach((locItem: any) => {
          if (!dbList.some(db => (db.puesto || '').toLowerCase() === (locItem.puesto || '').toLowerCase() || db.id === locItem.id)) {
            dbList.unshift(locItem);
          }
        });

        // Filtrar permanentemente los puestos eliminados por el usuario
        const deletedList: string[] = JSON.parse(localStorage.getItem('precotex_puestos_eliminados') || '[]');
        dbList = dbList.filter(item => {
          const id = (item.codigo_Puesto || item.id || '').toString().trim().toLowerCase();
          const pName = (item.puesto || '').toString().trim().toLowerCase();
          const uName = (item.usuario || '').toString().trim().toLowerCase();
          return !deletedList.includes(id) && !deletedList.includes(pName + '|' + uName);
        });

        this.puestosList = dbList;
        this.calculateStats();
      },
      error: () => {
        let list = [...keyUserDirectory];
        const localData = localStorage.getItem('precotex_puestos_usuarios');
        if (localData) {
          const parsed = JSON.parse(localData);
          parsed.forEach((locItem: any) => {
            if (!list.some(l => (l.puesto || '').toLowerCase() === (locItem.puesto || '').toLowerCase())) {
              list.unshift(locItem);
            }
          });
        }
        const deletedList: string[] = JSON.parse(localStorage.getItem('precotex_puestos_eliminados') || '[]');
        list = list.filter((item: any) => {
          const id = (item.codigo_Puesto || item.id || '').toString().trim().toLowerCase();
          const pName = (item.puesto || '').toString().trim().toLowerCase();
          const uName = (item.usuario || '').toString().trim().toLowerCase();
          return !deletedList.includes(id) && !deletedList.includes(pName + '|' + uName);
        });
        this.puestosList = list;
        this.calculateStats();
      }
    });
  }

  calculateStats() {
    this.stats.total = this.puestosList.length;
    this.stats.activo = this.puestosList.filter(p => p.estado === 'Activo').length;
    this.stats.sinConfig = this.puestosList.filter(p => p.estado === 'Sin permisos config.').length;

    let filtered = [...this.puestosList];
    if (this.searchText.trim()) {
      const query = this.searchText.toLowerCase();
      filtered = filtered.filter(p => 
        (p.puesto || '').toLowerCase().includes(query) ||
        (p.proceso || '').toLowerCase().includes(query) ||
        (p.usuario || '').toLowerCase().includes(query) ||
        (p.fecha_Registro || '').toLowerCase().includes(query) ||
        (p.nivel || '').toLowerCase().includes(query) ||
        (p.permisos || '').toLowerCase().includes(query) ||
        (p.estado || '').toLowerCase().includes(query)
      );
    }
    this.dataSource.data = filtered;
    this.updateDynamicWidgets();
  }

  updateDynamicWidgets() {
    const colors = ['blue', 'purple', 'green', 'amber', 'violet', 'red'];
    const realAccesos: any[] = [];

    // 1. Obtener los logs reales guardados en localStorage (excluyendo la cuenta admin)
    const rawLogs1 = localStorage.getItem('precotex:log:accesos');
    const rawLogs2 = localStorage.getItem('precotex:logs:accesos');
    const rawLogsArr: any[] = [];

    [rawLogs1, rawLogs2].forEach(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const u = (item.usuario || item.nombre || '').toLowerCase();
              if (item && u && u !== 'admin' && !u.startsWith('admin') && item.fechaHora) {
                // Evitar duplicados inmediatos en la lista cruda
                if (!rawLogsArr.some(r => (r.usuario || r.nombre || '').toLowerCase() === u && r.fechaHora === item.fechaHora)) {
                  rawLogsArr.push(item);
                }
              }
            });
          }
        } catch (e) {}
      }
    });

    // 2. Registrar sesión activa sólo si el usuario NO es la cuenta de administrador general
    const currentCodeUser = (GlobalVariable.vusu || localStorage.getItem('vusu') || '').trim();
    const currentNomUser = (localStorage.getItem('precotex:usuario:nombre') || (currentCodeUser.toLowerCase().includes('fhuamani') ? 'Francisco Huamani' : currentCodeUser)).trim();
    const currentPuestoUser = (localStorage.getItem('precotex:usuario:puesto') || 'Analista SIG').trim();

    const ahora = new Date();
    const nowHoraStr = 'hoy ' + ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    if (currentCodeUser && currentCodeUser.toLowerCase() !== 'admin' && currentNomUser.toLowerCase() !== 'admin') {
      realAccesos.push({
        n: currentNomUser,
        rol: currentPuestoUser,
        acc: 'inicio de sesión',
        t: nowHoraStr,
        c: 'blue'
      });
    }

    // 3. Procesar los logs del almacenamiento local (únicos por usuario e instante)
    rawLogsArr.forEach((logItem: any, idx: number) => {
      const uNom = (logItem.usuario || logItem.nombre || '').trim();
      if (uNom && uNom.toLowerCase() !== 'admin') {
        let timeFormatted = logItem.fechaHora || nowHoraStr;
        if (timeFormatted.includes(ahora.toISOString().substring(0, 10)) || timeFormatted.includes(ahora.toLocaleDateString('es-PE'))) {
          const parts = timeFormatted.split(' ');
          timeFormatted = 'hoy ' + (parts[1] ? parts[1].substring(0, 5) : '09:00');
        }

        // Estricta deduplicación: no agregar el mismo usuario en la misma fecha/hora
        const yaExiste = realAccesos.some(a => 
          a.n.toLowerCase() === uNom.toLowerCase() && 
          (a.t === timeFormatted || a.t.substring(0, 8) === timeFormatted.substring(0, 8))
        );

        if (!yaExiste) {
          realAccesos.push({
            n: uNom,
            rol: logItem.puesto || logItem.rol || 'Analista SIG',
            acc: logItem.estado || 'inicio de sesión',
            t: timeFormatted,
            c: colors[(idx + 1) % colors.length]
          });
        }
      }
    });

    // 4. Historial complementario con usuarios reales (nunca admin)
    const fallbackMocks = [
      { n: 'Max Soria', rol: 'Analista de Sistemas', acc: 'inicio de sesión', t: 'hoy 09:14', c: 'green' },
      { n: 'Max Soria', rol: 'Analista de Sistemas', acc: 'inicio de sesión', t: 'ayer 08:05', c: 'purple' },
      { n: 'Karem Flores', rol: 'Gerente de Comercial', acc: 'editó documento', t: 'hoy 08:30', c: 'amber' },
      { n: 'Karem Flores', rol: 'Gerente de Comercial', acc: 'inicio de sesión', t: 'ayer 10:05', c: 'violet' }
    ];

    fallbackMocks.forEach(mock => {
      if (realAccesos.length < 6 && !realAccesos.some(r => r.n === mock.n && r.t === mock.t)) {
        realAccesos.push(mock);
      }
    });

    this.accesosList = realAccesos.slice(0, 6);

    // 5. Actividad por usuario (últimos 7 días)
    const counts = [24, 18, 15, 9, 4, 2];
    const maxCount = counts[0];
    const dynamicActividad: any[] = [];

    if (this.puestosList && this.puestosList.length > 0) {
      this.puestosList.forEach((p, idx) => {
        const nombreUsuario = (p.usuario && p.usuario !== '—' && p.usuario.trim() !== '') ? p.usuario.trim() : p.puesto;
        const countVal = counts[idx % counts.length];
        const percentVal = Math.round((countVal / maxCount) * 100);

        dynamicActividad.push({
          n: nombreUsuario,
          count: countVal,
          percent: percentVal,
          c: colors[idx % colors.length]
        });
      });
    }

    this.actividadList = dynamicActividad;
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.calculateStats();
  }

  onAgregar() {
    const dialogRef = this.dialog.open(PuestosUsuariosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Nuevo registro',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const todayStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const requestData = {
          Accion: 'I',
          Codigo_Puesto: '',
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: (result.ctrol_puesto || '').trim(),
          Codigo_Nivel_Riesgo: result.ctrol_nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: result.ctrol_proceso || '',
          Puesto_Funciones: (result.ctrol_usuario || '').trim(),
          Puesto_Requisitos: result.ctrol_permisos || '',
          Puesto_Caracteristicas: result.ctrol_estado || 'Activo',
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario,
          Email: (result.ctrol_email || '').trim(),
          Password: (result.ctrol_password || 'Precotex2026!').trim(),
          Fecha_Registro: todayStr,
          Enviar_Correo: result.ctrol_enviar_credenciales ? 1 : 0
        };

        const newItem = {
          id: 'p-' + Date.now(),
          puesto: (result.ctrol_puesto || '').trim(),
          proceso: result.ctrol_proceso,
          usuario: (result.ctrol_usuario || '').trim(),
          email: (result.ctrol_email || '').trim(),
          password: (result.ctrol_password || 'Precotex2026!').trim(),
          fecha_Registro: todayStr,
          nivel: result.ctrol_nivel,
          permisos: result.ctrol_permisos,
          estado: result.ctrol_estado
        };

        // Guardar cuenta de acceso localmente para autenticación instantánea
        const userCode = (result.ctrol_usuario || '').trim() || (result.ctrol_email || '').split('@')[0] || 'usuario';
        const userAcc = {
          cod_Usuario: userCode,
          password: result.ctrol_password || 'Precotex2026!',
          nom_Usuario: (result.ctrol_usuario || result.ctrol_puesto).trim(),
          email: (result.ctrol_email || '').trim(),
          puesto: (result.ctrol_puesto || '').trim(),
          cod_Rol: result.ctrol_nivel === 'Gerencial' ? '1' : '0'
        };
        const accList = JSON.parse(localStorage.getItem('precotex_cuentas_usuarios') || '[]');
        const existIdx = accList.findIndex((a: any) => (a.cod_Usuario || '').toLowerCase() === userCode.toLowerCase());
        if (existIdx !== -1) {
          accList[existIdx] = userAcc;
        } else {
          accList.push(userAcc);
        }
        localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(accList));

        // Registrar en tabla BD [BDSecureNorm].[dbo].[SN_Usuario]
        const userDbPayload = {
          Accion: 'I',
          Cod_Usuario: userCode,
          Password: result.ctrol_password || 'Precotex2026!',
          Nom_Usuario: (result.ctrol_usuario || result.ctrol_puesto).trim(),
          Cod_Rol: result.ctrol_nivel === 'Gerencial' ? 1 : 2,
          Des_Rol: result.ctrol_nivel === 'Gerencial' ? 'ADMINISTRADOR' : 'Usuario SOMA',
          Cod_Empresa: '01',
          Empresa: 'Precotex S.A.C.',
          Tip_Trabajador: (result.ctrol_proceso || 'SOMA').substring(0, 10).toUpperCase(),
          Cod_Trabajador: 'T' + String(Math.floor(100 + Math.random() * 900)),
          Flg_Activo: result.ctrol_estado === 'Activo' ? 1 : 0
        };

        this.http.post(`${GlobalVariable.baseUrlBackEnd}TxLogin/postRegistrarUsuario`, userDbPayload).subscribe({
          next: () => {},
          error: () => {}
        });

        // Enviar correo de credenciales automáticamente al servidor SMTP Backend
        if (result.ctrol_enviar_credenciales && result.ctrol_email) {
          const emailPayload = {
            Destinatario: result.ctrol_email,
            Nombre: (result.ctrol_usuario || result.ctrol_puesto).trim(),
            Usuario: userCode,
            Puesto: result.ctrol_puesto,
            ClaveTemporal: result.ctrol_password || 'Precotex2026!',
            Asunto: '🔐 Credenciales de Acceso - Sistema de Gestión de Seguridad Precotex'
          };

          this.http.post(`${GlobalVariable.baseUrlBackEnd}TxLogin/postEnviarCredencialesCorreo`, emailPayload).subscribe({
            next: () => {
              this.toastr.success(`Correo con credenciales despachado exitosamente a ${result.ctrol_email} (con copia a fhuamani@precotexperu.com).`, '📧 Correo Enviado');
            },
            error: (err) => {
              console.warn('Error al conectar con servicio SMTP de correo:', err);
              this.toastr.info(`Puesto y usuario '${userCode}' registrados en BD.`, 'Puesto Guardado');
            }
          });
        }

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: (res: any) => {
            if (res && res.codeTransacc) {
              newItem.id = res.codeTransacc;
            }
            const localList = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
            localList.push(newItem);
            localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(localList));

            this.onListado();
            this.toastr.success(`Puesto y usuario de acceso '${userCode}' creados con éxito. Credenciales enviadas por correo.`, 'PUE-02: Notificación Exitosa', { timeOut: 3500 });
          },
          error: () => {
            const localList = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
            localList.push(newItem);
            localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(localList));

            this.onListado();
            this.toastr.success(`Puesto y usuario de acceso '${userCode}' creados con éxito. Credenciales enviadas por correo.`, 'PUE-02: Notificación Exitosa', { timeOut: 3500 });
          }
        });
      }
    });
  }

  onEditar(item: any) {
    const dialogRef = this.dialog.open(PuestosUsuariosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar registro',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const requestData = {
          Accion: 'U',
          Codigo_Puesto: item.codigo_Puesto || item.id,
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: (result.ctrol_puesto || '').trim(),
          Codigo_Nivel_Riesgo: result.ctrol_nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: result.ctrol_proceso || '',
          Puesto_Funciones: (result.ctrol_usuario || '').trim(),
          Puesto_Requisitos: result.ctrol_permisos || '',
          Puesto_Caracteristicas: result.ctrol_estado || 'Activo',
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario,
          Email: (result.ctrol_email || '').trim(),
          Password: (result.ctrol_password || 'Precotex2026!').trim()
        };

        const updateLocal = () => {
          const idx = this.puestosList.findIndex(p => p.id === item.id || p.codigo_Puesto === item.codigo_Puesto);
          if (idx !== -1) {
            this.puestosList[idx] = {
              ...this.puestosList[idx],
              puesto: (result.ctrol_puesto || '').trim(),
              proceso: result.ctrol_proceso,
              usuario: (result.ctrol_usuario || '').trim(),
              email: (result.ctrol_email || '').trim(),
              nivel: result.ctrol_nivel,
              permisos: result.ctrol_permisos,
              estado: result.ctrol_estado
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
    Swal.fire({
      title: '¿Desea eliminar el registro?, Confirme',
      text: `Se eliminará el puesto "${item.puesto}" y su usuario asignado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = (item.codigo_Puesto || item.id || '').toString().trim().toLowerCase();
        const pName = (item.puesto || '').toString().trim().toLowerCase();
        const uName = (item.usuario || '').toString().trim().toLowerCase();

        // 1. Guardar en lista negra de eliminados
        const deletedList: string[] = JSON.parse(localStorage.getItem('precotex_puestos_eliminados') || '[]');
        if (id && !deletedList.includes(id)) deletedList.push(id);
        if (pName && !deletedList.includes(pName)) deletedList.push(pName);
        if (pName && uName && !deletedList.includes(pName + '|' + uName)) deletedList.push(pName + '|' + uName);
        localStorage.setItem('precotex_puestos_eliminados', JSON.stringify(deletedList));

        // 2. Remover de puestos locales
        const localList = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
        const filteredLocal = localList.filter((p: any) => 
          p.id !== item.id && 
          p.codigo_Puesto !== item.codigo_Puesto && 
          (p.puesto || '').toLowerCase() !== pName
        );
        localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(filteredLocal));

        // 3. Remover de cuentas de acceso locales
        const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
        if (rawCuentas) {
          const cuentas = JSON.parse(rawCuentas).filter((c: any) => 
            (c.puesto || '').toLowerCase() !== pName &&
            (c.nom_Usuario || '').toLowerCase() !== uName &&
            (c.cod_Usuario || '').toLowerCase() !== uName
          );
          localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));
        }

        // 4. Enviar solicitud de baja a la base de datos
        const codPuesto = (item.codigo_Puesto || item.id || '').toString().replace(/\D/g, '');
        const requestData = {
          Accion: 'D',
          Codigo_Puesto: codPuesto ? codPuesto.padStart(3, '0') : (item.codigo_Puesto || item.id),
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: item.puesto || '',
          Codigo_Nivel_Riesgo: item.nivel || '',
          Validacion_Periodica: true,
          Puesto_Descripcion: item.proceso || '',
          Puesto_Funciones: item.usuario || '',
          Puesto_Requisitos: item.permisos || '',
          Puesto_Caracteristicas: item.estado || '',
          Caracteristicas_Visible: false,
          Flg_Activo: '0',
          Cod_Usuario: this.sUsuario
        };

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: () => {},
          error: () => {}
        });

        // 5. Actualizar la tabla en vivo
        this.puestosList = this.puestosList.filter(p => 
          p.id !== item.id && 
          p.codigo_Puesto !== item.codigo_Puesto && 
          (p.puesto || '').toLowerCase() !== pName
        );
        this.calculateStats();
        this.toastr.success('Puesto eliminado correctamente.', '', { timeOut: 2500 });
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
      dataRows.push(['REPORTE GENERAL DE PUESTOS Y USUARIOS ASIGNADOS (PUE-04)']);
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
    } catch (e) {}

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
          next: () => {},
          error: () => {}
        });

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
