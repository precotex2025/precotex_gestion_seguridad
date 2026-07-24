import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { PlanificacionObjetivosRegeditComponent } from './planificacion-objetivos-regedit/planificacion-objetivos-regedit.component';
import { ObjetivosService } from '../../services/objetivos.service';

@Component({
  selector: 'app-planificacion-objetivos',
  standalone: false,
  templateUrl: './planificacion-objetivos.component.html',
  styleUrls: ['./planificacion-objetivos.component.css']
})
export class PlanificacionObjetivosComponent implements OnInit {

  stats = {
    total: 0,
    cumplidos: 0,
    planificados: 0,
    pendientes: 0
  };

  displayedColumns: string[] = [
    'objetivo',
    'proceso',
    'norma',
    'indicador',
    'base',
    'meta',
    'frecuencia',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private objetivosService: ObjetivosService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    this.objetivosService.getListadoObjetivos().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            id: item.id_Objetivo,
            codigo: item.codigo,
            objetivo: item.nombre,
            proceso: item.proceso || 'General',
            norma: item.norma || 'ISO 9001:2015',
            indicador: item.indicador || '% cumplimiento',
            base: item.base || '0%',
            meta: item.meta !== null && item.meta !== undefined ? item.meta.toString() : '0',
            frecuencia: item.frecuencia || 'Mensual',
            estado: 'Planificado',
            desc: item.nombre
          }));
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: (err) => {
        console.error('Error al listar Objetivos:', err);
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      cumplidos: data.filter(d => (d.estado || '').toLowerCase().includes('cumplid')).length,
      planificados: data.filter(d => (d.estado || '').toLowerCase().includes('planificad')).length,
      pendientes: data.filter(d => (d.estado || '').toLowerCase().includes('pendient')).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'pendiente';
    const s = estado.toLowerCase().trim();
    if (s.includes('cumplid')) return 'cumplido';
    if (s.includes('planificad')) return 'planificado';
    return 'pendiente';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Registrar objetivo .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;
        const generatedCode = 'OBJ-' + Date.now().toString().slice(-4);

        const payload = {
          Accion: 'I',
          Codigo: res.codigo || generatedCode,
          Nombre: res.objetivo || res.nombre,
          Proceso: res.proceso || 'General',
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo registrado en la BD correctamente.', '', { timeOut: 2500 });
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
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar objetivo .::',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;

        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Nombre: res.objetivo || res.nombre,
          Proceso: res.proceso || 'General',
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo actualizado en la BD correctamente.', '', { timeOut: 2500 });
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
      title: '¿Desea eliminar el objetivo?, Confirme',
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
          Codigo: item.codigo,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo eliminado correctamente.', '', { timeOut: 2500 });
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
