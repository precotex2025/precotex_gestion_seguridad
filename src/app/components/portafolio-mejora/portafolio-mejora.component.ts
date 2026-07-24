import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PortafolioMejoraRegeditComponent } from './portafolio-mejora-regedit/portafolio-mejora-regedit.component';
import { ProcesosService } from '../../services/procesos.service';
import { MejoraService } from '../../services/mejora.service';

@Component({
  selector: 'app-portafolio-mejora',
  standalone: false,
  templateUrl: './portafolio-mejora.component.html',
  styleUrls: ['./portafolio-mejora.component.css']
})
export class PortafolioMejoraComponent implements OnInit {
  mejoraList: any[] = [];
  filteredList: any[] = [];
  searchText: string = '';
  selectedProceso: string = 'Todos';

  stats = {
    total: 0,
    enProceso: 0,
    cerrado: 0,
    vencido: 0
  };

  mostrarArchivosSubidos: boolean = false;
  procesosGroups: { [key: string]: string[] } = {};

  displayedColumns: string[] = [
    'titulo',
    'herramienta',
    'proceso',
    'sede',
    'apertura',
    'limite',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private mejoraService: MejoraService
  ) {}

  ngOnInit(): void {
    this.onListado();
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = groups;
        }
      }
    });
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onListado() {
    this.mejoraService.getListadoMejoras().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.mejoraList = res.elements.map((item: any) => ({
            id: item.id_Mejora,
            codigo: item.codigo,
            titulo: item.descripcion,
            proceso: item.nombre_Proceso || item.codigo_Proceso,
            sede: item.sede || 'Huachipa 1',
            herramienta: item.herramienta || item.fuente || '5W-2H',
            proveniente: item.proveniente || '—',
            apertura: item.fecha_Inicio ? item.fecha_Inicio.split('T')[0] : '',
            limite: item.fecha_Fin_Estimada ? item.fecha_Fin_Estimada.split('T')[0] : '',
            estado: item.estado || 'En proceso',
            responsable: item.responsable || 'Carlos Ríos',
            cumplimiento: item.cumplimiento || 0,
            archivo: item.archivo || ''
          }));
        } else {
          this.mejoraList = [];
        }
        this.calculateStats();
        this.applyFilter();
      },
      error: (err) => {
        console.error('Error al consultar BD de Mejoras:', err);
        this.toastr.error('Error al cargar datos desde la base de datos.', 'Error BD');
        this.mejoraList = [];
        this.calculateStats();
        this.applyFilter();
      }
    });
  }

  calculateStats() {
    this.stats.total = this.mejoraList.length;
    this.stats.enProceso = this.mejoraList.filter(m => (m.estado || '').toLowerCase() === 'en proceso').length;
    this.stats.cerrado = this.mejoraList.filter(m => (m.estado || '').toLowerCase() === 'cerrado').length;
    this.stats.vencido = this.mejoraList.filter(m => (m.estado || '').toLowerCase() === 'vencido').length;
  }

  // GETTERS PARA DISTRIBUCIÓN Y GRÁFICO DONUT
  get count5W2H(): number {
    return this.mejoraList.filter(m => m.herramienta === '5W-2H').length;
  }

  get countACR(): number {
    return this.mejoraList.filter(m => m.herramienta === 'ACR').length;
  }

  get countIniciativas(): number {
    return this.mejoraList.filter(m => m.herramienta === 'Iniciativa').length;
  }

  get pct5W2H(): number {
    return this.stats.total ? Math.round((this.count5W2H / this.stats.total) * 100) : 0;
  }

  get pctACR(): number {
    return this.stats.total ? Math.round((this.countACR / this.stats.total) * 100) : 0;
  }

  get pctIniciativas(): number {
    return this.stats.total ? Math.round((this.countIniciativas / this.stats.total) * 100) : 0;
  }

  // SEGMENTOS SVG DEL DONUT
  get offsetACR(): number {
    return 25 - this.pct5W2H;
  }

  get offsetIniciativas(): number {
    return 25 - this.pct5W2H - this.pctACR;
  }

  // ANALÍTICA: REGISTROS POR PROCESO Y META VS REAL
  get procesosUnicos(): string[] {
    const list = this.mejoraList.map(m => m.proceso).filter(Boolean);
    const set = Array.from(new Set(list));
    if (set.length === 0) {
      return ['Costura', 'Corte', 'Aseguramiento de Calidad Textil', 'SSOMA'];
    }
    return set.slice(0, 7);
  }

  get maxTotalProceso(): number {
    const totals = this.procesosUnicos.map(p => this.mejoraList.filter(m => m.proceso === p).length);
    return Math.max(1, ...totals);
  }

  getProcesoBreakdown(proc: string) {
    const rows = this.mejoraList.filter(m => m.proceso === proc);
    const n5 = rows.filter(m => m.herramienta === '5W-2H').length;
    const na = rows.filter(m => m.herramienta === 'ACR').length;
    const ni = rows.filter(m => m.herramienta === 'Iniciativa').length;
    const max = this.maxTotalProceso;

    return {
      n5,
      na,
      ni,
      pct5: (n5 / max) * 100,
      pctA: (na / max) * 100,
      pctI: (ni / max) * 100
    };
  }

  getMetaInfo(proc: string) {
    const real = this.mejoraList.filter(m => m.proceso === proc).length;
    const meta = 3;
    const cumple = real >= meta;
    const color = cumple ? '#3ecf8e' : (real >= 1 ? '#f0b429' : '#f0576b');
    const pct = Math.min((real / meta) * 100, 100);

    return { real, meta, cumple, color, pct };
  }

  get archivosAdjuntosList(): any[] {
    return this.mejoraList.filter(m => m.archivo && m.archivo.trim().length > 0);
  }

  onToggleArchivosSubidos(): void {
    this.mostrarArchivosSubidos = !this.mostrarArchivosSubidos;
  }

  selectProceso(proc: string) {
    this.selectedProceso = proc;
    this.applyFilter();
  }

  buscar(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchText = val;
    this.applyFilter();
  }

  applyFilter() {
    let list = [...this.mejoraList];

    if (this.selectedProceso !== 'Todos') {
      list = list.filter(m => m.proceso === this.selectedProceso);
    }

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      list = list.filter(m =>
        (m.titulo || '').toLowerCase().includes(q) ||
        (m.proceso || '').toLowerCase().includes(q) ||
        (m.sede || '').toLowerCase().includes(q) ||
        (m.herramienta || '').toLowerCase().includes(q) ||
        (m.estado || '').toLowerCase().includes(q)
      );
    }

    this.dataSource.data = list;
  }

  onAgregar() {
    const dialogRef = this.dialog.open(PortafolioMejoraRegeditComponent, {
      width: '780px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Registrar iniciativa',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'I',
          Codigo: '',
          Fuente: res.herramienta,
          Herramienta: res.herramienta,
          Codigo_Proceso: res.proceso,
          Descripcion: res.titulo.trim(),
          Responsable: 'Carlos Ríos',
          Sede: res.sede,
          Proveniente: res.proveniente,
          Fecha_Inicio: res.apertura,
          Fecha_Fin_Estimada: res.limite,
          Estado: res.estado,
          Archivo: res.archivo || '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.mejoraService.postMejoraMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.success('Iniciativa registrada y guardada en BD.', 'Registrado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al guardar la iniciativa.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEditar(item: any) {
    const dialogRef = this.dialog.open(PortafolioMejoraRegeditComponent, {
      width: '780px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar iniciativa',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Fuente: res.herramienta,
          Herramienta: res.herramienta,
          Codigo_Proceso: res.proceso,
          Descripcion: res.titulo.trim(),
          Responsable: item.responsable || 'Carlos Ríos',
          Sede: res.sede,
          Proveniente: res.proveniente,
          Fecha_Inicio: res.apertura,
          Fecha_Fin_Estimada: res.limite,
          Estado: res.estado,
          Archivo: res.archivo || item.archivo || '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.mejoraService.postMejoraMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.success('Iniciativa actualizada en BD.', 'Actualizado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al actualizar la iniciativa.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: `¿Desea eliminar la iniciativa "${item.titulo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          Accion: 'D',
          Codigo: item.codigo,
          Usuario_Registro: 'SISTEMAS'
        };

        this.mejoraService.postMejoraMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.warning('Iniciativa eliminada de BD.', 'Eliminado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al eliminar.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onDescargarArchivo(item: any): void {
    if (!item.archivo) {
      this.toastr.warning('Esta iniciativa no tiene ningún archivo adjunto.', 'Sin Archivo');
      return;
    }
    const downloadUrl = this.mejoraService.getDownloadUrl(item.archivo);
    window.open(downloadUrl, '_blank');
  }

  onExportarExcel(): void {
    const rows = this.dataSource.data;
    if (!rows.length) {
      this.toastr.warning('No hay datos para exportar a Excel.', 'Exportar');
      return;
    }

    let t = '<table border="1"><tr><th>Código</th><th>Título</th><th>Proceso</th><th>Sede</th><th>Herramienta</th><th>Proveniente de</th><th>Apertura</th><th>Límite</th><th>Estado</th></tr>';
    rows.forEach(d => {
      t += `<tr><td>${d.codigo || ''}</td><td>${d.titulo || ''}</td><td>${d.proceso || ''}</td><td>${d.sede || ''}</td><td>${d.herramienta || ''}</td><td>${d.proveniente || ''}</td><td>${d.apertura || ''}</td><td>${d.limite || ''}</td><td>${d.estado || ''}</td></tr>`;
    });
    t += '</table>';

    const blob = new Blob(['\ufeff<html><head><meta charset="utf-8"></head><body>' + t + '</body></html>'], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portafolio_mejora_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Archivo Excel descargado correctamente.', 'Exportar Excel');
  }

  onExportarPDF(): void {
    const rows = this.dataSource.data;
    if (!rows.length) {
      this.toastr.warning('No hay datos para exportar a PDF.', 'Exportar');
      return;
    }

    const head = '<th>Código</th><th>Título</th><th>Proceso</th><th>Sede</th><th>Herramienta</th><th>Estado</th>';
    const body = rows.map(d => `<tr><td>${d.codigo || ''}</td><td>${d.titulo || ''}</td><td>${d.proceso || ''}</td><td>${d.sede || ''}</td><td>${d.herramienta || ''}</td><td>${d.estado || ''}</td></tr>`).join('');
    
    const w = window.open('', '_blank');
    if (!w) {
      this.toastr.error('Por favor permite las ventanas emergentes.', 'Error Exportar');
      return;
    }

    w.document.write(`<html><head><title>Portafolio de Mejora — Precotex</title><style>body{font-family:sans-serif;padding:20px;color:#333}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h2>Portafolio de Mejora — Precotex</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  }

  countProceso(proc: string): number {
    return this.mejoraList.filter(m => m.proceso === proc).length;
  }
}
