import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AnalyticsRegeditComponent } from './analytics-regedit/analytics-regedit.component';
import { AnalyticsDetalleComponent } from './analytics-detalle/analytics-detalle.component';
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

  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'tipo',
    'sede',
    'norma',
    'frecuencia',
    'meta',
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
    this.indicadoresService.getListadoIndicadores().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          const mapped = res.elements.map((item: any) => ({
            codigo: item.codigo,
            nombre: item.nombre,
            tipo: item.tipo || 'Eficiencia',
            sede: item.sede || 'Sede Huachipa',
            proceso: item.nombre_Proceso || item.codigo_Proceso || 'General',
            codigoProceso: item.codigo_Proceso,
            norma: item.norma || 'ISO 9001:2015',
            frecuencia: item.frecuencia || 'Mensual',
            unidad: item.unidad_Medida || '%',
            meta: item.meta !== null && item.meta !== undefined ? item.meta.toString() : '0',
            estado: item.estado || 'Activo',
            idIndicador: item.id_Indicador
          }));
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.cargarIndicadoresDefault();
        }
      },
      error: (err) => {
        console.warn('Backend aún no responde o retornó 400. Cargando catálogo base local:', err);
        this.cargarIndicadoresDefault();
      }
    });
  }

  cargarIndicadoresDefault(): void {
    const defaultData = [
      { codigo: 'IND-COS-001', nombre: '% Eficiencia de Costura', tipo: 'Eficiencia', sede: 'Sede Huachipa', proceso: 'Costura', norma: 'ISO 9001:2015', frecuencia: 'Mensual', meta: '85', unidad: '%', estado: 'Activo' },
      { codigo: 'IND-SST-002', nombre: 'Índice de Frecuencia de Accidentes (IFA)', tipo: 'Eficacia', sede: 'Todas', proceso: 'SSOMA', norma: 'ISO 45001:2018', frecuencia: 'Mensual', meta: '2.5', unidad: 'Índice', estado: 'Activo' },
      { codigo: 'IND-CAL-003', nombre: '% Auditorías de Calidad Aprobadas', tipo: 'Efectividad', sede: 'Sede Huachipa', proceso: 'Gestión de Calidad', norma: 'ISO 9001:2015', frecuencia: 'Trimestral', meta: '95', unidad: '%', estado: 'Activo' },
      { codigo: 'IND-TIN-004', nombre: 'Rendimiento de Tintorería', tipo: 'Eficiencia', sede: 'Sede Santa Cecilia', proceso: 'Tintorería', norma: 'ISO 14001:2015', frecuencia: 'Mensual', meta: '90', unidad: '%', estado: 'Activo' }
    ];
    this.dataSource.data = defaultData;
    this.calculateStats(defaultData);
  }

  getSemaforoColor(estado: string): string {
    if (!estado) return '#3ecf8e';
    const s = estado.toLowerCase().trim();
    if (s.includes('activo')) return '#3ecf8e';
    return '#f0576b';
  }

  getSparklinePoints(id: string): { x: number, y: number }[] {
    let x = 0;
    const str = String(id || 'xyz');
    for (let i = 0; i < str.length; i++) {
      x = (x * 31 + str.charCodeAt(i)) >>> 0;
    }
    const rnd = () => {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return x / 0x7fffffff;
    };
    const n = 6;
    const w = 84;
    const h = 28;
    const pad = 4;
    const pts: { x: number, y: number }[] = [];
    const step = (w - pad * 2) / (n - 1);
    for (let i = 0; i < n; i++) {
      const px = pad + i * step;
      const py = h - pad - (0.25 + rnd() * 0.65) * (h - pad * 2);
      pts.push({ x: px, y: py });
    }
    return pts;
  }

  getSparklineLinePath(id: string): string {
    const pts = this.getSparklinePoints(id);
    if (!pts || pts.length === 0) return 'M 0 20 L 80 20';
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = (prev.x + curr.x) / 2;
      path += ` C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    return path;
  }

  getSparklineAreaPath(id: string): string {
    const linePath = this.getSparklineLinePath(id);
    const pts = this.getSparklinePoints(id);
    const lastX = pts[pts.length - 1].x.toFixed(1);
    const firstX = pts[0].x.toFixed(1);
    return `${linePath} L ${lastX} 28 L ${firstX} 28 Z`;
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
    let nextNum = 1;
    if (this.dataSource.data && this.dataSource.data.length > 0) {
      const nums = this.dataSource.data
        .map(d => {
          const match = String(d.codigo || '').match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
      nextNum = nums.length > 0 ? Math.max(...nums) + 1 : this.dataSource.data.length + 1;
    }
    const currentYear = new Date().getFullYear();
    const generatedCode = `IND-${currentYear}-${String(nextNum).padStart(3, '0')}`;

    const dialogRef = this.dialog.open(AnalyticsRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: '::. Registrar indicador .::',
        Accion: 'I',
        Datos: {
          codigo: generatedCode
        }
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
          Tipo: res.tipo || 'Eficacia',
          Sede: res.sede || 'Todas',
          Norma: res.norma || 'ISO 9001:2015',
          Codigo_Proceso: res.proceso || '001',
          Nombre_Proceso: res.proceso || 'General',
          Unidad_Medida: res.unidad || '%',
          Meta: numericMeta,
          Frecuencia: res.frecuencia || 'Mensual',
          Usuario_Registro: 'SISTEMAS'
        };

        // Sincronizar inmediatamente en catálogo local (IND-10)
        const localInds = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
        const newLocalItem = {
          id: Date.now(),
          codigo: res.codigo,
          nombre: res.nombre,
          tipo: res.tipo || 'Eficacia',
          sede: res.sede || 'Todas',
          norma: res.norma || 'ISO 9001:2015',
          proceso: res.proceso || 'General',
          meta: numericMeta,
          frecuencia: res.frecuencia || 'Mensual',
          unidad: res.unidad || '%',
          estado: 'Activo'
        };
        const updatedCatalog = [newLocalItem, ...localInds.filter((i: any) => i.codigo !== res.codigo)];
        localStorage.setItem('precotex_indicadores', JSON.stringify(updatedCatalog));

        this.indicadoresService.postIndicadorMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Indicador registrado en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al registrar', 'Error BD');
              this.onListado();
            }
          },
          error: (err) => {
            this.toastr.info('Indicador guardado en memoria local.', 'Registro Offline');
            this.onListado();
          }
        });
      }
    });
  }

  onVerDetalle(item: any): void {
    const dialogRef = this.dialog.open(AnalyticsDetalleComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'custom-dialog-no-padding',
      data: {
        indicador: item
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
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
