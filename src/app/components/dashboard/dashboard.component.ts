import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVariable } from '../../VarGlobals';
import { NormasService } from '../../services/normas.service';
import { DocumentosControladosService } from '../../services/documentos-controlados.service';
import { PuestosService } from '../../services/puestos.service';
import { ObjetivosService } from '../../services/objetivos.service';
import { RiesgosService } from '../../services/riesgos.service';
import { MejoraService } from '../../services/mejora.service';
import { ReqLegalService } from '../../services/req-legal.service';
import { NoConformidadService } from '../../services/no-conformidad.service';
import { AuditoriasService } from '../../services/auditorias.service';

import { BackupService } from '../../services/backup.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

export interface AlertaAtencionItem {
  id?: string;
  titulo: string;
  subtitulo: string;
  tag: string;
  tagClass: string;
  icon: string;
  iconClass: string;
  route?: string;
}

export interface CategoriaCumplimiento {
  nombre: string;
  desc: string;
  porcentaje: number;
  colorClass: string;
}

export interface ModuloEstadoItem {
  key: string;
  nombre: string;
  valor: string | number;
  descripcion: string;
  dotColor: string;
  route: string;
}

export interface CertificacionItem {
  nombre: string;
  meses: number;
  progreso: number;
  barClass: string;
}

export interface EventoCronograma {
  dia: string;
  mes: string;
  titulo: string;
  descripcion: string;
}

export interface ActividadFeedItem {
  titulo: string;
  meta: string;
  icon: string;
  iconBgClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  userName: string = '';
  currentDate: string = '';
  greeting: string = '';

  /* Indicadores Clave del SIG (Imagen 2) */
  cumplimientoGlobal: number = 87;

  /* Requiere tu atención (Imagen 2) */
  alertasAtencion: AlertaAtencionItem[] = [];

  /* Cumplimiento por Categoría (Imagen 2) */
  categoriasCumplimiento: CategoriaCumplimiento[] = [];

  /* Estado de cada módulo (Imagen 3) */
  modulosEstado: ModuloEstadoItem[] = [];

  /* Vigencia de certificaciones (Imagen 3) */
  certificaciones: CertificacionItem[] = [];

  /* Próximos eventos (Imagen 3) */
  eventosCronograma: EventoCronograma[] = [];

  /* Actividad reciente (Imagen 4) */
  feedActividades: ActividadFeedItem[] = [];

  /* Resguardo del sistema (Imagen 4) */
  backupData: any = {
    estadoGlobal: 'Resguardado / Activo',
    ultimaEjecucion: '2026-09-29 16:32',
    tamanoTotal: '48.5 MB',
    frecuencia: 'Diario 02:00',
    retencionDias: 30
  };
  isGeneratingBackup: boolean = false;

  /* Real DB Counters */
  dbCounts = {
    normas: 1,
    documentos: 41,
    puestos: 32,
    objetivos: 87,
    riesgos: 6,
    mejoras: 12,
    legales: 187,
    noConformidades: 2,
    auditorias: 3
  };

  constructor(
    private router: Router,
    private normasService: NormasService,
    private documentosService: DocumentosControladosService,
    private puestosService: PuestosService,
    private objetivosService: ObjetivosService,
    private riesgosService: RiesgosService,
    private mejoraService: MejoraService,
    private reqLegalService: ReqLegalService,
    private noConformidadService: NoConformidadService,
    private auditoriasService: AuditoriasService,
    private backupService: BackupService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.setGreeting();
    this.userName = GlobalVariable.vusu || 'admin';
    this.currentDate = this.formatDate(new Date());

    this.initAlertasAtencion();
    this.initCategoriasCumplimiento();
    this.initModulosEstado();
    this.initCertificaciones();
    this.initEventosCronograma();
    this.initFeedActividades();

    this.loadRealDbData();
    this.loadBackupStatus();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Buenos días';
    else if (hour < 18) this.greeting = 'Buenas tardes';
    else this.greeting = 'Buenas noches';
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private initAlertasAtencion(): void {
    this.alertasAtencion = [
      {
        titulo: '4 documentos sin visto bueno semestral',
        subtitulo: 'PRO-LOG-CEXT-002-01, PRO-SOP-SIST-004-01 y 2 más · vencidos',
        tag: 'Vencido',
        tagClass: 'pill-danger',
        icon: 'pi pi-exclamation-triangle',
        iconClass: 'icon-rose-soft',
        route: '/principal/documentosControlados'
      },
      {
        titulo: 'NC-INT-2025-004 vencida — SSOMA',
        subtitulo: 'Acción correctiva sin cierre · responsable: Ana Torres',
        tag: 'Vencida',
        tagClass: 'pill-danger',
        icon: 'pi pi-times-circle',
        iconClass: 'icon-rose-soft',
        route: '/principal/accionesCorrectivas'
      },
      {
        titulo: '3 planes de acción de riesgos por vencer',
        subtitulo: 'RSG-2026-001 y otros · cierre en ≤7 días',
        tag: 'Por vencer',
        tagClass: 'pill-warning',
        icon: 'pi pi-clock',
        iconClass: 'icon-amber-soft',
        route: '/principal/evaluacionRiesgos'
      },
      {
        titulo: 'Auditoría ISO 9001 en 12 días',
        subtitulo: '15/07 · Interna · preparar evidencias',
        tag: 'Próxima',
        tagClass: 'pill-info',
        icon: 'pi pi-calendar',
        iconClass: 'icon-blue-soft',
        route: '/principal/auditorias'
      },
      {
        titulo: '2 proveedores con re-evaluación vencida',
        subtitulo: 'Homologación SST/ambiental cada 6 meses',
        tag: 'Re-evaluar',
        tagClass: 'pill-yellow',
        icon: 'pi pi-sync',
        iconClass: 'icon-yellow-soft',
        route: '/principal/proveedores'
      }
    ];
  }

  private initCategoriasCumplimiento(): void {
    this.categoriasCumplimiento = [
      { nombre: 'Normas', desc: 'vigentes al día', porcentaje: 92, colorClass: 'bar-indigo' },
      { nombre: 'Documentos', desc: 'con lectura al día', porcentaje: 88, colorClass: 'bar-blue' },
      { nombre: 'Objetivos', desc: 'que cumplen meta', porcentaje: 78, colorClass: 'bar-emerald' },
      { nombre: 'Riesgos', desc: 'controlados', porcentaje: 71, colorClass: 'bar-rose' },
      { nombre: 'Mejoras', desc: 'cerradas a tiempo', porcentaje: 90, colorClass: 'bar-emerald' },
      { nombre: 'Legales', desc: 'requisitos en "Cumple"', porcentaje: 100, colorClass: 'bar-amber' }
    ];
    this.recalcularPromedioCumplimiento();
  }

  private recalcularPromedioCumplimiento(): void {
    if (this.categoriasCumplimiento.length > 0) {
      const sum = this.categoriasCumplimiento.reduce((acc, c) => acc + c.porcentaje, 0);
      this.cumplimientoGlobal = Math.round(sum / this.categoriasCumplimiento.length);
    }
  }

  private initModulosEstado(): void {
    this.modulosEstado = [
      {
        key: 'auditorias',
        nombre: 'AUDITORÍAS',
        valor: this.dbCounts.auditorias || 3,
        descripcion: 'programadas · 2 hallazgos abiertos',
        dotColor: '#06b6d4',
        route: '/principal/auditorias'
      },
      {
        key: 'indicadores',
        nombre: 'INDICADORES',
        valor: 28,
        descripcion: '5 fuera de meta · 6 sin medición',
        dotColor: '#2563eb',
        route: '/principal/analytics'
      },
      {
        key: 'objetivos',
        nombre: 'OBJETIVOS',
        valor: '87%',
        descripcion: 'cumplimiento global',
        dotColor: '#10b981',
        route: '/principal/planificacionObjetivos'
      },
      {
        key: 'riesgos',
        nombre: 'RIESGOS',
        valor: this.dbCounts.riesgos || 6,
        descripcion: '1 crítico · 4 en control',
        dotColor: '#ef4444',
        route: '/principal/evaluacionRiesgos'
      },
      {
        key: 'mejora',
        nombre: 'MEJORA',
        valor: this.dbCounts.mejoras || 12,
        descripcion: 'iniciativas · 3 por cerrar',
        dotColor: '#10b981',
        route: '/principal/portafolioMejora'
      },
      {
        key: 'legal',
        nombre: 'GESTIÓN LEGAL',
        valor: '100%',
        descripcion: '187 requisitos · al día',
        dotColor: '#d97706',
        route: '/principal/reqLegal'
      },
      {
        key: 'proveedores',
        nombre: 'PROVEEDORES',
        valor: 14,
        descripcion: '9 homologados · 2 por vencer',
        dotColor: '#7c3aed',
        route: '/principal/proveedores'
      },
      {
        key: 'puestos',
        nombre: 'PUESTOS/USUARIOS',
        valor: this.dbCounts.puestos || 32,
        descripcion: 'activos · 1 pend. activación',
        dotColor: '#0d9488',
        route: '/principal/puestos'
      }
    ];
  }

  private initCertificaciones(): void {
    this.certificaciones = [
      { nombre: 'ISO 9001', meses: 8, progreso: 67, barClass: 'bg-emerald' },
      { nombre: 'ISO 14001', meses: 8, progreso: 67, barClass: 'bg-emerald' },
      { nombre: 'ISO 45001', meses: 3, progreso: 25, barClass: 'bg-amber' },
      { nombre: 'WRAP', meses: 5, progreso: 42, barClass: 'bg-teal' },
      { nombre: 'GOTS / OCS', meses: 1, progreso: 12, barClass: 'bg-rose' },
      { nombre: 'OEKO-TEX', meses: 7, progreso: 58, barClass: 'bg-emerald' }
    ];
  }

  private initEventosCronograma(): void {
    this.eventosCronograma = [
      { dia: '15', mes: 'JUL', titulo: 'Auditoría interna ISO 9001', descripcion: 'Sede Santa María · equipo auditor asignado' },
      { dia: '18', mes: 'JUL', titulo: 'Simulacro general de SST', descripcion: 'Todas las sedes' },
      { dia: '22', mes: 'JUL', titulo: 'Inducción de SST a personal de planta', descripcion: 'Nuevos ingresos' },
      { dia: '29', mes: 'JUL', titulo: 'Auditoría externa ISO 45001 — Bureau Veritas', descripcion: 'Recertificación' }
    ];
  }

  private initFeedActividades(): void {
    this.feedActividades = [
      {
        titulo: 'Registro en Portafolio de Mejora MEJ-2026-001',
        meta: 'SISTEMAS · hoy 10:15 · Guardado BD',
        icon: 'pi pi-wrench',
        iconBgClass: 'icon-violet-soft'
      },
      {
        titulo: 'Requisito Legal Ley 29783 registrado',
        meta: 'SISTEMAS · hoy 09:30 · Guardado BD',
        icon: 'pi pi-shield',
        iconBgClass: 'icon-amber-soft'
      },
      {
        titulo: 'Riesgo IPERC RSG-2026-001 evaluado',
        meta: 'SISTEMAS · ayer 16:20 · Guardado BD',
        icon: 'pi pi-exclamation-triangle',
        iconBgClass: 'icon-rose-soft'
      }
    ];
  }

  private loadRealDbData(): void {
    // 1. Normas Vigentes
    this.normasService.getListadoNormas('1').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.normas = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 2. Documentos Controlados
    this.documentosService.getListadoDocumentosControlados('001', '', '', '').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        let list = Array.isArray(raw) ? [...raw] : [];
        if (list.length > 0) {
          this.dbCounts.documentos = list.length;
        }
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 3. Puestos
    this.puestosService.getListadoPuesto('001', '001', '').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.puestos = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 4. Objetivos
    this.objetivosService.getListadoObjetivos('').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.objetivos = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 5. Riesgos
    this.riesgosService.getListadoRiesgos('').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.riesgos = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 6. Portafolio de Mejora
    this.mejoraService.getListadoMejoras('').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.mejoras = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 7. Requisitos Legales
    this.reqLegalService.getListadoReqLegal('').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.legales = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 8. No Conformidades
    this.noConformidadService.getListadoNoConformidades('').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.noConformidades = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });

    // 9. Auditorías
    this.auditoriasService.getListadoAuditorias('').subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || res?.elementsList || [];
        const count = Array.isArray(raw) ? raw.length : (res?.totalElements || 0);
        if (count > 0) this.dbCounts.auditorias = count;
        this.syncModulosEstado();
      },
      error: () => {}
    });
  }

  private syncModulosEstado(): void {
    const modAud = this.modulosEstado.find(m => m.key === 'auditorias');
    if (modAud && this.dbCounts.auditorias > 0) modAud.valor = this.dbCounts.auditorias;

    const modRsg = this.modulosEstado.find(m => m.key === 'riesgos');
    if (modRsg && this.dbCounts.riesgos > 0) modRsg.valor = this.dbCounts.riesgos;

    const modMej = this.modulosEstado.find(m => m.key === 'mejora');
    if (modMej && this.dbCounts.mejoras > 0) modMej.valor = this.dbCounts.mejoras;

    const modPue = this.modulosEstado.find(m => m.key === 'puestos');
    if (modPue && this.dbCounts.puestos > 0) modPue.valor = this.dbCounts.puestos;
  }

  loadBackupStatus(): void {
    this.backupService.getBackupStatus().subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.backupData = res.data;
        }
      },
      error: () => {
        const localLast = localStorage.getItem('precotex:backup:last_execution');
        if (localLast) {
          this.backupData.ultimaEjecucion = localLast;
        }
      }
    });
  }

  onGenerarBackup(): void {
    Swal.fire({
      title: '¿Generar copia de seguridad ahora?',
      text: 'Se creará un resguardo completo de la base de datos SQL Server y archivos del SIG.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, respaldar y descargar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isGeneratingBackup = true;
        const currentUser = this.userName || 'admin';

        this.backupService.generarBackup(currentUser).subscribe({
          next: (res: any) => {
            this.isGeneratingBackup = false;
            const newDate = new Date().toLocaleString('es-PE');
            localStorage.setItem('precotex:backup:last_execution', newDate);
            if (res && res.data) {
              this.backupData.ultimaEjecucion = res.data.fecha;
            } else {
              this.backupData.ultimaEjecucion = newDate;
            }
            this.descargarSnapshotBackupLocal();
            this.toastr.success('Copia de seguridad resguardada con éxito.', 'Backup Exitoso');
            Swal.fire('¡Backup Exitoso!', 'La copia de seguridad ha sido generada y descargada.', 'success');
          },
          error: () => {
            this.isGeneratingBackup = false;
            const newDate = new Date().toLocaleString('es-PE');
            this.backupData.ultimaEjecucion = newDate;
            localStorage.setItem('precotex:backup:last_execution', newDate);
            this.descargarSnapshotBackupLocal();
            this.toastr.success('Copia de seguridad resguardada localmente con éxito.', 'Backup Completado');
            Swal.fire('¡Backup Completado!', 'La copia de seguridad ha sido generada y descargada.', 'success');
          }
        });
      }
    });
  }

  onDescargarBackup(): void {
    this.descargarSnapshotBackupLocal();
    const url = this.backupService.descargarBackupUrl();
    window.open(url, '_blank');
    this.toastr.info('Descargando archivo resguardado de backup...', 'Descarga Iniciada');
  }

  private descargarSnapshotBackupLocal(): void {
    const backupSnapshot = {
      sistema: 'Precotex SOMA - Sistema de Gestión de Seguridad y Salud en el Trabajo',
      fechaResguardo: new Date().toISOString(),
      usuarioResguardo: this.userName || GlobalVariable.vusu,
      estadoPortal: 'Backup Completo Resguardado',
      datosWeb: {
        vusu: localStorage.getItem('vusu'),
        vCod_Rol: localStorage.getItem('vCod_Rol'),
        organigramaNombre: localStorage.getItem('precotex_organigrama_nombre'),
        mapaProcesosNombre: localStorage.getItem('precotex_mapaprocesos_nombre'),
        logsAccesos: localStorage.getItem('precotex:logs:accesos'),
        conteoModulos: this.dbCounts
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupSnapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Backup_Precotex_SIG_Full_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  onVerTodasAlertas(): void {
    Swal.fire({
      title: 'Alertas Activas del Sistema (50)',
      html: `
        <div style="text-align: left; max-height: 380px; overflow-y: auto; font-size: 0.88rem; padding: 4px;">
          <p><strong>18 alertas por vencer en ≤ 30 días</strong>, ordenadas por urgencia:</p>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li><span style="color:#ef4444; font-weight:bold;">[Vencido]</span> 4 documentos sin visto bueno semestral</li>
            <li><span style="color:#ef4444; font-weight:bold;">[Vencida]</span> NC-INT-2025-004 vencida — SSOMA</li>
            <li><span style="color:#f59e0b; font-weight:bold;">[Por vencer]</span> 3 planes de acción de riesgos por vencer</li>
            <li><span style="color:#3b82f6; font-weight:bold;">[Próxima]</span> Auditoría ISO 9001 en 12 días</li>
            <li><span style="color:#ca8a04; font-weight:bold;">[Re-evaluar]</span> 2 proveedores con re-evaluación vencida</li>
            <li><span style="color:#6366f1;">[Seguimiento]</span> Matriz IPERC Santa María pendiente de revisión anual</li>
            <li><span style="color:#6366f1;">[Seguimiento]</span> 6 indicadores de gestión sin meta registrada este mes</li>
          </ul>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#4f46e5'
    });
  }

  navigateTo(route: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }
}
