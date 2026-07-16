import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MedicionRegeditComponent } from './medicion-regedit/medicion-regedit.component';

const STORAGE_KEY = 'precotex_mediciones_ind';

@Component({
  selector: 'app-medicion-indicadores',
  standalone: false,
  templateUrl: './medicion-indicadores.component.html',
  styleUrls: ['./medicion-indicadores.component.css']
})
export class MedicionIndicadoresComponent implements OnInit {

  stats = {
    total: 0,
    enMeta: 0,
    enRiesgo: 0,
    criticos: 0
  };

  displayedColumns: string[] = [
    'indicador',
    'sede',
    'proceso',
    'meta',
    'valor',
    'periodo',
    'semaforo',
    'tendencia',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  private readonly seedData = [
    {
      id: 'MED-001',
      indicador: '% eficiencia de línea',
      sede: 'Huachipa 1',
      proceso: 'Costura',
      meta: '≥85%',
      valor: '87%',
      periodo: 'Junio 2025',
      semaforo: 'En meta',
      obs: ''
    },
    {
      id: 'MED-002',
      indicador: '% merma de tela',
      sede: 'Huachipa 1',
      proceso: 'Corte',
      meta: '≤8%',
      valor: '15%',
      periodo: 'Junio 2025',
      semaforo: 'Crítico',
      obs: 'Revisar tendido de tela.'
    },
    {
      id: 'MED-003',
      indicador: '% piezas aprobadas 1er control',
      sede: 'Huachipa 2',
      proceso: 'Calidad',
      meta: '≥95%',
      valor: '91%',
      periodo: 'Junio 2025',
      semaforo: 'En riesgo',
      obs: ''
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
      enMeta: data.filter(d => d.semaforo === 'En meta').length,
      enRiesgo: data.filter(d => d.semaforo === 'En riesgo').length,
      criticos: data.filter(d => d.semaforo === 'Crítico').length
    };
  }

  getSemaforoClass(semaforo: string): string {
    if (!semaforo) return 'pendiente';
    const s = semaforo.toLowerCase().trim();
    if (s.includes('meta')) return 'completada';
    if (s.includes('riesgo')) return 'en-ejecucion';
    if (s.includes('crítico') || s.includes('critico')) return 'vencida';
    return 'pendiente';
  }

  getSemaforoColor(semaforo: string): string {
    if (!semaforo) return '#94a3b8';
    const s = semaforo.toLowerCase().trim();
    if (s.includes('meta')) return '#3ecf8e';
    if (s.includes('riesgo')) return '#f0b429';
    if (s.includes('crítico') || s.includes('critico')) return '#f0576b';
    return '#94a3b8';
  }

  getDonutDashArray(count: number): string {
    const total = this.stats.total || 1;
    const pct = Math.round((count / total) * 100);
    return `${pct} ${100 - pct}`;
  }

  getDonutPercentage(count: number): number {
    const total = this.stats.total || 1;
    return Math.round((count / total) * 100);
  }

  getSparklinePoints(id: string): string {
    let x = 0;
    const str = id || 'xyz';
    for (let i = 0; i < str.length; i++) {
      x = (x * 31 + str.charCodeAt(i)) >>> 0;
    }
    const rnd = () => {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return x / 0x7fffffff;
    };
    const n = 9;
    const w = 78;
    const h = 24;
    const pad = 3;
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      pts.push(0.2 + rnd() * 0.7);
    }
    const step = (w - pad * 2) / (n - 1);
    const path = pts.map((p, i) => `${(pad + i * step).toFixed(1)},${(h - pad - p * (h - pad * 2)).toFixed(1)}`).join(' ');
    return path;
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(MedicionRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Registrar medición de indicador .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const local = localStorage.getItem(STORAGE_KEY);
        const data = local ? JSON.parse(local) : [];
        const newRecord = {
          id: 'MED-' + Date.now(),
          ...res
        };
        data.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.toastr.success('Medición guardada correctamente.', '', { timeOut: 2500 });
        this.onListado();
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(MedicionRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar medición de indicador .::',
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
          this.toastr.success('Medición actualizada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar la medición?, Confirme',
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
          this.toastr.success('Medición eliminada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }
}
