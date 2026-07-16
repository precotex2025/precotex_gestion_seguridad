import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AnalyticsRegeditComponent } from './analytics-regedit/analytics-regedit.component';

const STORAGE_KEY = 'precotex_indicadores';

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

  private readonly seedData = [
    {
      codigo: 'IND-COS-001',
      nombre: '% eficiencia de línea',
      tipo: 'Eficacia',
      norma: 'ISO 9001:2015',
      responsable: 'Jefe Costura',
      respmed: 'Supervisor',
      estado: 'Activo',
      sede: 'Sede Ate',
      proceso: 'Costura',
      areasacc: 'Costura, Gerencia',
      inicio: '2025-01-01',
      fin: '2025-12-31',
      frecuencia: 'Diario',
      fuente: 'Reporte de producción',
      formula: '(Piezas conformes / Piezas producidas) × 100',
      unidad: 'Porcentaje (%)',
      base: '79%',
      meta: '≥85%',
      tipometa: 'Mayor o igual (≥)',
      sentido: '↑ Sube es bueno'
    },
    {
      codigo: 'IND-COR-001',
      nombre: '% merma de tela',
      tipo: 'Eficiencia',
      norma: 'ISO 9001:2015',
      responsable: 'Jefe Corte',
      respmed: 'Supervisor',
      estado: 'Activo',
      sede: 'Sede Central — Lima',
      proceso: 'Corte',
      areasacc: 'Corte',
      inicio: '2025-01-01',
      fin: '2025-12-31',
      frecuencia: 'Semanal',
      fuente: 'Reporte de producción',
      formula: '(Tela desperdiciada / Tela total) × 100',
      unidad: 'Porcentaje (%)',
      base: '12%',
      meta: '≤8%',
      tipometa: 'Menor o igual (≤)',
      sentido: '↓ Baja es bueno'
    },
    {
      codigo: 'IND-SSO-001',
      nombre: 'N° inspecciones realizadas vs prog.',
      tipo: 'Efectividad',
      norma: 'ISO 45001:2018',
      responsable: 'Jefe SSOMA',
      respmed: 'Jefe SSOMA',
      estado: 'Activo',
      sede: 'Todas',
      proceso: 'SSOMA',
      areasacc: 'SSOMA',
      inicio: '2025-01-01',
      fin: '2025-12-31',
      frecuencia: 'Mensual',
      fuente: 'Reporte SSOMA',
      formula: '(Inspecciones realizadas / Programadas) × 100',
      unidad: 'Porcentaje (%)',
      base: '80%',
      meta: '=100%',
      tipometa: 'Igual (=)',
      sentido: '↑ Sube es bueno'
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
      activos: data.filter(d => d.estado === 'Activo').length,
      inactivos: data.filter(d => d.estado === 'Inactivo').length
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
        const local = localStorage.getItem(STORAGE_KEY);
        const data = local ? JSON.parse(local) : [];
        if (data.some((d: any) => d.codigo === res.codigo)) {
          this.toastr.warning('El código del indicador ya existe.', 'Código Duplicado');
          return;
        }
        data.unshift(res);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.toastr.success('Indicador guardado correctamente.', '', { timeOut: 2500 });
        this.onListado();
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
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.map((d: any) => d.codigo === item.codigo ? res : d);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Indicador actualizado correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
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
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.filter((d: any) => d.codigo !== item.codigo);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Indicador eliminado correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }
}
