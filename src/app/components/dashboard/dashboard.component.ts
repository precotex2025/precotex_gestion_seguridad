import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVariable } from '../../VarGlobals';

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
  cumplimientoGlobal: number = 78;

  constructor(private router: Router) {}

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
        value: 12,
        icon: 'pi pi-book',
        trend: '+2 este mes',
        trendUp: true,
        colorClass: 'kpi-indigo',
        route: '/principal/normas'
      },
      {
        title: 'Docs. Controlados',
        value: 48,
        icon: 'pi pi-file-check',
        trend: '+5 esta semana',
        trendUp: true,
        colorClass: 'kpi-violet',
        route: '/principal/documentosControlados'
      },
      {
        title: 'Usuarios Activos',
        value: 156,
        icon: 'pi pi-users',
        trend: '+12 nuevos',
        trendUp: true,
        colorClass: 'kpi-emerald',
        route: '/principal/usuariosPersonas'
      },
      {
        title: 'Objetivos en Progreso',
        value: 8,
        icon: 'pi pi-chart-line',
        trend: '3 próximos a vencer',
        trendUp: false,
        colorClass: 'kpi-amber',
        route: '/principal/planificacionObjetivos'
      },
      {
        title: 'Riesgos Críticos',
        value: 3,
        icon: 'pi pi-exclamation-triangle',
        trend: '-1 vs mes anterior',
        trendUp: true,
        colorClass: 'kpi-rose',
        route: '/principal/evaluacionRiesgos'
      },
      {
        title: 'Acciones Correctivas',
        value: 7,
        icon: 'pi pi-wrench',
        trend: '2 pendientes',
        trendUp: false,
        colorClass: 'kpi-sky',
        route: '/principal/accionesCorrectivas'
      },
      {
        title: 'Registros Pendientes',
        value: 15,
        icon: 'pi pi-clock',
        trend: '+3 hoy',
        trendUp: false,
        colorClass: 'kpi-orange',
        route: '/principal/registrosPendientes'
      },
      {
        title: 'Evaluaciones',
        value: 24,
        icon: 'pi pi-check-square',
        trend: '100% completadas',
        trendUp: true,
        colorClass: 'kpi-teal',
        route: '/principal/evaluacionesPuntuales'
      }
    ];
  }

  private initCharts(): void {
    /* 1. Chart Cumplimiento por Categoría (Barras) */
    this.chartCumplimiento = {
      labels: ['Normas', 'Documentos', 'Objetivos', 'Riesgos', 'Formación', 'Accesos'],
      datasets: [
        {
          label: 'Cumplimiento %',
          data: [92, 85, 78, 70, 88, 95],
          backgroundColor: [
            'rgba(79, 70, 229, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(244, 63, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            'rgba(79, 70, 229, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(244, 63, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)'
          ],
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    };

    this.chartCumplimientoOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1800,
        easing: 'easeOutElastic'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'Inter', size: 13, weight: '600' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx: any) => ` ${ctx.parsed.y}% cumplimiento`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#94a3b8',
            callback: (val: number) => val + '%'
          },
          grid: { color: 'rgba(226, 232, 240, 0.6)' }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#64748b'
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
          data: [18, 12, 6, 3],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(249, 115, 22, 0.85)',
            'rgba(244, 63, 94, 0.85)'
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8
        }
      ]
    };

    this.chartRiesgosOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      animation: {
        duration: 2000,
        easing: 'easeOutBack'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { family: 'Inter', size: 11, weight: '500' },
            color: '#475569'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'Inter', size: 13, weight: '600' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} riesgos`
          }
        }
      }
    };

    /* 3. NEW Chart: Tendencia de Inspecciones y Auditorías (Líneas) */
    this.chartAuditorias = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Inspecciones Realizadas',
          data: [15, 28, 22, 35, 30, 42],
          fill: true,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#4f46e5',
          pointHoverRadius: 7
        },
        {
          label: 'Auditorías Planificadas',
          data: [5, 12, 8, 15, 10, 18],
          fill: false,
          borderColor: '#8b5cf6',
          borderDash: [5, 5],
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#8b5cf6',
          pointHoverRadius: 6
        }
      ]
    };

    this.chartAuditoriasOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1600,
        easing: 'easeOutCubic'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            font: { family: 'Inter', size: 11, weight: '500' },
            color: '#64748b'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'Inter', size: 13, weight: '600' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#94a3b8'
          },
          grid: { color: 'rgba(226, 232, 240, 0.6)' }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#64748b'
          },
          grid: { display: false }
        }
      }
    };
  }

  private initActividades(): void {
    this.actividades = [
      { id: 'ACT-001', accion: 'Norma ISO 45001 actualizada', modulo: 'Normas', usuario: 'fhuamani', fecha: '2026-07-13 09:15', estado: 'Completado', severidad: 'success' },
      { id: 'ACT-002', accion: 'Nuevo documento de procedimiento cargado', modulo: 'Documentos', usuario: 'admin', fecha: '2026-07-13 08:42', estado: 'Pendiente', severidad: 'warning' },
      { id: 'ACT-003', accion: 'Evaluación de riesgo área producción', modulo: 'Riesgos', usuario: 'jperez', fecha: '2026-07-12 16:30', estado: 'En revisión', severidad: 'info' },
      { id: 'ACT-004', accion: 'Acción correctiva #AC-012 cerrada', modulo: 'Acciones', usuario: 'mlopez', fecha: '2026-07-12 14:20', estado: 'Completado', severidad: 'success' },
      { id: 'ACT-005', accion: 'Alerta: Objetivo OBJ-005 próximo a vencer', modulo: 'Objetivos', usuario: 'sistema', fecha: '2026-07-12 10:00', estado: 'Urgente', severidad: 'danger' },
      { id: 'ACT-006', accion: 'Capacitación EPP registrada', modulo: 'Campus', usuario: 'cgomez', fecha: '2026-07-11 17:45', estado: 'Completado', severidad: 'success' }
    ];
  }

  private initAccesosRapidos(): void {
    this.accesosRapidos = [
      { label: 'Normas', icon: 'pi pi-book', route: '/principal/normas', color: '#4f46e5', description: 'Gestionar normas vigentes' },
      { label: 'Organización', icon: 'pi pi-sitemap', route: '/principal/organizacion', color: '#7c3aed', description: 'Estructura organizacional' },
      { label: 'Documentos', icon: 'pi pi-folder-open', route: '/principal/documentosControlados', color: '#0284c7', description: 'Documentos controlados' },
      { label: 'Personas', icon: 'pi pi-users', route: '/principal/usuariosPersonas', color: '#059669', description: 'Gestión de personas' },
      { label: 'Objetivos', icon: 'pi pi-chart-line', route: '/principal/planificacionObjetivos', color: '#d97706', description: 'Planificación de objetivos' },
      { label: 'Riesgos', icon: 'pi pi-exclamation-triangle', route: '/principal/evaluacionRiesgos', color: '#e11d48', description: 'Evaluación de riesgos' },
      { label: 'Analytics', icon: 'pi pi-chart-bar', route: '/principal/analytics', color: '#8b5cf6', description: 'Consultas y monitorizaciones' }
    ];
  }

  private initAlertas(): void {
    this.alertas = [
      { titulo: 'Alerta de Temperatura en Planta Industrial A', tiempo: 'Hace 5 min', nivel: 'Crítico', severidad: 'danger' },
      { titulo: 'Falta de EPP reglamentario registrado en Almacén Central', tiempo: 'Hace 12 min', nivel: 'Alto', severidad: 'danger' },
      { titulo: 'Auditoría mensual de seguridad del puesto pendiente de programar', tiempo: 'Hace 1 hora', nivel: 'Medio', severidad: 'warning' },
      { titulo: 'Actualización del reglamento interno de SST para firma', tiempo: 'Hace 3 horas', nivel: 'Bajo', severidad: 'info' }
    ];
  }

  private initProximosEventos(): void {
    this.proximosEventos = [
      { fecha: '18 Jul', titulo: 'Simulacro General de Sismos', tipo: 'Simulacro', progreso: 85 },
      { fecha: '22 Jul', titulo: 'Inducción de SST nuevos ingresos', tipo: 'Capacitación', progreso: 50 },
      { fecha: '26 Jul', titulo: 'Auditoría Externa de Calidad HSEQ', tipo: 'Auditoría', progreso: 20 },
      { fecha: '30 Jul', titulo: 'Inspección de Equipos Contra Incendio', tipo: 'Inspección', progreso: 95 }
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
