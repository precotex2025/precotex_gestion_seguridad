import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

export interface CursoVirtual {
  idInterno: string;
  categoria: string;
  abreviatura: string;
  denominacion: string;
  precio: number;
  masInfo: string;
  inscrito: boolean;
}

export interface AccionFormativa {
  estado: string;
  alumno: string;
  accionFormativa: string;
  codigo: string;
  fechaInicio: string;
  duracion: string;
  fechaFinMaxima: string;
  finalizado: boolean;
  info: string;
}

@Component({
  selector: 'app-campus-virtual',
  standalone: false,
  templateUrl: './campus-virtual.component.html',
  styleUrls: ['./campus-virtual.component.css']
})
export class CampusVirtualComponent implements OnInit {

  // Vista activa por defecto (Catálogo Formativo)
  currentTab: 'catalogo' | 'contratadas' = 'catalogo';

  // 1. Catálogo Formativo Data
  dataSourceCatalog = new MatTableDataSource<CursoVirtual>();
  displayedColumnsCatalog: string[] = [
    'idInterno',
    'categoria',
    'abreviatura',
    'denominacion',
    'precio',
    'masInfo',
    'inscripcion'
  ];

  filtroCatalogDenominacion = '';
  filtroCatalogPrecioDesde = '';
  filtroCatalogPrecioHasta = '';
  filtroCatalogCategoria = '';

  categoriasCatalog: string[] = [
    'Prevención de Riesgos',
    'Seguridad Industrial',
    'Primeros Auxilios',
    'Sistemas de Gestión',
    'Protección Personal'
  ];

  private originalCatalog: CursoVirtual[] = [
    {
      idInterno: 'CF-001',
      categoria: 'Prevención de Riesgos',
      abreviatura: 'PRL',
      denominacion: 'Curso Básico de Prevención de Riesgos Laborales',
      precio: 45.00,
      masInfo: 'Curso para aprender los conceptos básicos de prevención de riesgos en el trabajo, identificación de peligros y evaluación de riesgos.',
      inscrito: false
    },
    {
      idInterno: 'CF-002',
      categoria: 'Seguridad Industrial',
      abreviatura: 'SST',
      denominacion: 'Inducción en Seguridad y Salud en el Trabajo',
      precio: 60.00,
      masInfo: 'Capacitación obligatoria sobre el sistema de gestión de seguridad y salud en el trabajo de la empresa.',
      inscrito: true
    },
    {
      idInterno: 'CF-003',
      categoria: 'Primeros Auxilios',
      abreviatura: 'PA',
      denominacion: 'Primeros Auxilios y Reanimación Cardiopulmonar (RCP)',
      precio: 35.00,
      masInfo: 'Aprende a actuar ante una emergencia médica: soporte vital básico, heridas, quemaduras y reanimación.',
      inscrito: false
    },
    {
      idInterno: 'CF-004',
      categoria: 'Sistemas de Gestión',
      abreviatura: 'ISO45',
      denominacion: 'Implementación de la Norma ISO 45001:2018',
      precio: 120.00,
      masInfo: 'Requisitos y directrices para el diseño, implementación y auditoría de un Sistema de Gestión de Seguridad y Salud en el Trabajo.',
      inscrito: false
    },
    {
      idInterno: 'CF-005',
      categoria: 'Protección Personal',
      abreviatura: 'EPP',
      denominacion: 'Uso y Mantenimiento Correcto de Equipos de Protección Personal (EPP)',
      precio: 25.00,
      masInfo: 'Guía práctica para la selección, uso, limpieza y mantenimiento de cascos, lentes, guantes y calzado de seguridad.',
      inscrito: true
    }
  ];

  // 2. Acciones Formativas Contratadas Data
  dataSourceAcciones = new MatTableDataSource<AccionFormativa>();
  displayedColumnsAcciones: string[] = [
    'accesoCampus',
    'verificarConexion',
    'eliminarMatriculacion',
    'estado',
    'alumno',
    'accionFormativa',
    'codigo',
    'fechaInicio',
    'duracion',
    'fechaFinMaxima',
    'informeActividad',
    'descargarDiploma',
    'masInfo'
  ];

  filtroAccionDenominacion: string = 'Cualquier curso';
  filtroAccionUsuario: string = 'Todos los Usuarios';
  filtroAccionPuesto: string = 'Cualquier Puesto';
  filtroAccionOrganizacion: string = 'Selecciona';
  filtroAccionSede: string = 'Selecciona';
  filtroAccionEstado: string = 'Matrícula Activa';

  cursosOptions: string[] = [
    'Inducción en Seguridad y Salud en el Trabajo',
    'Manejo de Equipos de Protección Personal (EPP)',
    'Primeros Auxilios y RCP Básico'
  ];
  usuariosOptions: string[] = ['Juan Pérez', 'María López', 'Carlos Gómez'];
  puestosOptions: string[] = ['Operario de Almacén', 'Supervisor SST', 'Administrativo'];
  organizacionesOptions: string[] = ['Precotex S.A.C.', 'Preco Seguridad'];
  sedesOptions: string[] = ['Sede Central', 'Planta Lurin', 'Planta Ate'];
  estadosOptions: string[] = ['Matrícula Activa', 'Matrícula Inactiva', 'Finalizada'];

  private originalAcciones: AccionFormativa[] = [
    {
      estado: 'Matrícula Activa',
      alumno: 'Juan Pérez',
      accionFormativa: 'Inducción en Seguridad y Salud en el Trabajo',
      codigo: 'CF-001',
      fechaInicio: '15/01/2026',
      duracion: '10 horas',
      fechaFinMaxima: '15/02/2026',
      finalizado: true,
      info: 'Curso obligatorio de inducción de seguridad y salud ocupacional.'
    },
    {
      estado: 'Matrícula Activa',
      alumno: 'María López',
      accionFormativa: 'Manejo de Equipos de Protección Personal (EPP)',
      codigo: 'CF-002',
      fechaInicio: '01/02/2026',
      duracion: '8 horas',
      fechaFinMaxima: '01/03/2026',
      finalizado: false,
      info: 'Uso correcto de cascos, lentes de seguridad y EPP específico.'
    },
    {
      estado: 'Matrícula Activa',
      alumno: 'Carlos Gómez',
      accionFormativa: 'Primeros Auxilios y RCP Básico',
      codigo: 'CF-003',
      fechaInicio: '10/02/2026',
      duracion: '12 horas',
      fechaFinMaxima: '10/03/2026',
      finalizado: true,
      info: 'Primeros auxilios básicos, RCP y uso de desfibrilador.'
    }
  ];

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.dataSourceCatalog.data = [...this.originalCatalog];
    this.dataSourceAcciones.data = [...this.originalAcciones];
  }

  setTab(tab: 'catalogo' | 'contratadas'): void {
    this.currentTab = tab;
    this.toastr.success(
      `Cambiado a: ${tab === 'catalogo' ? 'Catálogo Formativo' : 'Acciones Formativas Contratadas'}`,
      'Tab Modificada'
    );
  }

  // --- Métodos de Catálogo ---
  onBuscarCatalog(): void {
    this.spinner.show();
    setTimeout(() => {
      let filtered = [...this.originalCatalog];

      if (this.filtroCatalogDenominacion) {
        filtered = filtered.filter(c => 
          c.denominacion.toLowerCase().includes(this.filtroCatalogDenominacion.toLowerCase())
        );
      }

      if (this.filtroCatalogCategoria) {
        filtered = filtered.filter(c => c.categoria === this.filtroCatalogCategoria);
      }

      if (this.filtroCatalogPrecioDesde) {
        const desde = parseFloat(this.filtroCatalogPrecioDesde);
        if (!isNaN(desde)) {
          filtered = filtered.filter(c => c.precio >= desde);
        }
      }

      if (this.filtroCatalogPrecioHasta) {
        const hasta = parseFloat(this.filtroCatalogPrecioHasta);
        if (!isNaN(hasta)) {
          filtered = filtered.filter(c => c.precio <= hasta);
        }
      }

      this.dataSourceCatalog.data = filtered;
      this.spinner.hide();
    }, 200);
  }

  onInscribirCatalog(curso: CursoVirtual): void {
    curso.inscrito = !curso.inscrito;
    if (curso.inscrito) {
      this.toastr.success(`Inscrito en: ${curso.denominacion}`, 'Éxito');
      // Sincronizar agregando a contratadas
      const nuevaAccion: AccionFormativa = {
        estado: 'Matrícula Activa',
        alumno: 'Usuario Actual',
        accionFormativa: curso.denominacion,
        codigo: curso.idInterno,
        fechaInicio: 'Hoy',
        duracion: 'Online',
        fechaFinMaxima: 'Sin límite',
        finalizado: false,
        info: curso.masInfo
      };
      this.originalAcciones.push(nuevaAccion);
      this.dataSourceAcciones.data = [...this.originalAcciones];
    } else {
      this.toastr.warning(`Cancelado: ${curso.denominacion}`, 'Cancelado');
      // Sincronizar eliminando de contratadas
      this.originalAcciones = this.originalAcciones.filter(a => a.codigo !== curso.idInterno);
      this.dataSourceAcciones.data = [...this.originalAcciones];
    }
  }

  onExportarCatalog(): void {
    this.toastr.success('Exportando catálogo de cursos...', 'Exportar');
  }

  onVerCursoCatalog(curso: CursoVirtual): void {
    this.toastr.info(curso.masInfo, `Detalles: ${curso.idInterno}`, {
      timeOut: 8000,
      closeButton: true
    });
  }

  // --- Métodos de Contratadas ---
  onFiltrarAcciones(): void {
    this.spinner.show();
    setTimeout(() => {
      let filtered = [...this.originalAcciones];

      if (this.filtroAccionDenominacion && this.filtroAccionDenominacion !== 'Cualquier curso') {
        filtered = filtered.filter(a => a.accionFormativa === this.filtroAccionDenominacion);
      }

      if (this.filtroAccionUsuario && this.filtroAccionUsuario !== 'Todos los Usuarios') {
        filtered = filtered.filter(a => a.alumno === this.filtroAccionUsuario);
      }

      if (this.filtroAccionEstado && this.filtroAccionEstado !== 'Matrícula Activa') {
        filtered = filtered.filter(a => a.estado === this.filtroAccionEstado);
      }

      this.dataSourceAcciones.data = filtered;
      this.spinner.hide();
    }, 200);
  }

  onAccesoCampus(row: AccionFormativa): void {
    this.toastr.info(`Accediendo al campus para: ${row.accionFormativa}`, 'Acceso');
  }

  onVerificarConexion(row: AccionFormativa): void {
    this.toastr.success('Conexión con el campus verificada.', 'Conexión OK');
  }

  onEliminarMatriculacion(row: AccionFormativa): void {
    this.spinner.show();
    setTimeout(() => {
      this.originalAcciones = this.originalAcciones.filter(a => a.codigo !== row.codigo);
      this.dataSourceAcciones.data = [...this.originalAcciones];
      // Sincronizar catálogo
      const curso = this.originalCatalog.find(c => c.idInterno === row.codigo);
      if (curso) {
        curso.inscrito = false;
        this.dataSourceCatalog.data = [...this.originalCatalog];
      }
      this.toastr.warning(`Matrícula eliminada: ${row.accionFormativa}`, 'Eliminado');
      this.spinner.hide();
    }, 200);
  }

  onInformeActividad(row: AccionFormativa): void {
    this.toastr.info(`Informe de actividad para ${row.alumno}`, 'Informe');
  }

  onDescargarDiploma(row: AccionFormativa): void {
    if (!row.finalizado) {
      this.toastr.error('Curso no finalizado.', 'Error');
      return;
    }
    this.toastr.success(`Descargando diploma de ${row.alumno}`, 'Diploma');
  }

  onMasInfoAcc(row: AccionFormativa): void {
    this.toastr.info(row.info, `Detalles: ${row.codigo}`, {
      timeOut: 8000,
      closeButton: true
    });
  }
}
