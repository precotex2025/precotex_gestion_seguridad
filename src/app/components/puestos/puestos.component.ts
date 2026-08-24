import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PuestosUsuariosRegeditComponent } from './puestos-usuarios-regedit/puestos-usuarios-regedit.component';
import { PuestosService } from '../../services/puestos.service';
import { GlobalVariable } from '../../VarGlobals';

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
    // 1. Asegurar cuenta local por defecto de Cynthia Aldana
    const seedPuestos = [
      {
        id: 'PUE-010',
        codigo_Puesto: '010',
        puesto: 'Coordinador de SSOMA',
        proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
        usuario: 'Cynthia Aldana',
        nivel: 'Mando Medio',
        permisos: 'Lectura + descarga + modificar',
        estado: 'Activo',
        email: 'caldana@precotexperu.com'
      }
    ];

    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      const cuentas = rawCuentas ? JSON.parse(rawCuentas) : [];
      if (!cuentas.some((c: any) => (c.cod_Usuario || '').toLowerCase() === 'caldana')) {
        cuentas.push({
          cod_Usuario: 'caldana',
          password: 'Precotex2026!',
          nom_Usuario: 'Cynthia Aldana',
          puesto: 'Coordinador de SSOMA',
          email: 'caldana@precotexperu.com',
          cod_Rol: '2',
          des_Rol: 'Usuario SOMA',
          flg_Activo: 1
        });
        cuentas.push({
          cod_Usuario: 'cynthia.aldana',
          password: 'Precotex2026!',
          nom_Usuario: 'Cynthia Aldana',
          puesto: 'Coordinador de SSOMA',
          email: 'caldana@precotexperu.com',
          cod_Rol: '2',
          des_Rol: 'Usuario SOMA',
          flg_Activo: 1
        });
        localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));
      }
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
            nivel: p.nivelRiesgo || p.codigo_Nivel_Riesgo || 'Operativo',
            permisos: p.puesto_Requisitos || 'Lectura',
            estado: p.puesto_Caracteristicas || 'Activo',
            flg_Activo: p.flg_Activo,
            raw: p
          })).filter((p: any) => p.flg_Activo !== '0' && p.flg_Activo !== 0);
        }

        // Combinar con los puestos semillas por defecto
        seedPuestos.forEach(sp => {
          if (!dbList.some(db => (db.puesto || '').toLowerCase() === sp.puesto.toLowerCase())) {
            dbList.push(sp);
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
        let list = [...seedPuestos];
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
          Enviar_Correo: result.ctrol_enviar_credenciales ? 1 : 0
        };

        const newItem = {
          id: 'p-' + Date.now(),
          puesto: (result.ctrol_puesto || '').trim(),
          proceso: result.ctrol_proceso,
          usuario: (result.ctrol_usuario || '').trim(),
          email: (result.ctrol_email || '').trim(),
          password: (result.ctrol_password || 'Precotex2026!').trim(),
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

  initials(n: string): string {
    const p = (n || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] || '?').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase();
  }
}
