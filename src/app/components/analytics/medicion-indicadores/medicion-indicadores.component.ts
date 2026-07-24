import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MedicionRegeditComponent } from './medicion-regedit/medicion-regedit.component';
import { IndicadoresService } from '../../../services/indicadores.service';

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

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private indicadoresService: IndicadoresService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    this.indicadoresService.getListadoIndicadorMediciones().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            id: item.id_Medicion,
            idMedicion: item.id_Medicion,
            idIndicador: item.id_Indicador,
            codigoIndicador: item.codigo_Indicador,
            indicador: item.nombre_Indicador || item.codigo_Indicador,
            sede: 'Todas',
            proceso: item.nombre_Proceso || 'General',
            meta: item.meta !== null && item.meta !== undefined ? item.meta.toString() + (item.unidad_Medida || '%') : '0%',
            valor: item.valor_Obtenido !== null && item.valor_Obtenido !== undefined ? item.valor_Obtenido.toString() + '%' : '0%',
            valorNumerico: item.valor_Obtenido,
            periodo: item.periodo,
            semaforo: item.semaforo || 'En meta',
            obs: item.comentario
          }));
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: (err) => {
        console.error('Error al listar mediciones:', err);
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      enMeta: data.filter(d => (d.semaforo || '').toLowerCase().includes('meta')).length,
      enRiesgo: data.filter(d => (d.semaforo || '').toLowerCase().includes('riesgo')).length,
      criticos: data.filter(d => (d.semaforo || '').toLowerCase().includes('crítico') || (d.semaforo || '').toLowerCase().includes('critico')).length
    };
  }

  getSemaforoClass(semaforo: string): string {
    if (!semaforo) return 'en-meta';
    const s = semaforo.toLowerCase().trim();
    if (s.includes('meta')) return 'en-meta';
    if (s.includes('riesgo')) return 'en-riesgo';
    if (s.includes('crítico') || s.includes('critico')) return 'critico';
    return 'en-meta';
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
    const str = String(id || 'xyz');
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
        const numericVal = parseFloat(String(res.valor).replace(/[^0-9.]/g, '')) || 0;

        const payload = {
          Accion: 'I',
          Id_Indicador: res.idIndicador || null,
          Codigo_Indicador: res.codigoIndicador || 'HCP-ABO-001',
          Periodo: res.periodo || 'Ene-2026',
          Valor_Obtenido: numericVal,
          Comentario: res.obs || '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.indicadoresService.postProcesoMntoIndicadorMedicion(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Medición registrada en la BD correctamente.', '', { timeOut: 2500 });
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
        const numericVal = parseFloat(String(res.valor).replace(/[^0-9.]/g, '')) || 0;

        const payload = {
          Accion: 'U',
          Id_Medicion: item.idMedicion || item.id,
          Id_Indicador: res.idIndicador || item.idIndicador,
          Codigo_Indicador: res.codigoIndicador || item.codigoIndicador,
          Periodo: res.periodo || 'Ene-2026',
          Valor_Obtenido: numericVal,
          Comentario: res.obs || '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.indicadoresService.postProcesoMntoIndicadorMedicion(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Medición actualizada en la BD correctamente.', '', { timeOut: 2500 });
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
      title: '¿Desea eliminar la medición?, Confirme',
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
          Id_Medicion: item.idMedicion || item.id,
          Usuario_Registro: 'SISTEMAS'
        };

        this.indicadoresService.postProcesoMntoIndicadorMedicion(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Medición eliminada correctamente.', '', { timeOut: 2500 });
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
