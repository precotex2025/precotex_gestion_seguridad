import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AnalyticsRegeditComponent } from './analytics-regedit/analytics-regedit.component';
import { IndicadoresService } from '../../services/indicadores.service';

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  stats = {
    total: 0,
    activos: 0,
    inactivos: 0
  };

  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'tipo',
    'proceso',
    'norma',
    'frecuencia',
    'meta',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private indicadoresService: IndicadoresService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    this.indicadoresService.getListadoIndicadores().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            codigo: item.codigo,
            nombre: item.nombre,
            tipo: item.tipo || 'Eficiencia',
            proceso: item.nombre_Proceso || item.codigo_Proceso || 'General',
            codigoProceso: item.codigo_Proceso,
            norma: item.norma || 'ISO 9001:2015',
            frecuencia: item.frecuencia || 'Mensual',
            unidad: item.unidad_Medida || '%',
            meta: item.meta !== null && item.meta !== undefined ? item.meta.toString() : '0',
            estado: 'Activo',
            idIndicador: item.id_Indicador
          }));
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: (err) => {
        console.error('Error al listar Indicadores:', err);
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      activos: data.filter(d => (d.estado || '').toLowerCase().includes('activo')).length,
      inactivos: data.filter(d => (d.estado || '').toLowerCase().includes('inactivo')).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'inactivo';
    const s = estado.toLowerCase().trim();
    return s.includes('activo') ? 'activo' : 'inactivo';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(AnalyticsRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Registrar indicador .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        // Formatear valor numérico de meta
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;

        const payload = {
          Accion: 'I',
          Codigo: res.codigo,
          Nombre: res.nombre,
          Codigo_Proceso: res.proceso || '001',
          Unidad_Medida: res.unidad || '%',
          Meta: numericMeta,
          Frecuencia: res.frecuencia || 'Mensual',
          Usuario_Registro: 'SISTEMAS'
        };

        this.indicadoresService.postIndicadorMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Indicador registrado en la BD correctamente.', '', { timeOut: 2500 });
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
    const dialogRef = this.dialog.open(AnalyticsRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar indicador .::',
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
          Nombre: res.nombre,
          Codigo_Proceso: res.proceso || '001',
          Unidad_Medida: res.unidad || '%',
          Meta: numericMeta,
          Frecuencia: res.frecuencia || 'Mensual',
          Usuario_Registro: 'SISTEMAS'
        };

        this.indicadoresService.postIndicadorMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Indicador actualizado en la BD correctamente.', '', { timeOut: 2500 });
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
      title: '¿Desea eliminar el indicador?, Confirme',
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

        this.indicadoresService.postIndicadorMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Indicador eliminado correctamente.', '', { timeOut: 2500 });
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
