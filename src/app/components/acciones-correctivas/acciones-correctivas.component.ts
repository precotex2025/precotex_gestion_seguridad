import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { PlanificarFormacionModalComponent } from './planificar-formacion-modal/planificar-formacion-modal.component';
import { NoConformidadService } from '../../services/no-conformidad.service';

@Component({
  selector: 'app-acciones-correctivas',
  standalone: false,
  templateUrl: './acciones-correctivas.component.html',
  styleUrls: ['./acciones-correctivas.component.css']
})
export class AccionesCorrectivasComponent implements OnInit {

  stats = {
    total: 0,
    completadas: 0,
    enEjecucion: 0,
    pendientes: 0,
    vencidas: 0
  };

  displayedColumns: string[] = [
    'nc',
    'tipo',
    'accion',
    'proceso',
    'responsable',
    'inicio',
    'limite',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private noConformidadService: NoConformidadService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    this.noConformidadService.getListadoNoConformidades().subscribe({
      next: (res: any) => {
        if (res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            nc: item.nc,
            tipo: item.tipo,
            accion: item.accion,
            proceso: item.proceso,
            responsable: item.responsable,
            inicio: item.fecha_Inicio ? item.fecha_Inicio.split('T')[0] : '',
            limite: item.fecha_Limite ? item.fecha_Limite.split('T')[0] : '',
            estado: item.estado,
            desc: item.descripcion,
            codigoAuditoria: item.codigo_Auditoria
          }));
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: (err) => {
        console.error('Error al listar No Conformidades:', err);
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      completadas: data.filter(d => (d.estado || '').toLowerCase().includes('completad')).length,
      enEjecucion: data.filter(d => (d.estado || '').toLowerCase().includes('ejecuci')).length,
      pendientes: data.filter(d => (d.estado || '').toLowerCase().includes('pendient')).length,
      vencidas: data.filter(d => (d.estado || '').toLowerCase().includes('vencid')).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'pendiente';
    const s = estado.toLowerCase().trim();
    if (s.includes('completad')) return 'completada';
    if (s.includes('ejecuci')) return 'en-ejecucion';
    if (s.includes('pendient')) return 'pendiente';
    if (s.includes('vencid')) return 'vencida';
    return 'pendiente';
  }

  getTipoClass(tipo: string): string {
    return tipo === 'Externa' ? 'externa' : 'interna';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(PlanificarFormacionModalComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Planificar acción correctiva .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'I',
          NC: res.nc,
          Tipo: res.tipo,
          Accion_Desc: res.accion,
          Proceso: res.proceso,
          Responsable: res.responsable,
          Fecha_Inicio: res.inicio,
          Fecha_Limite: res.limite,
          Estado: res.estado,
          Descripcion: res.desc || '',
          Codigo_Auditoria: res.codigoAuditoria || '',
          Cod_Usuario: 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Acción correctiva registrada en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al registrar', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(PlanificarFormacionModalComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar acción correctiva .::',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'U',
          NC: item.nc,
          Tipo: res.tipo,
          Accion_Desc: res.accion,
          Proceso: res.proceso,
          Responsable: res.responsable,
          Fecha_Inicio: res.inicio,
          Fecha_Limite: res.limite,
          Estado: res.estado,
          Descripcion: res.desc || '',
          Codigo_Auditoria: res.codigoAuditoria || '',
          Cod_Usuario: 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Acción correctiva actualizada en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al actualizar', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar la acción correctiva?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        const payload = {
          Accion: 'D',
          NC: item.nc,
          Cod_Usuario: 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Acción correctiva eliminada correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al eliminar', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }
}
