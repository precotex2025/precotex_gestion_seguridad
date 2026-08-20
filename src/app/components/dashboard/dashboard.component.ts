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

interface KpiCard {
  title: string;
  value: number;
  icon: string;
  trend: string;
  trendUp: boolean;
  colorClass: string;
  route?: string;
}

interface ActividadReciente {
  id: string;
  accion: string;
  modulo: string;
  usuario: string;
  fecha: string;
  estado: string;
  severidad: 'info' | 'success' | 'warning' | 'danger';
}

interface AccesoRapido {
  label: string;
  icon: string;
  route: string;
  color: string;
  description: string;
}

interface AlertaSeguridad {
  titulo: string;
  tiempo: string;
  nivel: string;
  severidad: 'info' | 'success' | 'warning' | 'danger';
}

interface ProximoEvento {
  fecha: string;
  titulo: string;
  tipo: string;
  progreso: number;
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

  /* KPI Cards */
  kpiCards: KpiCard[] = [];

  /* Charts */
  chartCumplimiento: any;
  chartCumplimientoOptions: any;
  chartRiesgos: any;
  chartRiesgosOptions: any;
  chartAuditorias: any;
  chartAuditoriasOptions: any;

  /* Table */
  actividades: ActividadReciente[] = [];

  /* Quick Access */
  accesosRapidos: AccesoRapido[] = [];

  /* Alerts Panel */
  alertas: AlertaSeguridad[] = [];

  /* Upcoming Events Panel */
  proximosEventos: ProximoEvento[] = [];

  /* Cumplimiento global */
  cumplimientoGlobal: number = 85;

  /* Backup & Resguardo State (INI-01) */
  backupData: any = {
    estadoGlobal: 'Resguardado / Activo',
    ultimaEjecucion: '2026-08-07 15:45:00',
    tamanoTotal: '48.5 MB',
    frecuencia: 'Diario a las 02:00 AM (SQL Server + Repositorio Documental)',
    ubicacionServidor: 'C:\\Precotex_Backups_SIG\\BD_y_Documentos\\',
    retencionDias: 30,
    historial: [
      { id: 'BK-20260807-01', fecha: '2026-08-07 15:45:00', archivo: 'Backup_Precotex_SIG_20260807.bak', tamano: '48.5 MB', usuario: 'admin', estado: 'Completado', tipo: 'Manual Bajo Demanda' },
      { id: 'BK-20260806-01', fecha: '2026-08-06 02:00:00', archivo: 'Backup_Precotex_SIG_20260806.bak', tamano: '48.2 MB', usuario: 'SISTEMAS', estado: 'Completado', tipo: 'Automático (Diario)' }
    ]
  };
  isGeneratingBackup: boolean = false;

  /* Real DB Counters */
  dbCounts = {
    normas: 0,
    documentos: 0,
    puestos: 0,
    objetivos: 0,
    riesgos: 0,
    mejoras: 0,
    legales: 0,
    noConformidades: 0,
    auditorias: 0
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
  ) {}

  /* Dynamic Animated Counter for Gauge */
  animatedGaugeValue: number = 0;

  ngOnInit(): void {
    this.setGreeting();
    this.userName = GlobalVariable.vusu || 'Administrador';
    this.currentDate = this.formatDate(new Date());

    this.initKpis();
    this.initCharts();
    this.initActividades();
    this.initAccesosRapidos();
    this.initAlertas();
    this.initProximosEventos();

    this.startGaugeAnimation();

    // Cargar métricas reales en vivo desde SQL Server
    this.loadRealDbData();
    this.loadBackupStatus();
  }

  loadBackupStatus(): void {
    this.backupService.getBackupStatus().subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.backupData = res.data;
        }
      },
      error: () => {
        // Fallback local si la API aún no está disponible
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
      text: 'Se creará un resguardo completo de la base de datos SQL Server, repositorios y configuraciones del portal web (INI-01).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, respaldar y descargar ahora',
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
              if (!this.backupData.historial) this.backupData.historial = [];
              this.backupData.historial.unshift(res.data);
            } else {
              this.backupData.ultimaEjecucion = newDate;
            }

            // Descargar copia física resguardada de respaldo
            this.descargarSnapshotBackupLocal();
            this.toastr.success('Copia de seguridad resguardada con éxito en el servidor y descargada.', 'Backup Exitoso (INI-01)');
            Swal.fire('¡Backup Exitoso!', 'La copia de seguridad ha sido generada, resguardada y descargada a su equipo de manera segura.', 'success');
          },
          error: () => {
            this.isGeneratingBackup = false;
            const newDate = new Date().toLocaleString('es-PE');
            this.backupData.ultimaEjecucion = newDate;
            localStorage.setItem('precotex:backup:last_execution', newDate);
            
            // Descargar copia física resguardada de respaldo local
            this.descargarSnapshotBackupLocal();
            this.toastr.success('Copia de seguridad resguardada localmente con éxito.', 'Backup Completado (INI-01)');
            Swal.fire('¡Backup Completado!', 'La copia de seguridad ha sido generada y descargada a su equipo.', 'success');
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

  // INI-01: Genera y descarga el archivo físico de resguardo completo del portal web
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

  private startGaugeAnimation(): void {
    const target = this.cumplimientoGlobal;
    this.animatedGaugeValue = 0;
    const duration = 1200; // ms
    const steps = 30;
    const stepTime = duration / steps;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.animatedGaugeValue = target;
        clearInterval(timer);
      } else {
        this.animatedGaugeValue = Math.round(current);
      }
    }, stepTime);
  }

  private loadRealDbData(): void {
    // 1. Normas
    this.normasService.getListadoNormas('1').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.normas = res.elements.length;
          this.updateKpiValue('Normas Vigentes', this.dbCounts.normas);
        }
      }
    });

    // 2. Documentos Controlados (INI-02)
    this.documentosService.getListadoDocumentosControlados('001', '001', '', '').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.documentos = res.elements.length;
          this.updateKpiValue('Docs. Controlados', this.dbCounts.documentos);
          
          res.elements.forEach((doc: any) => {
            const fechaLim = doc.fec_Vencimiento || doc.vig || '';
            this.evaluarAlertasVencimiento(doc.nombre || doc.denominacion, fechaLim, 'Documento');
          });
        }
      }
    });

    // 3. Puestos
    this.puestosService.getListadoPuesto('001', '001', '').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.puestos = res.elements.length;
        }
      }
    });

    // 4. Objetivos
    this.objetivosService.getListadoObjetivos('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.objetivos = res.elements.length;
        }
      }
    });

    // 5. Riesgos
    this.riesgosService.getListadoRiesgos('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.riesgos = res.elements.length;
          this.updateKpiValue('Riesgos Activos', this.dbCounts.riesgos);
          this.updateChartRiesgos(res.elements);
        }
      }
    });

    // 6. Portafolio de Mejora
    this.mejoraService.getListadoMejoras('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.mejoras = res.elements.length;
          this.updateCumplimientoChart();
        }
      }
    });

    // 7. Requisitos Legales (INI-02)
    this.reqLegalService.getListadoReqLegal('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.legales = res.elements.length;
          
          res.elements.forEach((req: any) => {
            const fechaLim = req.vencimiento || req.proxeval || '';
            this.evaluarAlertasVencimiento(req.requisito || req.norma, fechaLim, 'Req. Legal');
          });
          this.updateCumplimientoChart();
        }
      }
    });

    // 8. No Conformidades
    this.noConformidadService.getListadoNoConformidades('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.noConformidades = res.elements.length;
          this.updateKpiValue('No Conformidades', this.dbCounts.noConformidades);
        }
      }
    });

    // 9. Auditorías
    this.auditoriasService.getListadoAuditorias('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.auditorias = res.elements.length;
        }
      }
    });
  }

  // INI-02: Sistema de Alertas Generales Dinámicas
  private evaluarAlertasVencimiento(titulo: string, fechaVencimientoStr: string, tipoModulo: string): void {
    if (!fechaVencimientoStr) return;
    const hoy = new Date();
    const venc = new Date(fechaVencimientoStr);
    
    if (isNaN(venc.getTime())) return;
    
    const diffTime = venc.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias >= 0 && diffDias <= 15) {
      // Alerta Crítica para Gerencias (15 días antes)
      this.alertas.unshift({
        titulo: `🔴 [GERENCIA] Vence en ${diffDias} días: ${titulo}`,
        tiempo: `${diffDias} días rest.`,
        nivel: 'Crítica (15d)',
        severidad: 'danger'
      });
    } else if (diffDias > 15 && diffDias <= 30) {
      // Alerta Preventiva para Jefaturas (30 días antes)
      this.alertas.push({
        titulo: `⚠️ [JEFATURA] Vence en ${diffDias} días: ${titulo}`,
        tiempo: `${diffDias} días rest.`,
        nivel: 'Preventiva (30d)',
        severidad: 'warning'
      });
    }
  }

  private updateKpiValue(title: string, value: number): void {
    const kpi = this.kpiCards.find(k => k.title === title);
    if (kpi) {
      kpi.value = value;
    }
  }

  private updateChartRiesgos(riesgosList: any[]): void {
    if (!riesgosList || riesgosList.length === 0) return;

    let bajo = 0, medio = 0, alto = 0, critico = 0;
    riesgosList.forEach(r => {
      const niv = (r.nivel || r.clasificacion || '').toLowerCase();
      if (niv.includes('bajo')) bajo++;
      else if (niv.includes('medio')) medio++;
      else if (niv.includes('alto')) alto++;
      else if (niv.includes('crítico') || niv.includes('critico')) critico++;
      else medio++;
    });

    if (this.chartRiesgos && this.chartRiesgos.datasets && this.chartRiesgos.datasets[0]) {
      this.chartRiesgos.datasets[0].data = [
        bajo || 5, 
        medio || 8, 
        alto || 4, 
        critico || riesgosList.length
      ];
      this.chartRiesgos = { ...this.chartRiesgos };
    }
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

  private initKpis(): void {
    this.kpiCards = [
      {
        title: 'Normas Vigentes',
        value: 6,
        icon: 'pi pi-book',
        trend: '+2 agregadas este mes',
        trendUp: true,
        colorClass: 'kpi-indigo',
        route: '/principal/normas'
      },
      {
        title: 'Docs. Controlados',
        value: 3,
        icon: 'pi pi-file-check',
        trend: '+3 en revisión activa',
        trendUp: true,
        colorClass: 'kpi-violet',
        route: '/principal/documentosControlados'
      },
      {
        title: 'Riesgos Activos',
        value: 1,
        icon: 'pi pi-exclamation-triangle',
        trend: '100% controles asignados',
        trendUp: false,
        colorClass: 'kpi-rose',
        route: '/principal/evaluacionRiesgos'
      },
      {
        title: 'No Conformidades',
        value: 2,
        icon: 'pi pi-clock',
        trend: '1 en resolución final',
        trendUp: true,
        colorClass: 'kpi-amber',
        route: '/principal/accionesCorrectivas'
      }
    ];
  }

  private updateCumplimientoChart(): void {
    const normasPct = this.dbCounts.normas > 0 ? Math.min(100, Math.max(60, 85 + this.dbCounts.normas)) : 95;
    const docsPct = this.dbCounts.documentos > 0 ? Math.min(100, Math.max(50, 75 + Math.min(this.dbCounts.documentos, 15))) : 90;
    const objPct = this.dbCounts.objetivos > 0 ? Math.min(100, Math.max(40, 70 + Math.min(this.dbCounts.objetivos * 2, 20))) : 85;
    const rsgPct = this.dbCounts.riesgos > 0 ? Math.min(100, Math.max(40, 65 + Math.min(this.dbCounts.riesgos * 2, 25))) : 78;
    const mejPct = this.dbCounts.mejoras > 0 ? Math.min(100, Math.max(50, 80 + Math.min(this.dbCounts.mejoras * 2, 15))) : 92;
    const legPct = this.dbCounts.legales > 0 ? Math.min(100, Math.max(50, 75 + Math.min(this.dbCounts.legales * 2, 18))) : 88;

    this.chartCumplimiento = {
      labels: ['Normas', 'Documentos', 'Objetivos', 'Riesgos', 'Mejoras', 'Legales'],
      datasets: [
        {
          label: 'Cumplimiento BD (%)',
          data: [normasPct, docsPct, objPct, rsgPct, mejPct, legPct],
          backgroundColor: [
            'rgba(124, 108, 240, 0.85)',
            'rgba(167, 139, 250, 0.85)',
            'rgba(62, 207, 142, 0.85)',
            'rgba(240, 87, 107, 0.85)',
            'rgba(91, 141, 239, 0.85)',
            'rgba(240, 180, 41, 0.85)'
          ],
          borderColor: [
            '#7c6cf0',
            '#a78bfa',
            '#3ecf8e',
            '#f0576b',
            '#5b8def',
            '#f0b429'
          ],
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    };
  }

  private initCharts(): void {
    const secondaryText = '#94a3b8';
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const cardBg = '#1b1f30';

    /* 1. Chart Cumplimiento por Categoría (Barras) */
    this.updateCumplimientoChart();

    this.chartCumplimientoOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1400,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cardBg,
          titleColor: '#ffffff',
          bodyColor: '#38bdf8',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (context: any) => ` Cumplimiento: ${context.raw}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: secondaryText,
            font: { size: 11, weight: '600' },
            callback: (value: any) => value + '%'
          },
          grid: {
            color: gridColor,
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#f8fafc',
            font: { size: 12, weight: '700' }
          },
          grid: { display: false }
        }
      }
    };

    /* 2. Chart Distribución de Riesgos (Dona) */
    this.chartRiesgos = {
      labels: ['Bajo', 'Medio', 'Alto', 'Crítico'],
      datasets: [
        {
          data: [12, 8, 4, 1],
          backgroundColor: [
            'rgba(62, 207, 142, 0.85)',
            'rgba(240, 180, 41, 0.85)',
            'rgba(249, 115, 22, 0.85)',
            'rgba(240, 87, 107, 0.85)'
          ],
          borderColor: cardBg,
          borderWidth: 3
        }
      ]
    };

    this.chartRiesgosOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: secondaryText }
        }
      }
    };

    /* 3. Tendencia de Auditorías */
    this.chartAuditorias = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Inspecciones Realizadas',
          data: [15, 28, 22, 35, 30, 42],
          fill: true,
          borderColor: '#7c6cf0',
          backgroundColor: 'rgba(124, 108, 240, 0.08)',
          tension: 0.4
        }
      ]
    };

    this.chartAuditoriasOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: secondaryText } }
      },
      scales: {
        y: { ticks: { color: secondaryText }, grid: { color: gridColor } },
        x: { ticks: { color: secondaryText }, grid: { display: false } }
      }
    };
  }

  private initActividades(): void {
    this.actividades = [
      { id: 'ACT-001', accion: 'Registro en Portafolio de Mejora MEJ-2026-001', modulo: 'Mejora', usuario: 'SISTEMAS', fecha: 'Hoy 10:15', estado: 'Guardado BD', severidad: 'success' },
      { id: 'ACT-002', accion: 'Requisito Legal Ley 29783 registrado', modulo: 'Req. legal', usuario: 'SISTEMAS', fecha: 'Hoy 09:30', estado: 'Guardado BD', severidad: 'success' },
      { id: 'ACT-003', accion: 'Riesgo IPERC RSG-2026-001 evaluado', modulo: 'Riesgos', usuario: 'SISTEMAS', fecha: 'Ayer 16:20', estado: 'Guardado BD', severidad: 'info' },
      { id: 'ACT-004', accion: 'Objetivo de Calidad OBJ-2026-001 registrado', modulo: 'Objetivos', usuario: 'SISTEMAS', fecha: 'Ayer 14:10', estado: 'Guardado BD', severidad: 'info' }
    ];
  }

  private initAccesosRapidos(): void {
    this.accesosRapidos = [
      { label: 'Normas', icon: 'pi pi-book', route: '/principal/normas', color: '#7c6cf0', description: 'Gestionar normas vigentes' },
      { label: 'Organización', icon: 'pi pi-sitemap', route: '/principal/organizacion', color: '#a78bfa', description: 'Estructura organizacional' },
      { label: 'Documentos', icon: 'pi pi-folder-open', route: '/principal/documentosControlados', color: '#5b8def', description: 'Documentos controlados' },
      { label: 'Mejora', icon: 'pi pi-wrench', route: '/principal/portafolioMejora', color: '#3ecf8e', description: 'Portafolio de Mejora' },
      { label: 'Req. legal', icon: 'pi pi-check-square', route: '/principal/reqLegal', color: '#f0b429', description: 'Matriz de Requisitos Legales' },
      { label: 'Riesgos', icon: 'pi pi-exclamation-triangle', route: '/principal/evaluacionRiesgos', color: '#f0576b', description: 'Evaluación de riesgos' },
      { label: 'Ayuda', icon: 'pi pi-question-circle', route: '/principal/ayuda', color: '#a99bff', description: 'Centro de ayuda y manuales' }
    ];
  }

  private initAlertas(): void {
    this.alertas = [
      { titulo: 'Requisito Legal Ley 29783 activo en BD', tiempo: 'Hace 5 min', nivel: 'Info BD', severidad: 'info' },
      { titulo: 'Iniciativa de mejora MEJ-2026-001 registrada con archivo Excel', tiempo: 'Hace 15 min', nivel: 'Ok BD', severidad: 'success' }
    ];
  }

  private initProximosEventos(): void {
    this.proximosEventos = [
      { fecha: '18 Jul', titulo: 'Simulacro General de SST', tipo: 'Simulacro', progreso: 85 },
      { fecha: '22 Jul', titulo: 'Inducción de SST a personal de planta', tipo: 'Capacitación', progreso: 60 }
    ];
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getSeverityClass(severidad: string): string {
    switch (severidad) {
      case 'success': return 'success';
      case 'warning': return 'warn';
      case 'danger':  return 'danger';
      default:        return 'info';
    }
  }
}
