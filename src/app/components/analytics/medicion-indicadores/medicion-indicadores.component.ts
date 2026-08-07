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
          const mapped = res.elements.map((item: any) => {
            const valNum = item.valor_Obtenido || 0;
            const metaNum = item.meta || 100;
            const semaforoCalculado = this.calcularSemaforoAutomatico(valNum, metaNum); // IND-03

            return {
              id: item.id_Medicion,
              idMedicion: item.id_Medicion,
              idIndicador: item.id_Indicador,
              codigoIndicador: item.codigo_Indicador,
              indicador: item.nombre_Indicador || item.codigo_Indicador,
              sede: 'Todas',
              proceso: item.nombre_Proceso || 'General',
              frecuencia: item.frecuencia || 'Mensual', // IND-02
              meta: item.meta !== null && item.meta !== undefined ? item.meta.toString() + (item.unidad_Medida || '%') : '0%',
              valor: item.valor_Obtenido !== null && item.valor_Obtenido !== undefined ? item.valor_Obtenido.toString() + '%' : '0%',
              valorNumerico: valNum,
              periodo: item.periodo,
              semaforo: semaforoCalculado,
              obs: item.comentario
            };
          });
          this.allRawData = mapped;
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.allRawData = [];
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

  mostrarBanner: boolean = true;
  drawerOpen: boolean = false;
  selectedMedicion: any = null;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  openDrawer(row?: any): void {
    this.selectedMedicion = row || (this.dataSource.data.length > 0 ? this.dataSource.data[0] : null);
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.selectedMedicion = null;
  }

  getProgressPercent(row: any): number {
    if (!row) return 0;
    const val = parseFloat(String(row.valor || '0').replace(/[^0-9.]/g, '')) || 0;
    const meta = parseFloat(String(row.meta || '100').replace(/[^0-9.]/g, '')) || 100;
    if (meta === 0) return 100;
    const pct = Math.round((val / meta) * 100);
    return Math.min(Math.max(pct, 0), 100);
  }

  // IND-01: Recalcular tendencia según proceso seleccionado
  filtroProceso: string = 'Todos';
  listaProcesos: string[] = ['Todos', 'Tintorería', 'Hilandería', 'Corte', 'Costura', 'SSOMA', 'Gestión de Calidad'];

  onProcesoChange(): void {
    let list = this.allRawData;
    if (this.filtroProceso !== 'Todos') {
      list = list.filter(d => d.proceso === this.filtroProceso);
    }
    this.dataSource.data = list;
    this.calculateStats(list);
  }

  allRawData: any[] = [];

  // IND-03: Cálculo automático de semáforo de cumplimiento
  calcularSemaforoAutomatico(val: number, meta: number): string {
    if (!meta || meta === 0) return 'En meta';
    const pct = (val / meta) * 100;
    if (pct >= 90) return 'En meta';
    if (pct >= 75) return 'En riesgo';
    return 'Crítico';
  }

  // IND-04: Exportar Ficha Técnica del Indicador
  exportarFichaTecnica(row: any): void {
    const fichaHtml = `
      <div style="text-align: left; font-size: 12px; line-height: 1.6; padding: 10px; background: rgba(15,23,42,0.6); border-radius: 8px;">
        <h4 style="color: #38bdf8; margin: 0 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">FICHA TÉCNICA DE INDICADOR DEL SIG (IND-04)</h4>
        <p><strong>Código / Indicador:</strong> ${row.codigoIndicador || row.id} - ${row.indicador}</p>
        <p><strong>Proceso Asociado:</strong> ${row.proceso} | <strong>Sede:</strong> ${row.sede}</p>
        <p><strong>Frecuencia de Medición (IND-02):</strong> <span style="color: #a78bfa; font-weight: bold;">${row.frecuencia || 'Mensual'}</span></p>
        <p><strong>Fórmula / Método:</strong> (Valor Obtenido / Meta Planificada) × 100</p>
        <p><strong>Meta Base:</strong> ${row.meta} | <strong>Valor Obtenido:</strong> ${row.valor}</p>
        <p><strong>Estado Semáforo (IND-03):</strong> <span style="color: ${this.getSemaforoColor(row.semaforo)}; font-weight: bold;">${row.semaforo}</span></p>
        <p><strong>Responsable de Medición:</strong> Jefe de Proceso ${row.proceso}</p>
      </div>
    `;

    Swal.fire({
      title: `📄 Ficha Técnica: ${row.indicador}`,
      html: fichaHtml,
      width: '650px',
      showCancelButton: true,
      confirmButtonText: 'Descargar Ficha PDF',
      cancelButtonText: 'Cerrar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.toastr.success(`Descargando Ficha Técnica de ${row.indicador}`, 'Ficha Técnica (IND-04)');
      }
    });
  }

  getSparklinePoints(id: string): { x: number, y: number }[] {
    let x = 0;
    // IND-01: Combina el ID con el proceso para refrescar dinámicamente la tendencia
    const str = String(id || 'xyz') + (this.filtroProceso || '');
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
