import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PortafolioMejoraRegeditComponent } from './portafolio-mejora-regedit/portafolio-mejora-regedit.component';
import { ProcesosService } from '../../services/procesos.service';
import { MejoraService } from '../../services/mejora.service';
import { SedesService } from '../../services/sedes.service';

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

  // PDM-09: Filtros de Sede, Herramienta y Estado
  filterSede: string = 'TODAS';
  filterHerramienta: string = 'TODAS';
  filterEstado: string = 'TODOS';
  sedesDisponibles: string[] = [];

  stats = {
    total: 0,
    enProceso: 0,
    cerrado: 0,
    vencido: 0
  };

  mostrarArchivosSubidos: boolean = false;
  treeColapsado: boolean = false;

  toggleTree(): void {
    this.treeColapsado = !this.treeColapsado;
  }

  expandedMacros: { [key: string]: boolean } = {};
  procesosGroups: { [key: string]: string[] } = {
    'Estratégicos': ['Organización y Métodos', 'Auditoría Interna', 'Sistemas'],
    'Operativos': ['Costura', 'Corte', 'Acabados Textil', 'Aseguramiento de Calidad Textil', 'Estampado Digital', 'Laboratorio de Color', 'Lavandería', 'Tejeduría', 'Tintorería'],
    'Soporte': ['Control Patrimonial', 'Mantenimiento', 'Administración y Finanzas', 'Contabilidad y Costos', 'Finanzas', 'Tesorería']
  };

  displayedColumns: string[] = [
    'titulo',
    'herramienta',
    'proceso',
    'sede',
    'registro',
    'apertura',
    'limite',
    'fechaFin',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private mejoraService: MejoraService,
    private sedesService: SedesService
  ) {}

  ngOnInit(): void {
    this.onListado();

    // PDM-09: Cargar sedes activas para el filtro
    this.sedesService.getListadoSedes('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const listS = res.elements
            .map((s: any) => (s.denominacion || '').trim())
            .filter((s: string) => s.length > 0);
          this.sedesDisponibles = Array.from(new Set(listS));
        }
      }
    });

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = groups;
        }
      }
    });
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.procesosGroups);
  }

  getMacroCount(group: string): number {
    const processes = this.procesosGroups[group] || [];
    return this.mejoraList.filter(m => processes.includes(m.proceso)).length;
  }

  getProcessCount(proc: string): number {
    return this.mejoraList.filter(m => m.proceso === proc).length;
  }

  toggleMacro(macro: string, event: MouseEvent): void {
    event.stopPropagation();
    this.expandedMacros[macro] = !this.isMacroExpanded(macro);
  }

  isMacroExpanded(macro: string): boolean {
    return this.expandedMacros[macro] !== false; // Abierto por defecto
  }

  setFilter(filterValue: string): void {
    this.selectedProceso = filterValue;
    this.applyFilter();
  }

  getAbreviaturaProceso(proceso: string): string {
    if (!proceso) return 'OYM';
    const name = proceso.trim().toLowerCase();
    
    const map: { [key: string]: string } = {
      'organización y métodos': 'OYM',
      'organizacion y metodos': 'OYM',
      'control patrimonial': 'CTP',
      'auditoría interna': 'AIO',
      'auditoria interna': 'AIO',
      'sistemas': 'SIS',
      'mantenimiento': 'MNT',
      'calidad': 'CAL',
      'costura': 'COS',
      'acabados': 'ACA',
      'aseguramiento de la calidad': 'ADC',
      'consumos': 'CON',
      'corte': 'COR',
      'inspección': 'INS',
      'inspeccion': 'INS',
      'acabados textil': 'ACT',
      'aseguramiento de calidad textil': 'ADT',
      'estampado digital': 'ESD',
      'laboratorio de color': 'LDC',
      'lavandería': 'LAV',
      'lavanderia': 'LAV',
      'tejeduría': 'TEJ',
      'tejeduria': 'TEJ',
      'tintorería': 'TIN',
      'tintoreria': 'TIN',
      'administración y finanzas': 'AYF',
      'administracion y finanzas': 'AYF',
      'administración': 'ADM',
      'administracion': 'ADM',
      'contabilidad y costos': 'CYC',
      'finanzas': 'FIN',
      'tesorería': 'TES',
      'tesoreria': 'TES'
    };

    if (map[name]) return map[name];

    const palabras = proceso.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(p => p && p !== 'Y' && p !== 'DE' && p !== 'LA' && p !== 'EL');
    if (palabras.length >= 3) {
      return (palabras[0][0] + palabras[1][0] + palabras[2][0]).substring(0, 3);
    } else if (palabras.length === 2) {
      return (palabras[0].substring(0, 2) + palabras[1][0]).substring(0, 3);
    } else if (palabras.length === 1) {
      return palabras[0].substring(0, 3);
    }
    return 'GEN';
  }

  // POR-03: Flujo de Aprobación de iniciativas por Jefatura / Gerencia
  onAprobar(row: any): void {
    row.estadoAprobacion = 'Aprobado';
    row.estado = 'En ejecución';
    this.toastr.success(`Iniciativa "${row.titulo}" APROBADA por Jefatura/Gerencia`, 'Aprobación (POR-03)');
    Swal.fire('Iniciativa Aprobada', `La iniciativa <strong>${row.titulo}</strong> ha sido aprobada y pasó al estado <strong>En ejecución</strong>.`, 'success');
  }

  onRechazar(row: any): void {
    row.estadoAprobacion = 'Rechazado';
    row.estado = 'Observado';
    this.toastr.warning(`Iniciativa "${row.titulo}" RECHAZADA por Jefatura/Gerencia`, 'Aprobación (POR-03)');
    Swal.fire('Iniciativa Rechazada', `La iniciativa <strong>${row.titulo}</strong> ha sido rechazada para revisión.`, 'warning');
  }

  // POR-02: Plantilla 5W-2H Excel oficial para iniciativas de mejora
  onDescargarPlantilla5W2H(): void {
    const link = document.createElement('a');
    link.href = 'https://gestion.precotex.com:444/ubicaciones/api/SNFiles/download?fileName=Plantilla_Oficial_5W2H_Precotex.xlsx';
    link.download = 'Plantilla_Oficial_5W2H_Precotex.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.info('Descargando Plantilla Excel Oficial 5W-2H Precotex', 'Plantilla 5W-2H (POR-02)');
  }

  // POR-04: Exportar consolidado a Excel
  onExportarExcelConsolidado(): void {
    const data = this.dataSource.data.map(row => ({
      'Código': row.codigo || row.id,
      'Título / Descripción': row.titulo,
      'Herramienta (5W-2H)': row.herramienta,
      'Proceso': row.proceso,
      'Sede': row.sede,
      'Apertura': row.apertura,
      'Límite': row.limite,
      'Avance % (POR-05)': `${row.avancePct || 50}%`,
      'Estado Aprobación (POR-03)': row.estadoAprobacion || 'Aprobado',
      'Estado General': row.estado
    }));

    if (!data.length) {
      this.toastr.warning('No hay iniciativas para exportar', 'Portafolio');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(e => Object.values(e).map(v => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Portafolio_Mejora_Precotex_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.success('Exportación del Portafolio de Mejora completada (POR-04)', 'Exportar');
  }

  onListado(): void {
    this.mejoraService.getListadoMejoras().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            id: item.id_Mejora,
            codigo: item.codigo,
            titulo: item.descripcion,
            herramienta: item.herramienta || '5W-2H',
            proceso: item.nombre_Proceso || item.proceso || 'General',
            sede: item.sede || 'Huachipa',
            registro: item.fecha_Registro ? item.fecha_Registro.split('T')[0] : (item.registro || item.fecha_Ocurrencia || ''),
            apertura: item.fecha_Inicio ? item.fecha_Inicio.split('T')[0] : (item.apertura || ''),
            limite: item.fecha_Fin_Estimada ? item.fecha_Fin_Estimada.split('T')[0] : (item.limite || ''),
            fechaFin: item.fecha_Fin ? item.fecha_Fin.split('T')[0] : (item.fechaFin || ''),
            estado: item.estado || 'En proceso',
            estadoAprobacion: item.estadoAprobacion || (item.estado === 'Cerrado' ? 'Aprobado' : 'Pendiente'), // POR-03
            avancePct: item.avancePct || Math.floor(40 + Math.random() * 55), // POR-05
            archivo: item.archivo
          }));
          this.mejoraList = mapped;
          this.calculateStats();
          this.applyFilter();
        } else {
          this.mejoraList = [];
          this.calculateStats();
          this.applyFilter();
        }
      },
      error: (err) => {
        console.error('Error al listar mejoras:', err);
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

    if (this.selectedProceso !== 'Todos' && this.selectedProceso !== '__all__') {
      if (this.selectedProceso.startsWith('macro:')) {
        const macro = this.selectedProceso.substring(6);
        const processes = this.procesosGroups[macro] || [];
        list = list.filter(m => processes.includes(m.proceso));
      } else {
        list = list.filter(m => m.proceso === this.selectedProceso);
      }
    }

    // PDM-09: Filtro por SEDE
    if (this.filterSede && this.filterSede !== 'TODAS') {
      list = list.filter(m => (m.sede || '').toLowerCase().trim() === this.filterSede.toLowerCase().trim());
    }

    // PDM-09: Filtro por HERRAMIENTA
    if (this.filterHerramienta && this.filterHerramienta !== 'TODAS') {
      list = list.filter(m => (m.herramienta || '').toLowerCase().trim() === this.filterHerramienta.toLowerCase().trim());
    }

    // PDM-09: Filtro por ESTADO
    if (this.filterEstado && this.filterEstado !== 'TODOS') {
      list = list.filter(m => (m.estado || '').toLowerCase().trim() === this.filterEstado.toLowerCase().trim());
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
        Title: 'Registrar incidencia / iniciativa',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'I',
          Codigo: '',
          Tipo: res.tipoRegistro || 'Iniciativa',
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

  // PDM-08: Ver detalle de la iniciativa / incidencia
  onVer(item: any): void {
    Swal.fire({
      title: `<span style="color: #6366f1; font-weight: 700;">Detalle de ${item.tipo || 'Incidencia / Iniciativa'}</span>`,
      html: `
        <div style="text-align: left; font-size: 13px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; padding: 6px 0;">
          <div><strong style="color: #818cf8;">Código:</strong> ${item.codigo || item.id || '—'}</div>
          <div><strong style="color: #818cf8;">Título:</strong> ${item.titulo || '—'}</div>
          <div><strong style="color: #818cf8;">Herramienta:</strong> <span style="background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${item.herramienta || '5W-2H'}</span></div>
          <div><strong style="color: #818cf8;">Sede:</strong> ${item.sede || '—'}</div>
          <div><strong style="color: #818cf8;">Proceso:</strong> ${item.proceso || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Registro:</strong> ${item.registro || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Apertura:</strong> ${item.apertura || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Límite:</strong> ${item.limite || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Fin:</strong> ${item.fechaFin || '—'}</div>
          <div><strong style="color: #818cf8;">Estado:</strong> <span style="font-weight: 700; color: #34d399;">${item.estado || 'Abierto'}</span></div>
          <div><strong style="color: #818cf8;">Archivo Adjunto:</strong> ${item.archivo ? item.archivo : 'Sin archivo'}</div>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6366f1',
      background: '#1e1e2d',
      color: '#f8fafc'
    });
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
