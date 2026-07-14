import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EvaluacionRiesgosRegeditComponent } from './evaluacion-riesgos-regedit/evaluacion-riesgos-regedit.component';

interface RiesgoItem {
  id: number;
  denominacion: string;
  tipo: string;
  estado: string;
  fechaAprobacion: string;
  organizacion: string;
  sede: string;
  norma: string;
}

@Component({
  selector: 'app-evaluacion-riesgos',
  standalone: false,
  templateUrl: './evaluacion-riesgos.component.html',
  styleUrls: ['./evaluacion-riesgos.component.css']
})
export class EvaluacionRiesgosComponent implements OnInit {
  formularioBusqueda!: FormGroup;
  riesgos: RiesgoItem[] = [];
  riesgosFiltrados: RiesgoItem[] = [];

  cantPendientes = 1;
  cantActivas = 0;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.formularioBusqueda = this.fb.group({
      ctrol_estado: ['En Evaluación y Aprobadas'],
      ctrol_organizacion: [''],
      ctrol_norma: [''],
      ctrol_tipo: ['']
    });

    this.onListarMock();
  }

  onListarMock(): void {
    this.riesgos = [
      {
        id: 1,
        denominacion: 'Sistema Integrado de Gestión_Procesos',
        tipo: 'Estructura Libres',
        estado: 'En Evaluación',
        fechaAprobacion: '',
        organizacion: 'PRECOTEX',
        sede: 'PRECOTEX\nSanta Maria\nSanta Cecilia',
        norma: 'ISO 14001:2015\nISO 9001:2015\nISO 45001:2018'
      },
      {
        id: 2,
        denominacion: 'Plan de Gestión de SST 2026',
        tipo: 'Estructura Libres',
        estado: 'Aprobada',
        fechaAprobacion: '15/01/2026',
        organizacion: 'PRECOTEX',
        sede: 'PRECOTEX',
        norma: 'ISO 45001:2018'
      }
    ];
    this.actualizarContadores();
    this.riesgosFiltrados = [...this.riesgos];
  }

  actualizarContadores(): void {
    this.cantPendientes = this.riesgos.filter(r => r.estado === 'En Evaluación').length;
    this.cantActivas = this.riesgos.filter(r => r.estado === 'Aprobada' || r.estado === 'Aprobadas').length;
  }

  onBuscar(): void {
    const filters = this.formularioBusqueda.value;
    this.riesgosFiltrados = this.riesgos.filter(item => {
      // Estado
      if (filters.ctrol_estado && filters.ctrol_estado !== 'Todas') {
        const est = item.estado.toLowerCase();
        if (filters.ctrol_estado === 'En Evaluación y Aprobadas') {
          if (est !== 'en evaluación' && est !== 'aprobada' && est !== 'aprobadas') {
            return false;
          }
        } else if (filters.ctrol_estado !== item.estado) {
          return false;
        }
      }
      // Organización
      if (filters.ctrol_organizacion && item.organizacion !== filters.ctrol_organizacion) {
        return false;
      }
      // Norma
      if (filters.ctrol_norma && !item.norma.includes(filters.ctrol_norma)) {
        return false;
      }
      // Tipo
      if (filters.ctrol_tipo && item.tipo !== filters.ctrol_tipo) {
        return false;
      }
      return true;
    });
    this.toastr.success('Filtros de evaluación aplicados.', 'Filtrado');
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1050px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        Title: 'Registrar Evaluación de Riesgo',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const nuevoId = this.riesgos.length > 0 ? Math.max(...this.riesgos.map(r => r.id)) + 1 : 1;
        this.riesgos.push({
          id: nuevoId,
          ...result
        });
        this.actualizarContadores();
        this.onBuscar();
      }
    });
  }

  onEdit(item: RiesgoItem): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1050px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        Title: 'Editar Evaluación de Riesgo',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.riesgos.findIndex(r => r.id === item.id);
        if (index !== -1) {
          this.riesgos[index] = {
            id: item.id,
            ...result
          };
          this.actualizarContadores();
          this.onBuscar();
        }
      }
    });
  }

  onDelete(item: RiesgoItem): void {
    this.riesgos = this.riesgos.filter(r => r.id !== item.id);
    this.actualizarContadores();
    this.onBuscar();
    this.toastr.warning(`Evaluación "${item.denominacion}" eliminada.`, 'Eliminado');
  }

  onDuplicar(): void {
    if (this.riesgosFiltrados.length === 0) {
      this.toastr.warning('No hay evaluaciones disponibles para duplicar.', 'Advertencia');
      return;
    }
    const itemToDuplicate = this.riesgosFiltrados[0];
    const nuevoId = Math.max(...this.riesgos.map(r => r.id)) + 1;
    this.riesgos.push({
      ...itemToDuplicate,
      id: nuevoId,
      denominacion: `${itemToDuplicate.denominacion} (Copia)`
    });
    this.actualizarContadores();
    this.onBuscar();
    this.toastr.success(`Copia creada de: "${itemToDuplicate.denominacion}"`, 'Duplicado');
  }

  onOpcionesVisualizacion(): void {
    this.toastr.info('Abriendo opciones de visualización de riesgos...', 'Opciones');
  }

  onRestriccionPermisos(item: RiesgoItem): void {
    this.toastr.info(`Restricción de Permisos para: "${item.denominacion}"`, 'Permisos');
  }

  onVerLog(item: RiesgoItem): void {
    this.toastr.info(`Logs de auditoría de: "${item.denominacion}"`, 'Log');
  }

  onEvaluarRiesgos(item: RiesgoItem): void {
    this.toastr.info(`Iniciando matriz IPERC para: "${item.denominacion}"`, 'Evaluar Riesgos');
  }

  onRiesgosPuestos(item: RiesgoItem): void {
    this.toastr.info(`Mapa de riesgos por puesto de: "${item.denominacion}"`, 'Riesgos Puestos');
  }

  onPlanControl(item: RiesgoItem): void {
    this.toastr.info(`Plan de control de medidas para: "${item.denominacion}"`, 'Plan Control');
  }
}
