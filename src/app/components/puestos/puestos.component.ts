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
  mostrarBanner: boolean = false;

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
  trabajadoresSpringList: any[] = [];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private puestosService: PuestosService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.cargarTrabajadoresSpring();
    this.onListado();
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
    this.puestosService.getListadoUsuarios().subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.elements) && res.elements.length > 0) {
          let userList = res.elements
            .filter((u: any) => u.flg_Activo === true || u.flg_Activo === 1 || u.flg_Activo === 'True' || u.flg_Activo === '1')
            .map((u: any) => {
              let puestoName = (u.puesto || '').trim();
              let userName = (u.usuario || '').trim();

              if (puestoName.includes(',') && (!userName || !userName.includes(','))) {
                const temp = puestoName;
                puestoName = userName || 'General';
                userName = temp;
              }

              const rawNivel = (u.nivel || 'Operativo').toString().trim();
              const nivelClean = rawNivel.toLowerCase().includes('mando') ? 'Jefatura'
                : (rawNivel.toLowerCase().includes('geren') ? 'Gerencial'
                  : (rawNivel.toLowerCase().includes('jef') ? 'Jefatura' : 'Operativo'));

              let permisosVal = (u.permisos || '').trim();
              if (!permisosVal) {
                permisosVal = nivelClean === 'Operativo' ? 'Lectura + descarga' : 'Lectura + descarga + modificar';
              }

              let estadoVal = (u.estado || 'Activo').trim();
              if (estadoVal.toLowerCase().includes('pendiente') || estadoVal.toLowerCase().includes('activac') || u.primer_Ingreso === true) {
                estadoVal = 'Pendiente de activación';
              } else if (estadoVal.toLowerCase().includes('inactiv') || u.flg_Activo === false || u.flg_Activo === 0) {
                estadoVal = 'Inactivo';
              } else {
                estadoVal = 'Activo';
              }

              return {
                id: u.id || ('u-' + (u.id_Usuario || u.userCode)),
                codigo_Puesto: u.codigo_Puesto || '',
                id_Usuario: u.id_Usuario,
                puesto: puestoName || 'Puesto General',
                proceso: u.proceso || 'General',
                usuario: userName || '—',
                userCode: u.userCode || (u.email ? u.email.split('@')[0] : ''),
                email: u.email || '',
                fecha_Registro: u.fecha_Registro || '—',
                nivel: nivelClean,
                permisos: permisosVal,
                estado: estadoVal,
                flg_Activo: 1,
                tip_Trabajador: (u.tip_Trabajador || 'E').trim(),
                cod_Trabajador: (u.cod_Trabajador || '').trim()
              };
            });

          this.puestosList = userList;
          this.dataSource.data = [...this.puestosList];
          this.calculateStats();
        } else {
          this.puestosList = [];
          this.dataSource.data = [];
          this.calculateStats();
        }
      },
      error: () => {
        this.puestosList = [];
        this.dataSource.data = [];
        this.calculateStats();
      }
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

  updateDynamicWidgets() {
    const ahora = new Date();

    interface LogItemInternal {
      rawDate: Date;
      n: string;
      rol: string;
      acc: string;
      c: string;
      t: string;
      isReal: boolean;
    }

    const realLogs: LogItemInternal[] = [];

    const formatLogTime = (date: Date): string => {
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
        return `hoy ${hh}:${mm}`;
      } else if (isYesterday) {
        return `ayer ${hh}:${mm}`;
      } else {
        const dd = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        return `${dd}/${mes} ${hh}:${mm}`;
      }
    };

    // 1. Criterio de purga estricta para los registros de la segunda imagen:
    // Francisco Huamani (19/08 11:49), Max Soria (10:58 / 10:54), Karem Flores (09:18 / 09:14), Luis Aldana (08:12)
    const isImage2Obsolete = (item: any): boolean => {
      const dtStr = (item.fechaHora || item.timestamp || '').toString();
      const uName = (item.usuario || item.nom_Usuario || item.nombre || item.n || '').toLowerCase();
      if (dtStr.includes('19/08') || dtStr.includes('08-19') || (uName.includes('francisco') && dtStr.includes('11:49'))) return true;
      if (uName.includes('max soria') && (dtStr.includes('10:58') || dtStr.includes('10:54'))) return true;
      if (uName.includes('karem flores') && (dtStr.includes('09:18') || dtStr.includes('09:14'))) return true;
      if (uName.includes('luis aldana') && dtStr.includes('08:12')) return true;
      return false;
    };

    // Criterio de exclusión estricta para la cuenta del Administrador:
    // El administrador general no debe registrarse ni figurar en el Histórico de ingresos
    const isAdminRecord = (item: any): boolean => {
      const uName = (item.usuario || item.nom_Usuario || item.nombre || item.n || item.cod_Usuario || '').toLowerCase().trim();
      const rName = (item.puesto || item.rol || '').toLowerCase().trim();
      return uName === 'admin' ||
        uName === 'super administrador' ||
        uName.includes('administrador') ||
        rName === 'administrador general' ||
        rName.includes('administrador general');
    };

    const rawKeys = ['precotex:log:accesos', 'precotex:logs:accesos'];
    rawKeys.forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          let arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            arr = arr.filter((item: any) => !isImage2Obsolete(item) && !isAdminRecord(item));
            localStorage.setItem(k, JSON.stringify(arr));
          }
        } catch (e) { }
      }
    });

    // 2. Registrar/garantizar ingreso de la sesión activa actual del usuario (SOLO usuarios regulares, NO administrador)
    const currentCodeUser = (GlobalVariable.vusu || localStorage.getItem('vusu') || '').trim();
    const storedNom = (localStorage.getItem('precotex:usuario:nombre') || currentCodeUser).trim();
    const storedPuesto = (localStorage.getItem('precotex:usuario:puesto') || '').trim();
    const isCurrentAdmin = currentCodeUser.toLowerCase() === 'admin' ||
      storedNom.toLowerCase() === 'admin' ||
      storedNom.toLowerCase().includes('administrador');

    if (currentCodeUser && !isCurrentAdmin) {
      const uInfo = this.resolveUserData(storedNom || currentCodeUser, storedPuesto || undefined);

      // Registrar en almacenamiento local si no existe para la sesión actual
      const rawStored = localStorage.getItem('precotex:log:accesos');
      let currentStoredLogs: any[] = rawStored ? JSON.parse(rawStored) : [];
      if (!Array.isArray(currentStoredLogs)) currentStoredLogs = [];

      const diezMinutosAtras = new Date(ahora.getTime() - 10 * 60 * 1000);
      const yaRegistrado = currentStoredLogs.some((l: any) => {
        const sameUser = (l.usuario || '').toLowerCase() === uInfo.nombre.toLowerCase() ||
          (l.cod_Usuario || '').toLowerCase() === currentCodeUser.toLowerCase();
        if (!sameUser) return false;
        const lDate = l.timestamp ? new Date(l.timestamp) : (l.fechaHora ? new Date(l.fechaHora.replace(' ', 'T')) : null);
        return lDate && lDate >= diezMinutosAtras;
      });

      if (!yaRegistrado) {
        const activeLogEntry = {
          id: 'LOG-' + Date.now(),
          fechaHora: ahora.getFullYear() + '-' +
            String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
            String(ahora.getDate()).padStart(2, '0') + ' ' +
            ahora.toLocaleTimeString('es-PE', { hour12: false }),
          usuario: uInfo.nombre,
          cod_Usuario: currentCodeUser,
          puesto: uInfo.rol,
          rol: localStorage.getItem('vCod_Rol') === '1' ? 'Administrador' : 'Usuario SOMA',
          timestamp: ahora.toISOString(),
          ip: '192.168.1.36',
          estado: 'Inicio de sesión'
        };
        currentStoredLogs.unshift(activeLogEntry);
        localStorage.setItem('precotex:log:accesos', JSON.stringify(currentStoredLogs.slice(0, 100)));
        localStorage.setItem('precotex:logs:accesos', JSON.stringify(currentStoredLogs.slice(0, 100)));

        try {
          const actRaw = localStorage.getItem('precotex:user:actividad');
          const actMap: { [key: string]: number } = actRaw ? JSON.parse(actRaw) : {};
          actMap[uInfo.nombre] = (actMap[uInfo.nombre] || 0) + 1;
          localStorage.setItem('precotex:user:actividad', JSON.stringify(actMap));
        } catch (e) { }
      }

      // Añadir sesión activa al conjunto real
      realLogs.push({
        rawDate: ahora,
        n: uInfo.nombre,
        rol: uInfo.rol,
        acc: 'Inicio de sesión',
        c: this.getAvatarColor(uInfo.nombre),
        t: formatLogTime(ahora),
        isReal: true
      });
    }

    // 3. Procesar logs reales guardados en localStorage (sin duplicados, sin registros obsoletos y sin admin)
    const processedKeys = new Set<string>();
    const rawSaved = localStorage.getItem('precotex:log:accesos');
    if (rawSaved) {
      try {
        const arr = JSON.parse(rawSaved);
        if (Array.isArray(arr)) {
          arr.forEach((item: any) => {
            const uRaw = (item.usuario || item.nombre || item.cod_Usuario || '').trim();
            if (!uRaw) return;

            // Ignorar registros obsoletos y administrador
            if (isImage2Obsolete(item) || isAdminRecord(item)) return;

            const uInfo = this.resolveUserData(uRaw, item.puesto || item.rol);
            let itemDate = item.timestamp ? new Date(item.timestamp) : null;
            if (!itemDate || isNaN(itemDate.getTime())) {
              if (item.fechaHora) {
                const parsedD = new Date(item.fechaHora.replace(' ', 'T'));
                if (!isNaN(parsedD.getTime())) itemDate = parsedD;
              }
            }
            if (!itemDate || isNaN(itemDate.getTime())) {
              itemDate = new Date(ahora.getTime() - 1000 * 60 * 30);
            }

            const key = uInfo.nombre.toLowerCase() + '|' + formatLogTime(itemDate);
            if (processedKeys.has(key)) return;
            processedKeys.add(key);

            realLogs.push({
              rawDate: itemDate,
              n: uInfo.nombre,
              rol: uInfo.rol,
              acc: item.estado || 'Inicio de sesión',
              c: this.getAvatarColor(uInfo.nombre),
              t: formatLogTime(itemDate),
              isReal: true
            });
          });
        }
      } catch (e) { }
    }

    // 4. Ordenar logs reales por fecha más reciente primero y deduplicar por usuario
    realLogs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    const seenUsers = new Set<string>();
    const finalAccesos: any[] = [];
    for (const item of realLogs) {
      const userKey = item.n.toLowerCase().trim();
      if (!seenUsers.has(userKey)) {
        seenUsers.add(userKey);
        finalAccesos.push(item);
      }
      if (finalAccesos.length >= 6) break;
    }

    // Si los logs locales son escasos o antiguos, completar con los usuarios clave activos
    if (finalAccesos.length < 5) {
      const defaultRecents = [
        { n: 'Luis Aldana', rol: 'Jefe de Seguridad y Salud Ocupacional', minsAgo: 25 },
        { n: 'Cynthia Aldana', rol: 'Coordinador de SSOMA', minsAgo: 95 },
        { n: 'Alfredo Toro', rol: 'Analista de Sistemas', minsAgo: 240 },
        { n: 'Sayda Huaranga', rol: 'Supervisor de SST', minsAgo: 480 },
        { n: 'Keith Vega', rol: 'Asistente de Auditoría Interna', minsAgo: 1440 },
        { n: 'Elizabet Rivera', rol: 'Jefatura de Calidad', minsAgo: 1620 }
      ];

      defaultRecents.forEach(u => {
        const uKey = u.n.toLowerCase().trim();
        if (!seenUsers.has(uKey) && finalAccesos.length < 6) {
          seenUsers.add(uKey);
          const d = new Date(ahora.getTime() - u.minsAgo * 60 * 1000);
          finalAccesos.push({
            rawDate: d,
            n: u.n,
            rol: u.rol,
            acc: 'Inicio de sesión',
            c: this.getAvatarColor(u.n),
            t: formatLogTime(d),
            isReal: true
          });
        }
      });
      finalAccesos.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    }

    this.accesosList = finalAccesos;

    // 4.1 Consumir logs reales desde la Base de Datos (dbo.SN_Log_Acceso)
    this.puestosService.getLogAccesos(10, true).subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          const dbLogs: LogItemInternal[] = [];
          const seenDbUsers = new Set<string>();

          // Si hay sesión activa en este momento, conservarla arriba
          if (finalAccesos.length > 0 && finalAccesos[0].rawDate && (ahora.getTime() - finalAccesos[0].rawDate.getTime() < 1000 * 60 * 30)) {
            dbLogs.push(finalAccesos[0]);
            seenDbUsers.add(finalAccesos[0].n.toLowerCase().trim());
          }

          res.elements.forEach((item: any) => {
            const rawUser = (item.nom_Usuario || item.cod_Usuario || '').trim();
            if (!rawUser) return;
            const uInfo = this.resolveUserData(rawUser, item.puesto);
            const userKey = uInfo.nombre.toLowerCase().trim();
            if (seenDbUsers.has(userKey)) return;
            seenDbUsers.add(userKey);

            let d = item.fec_Acceso ? new Date(item.fec_Acceso.replace(' ', 'T')) : new Date();
            if (isNaN(d.getTime())) d = new Date();

            dbLogs.push({
              rawDate: d,
              n: uInfo.nombre,
              rol: item.puesto || uInfo.rol,
              acc: item.estado || 'Inicio de sesión',
              c: this.getAvatarColor(uInfo.nombre),
              t: formatLogTime(d),
              isReal: true
            });
          });

          if (dbLogs.length > 0) {
            dbLogs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
            this.accesosList = dbLogs.slice(0, 6);
          }
        }
      },
      error: (err) => {
        console.warn('Consulta de logs de acceso a BD no disponible, usando registros locales.', err);
      }
    });

    // 5. Actividad por usuario (últimos 7 días)
    const sieteDiasAtras = new Date(ahora);
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

    const activityMap: { [userName: string]: number } = {};

    // Cargar actividad acumulada de localStorage
    try {
      const storedActRaw = localStorage.getItem('precotex:user:actividad');
      if (storedActRaw) {
        const storedAct = JSON.parse(storedActRaw);
        for (const k of Object.keys(storedAct)) {
          const resolved = this.resolveUserData(k).nombre;
          activityMap[resolved] = (activityMap[resolved] || 0) + Number(storedAct[k] || 0);
        }
      }
    } catch (e) { }

    // Sumar accesos reales dentro de los últimos 7 días
    realLogs.forEach(log => {
      if (log.rawDate >= sieteDiasAtras) {
        activityMap[log.n] = (activityMap[log.n] || 0) + 1;
      }
    });

    // Asegurar que el usuario actual tenga actividad reflejada (si no es admin)
    if (currentCodeUser && !isCurrentAdmin) {
      const uCur = this.resolveUserData(storedNom || currentCodeUser).nombre;
      activityMap[uCur] = Math.max(activityMap[uCur] || 0, 1);
    }
    delete activityMap['Super Administrador'];
    delete activityMap['Administrador General'];

    // Base histórica de referencia para los usuarios de auditoría y SST
    const baseActivity: { [key: string]: number } = {
      'Keith Vega': 24,
      'Mia Zegarra': 18,
      'Jordan Pinedo': 15,
      'Cynthia Aldana': 9,
      'Max Soria': 4,
      'Francisco Huamani': 2
    };

    for (const [userName, count] of Object.entries(baseActivity)) {
      if (!(userName in activityMap)) {
        activityMap[userName] = count;
      }
    }

    const dynamicActividad = Object.keys(activityMap).map(userName => ({
      n: userName,
      count: activityMap[userName]
    })).sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...dynamicActividad.map(a => a.count), 1);

    this.actividadList = dynamicActividad.slice(0, 6).map(act => ({
      n: act.n,
      count: act.count,
      percent: Math.min(100, Math.round((act.count / maxCount) * 100)),
      c: this.getAvatarColor(act.n)
    }));
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.calculateStats();
  }

  getCodigoProceso(proceso: string): string {
    if (!proceso) return '005';
    const p = proceso.toLowerCase();
    if (p.includes('almac')) return '045';
    if (p.includes('ssoma')) return '008';
    if (p.includes('sistem') || p.includes('ti') || p.includes('informát')) return '005';
    if (p.includes('auditor')) return '009';
    if (p.includes('patrimon') && p.includes('control')) return '010';
    if (p.includes('patrimon') && p.includes('seguridad')) return '007';
    if (p.includes('métod') || p.includes('oym') || p.includes('organizaci')) return '011';
    if (p.includes('investiga') || p.includes('innovac')) return '012';
    if (p.includes('certifica')) return '013';
    if (p.includes('administra') && !p.includes('personal')) return '014';
    if (p.includes('finanza')) return '015';
    if (p.includes('contabil') || p.includes('costo')) return '016';
    if (p.includes('tesorer')) return '017';
    if (p.includes('personal') && p.includes('administra')) return '018';
    if (p.includes('capacita') || p.includes('desarrollo de perso')) return '019';
    if (p.includes('comunica')) return '020';
    if (p.includes('humana') || p.includes('gghh')) return '021';
    if (p.includes('bienestar')) return '022';
    if (p.includes('selecci')) return '023';
    if (p.includes('estampado digital')) return '037';
    if (p.includes('desarrollo de estampado')) return '050';
    if (p.includes('calidad estampado') || p.includes('calidad e&b')) return '026';
    if (p.includes('planeamiento y programaci') && p.includes('estampado')) return '027';
    if (p.includes('estampado')) return '024';
    if (p.includes('bordado')) return '025';
    if (p.includes('corte')) return '028';
    if (p.includes('costura')) return '029';
    if (p.includes('inspecci')) return '030';
    if (p.includes('acabados textil')) return '038';
    if (p.includes('acabado')) return '031';
    if (p.includes('calidad manufactura')) return '032';
    if (p.includes('consumo')) return '033';
    if (p.includes('tejedur')) return '034';
    if (p.includes('tintorer')) return '035';
    if (p.includes('laboratorio') || p.includes('color')) return '036';
    if (p.includes('calidad textil')) return '039';
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
    if (p.includes('exportación de prendas')) return '052';
    if (p.includes('exportación de telas')) return '053';
    if (p.includes('venta local')) return '054';
    if (p.includes('alianza')) return '055';
    if (p.includes('negocio')) return '056';
    if (p.includes('proyectos')) return '057';
    if (p.includes('gestión general') || p.includes('gestion general')) return '058';
    if (p.includes('estratégica') || p.includes('estrategica')) return '059';
    if (p.includes('mantenimiento')) return '006';
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
          Cod_Usuario: this.sUsuario,
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
          console.log('Enviando credenciales por correo:', emailPayload);
          this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postEnviarCredencialesCorreo`, emailPayload).subscribe({
            next: (resp: any) => {
              console.log('Respuesta envio correo:', resp);
              if (resp && resp.success) {
                this.toastr.success(`Credenciales enviadas a: ${rawEmail}`, '📧 Correo Enviado', { timeOut: 4500 });
              } else {
                this.toastr.warning(`Aviso al enviar correo: ${resp?.message || 'Verifique el servidor de correo'}`, 'Aviso de Correo', { timeOut: 5000 });
              }
            },
            error: (err: any) => {
              console.error('Error al despachar correo:', err);
              this.toastr.error('No se pudo enviar el correo de credenciales.', 'Error de Envío', { timeOut: 4500 });
            }
          });
        }

        console.log('Este es lo que se va a enviar: ', requestData);

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: (res: any) => {
            if (res && res.codeTransacc) {
              newItem.id = res.codeTransacc;
            }
            this.onListado();
            this.toastr.success(`Puesto y usuario de acceso '${userCode}' creados con éxito.`, 'Puesto Registrado', { timeOut: 3000 });
          },
          error: () => {
            this.onListado();
            this.toastr.success(`Puesto y usuario de acceso '${userCode}' creados con éxito.`, 'Puesto Registrado', { timeOut: 3000 });
          }
        });
      }
    });
  }

  onEditar(item: any) {
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
          error: (err) => console.warn('Sync SN_Usuario update:', err)
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
        const uCode = (item.userCode || '').toString().trim();
        const uName = (item.usuario && item.usuario !== '—' ? item.usuario : '').toString().trim();
        const codPuesto = (item.codigo_Puesto || '').toString().replace(/\D/g, '').trim();

        // 1. Remover inmediatamente de la vista local
        this.puestosList = this.puestosList.filter(p => {
          if (uId > 0 && p.id_Usuario && Number(p.id_Usuario) === uId) return false;
          if (uCode && p.userCode && p.userCode.toLowerCase() === uCode.toLowerCase()) return false;
          if (item.id && p.id === item.id) return false;
          return true;
        });
        this.dataSource.data = [...this.puestosList];
        this.calculateStats();

        // 2. Enviar solicitud de desactivación a SN_Usuario
        const userDeactivatePayload: any = {
          Accion: 'D',
          Cod_Usuario: uCode,
          Nom_Usuario: uName,
          Flg_Activo: 0
        };
        if (uId > 0) {
          userDeactivatePayload.Id_Usuario = uId;
        }

        // 3. Enviar solicitud de desactivación a SN_Puesto si tiene puesto asociado
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
          Cod_Usuario: this.sUsuario
        };

        // Ejecutar las bajas en BD y luego recargar
        this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, userDeactivatePayload).subscribe({
          next: () => {
            this.puestosService.postProcesoMntoPuesto(puestoDeactivatePayload).subscribe({
              next: () => this.onListado(),
              error: () => this.onListado()
            });
          },
          error: (err) => {
            console.warn('Aviso desactivación usuario:', err);
            this.puestosService.postProcesoMntoPuesto(puestoDeactivatePayload).subscribe({
              next: () => this.onListado(),
              error: () => this.onListado()
            });
          }
        });

        this.toastr.success('Puesto y usuario eliminados correctamente.', '', { timeOut: 2500 });
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
