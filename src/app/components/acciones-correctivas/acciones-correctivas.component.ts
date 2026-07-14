import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { PlanificarFormacionModalComponent } from './planificar-formacion-modal/planificar-formacion-modal.component';

export interface AccionCorrectiva {
  codigo: string;
  textoLibre: string;
  valoracionEficacia: string;
  ano: string;
  metodologia: string;
  tipo: string;
  estado: string;
  sede: string;
  personaResponsable: string;
  puestoResponsable: string;
  fechaPlanificada: string;
}

@Component({
  selector: 'app-acciones-correctivas',
  standalone: false,
  templateUrl: './acciones-correctivas.component.html',
  styleUrls: ['./acciones-correctivas.component.css']
})
export class AccionesCorrectivasComponent implements OnInit {

  dataSource = new MatTableDataSource<AccionCorrectiva>();
  displayedColumns: string[] = [
    'acciones',
    'codigo',
    'textoLibre',
    'ano',
    'tipo',
    'metodologia',
    'estado',
    'sede',
    'personaResponsable',
    'valoracionEficacia'
  ];

  // Filtros
  filtroTextoLibre: string = '';
  filtroValoracionEficacia: string = 'Selecciona';
  filtroAno: string = '2026';
  filtroMetodologia: string = 'Selecciona';
  filtroTipo: string = 'Selecciona';
  filtroEstado: string = 'Selecciona';
  filtroSede: string = 'Selecciona';
  filtroPersonaResponsable: string = 'Selecciona';
  filtroPuestoResponsable: string = 'Selecciona';

  // Opciones de combos
  valoracionesOptions: string[] = ['Eficaz', 'No Eficaz', 'Pendiente de Valorar'];
  anosOptions: string[] = ['2026', '2025', '2024'];
  metodologiasOptions: string[] = ['Presencial', 'Online', 'Mixta'];
  tiposOptions: string[] = ['Correctiva', 'Preventiva', 'Mejora'];
  estadosOptions: string[] = ['Abierta', 'En Proceso', 'Cerrada', 'Anulada'];
  sedesOptions: string[] = ['Sede Central', 'Planta Lurín', 'Planta Ate'];
  personasOptions: string[] = ['Juan Pérez', 'María López', 'Carlos Gómez'];
  puestosOptions: string[] = ['Supervisor SST', 'Gerente Operaciones', 'Jefe de Almacén'];

  private originalAcciones: AccionCorrectiva[] = [
    {
      codigo: 'AC-2026-001',
      textoLibre: 'Capacitación en uso y mantenimiento de EPP para personal de almacén.',
      valoracionEficacia: 'Eficaz',
      ano: '2026',
      metodologia: 'Presencial',
      tipo: 'Correctiva',
      estado: 'Cerrada',
      sede: 'Sede Central',
      personaResponsable: 'Juan Pérez',
      puestoResponsable: 'Supervisor SST',
      fechaPlanificada: '15/01/2026'
    },
    {
      codigo: 'AC-2026-002',
      textoLibre: 'Revisión y simulacro de evacuación en Planta Lurín.',
      valoracionEficacia: 'Pendiente de Valorar',
      ano: '2026',
      metodologia: 'Mixta',
      tipo: 'Preventiva',
      estado: 'En Proceso',
      sede: 'Planta Lurín',
      personaResponsable: 'María López',
      puestoResponsable: 'Gerente Operaciones',
      fechaPlanificada: '20/03/2026'
    },
    {
      codigo: 'AC-2026-003',
      textoLibre: 'Inducción general sobre riesgos ergonómicos en oficinas.',
      valoracionEficacia: 'No Eficaz',
      ano: '2026',
      metodologia: 'Online',
      tipo: 'Mejora',
      estado: 'Abierta',
      sede: 'Sede Central',
      personaResponsable: 'Carlos Gómez',
      puestoResponsable: 'Jefe de Almacén',
      fechaPlanificada: '10/02/2026'
    }
  ];

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.dataSource.data = [...this.originalAcciones];
  }

  onFiltrar(): void {
    this.spinner.show();
    setTimeout(() => {
      let filtered = [...this.originalAcciones];

      if (this.filtroTextoLibre) {
        filtered = filtered.filter(a =>
          a.textoLibre.toLowerCase().includes(this.filtroTextoLibre.toLowerCase()) ||
          a.codigo.toLowerCase().includes(this.filtroTextoLibre.toLowerCase())
        );
      }

      if (this.filtroValoracionEficacia && this.filtroValoracionEficacia !== 'Selecciona') {
        filtered = filtered.filter(a => a.valoracionEficacia === this.filtroValoracionEficacia);
      }

      if (this.filtroAno) {
        filtered = filtered.filter(a => a.ano === this.filtroAno);
      }

      if (this.filtroMetodologia && this.filtroMetodologia !== 'Selecciona') {
        filtered = filtered.filter(a => a.metodologia === this.filtroMetodologia);
      }

      if (this.filtroTipo && this.filtroTipo !== 'Selecciona') {
        filtered = filtered.filter(a => a.tipo === this.filtroTipo);
      }

      if (this.filtroEstado && this.filtroEstado !== 'Selecciona') {
        filtered = filtered.filter(a => a.estado === this.filtroEstado);
      }

      if (this.filtroSede && this.filtroSede !== 'Selecciona') {
        filtered = filtered.filter(a => a.sede === this.filtroSede);
      }

      if (this.filtroPersonaResponsable && this.filtroPersonaResponsable !== 'Selecciona') {
        filtered = filtered.filter(a => a.personaResponsable === this.filtroPersonaResponsable);
      }

      this.dataSource.data = filtered;
      this.spinner.hide();
    }, 200);
  }

  onPlanificarNuevaFormacion(): void {
    const dialogRef = this.dialog.open(PlanificarFormacionModalComponent, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinner.show();
        setTimeout(() => {
          const nuevaAC: AccionCorrectiva = {
            codigo: `AC-2026-0${this.originalAcciones.length + 1}`,
            textoLibre: result.accionFormativa || 'Planificación de Acción Formativa',
            valoracionEficacia: 'Pendiente de Valorar',
            ano: '2026',
            metodologia: result.metodologia || 'Presencial',
            tipo: result.tipoFormacion || 'Correctiva',
            estado: result.estado || 'Planificada',
            sede: result.sedes.length > 0 ? result.sedes.join(', ') : 'Sede Central',
            personaResponsable: 'Usuario Actual',
            puestoResponsable: 'Administrador',
            fechaPlanificada: new Date().toLocaleDateString()
          };
          this.originalAcciones.push(nuevaAC);
          this.onFiltrar();
          this.toastr.success('Nueva formación planificada y registrada con éxito.', 'Planificación Guardada');
          this.spinner.hide();
        }, 300);
      }
    });
  }

  onExportarPDF(): void {
    this.toastr.success('Generando Plan de Formación en formato PDF...', 'Exportar PDF');
  }

  onExportarExcel(): void {
    this.toastr.success('Generando Plan de Formación en formato Excel...', 'Exportar Excel');
  }

  onEditar(row: AccionCorrectiva): void {
    this.toastr.info(`Editando acción correctiva: ${row.codigo}`, 'Editar');
  }

  onEliminar(row: AccionCorrectiva): void {
    this.spinner.show();
    setTimeout(() => {
      this.originalAcciones = this.originalAcciones.filter(a => a.codigo !== row.codigo);
      this.onFiltrar();
      this.toastr.warning(`Acción correctiva eliminada: ${row.codigo}`, 'Eliminar');
      this.spinner.hide();
    }, 300);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Abierta': return 'estado-abierta';
      case 'En Proceso': return 'estado-proceso';
      case 'Cerrada': return 'estado-cerrada';
      default: return 'estado-anulada';
    }
  }

  getEficaciaClass(valoracion: string): string {
    switch (valoracion) {
      case 'Eficaz': return 'eficacia-eficaz';
      case 'No Eficaz': return 'eficacia-no-eficaz';
      default: return 'eficacia-pendiente';
    }
  }
}
