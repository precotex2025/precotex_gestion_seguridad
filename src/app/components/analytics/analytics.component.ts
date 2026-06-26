import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

export interface AnaliticaRegistro {
  id: string;
  usuario: string; // Usuario Buscado (searcher account)
  personaBuscada: string; // Persona Buscada (searched employee)
  fechaHora: string;
  tipo: 'Consulta' | 'Monitorización';
  resultado: string;
  alerta: string;
  verificado: boolean;
}

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  dataSource = new MatTableDataSource<AnaliticaRegistro>();
  displayedColumns: string[] = [];

  // Tab activa
  currentTab: 'consultas' | 'monitorizaciones' = 'consultas';

  // Filtros
  filtroUsuario: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroResultado: string = 'Cualquiera';
  filtroSeleccionaUsuario: string = 'Todos';

  // Filtros Monitorizaciones
  filtroTermino: string = '';
  filtroFechaInicio: string = '';
  filtroResultadoMonitorizacion: string = 'Cualquiera';

  // Opciones de combos
  resultadosOptions: string[] = ['Cualquiera', 'Positivo', 'Negativo', 'Pendiente'];
  usuariosOptions: string[] = ['Todos', 'fhuamani', 'admin', 'sys'];

  // KPIs
  kpiConsultasActivas = 0;
  kpiMonitorizacionesActivas = 0;
  kpiConsultasPositivasPendientes = 0;
  kpiMonitorizacionesPositivas = 0;

  private originalRegistros: AnaliticaRegistro[] = [
    {
      id: 'REG-001',
      usuario: 'fhuamani',
      personaBuscada: 'Juan Pérez',
      fechaHora: '2026-06-25',
      tipo: 'Consulta',
      resultado: 'Negativo',
      alerta: 'Sin Alertas',
      verificado: true
    },
    {
      id: 'REG-002',
      usuario: 'fhuamani',
      personaBuscada: 'María López',
      fechaHora: '2026-06-24',
      tipo: 'Consulta',
      resultado: 'Positivo',
      alerta: 'Alerta Temperatura',
      verificado: false
    },
    {
      id: 'REG-003',
      usuario: 'admin',
      personaBuscada: 'Carlos Gómez',
      fechaHora: '2026-06-23',
      tipo: 'Monitorización',
      resultado: 'Negativo',
      alerta: 'Sin Alertas',
      verificado: true
    },
    {
      id: 'REG-004',
      usuario: 'sys',
      personaBuscada: 'Juan Pérez',
      fechaHora: '2026-06-22',
      tipo: 'Monitorización',
      resultado: 'Positivo',
      alerta: 'Alerta Falta EPP',
      verificado: false
    },
    {
      id: 'REG-005',
      usuario: 'fhuamani',
      personaBuscada: 'María López',
      fechaHora: '2026-06-21',
      tipo: 'Consulta',
      resultado: 'Negativo',
      alerta: 'Sin Alertas',
      verificado: true
    }
  ];

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.actualizarColumnas();
    this.cargarDatos();
  }

  actualizarColumnas(): void {
    if (this.currentTab === 'consultas') {
      this.displayedColumns = [
        'verRevisar',
        'eliminar',
        'fechaHora',
        'tipoConsulta',
        'usuarioBuscado',
        'resultadoRevision',
        'resultadoValidacion'
      ];
    } else {
      this.displayedColumns = [
        'gestionarResultados',
        'historicoConsultas',
        'eliminar',
        'monitorizacion',
        'estadoMonitorizacion',
        'fecha',
        'usuarioBuscado',
        'personaBuscada'
      ];
    }
  }

  cargarDatos(): void {
    this.calcularKPIs();
    this.onFiltrar();
  }

  calcularKPIs(): void {
    this.kpiConsultasActivas = this.originalRegistros.filter(r => r.tipo === 'Consulta').length;
    this.kpiMonitorizacionesActivas = this.originalRegistros.filter(r => r.tipo === 'Monitorización').length;
    
    this.kpiConsultasPositivasPendientes = this.originalRegistros.filter(
      r => r.tipo === 'Consulta' && r.resultado === 'Positivo' && !r.verificado
    ).length;

    this.kpiMonitorizacionesPositivas = this.originalRegistros.filter(
      r => r.tipo === 'Monitorización' && r.resultado === 'Positivo' && !r.verificado
    ).length;
  }

  setTab(tab: 'consultas' | 'monitorizaciones'): void {
    this.currentTab = tab;
    this.actualizarColumnas();
    this.toastr.success(
      `Cambiado a: ${tab === 'consultas' ? 'Consultas Puntuales' : 'Monitorizaciones'}`,
      'Tab Modificada'
     );
     this.onFiltrar();
  }

  onFiltrar(): void {
    this.spinner.show();
    setTimeout(() => {
      let filtered = [...this.originalRegistros];

      if (this.currentTab === 'consultas') {
        filtered = filtered.filter(r => r.tipo === 'Consulta');

        // Filtrar por Nombre Usuario (texto libre)
        if (this.filtroUsuario) {
          filtered = filtered.filter(r => 
            r.usuario.toLowerCase().includes(this.filtroUsuario.toLowerCase())
          );
        }

        // Filtrar por Selecciona Usuario (combo)
        if (this.filtroSeleccionaUsuario && this.filtroSeleccionaUsuario !== 'Todos') {
          filtered = filtered.filter(r => r.usuario === this.filtroSeleccionaUsuario);
        }

        // Filtrar por Resultado de la Revisión / Alerta (combo)
        if (this.filtroResultado && this.filtroResultado !== 'Cualquiera') {
          filtered = filtered.filter(r => r.resultado === this.filtroResultado);
        }

        // Filtrar por Rango de fechas
        if (this.filtroFechaDesde) {
          filtered = filtered.filter(r => r.fechaHora >= this.filtroFechaDesde);
        }
        if (this.filtroFechaHasta) {
          filtered = filtered.filter(r => r.fechaHora <= this.filtroFechaHasta + ' 23:59');
        }
      } else {
        filtered = filtered.filter(r => r.tipo === 'Monitorización');

        // Filtrar por Término Buscado
        if (this.filtroTermino) {
          const term = this.filtroTermino.toLowerCase();
          filtered = filtered.filter(r => 
            r.personaBuscada.toLowerCase().includes(term) ||
            r.usuario.toLowerCase().includes(term)
          );
        }

        // Filtrar por Selecciona Usuario (combo)
        if (this.filtroSeleccionaUsuario && this.filtroSeleccionaUsuario !== 'Todos') {
          filtered = filtered.filter(r => r.usuario === this.filtroSeleccionaUsuario);
        }

        // Filtrar por Resultado de la Monitorización (combo)
        if (this.filtroResultadoMonitorizacion && this.filtroResultadoMonitorizacion !== 'Cualquiera') {
          filtered = filtered.filter(r => r.resultado === this.filtroResultadoMonitorizacion);
        }

        // Filtrar por Fecha / Hora Inicio
        if (this.filtroFechaInicio) {
          filtered = filtered.filter(r => r.fechaHora >= this.filtroFechaInicio);
        }
      }

      this.dataSource.data = filtered;
      this.spinner.hide();
    }, 200);
  }

  onNuevaConsulta(): void {
    this.toastr.info('Abriendo formulario de nueva consulta puntual...', 'Nueva Consulta');
  }

  onExportarListado(): void {
    this.toastr.success('Exportando listado de analíticas...', 'Exportar');
  }

  onVerRevisar(row: AnaliticaRegistro): void {
    this.toastr.info(`Visualizando detalles del registro ${row.id}...`, 'Ver / Revisar');
  }

  onGestionarResultados(row: AnaliticaRegistro): void {
    this.toastr.info(`Gestionando resultados de monitorización para ${row.personaBuscada}...`, 'Gestionar Resultados');
  }

  onHistoricoConsultas(row: AnaliticaRegistro): void {
    this.toastr.info(`Cargando histórico de consultas para ${row.personaBuscada}...`, 'Histórico Consultas');
  }

  onEliminar(row: AnaliticaRegistro): void {
    this.spinner.show();
    setTimeout(() => {
      this.originalRegistros = this.originalRegistros.filter(r => r.id !== row.id);
      this.calcularKPIs();
      this.onFiltrar();
      this.toastr.error(`Registro ${row.id} eliminado con éxito.`, 'Registro Eliminado');
      this.spinner.hide();
    }, 300);
  }

  onVerificar(row: AnaliticaRegistro): void {
    this.spinner.show();
    setTimeout(() => {
      row.verificado = true;
      this.calcularKPIs();
      this.onFiltrar();
      this.toastr.success(`Registro ${row.id} verificado con éxito.`, 'Verificación OK');
      this.spinner.hide();
    }, 300);
  }
}
