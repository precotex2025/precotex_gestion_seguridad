import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { EvaluacionRiesgosRegeditComponent } from './evaluacion-riesgos-regedit/evaluacion-riesgos-regedit.component';
import { RiesgosService } from '../../services/riesgos.service';

export interface RiesgoItem {
  id: number;
  codigo: string;
  tipo: string;
  descbrief: string;
  proceso: string;
  nivel: string;
  estado: string; // 'Controlado' | 'En seguimiento' | 'Sin control'
  responsable: string;
  revision: string; // YYYY-MM-DD
  medidacontrol?: string;
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

  cantTotal = 0;
  cantControlado = 0;
  cantEnSeguimiento = 0;
  cantSinControl = 0;

  expandedRow: string | null = null;
  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  toggleRow(codigo: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.expandedRow === codigo) {
      this.expandedRow = null;
    } else {
      this.expandedRow = codigo;
    }
  }

  isRowExpanded(codigo: string): boolean {
    return this.expandedRow === codigo;
  }

  getNivelHeatmapClass(nivel: string): string {
    if (!nivel) return 'heatmap-bajo';
    const n = nivel.toLowerCase().trim();
    if (n.includes('alt') || n.includes('crític') || n.includes('critic')) return 'heatmap-alto';
    if (n.includes('med')) return 'heatmap-medio';
    return 'heatmap-bajo';
  }

  readonly tiposOptions = ['Seguridad', 'Calidad', 'Ambiental', 'Operativo']; // RIE-04
  readonly procesosOptions = [
    'Sistemas', 'Servicios Compartidos', 'Recursos Humanos', 'Finanzas', 'SSOMA',
    'Corte', 'Costura', 'Tintorería'
  ];
  readonly nivelesOptions = ['Alto', 'Medio', 'Bajo'];
  readonly estadosOptions = ['Controlado', 'En seguimiento', 'Sin control'];

  // RIE-05: Exportar Matriz IPERC / SIG a Excel
  exportarExcelIPERC(): void {
    const data = this.riesgosFiltrados.map(r => ({
      'Código': r.codigo,
      'Tipo de Riesgo': r.tipo,
      'Descripción / Peligro': r.descbrief,
      'Proceso': r.proceso,
      'Nivel de Riesgo (Residual)': r.nivel,
      'Estado': r.estado,
      'Responsable': r.responsable,
      'Última Revisión': r.revision,
      'Medida de Control': r.medidacontrol || 'Ninguna'
    }));

    if (!data.length) {
      this.toastr.warning('No hay riesgos para exportar', 'Matriz IPERC');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(e => Object.values(e).map(v => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Matriz_IPERC_Precotex_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.success('Exportación IPERC/SIG realizada con éxito (RIE-05)', 'Matriz IPERC');
  }

  // RIE-06: Historial de revaluaciones de riesgos
  onVerHistorialRevaluaciones(item: any): void {
    const htmlHistorial = `
      <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #1e293b;">
        <p style="color: #334155; margin-bottom: 10px;">
          <strong style="color: #0f172a;">Código:</strong> ${item.codigo} | 
          <strong style="color: #0f172a;">Riesgo:</strong> ${item.descbrief}
        </p>
        <p style="color: #475569; margin-bottom: 10px;">
          <strong>Proceso:</strong> ${item.proceso} | 
          <strong>Responsable:</strong> ${item.responsable}
        </p>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Fecha</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Eval. Inicial</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Revaluación (Residual)</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">${item.revision || '2026-02-10'}</td>
                <td style="padding: 10px 12px;"><span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Alto (15)</span></td>
                <td style="padding: 10px 12px;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-weight: 700;">${item.nivel || 'Bajo'}</span></td>
                <td style="padding: 10px 12px; color: #334155;">${item.estado}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 12px; color: #64748b;">2025-08-15</td>
                <td style="padding: 10px 12px;"><span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Alto (20)</span></td>
                <td style="padding: 10px 12px;"><span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Medio (10)</span></td>
                <td style="padding: 10px 12px; color: #64748b;">En seguimiento</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    Swal.fire({
      title: '📈 Historial de Revaluaciones (RIE-06)',
      html: htmlHistorial,
      width: '680px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#6366f1'
    });
  }

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private riesgosService: RiesgosService
  ) { }

  ngOnInit(): void {
    this.formularioBusqueda = this.fb.group({
      termino: [''],
      tipo: [''],
      proceso: [''],
      estado: ['']
    });

    this.cargarDatos();
  }

  cargarDatos(): void {
    this.riesgosService.getListadoRiesgos().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.riesgos = res.elements.map((item: any) => ({
            id: item.id_Riesgo,
            codigo: item.codigo,
            tipo: item.tipo,
            descbrief: item.descripcion_Breve,
            proceso: item.proceso,
            nivel: item.nivel,
            estado: item.estado,
            responsable: item.responsable,
            revision: item.fecha_Revision ? item.fecha_Revision.split('T')[0] : '',
            medidacontrol: item.medida_Control || ''
          }));
          this.actualizarContadores();
          this.onBuscar();
        } else {
          this.riesgos = [];
          this.actualizarContadores();
          this.riesgosFiltrados = [];
        }
      },
      error: (err) => {
        console.error('Error al listar Riesgos:', err);
        this.riesgos = [];
        this.actualizarContadores();
        this.riesgosFiltrados = [];
      }
    });
  }

  actualizarContadores(): void {
    this.cantTotal = this.riesgos.length;
    this.cantControlado = this.riesgos.filter(r => (r.estado || '').toLowerCase() === 'controlado').length;
    this.cantEnSeguimiento = this.riesgos.filter(r => (r.estado || '').toLowerCase().includes('seguimiento')).length;
    this.cantSinControl = this.riesgos.filter(r => (r.estado || '').toLowerCase().includes('sin control')).length;
  }

  onBuscar(): void {
    const filters = this.formularioBusqueda.value;
    const term = (filters.termino || '').toLowerCase().trim();

    this.riesgosFiltrados = this.riesgos.filter(item => {
      if (term) {
        const cod = (item.codigo || '').toLowerCase();
        const desc = (item.descbrief || '').toLowerCase();
        const resp = (item.responsable || '').toLowerCase();
        if (
          !cod.includes(term) &&
          !desc.includes(term) &&
          !resp.includes(term)
        ) {
          return false;
        }
      }
      if (filters.tipo && item.tipo !== filters.tipo) return false;
      if (filters.proceso && item.proceso !== filters.proceso) return false;
      if (filters.estado && item.estado !== filters.estado) return false;
      return true;
    });
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Declarar Riesgo',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          Accion: 'I',
          Codigo: result.codigo,
          Tipo: result.tipo,
          Descripcion_Breve: result.descbrief,
          Proceso: result.proceso,
          Nivel: result.nivel,
          Estado: result.estado,
          Responsable: result.responsable,
          Fecha_Revision: result.revision,
          Medida_Control: result.medidacontrol,
          Usuario_Registro: 'SISTEMAS'
        };

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.toastr.success('Riesgo declarado y guardado en BD.', 'Registrado');
              this.cargarDatos();
            } else {
              this.toastr.error(res.message || 'Error al guardar el riesgo.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEdit(item: RiesgoItem): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar Riesgo Declarado',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Tipo: result.tipo,
          Descripcion_Breve: result.descbrief,
          Proceso: result.proceso,
          Nivel: result.nivel,
          Estado: result.estado,
          Responsable: result.responsable,
          Fecha_Revision: result.revision,
          Medida_Control: result.medidacontrol,
          Usuario_Registro: 'SISTEMAS'
        };

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.toastr.success('Riesgo actualizado en BD.', 'Actualizado');
              this.cargarDatos();
            } else {
              this.toastr.error(res.message || 'Error al actualizar el riesgo.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onDelete(item: RiesgoItem): void {
    Swal.fire({
      title: `¿Está seguro de eliminar el riesgo "${item.codigo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          Accion: 'D',
          Codigo: item.codigo,
          Usuario_Registro: 'SISTEMAS'
        };

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.toastr.warning(`Riesgo "${item.codigo}" eliminado.`, 'Eliminado');
              this.cargarDatos();
            } else {
              this.toastr.error(res.message || 'Error al eliminar.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '--';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
  }

  getEstadoClass(est: string): string {
    switch ((est || '').toLowerCase()) {
      case 'controlado':
        return 'status-green';
      case 'en seguimiento':
        return 'status-amber';
      default:
        return 'status-red';
    }
  }
}
