import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { PlanificacionObjetivosRegeditComponent } from './planificacion-objetivos-regedit/planificacion-objetivos-regedit.component';

const STORAGE_KEY = 'precotex_objetivos';

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

  private readonly seedData = [
    {
      id: 'OBJ-001',
      objetivo: 'Reducir defectos de calidad',
      proceso: 'Calidad',
      norma: 'ISO 9001:2015',
      indicador: '% piezas defectuosas',
      base: '12%',
      meta: '≤10%',
      frecuencia: 'Mensual',
      estado: 'Planificado',
      desc: 'Reforzar control en primera inspección.'
    },
    {
      id: 'OBJ-002',
      objetivo: 'Cero accidentes en planta',
      proceso: 'SSOMA',
      norma: 'ISO 45001:2018',
      indicador: 'N° accidentes',
      base: '2 en 2024',
      meta: '0',
      frecuencia: 'Trimestral',
      estado: 'Planificado',
      desc: 'Programa de prevención y capacitación.'
    },
    {
      id: 'OBJ-003',
      objetivo: 'Reducir merma de tela',
      proceso: 'Corte',
      norma: 'ISO 9001:2015',
      indicador: 'Sin definir',
      base: '18%',
      meta: '≤8%',
      frecuencia: 'Mensual',
      estado: 'Pendiente',
      desc: 'Optimizar tendido de tela.'
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
      cumplidos: data.filter(d => d.estado === 'Cumplido').length,
      planificados: data.filter(d => d.estado === 'Planificado').length,
      pendientes: data.filter(d => d.estado === 'Pendiente').length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'planificado';
    const s = estado.toLowerCase().trim();
    if (s.includes('cumplido')) return 'cumplido';
    if (s.includes('pendiente')) return 'pendiente';
    return 'planificado';
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
        Title: '::. Registrar objetivo planificado .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const local = localStorage.getItem(STORAGE_KEY);
        const data = local ? JSON.parse(local) : [];
        const newRecord = {
          id: 'OBJ-' + Date.now(),
          ...res
        };
        data.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.toastr.success('Objetivo guardado correctamente.', '', { timeOut: 2500 });
        this.onListado();
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar objetivo planificado .::',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.map((d: any) => d.id === item.id ? { id: item.id, ...res } : d);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Objetivo actualizado correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
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
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.filter((d: any) => d.id !== item.id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Objetivo eliminado correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }
}
