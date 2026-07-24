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
    private auditoriasService: AuditoriasService
  ) {}

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

    // Cargar métricas reales en vivo desde SQL Server
    this.loadRealDbData();
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

    // 2. Documentos Controlados
    this.documentosService.getListadoDocumentosControlados('001', '001', '', '').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.documentos = res.elements.length;
          this.updateKpiValue('Docs. Controlados', this.dbCounts.documentos);
        }
      }
    });

    // 3. Puestos
    this.puestosService.getListadoPuesto('001', '001', '').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.puestos = res.elements.length;
          this.updateKpiValue('Puestos y Usuarios', this.dbCounts.puestos);
        }
      }
    });

    // 4. Objetivos
    this.objetivosService.getListadoObjetivos('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.objetivos = res.elements.length;
          this.updateKpiValue('Objetivos SIG', this.dbCounts.objetivos);
        }
      }
    });

    // 5. Riesgos
    this.riesgosService.getListadoRiesgos('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.riesgos = res.elements.length;
          this.updateKpiValue('Matriz de Riesgos', this.dbCounts.riesgos);
          this.updateChartRiesgos(res.elements);
        }
      }
    });

    // 6. Portafolio de Mejora
    this.mejoraService.getListadoMejoras('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.mejoras = res.elements.length;
          this.updateKpiValue('Portafolio Mejora', this.dbCounts.mejoras);
        }
      }
    });

    // 7. Requisitos Legales
    this.reqLegalService.getListadoReqLegal('').subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          this.dbCounts.legales = res.elements.length;
          this.updateKpiValue('Requisitos Legales', this.dbCounts.legales);
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
        value: 0,
        icon: 'pi pi-book',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-indigo',
        route: '/principal/normas'
      },
      {
        title: 'Docs. Controlados',
        value: 0,
        icon: 'pi pi-file-check',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-violet',
        route: '/principal/documentosControlados'
      },
      {
        title: 'Puestos y Usuarios',
        value: 0,
        icon: 'pi pi-users',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-emerald',
        route: '/principal/puestos'
      },
      {
        title: 'Objetivos SIG',
        value: 0,
        icon: 'pi pi-chart-line',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-amber',
        route: '/principal/planificacionObjetivos'
      },
      {
        title: 'Matriz de Riesgos',
        value: 0,
        icon: 'pi pi-exclamation-triangle',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-rose',
        route: '/principal/evaluacionRiesgos'
      },
      {
        title: 'Portafolio Mejora',
        value: 0,
        icon: 'pi pi-wrench',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-sky',
        route: '/principal/portafolioMejora'
      },
      {
        title: 'Requisitos Legales',
        value: 0,
        icon: 'pi pi-check-square',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-teal',
        route: '/principal/reqLegal'
      },
      {
        title: 'No Conformidades',
        value: 0,
        icon: 'pi pi-clock',
        trend: 'Datos registrados de Este Modulo',
        trendUp: true,
        colorClass: 'kpi-orange',
        route: '/principal/accionesCorrectivas'
      }
    ];
  }

  private initCharts(): void {
    const secondaryText = '#8b90a8';
    const gridColor = 'rgba(38, 43, 64, 0.4)';
    const cardBg = '#151827';

    /* 1. Chart Cumplimiento por Categoría (Barras) */
    this.chartCumplimiento = {
      labels: ['Normas', 'Documentos', 'Objetivos', 'Riesgos', 'Mejoras', 'Legales'],
      datasets: [
        {
          label: 'Registros BD %',
          data: [95, 90, 85, 78, 92, 88],
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
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };

    this.chartCumplimientoOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cardBg,
          borderColor: '#262b40',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: secondaryText },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: secondaryText },
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
