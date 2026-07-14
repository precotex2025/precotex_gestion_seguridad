import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { EvaluacionesPuntualesRegeditComponent } from './evaluaciones-puntuales-regedit/evaluaciones-puntuales-regedit.component';

export interface EvaluacionPuntual {
  id: number;
  denominacion: string;
  fechaAlta: string;
  fechaLimite: string;
  estado: 'ABIERTA' | 'CERRADA';
}

@Component({
  selector: 'app-evaluaciones-puntuales',
  standalone: false,
  templateUrl: './evaluaciones-puntuales.component.html',
  styleUrls: ['./evaluaciones-puntuales.component.css']
})
export class EvaluacionesPuntualesComponent implements OnInit {
  dataSource = new MatTableDataSource<EvaluacionPuntual>();
  displayedColumns: string[] = [
    'ver_gestionar',
    'estado',
    'denominacion',
    'fecha_alta',
    'fecha_limite'
  ];

  mostrarHistorico = false;

  private originalEvaluaciones: EvaluacionPuntual[] = [
    {
      id: 1,
      denominacion: 'Evaluación de Riesgos Psicosociales 2026',
      fechaAlta: '2026-06-01',
      fechaLimite: '2026-06-30',
      estado: 'ABIERTA'
    },
    {
      id: 2,
      denominacion: 'Desempeño de Seguridad - Planta Ate',
      fechaAlta: '2026-06-10',
      fechaLimite: '2026-07-15',
      estado: 'ABIERTA'
    },
    {
      id: 3,
      denominacion: 'Examen de Inducción de SST - Nuevos Ingresos',
      fechaAlta: '2026-06-15',
      fechaLimite: '2026-06-25',
      estado: 'CERRADA'
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
    if (this.mostrarHistorico) {
      this.dataSource.data = this.originalEvaluaciones.filter(e => e.estado === 'CERRADA');
    } else {
      this.dataSource.data = [...this.originalEvaluaciones];
    }
  }

  onVerHistorico(): void {
    this.spinner.show();
    setTimeout(() => {
      this.mostrarHistorico = !this.mostrarHistorico;
      this.cargarDatos();
      this.toastr.success(
        this.mostrarHistorico ? 'Historial de evaluaciones cargado' : 'Todas las evaluaciones cargadas',
        'Filtro'
      );
      this.spinner.hide();
    }, 300);
  }

  onVerDetalle(evaluacion: EvaluacionPuntual): void {
    Swal.fire({
      title: 'Detalle de la Evaluación',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Denominación:</strong> ${evaluacion.denominacion}</p>
          <p><strong>Fecha Alta:</strong> ${evaluacion.fechaAlta}</p>
          <p><strong>Fecha Límite:</strong> ${evaluacion.fechaLimite}</p>
          <p><strong>Estado Actual:</strong> 
            <span style="font-weight: bold; color: ${evaluacion.estado === 'ABIERTA' ? '#2e7d32' : '#c00000'};">
              ${evaluacion.estado}
            </span>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
          <p><strong>Descripción:</strong> Esta es una evaluación puntual asignada para medir el nivel de comprensión sobre la normativa interna de seguridad y prevención de incidentes.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#1e293b'
    });
  }

  onVerEstadisticas(evaluacion: EvaluacionPuntual): void {
    const participacion = evaluacion.estado === 'CERRADA' ? 100 : 75;
    const respondieron = evaluacion.estado === 'CERRADA' ? 20 : 15;
    const pendientes = evaluacion.estado === 'CERRADA' ? 0 : 5;

    Swal.fire({
      title: 'Estadísticas de Participación',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <h4 style="margin: 0 0 10px 0;">${evaluacion.denominacion}</h4>
          <p><strong>Participación General:</strong> ${participacion}%</p>
          <div style="background-color: #e2e8f0; border-radius: 4px; height: 10px; width: 100%; margin-bottom: 15px; overflow: hidden;">
            <div style="background-color: #3f51b5; width: ${participacion}%; height: 100%;"></div>
          </div>
          <p>✓ <strong>Respondieron:</strong> ${respondieron} usuarios</p>
          <p>⏳ <strong>Pendientes:</strong> ${pendientes} usuarios</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3f51b5'
    });
  }

  onAnadirDestinatarios(evaluacion: EvaluacionPuntual): void {
    if (evaluacion.estado === 'CERRADA') {
      this.toastr.warning('No se pueden añadir destinatarios a una evaluación cerrada', 'Advertencia');
      return;
    }

    Swal.fire({
      title: 'Añadir Destinatarios',
      text: 'Ingrese el nombre de la persona o departamento a agregar:',
      input: 'text',
      inputPlaceholder: 'Ej. Juan Pérez / Operaciones...',
      showCancelButton: true,
      confirmButtonText: 'Añadir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2e7d32',
      cancelButtonColor: '#757575',
      inputValidator: (value) => {
        if (!value) {
          return '¡Debes escribir un destinatario!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.spinner.show();
        setTimeout(() => {
          this.toastr.success(`Destinatario "${result.value}" añadido correctamente`, 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }

  onCerrarEvaluacion(evaluacion: EvaluacionPuntual): void {
    if (evaluacion.estado === 'CERRADA') {
      this.toastr.info('La evaluación ya se encuentra cerrada', 'Info');
      return;
    }

    Swal.fire({
      title: '¿Cerrar Evaluación?',
      text: `¿Desea cerrar la evaluación "${evaluacion.denominacion}"? Esto evitará que más usuarios participen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c00000',
      cancelButtonColor: '#757575'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        setTimeout(() => {
          evaluacion.estado = 'CERRADA';
          this.cargarDatos();
          this.toastr.success('Evaluación cerrada con éxito', 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }

  onNuevaEvaluacion(): void {
    const dialogRef = this.dialog.open(EvaluacionesPuntualesRegeditComponent, {
      width: '80%',
      maxWidth: '850px',
      disableClose: true,
      data: { Accion: 'I', Datos: null }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res && res.guardar) {
        this.spinner.show();
        setTimeout(() => {
          const hoy = new Date().toISOString().split('T')[0];
          let limiteStr = '';
          if (res.valores.ctrol_fecha_limite) {
            const d = new Date(res.valores.ctrol_fecha_limite);
            const yr = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            limiteStr = `${yr}-${mo}-${da}`;
          }
          const nuevoItem: EvaluacionPuntual = {
            id: this.originalEvaluaciones.length + 1,
            denominacion: res.valores.ctrol_titulo,
            fechaAlta: hoy,
            fechaLimite: limiteStr,
            estado: 'ABIERTA'
          };
          this.originalEvaluaciones.push(nuevoItem);
          this.cargarDatos();
          this.toastr.success('Nueva evaluación registrada exitosamente', 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }
}
