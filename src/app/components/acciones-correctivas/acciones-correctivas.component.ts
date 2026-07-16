import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { PlanificarFormacionModalComponent } from './planificar-formacion-modal/planificar-formacion-modal.component';

const STORAGE_KEY = 'precotex_noconf';

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

  private readonly seedData = [
    {
      nc: 'NC-INT-2025-002',
      tipo: 'Interna',
      accion: 'Actualizar procedimiento costura v2.1',
      proceso: 'Costura',
      responsable: 'Carlos Ríos',
      inicio: '2025-06-14',
      limite: '2025-06-28',
      estado: 'Completada',
      desc: 'Actualización del procedimiento tras hallazgo.'
    },
    {
      nc: 'NC-EXT-2025-001',
      tipo: 'Externa',
      accion: 'Crear dashboard de indicadores',
      proceso: 'Calidad',
      responsable: 'Jordan Pinedo',
      inicio: '2025-07-01',
      limite: '2025-07-15',
      estado: 'En ejecución',
      desc: 'Implementar tablero visible de indicadores.'
    },
    {
      nc: 'NC-INT-2025-003',
      tipo: 'Interna',
      accion: 'Retomar medición indicadores de calidad',
      proceso: 'Calidad',
      responsable: 'Rosa Chávez',
      inicio: '2025-05-20',
      limite: '2025-06-30',
      estado: 'Vencida',
      desc: 'Regularizar mediciones pendientes.'
    }
  ];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const data = JSON.parse(local);
      this.dataSource.data = data;
      this.calculateStats(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.seedData));
      this.dataSource.data = this.seedData;
      this.calculateStats(this.seedData);
    }
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      completadas: data.filter(d => d.estado === 'Completada').length,
      enEjecucion: data.filter(d => d.estado === 'En ejecución').length,
      pendientes: data.filter(d => d.estado === 'Pendiente').length,
      vencidas: data.filter(d => d.estado === 'Vencida').length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'pendiente';
    const s = estado.toLowerCase().trim();
    if (s.includes('completada')) return 'completada';
    if (s.includes('ejecución') || s.includes('ejecucion')) return 'en-ejecucion';
    if (s.includes('pendiente')) return 'pendiente';
    if (s.includes('vencida')) return 'vencida';
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
        const local = localStorage.getItem(STORAGE_KEY);
        const data = local ? JSON.parse(local) : [];
        // Evitar duplicados de NC
        if (data.some((d: any) => d.nc === res.nc)) {
          this.toastr.warning('El código de NC ya existe.', 'Código Duplicado');
          return;
        }
        data.unshift(res);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.toastr.success('Acción correctiva agregada correctamente.', '', { timeOut: 2500 });
        this.onListado();
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
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.map((d: any) => d.nc === item.nc ? res : d);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Acción correctiva actualizada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
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
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.filter((d: any) => d.nc !== item.nc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Acción correctiva eliminada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }
}
