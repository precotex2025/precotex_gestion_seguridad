import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { PlanificacionObjetivosRegeditComponent } from './planificacion-objetivos-regedit/planificacion-objetivos-regedit.component';
import { NuevaTareaModalComponent } from './nueva-tarea-modal/nueva-tarea-modal.component';

@Component({
  selector: 'app-planificacion-objetivos',
  standalone: false,
  templateUrl: './planificacion-objetivos.component.html',
  styleUrl: './planificacion-objetivos.component.css'
})
export class PlanificacionObjetivosComponent implements OnInit {
  formulario!: FormGroup;
  formularioMedicion!: FormGroup;
  formularioGestionTareas!: FormGroup;
  mostrarMedicion = false;
  mostrarDetalle = false;
  mostrarMediciones = false;
  mostrarGestionTareas = false;
  detalleObjetivo: any = null;
  medicionesObjetivo: any = null;
  gestionTareasObjetivo: any = null;
  filteredTareas: any[] = [];

  displayedColumns: string[] = [
    'desactivar',
    'objetivo',
    'req_medic/seg-perió',
    'frecuencia',
    'cum-obj',
    'norma',
    'tipo-objetivo',
    'valores',
    'inicio',
    'fin'
  ];
  dataSource = new MatTableDataSource<any>();

  displayedColumnsMedicion: string[] = [
    'objetivo',
    'detalle',
    'ficha',
    'mediciones',
    'gestion-tareas',
    'tipo-objetivo',
    'resp-medicion',
    'resp-seguimiento',
    'normas',
    'procesos',
    'fecha-inicio',
    'fecha-fin',
    'frecuencia-medicion',
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];
  dataSourceMedicion = new MatTableDataSource<any>();

  lstMeses = [
    { codigo: 'todos', descripcion: 'Todos' },
    { codigo: '01', descripcion: 'Enero' },
    { codigo: '02', descripcion: 'Febrero' },
    { codigo: '03', descripcion: 'Marzo' },
    { codigo: '04', descripcion: 'Abril' },
    { codigo: '05', descripcion: 'Mayo' },
    { codigo: '06', descripcion: 'Junio' },
    { codigo: '07', descripcion: 'Julio' },
    { codigo: '08', descripcion: 'Agosto' },
    { codigo: '09', descripcion: 'Setiembre' },
    { codigo: '10', descripcion: 'Octubre' },
    { codigo: '11', descripcion: 'Noviembre' },
    { codigo: '12', descripcion: 'Diciembre' }
  ];

  lstAnios = [
    { codigo: '2026', descripcion: '2026' },
    { codigo: '2025', descripcion: '2025' },
    { codigo: '2024', descripcion: '2024' }
  ];

  lstOrganizaciones = [
    { codigo: '01', descripcion: 'Organización Precotex S.A.C.' }
  ];

  lstSedes = [
    { codigo: '01', descripcion: 'Sede Central - Ate' },
    { codigo: '02', descripcion: 'Sede Planta - Lurin' }
  ];

  lstPersonasResponsables = [
    { codigo: 'Cualquier persona', descripcion: 'Cualquier persona' },
    { codigo: 'Cristian Quispe', descripcion: 'Cristian Quispe' },
    { codigo: 'Ana Torres', descripcion: 'Ana Torres' }
  ];

  lstPuestosResponsables = [
    { codigo: 'Cualquier puesto', descripcion: 'Cualquier puesto' },
    { codigo: 'Jefe de Mantenimiento', descripcion: 'Jefe de Mantenimiento' },
    { codigo: 'Jefe de RRHH', descripcion: 'Jefe de RRHH' }
  ];

  lstEstadosRealizacion = [
    { codigo: 'Cualquier estado', descripcion: 'Cualquier estado' },
    { codigo: 'Planificada', descripcion: 'Planificada' },
    { codigo: 'En Proceso', descripcion: 'En Proceso' },
    { codigo: 'Realizada', descripcion: 'Realizada' },
    { codigo: 'Cancelada', descripcion: 'Cancelada' }
  ];

  constructor(
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private SpinnerService: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_objetivo: [''],
      ctrol_tipo_objetivo: [''],
      ctrol_frecuencia: [''],
      ctrol_inicio: [''],
      ctrol_fin: ['']
    });

    this.formularioMedicion = this.formBuilder.group({
      ctrol_mes: ['todos'],
      ctrol_anio: ['2026'],
      ctrol_frecuencia: [''],
      ctrol_tipo_objetivo: [''],
      ctrol_fecha_inicio: [''],
      ctrol_fecha_fin: [''],
      ctrol_organizacion: [''],
      ctrol_sede: [''],
      ctrol_puesto_responsable: [''],
      ctrol_proceso: [''],
      ctrol_subproceso: [''],
      ctrol_subproceso_n2: [''],
      ctrol_norma: [''],
      ctrol_resultado: ['']
    });

    this.formularioGestionTareas = this.formBuilder.group({
      ctrol_denominacion_tarea: [''],
      ctrol_estado_realizacion: ['Cualquier estado'],
      ctrol_fecha_inicio_mayor: [''],
      ctrol_fecha_fin_menor: [''],
      ctrol_anio: ['2026'],
      ctrol_persona_responsable: ['Cualquier persona'],
      ctrol_puesto_responsable: ['Cualquier puesto']
    });

    this.onListarMock();
  }

  onListarMock() {
    this.dataSource.data = [
      {
        id: 1,
        objetivo: 'Reducir accidentes laborales',
        reqMedicionSegPeriodico: 'Sí',
        frecuencia: 'Mensual',
        cumplimiento: '95%',
        norma: 'ISO 45001',
        tipoObjetivo: 'Estratégico',
        valores: 'Meta: < 2',
        fechaInicio: '01/01/2026',
        fechaFin: '31/12/2026'
      },
      {
        id: 2,
        objetivo: 'Capacitación en seguridad',
        reqMedicionSegPeriodico: 'Sí',
        frecuencia: 'Trimestral',
        cumplimiento: '100%',
        norma: 'ISO 45001',
        tipoObjetivo: 'Operativo',
        valores: 'Meta: 100%',
        fechaInicio: '01/01/2026',
        fechaFin: '31/12/2026'
      }
    ];

    this.dataSourceMedicion.data = [
      {
        id: 1,
        objetivo: 'Asegurar la adecuada operatividad de los equipos mediante el cumplimiento de los mantenimientos preventivos',
        indicador: '(N° mantenimientos preventivos realizados/ N° mantenimientos preventivos programados)*100%',
        tipoObjetivo: 'Valor Numérico (Entre: 92porcentaje y porcentaje)',
        fuenteDatos: 'Seguimiento de los mantenimientos reportados',
        reqMedicionPeriodica: 'Sí',
        frecuenciaSeguimiento: 'Mensual',
        cumplimientoParcial: 'Sí',
        normasImplicadas: ['ISO 14001:2015', 'ISO 9001:2015', 'ISO 45001:2018'],
        procesosLista: ['MANTENIMIENTO'],
        recursosRequeridos: [
          'Recurso humano para realizar el mantenimiento de equipos',
          'Sistema para la gestión de los mantenimientos',
          'Herramientas'
        ],
        respMedicion: 'Carlos Chamaya',
        respSeguimiento: 'Maria Javier Castillo Reynoso',
        tareasPlanes: [
          {
            tarea: 'Plantear el programa de mantenimiento preventivo de equipos',
            responsable: 'Cristian Quispe',
            cargo: 'Jefe de Mantenimiento',
            fechaInicio: '2025-10-01',
            fechaFin: '2026-12-31',
            estado: 'Planificada'
          },
          {
            tarea: 'Realizar seguimiento quincenal del porcentaje de avance del avance de los mantenimientos realizados',
            responsable: 'Cristian Quispe',
            cargo: 'Jefe de Mantenimiento',
            fechaInicio: '2025-10-01',
            fechaFin: '2026-12-31',
            estado: 'Planificada'
          }
        ],
        normas: 'ISO 45001',
        procesos: 'Proceso de SST',
        fechaInicio: '01/01/2026',
        fechaFin: '31/12/2026',
        frecuenciaMedicion: 'Mensual',
        ene: '', feb: '', mar: '', abr: '', may: '', jun: '',
        jul: '', ago: '', sep: '', oct: '', nov: '', dic: ''
      },
      {
        id: 2,
        objetivo: 'Capacitar al 100% del personal en SST',
        indicador: '(N° personal capacitado / N° total de personal)*100%',
        tipoObjetivo: 'Valor Numérico (Entre: 95porcentaje y porcentaje)',
        fuenteDatos: 'Registro de asistencia a capacitaciones',
        reqMedicionPeriodica: 'Sí',
        frecuenciaSeguimiento: 'Trimestral',
        cumplimientoParcial: 'Sí',
        normasImplicadas: ['ISO 45001:2018', 'Ley Nº 29783'],
        procesosLista: ['GESTIÓN DE PERSONAS'],
        recursosRequeridos: [
          'Capacitadores internos y externos',
          'Material de capacitación',
          'Salas de conferencia'
        ],
        respMedicion: 'Jefe de RRHH',
        respSeguimiento: 'Gerencia General',
        tareasPlanes: [
          {
            tarea: 'Elaborar el plan anual de capacitaciones en SST',
            responsable: 'Ana Torres',
            cargo: 'Jefe de RRHH',
            fechaInicio: '2026-01-01',
            fechaFin: '2026-03-31',
            estado: 'Planificada'
          }
        ],
        normas: 'ISO 45001, Ley 29783',
        procesos: 'Gestión de Personas',
        fechaInicio: '01/01/2026',
        fechaFin: '31/12/2026',
        frecuenciaMedicion: 'Trimestral',
        ene: '', feb: '', mar: '', abr: '', may: '', jun: '',
        jul: '', ago: '', sep: '', oct: '', nov: '', dic: ''
      }
    ];
  }

  onBuscar() {
    this.toastr.success('Búsqueda de objetivos realizada', 'Éxito');
  }

  onAgregar() {
    let dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '75vw',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: {
        Title: 'Registra nuevo objetivo',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onListarMock();
      }
    });
  }

  onEdit(item: any) {
    let dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '75vw',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: {
        Title: 'Edita objetivo',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onListarMock();
      }
    });
  }

  onDelete(item: any) {
    this.toastr.warning(`Eliminando objetivo: "${item.objetivo}"`, 'Advertencia');
  }

  onMedicDeobj(item?: any) {
    this.mostrarMedicion = true;
    this.toastr.info('Abriendo vista de Medición de Objetivos', 'Información');
  }

  onVolver() {
    this.mostrarMedicion = false;
  }

  onFiltrarMedicion() {
    this.toastr.success('Filtros de medición aplicados correctamente.', 'Éxito');
  }

  onVerDetalle(row: any) {
    this.detalleObjetivo = row;
    this.mostrarDetalle = true;
  }

  onVolverDesdeDetalle() {
    this.mostrarDetalle = false;
    this.detalleObjetivo = null;
  }

  onVerMediciones(row: any) {
    this.medicionesObjetivo = {
      ...row,
      tipoObjetivoCorto: 'Valor Numérico',
      fechaInicioMed: '2025-10-01',
      fechaFinMed: '2026-02-28',
      reqMedicionPeriodica: 'sí',
      frecuenciaMed: 'Mensual',
      cumplimientoParcialMed: 'sí',
      numMedRealizadas: 5,
      numMedTotales: 5,
      pendientes: 0,
      valorMinEsperado: 92,
      valorMaxEsperado: 'No Aplica',
      pctRealizadas: 100,
      pctPendientes: 0,
      pctDentroRango: 100,
      pctFueraRango: 0,
      datosTendencia: [
        { mes: 'Oct 2025', valor: 94.50, acumulado: 94.50, metaMinima: 92.00 },
        { mes: 'Nov 2025', valor: 95.00, acumulado: 95.00, metaMinima: 92.00 },
        { mes: 'Dic 2025', valor: 92.00, acumulado: 94.16, metaMinima: 92.00 },
        { mes: 'Ene 2026', valor: 93.00, acumulado: 93.67, metaMinima: 92.00 },
        { mes: 'Feb 2026', valor: 97.00, acumulado: 94.50, metaMinima: 92.00 }
      ],
      datosMediciones: [
        { mesAnio: 'Feb de 2026', fechaReal: '2026-03-02 02:47:33', valor: 97, unidad: 'porcentaje' },
        { mesAnio: 'Ene de 2026', fechaReal: '2026-02-15 19:15:47', valor: 93, unidad: 'porcentaje' },
        { mesAnio: 'Dic de 2025', fechaReal: '2026-01-22 03:17:57', valor: 92.5, unidad: 'porcentaje' },
        { mesAnio: 'Nov de 2025', fechaReal: '2026-01-22 03:17:39', valor: 95.5, unidad: 'porcentaje' },
        { mesAnio: 'Oct de 2025', fechaReal: '2026-01-22 03:17:25', valor: 94.5, unidad: 'porcentaje' }
      ]
    };
    this.mostrarMediciones = true;
  }

  onVolverDesdeMediciones() {
    this.mostrarMediciones = false;
    this.medicionesObjetivo = null;
  }

  onVerGestionTareas(row: any) {
    this.gestionTareasObjetivo = row;
    this.mostrarGestionTareas = true;
    this.filteredTareas = row.tareasPlanes ? [...row.tareasPlanes] : [];
    this.formularioGestionTareas.patchValue({
      ctrol_denominacion_tarea: '',
      ctrol_estado_realizacion: 'Cualquier estado',
      ctrol_fecha_inicio_mayor: '',
      ctrol_fecha_fin_menor: '',
      ctrol_anio: '2026',
      ctrol_persona_responsable: 'Cualquier persona',
      ctrol_puesto_responsable: 'Cualquier puesto'
    });
  }

  onVolverDesdeGestionTareas() {
    this.mostrarGestionTareas = false;
    this.gestionTareasObjetivo = null;
  }

  onFiltrarTareas() {
    if (!this.gestionTareasObjetivo || !this.gestionTareasObjetivo.tareasPlanes) {
      return;
    }
    const filters = this.formularioGestionTareas.value;
    this.filteredTareas = this.gestionTareasObjetivo.tareasPlanes.filter((tarea: any) => {
      // 1. Denominación Tarea
      if (filters.ctrol_denominacion_tarea) {
        const term = filters.ctrol_denominacion_tarea.toLowerCase();
        if (!tarea.tarea.toLowerCase().includes(term)) {
          return false;
        }
      }
      // 2. Estado Realización
      if (filters.ctrol_estado_realizacion && filters.ctrol_estado_realizacion !== 'Cualquier estado') {
        if (tarea.estado !== filters.ctrol_estado_realizacion) {
          return false;
        }
      }
      // 3. Persona Responsable
      if (filters.ctrol_persona_responsable && filters.ctrol_persona_responsable !== 'Cualquier persona') {
        if (tarea.responsable !== filters.ctrol_persona_responsable) {
          return false;
        }
      }
      // 4. Puesto Responsable
      if (filters.ctrol_puesto_responsable && filters.ctrol_puesto_responsable !== 'Cualquier puesto') {
        if (tarea.cargo !== filters.ctrol_puesto_responsable) {
          return false;
        }
      }
      return true;
    });
    this.toastr.success('Filtros de tareas aplicados', 'Éxito');
  }

  onEditTarea(tarea: any) {
    this.toastr.info(`Editando tarea: "${tarea.tarea}"`, 'Información');
  }

  onDeleteTarea(tarea: any) {
    this.toastr.warning(`Eliminando tarea: "${tarea.tarea}"`, 'Advertencia');
  }

  onDescargarInforme(tarea: any) {
    this.toastr.success(`Descargando informe para la tarea: "${tarea.tarea}"`, 'Éxito');
  }

  onExportarPlanificacion() {
    this.toastr.success('Exportando planificación de tareas a Excel...', 'Éxito');
  }

  onNuevaAccionTarea() {
    let dialogRef = this.dialog.open(NuevaTareaModalComponent, {
      width: '650px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.gestionTareasObjetivo) {
          if (!this.gestionTareasObjetivo.tareasPlanes) {
            this.gestionTareasObjetivo.tareasPlanes = [];
          }
          this.gestionTareasObjetivo.tareasPlanes.push({
            tarea: result.tarea,
            responsable: result.responsable,
            cargo: result.cargo,
            fechaInicio: result.fechaInicio,
            fechaFin: result.fechaFin,
            estado: 'Planificada'
          });
          this.onFiltrarTareas();
        }
      }
    });
  }
}
