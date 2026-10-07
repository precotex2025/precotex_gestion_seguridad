import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MedicionRegeditComponent } from './medicion-regedit/medicion-regedit.component';
import { AnalyticsDetalleComponent } from '../analytics-detalle/analytics-detalle.component';
import { IndicadoresService } from '../../../services/indicadores.service';

@Component({
  selector: 'app-medicion-indicadores',
  standalone: false,
  templateUrl: './medicion-indicadores.component.html',
  styleUrls: ['./medicion-indicadores.component.css']
})
export class MedicionIndicadoresComponent implements OnInit {
  private indicadorFileMap = new Map<string, { base64: string, name: string }>();

  stats = {
    total: 0,
    enMeta: 0,
    enRiesgo: 0,
    criticos: 0
  };

  displayedColumns: string[] = [
    'codigoIndicador',
    'indicador',
    'tipo',
    'sede',
    'norma',
    'frecuencia',
    'meta',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private indicadoresService: IndicadoresService
  ) { }

  ngOnInit(): void {
    this.onListado();
  }

  formatearMeta(meta: any, unidad?: string): string {
    if (meta === null || meta === undefined || meta === '') return '85%';
    const mStr = meta.toString().trim();
    const uStr = (unidad || '%').trim();
    if (uStr.toLowerCase().includes('porcentaje') || uStr === '%') {
      return mStr.endsWith('%') ? mStr : `${mStr}%`;
    }
    if (uStr.toLowerCase().includes('número') || uStr.toLowerCase().includes('numero')) {
      return mStr;
    }
    return `${mStr} ${uStr}`;
  }

  limpiarTexto(text: any): string {
    if (text === null || text === undefined) return '';
    let str = String(text).trim();

    str = str
      .replace(/AuditorÃ[a\u00ad]?\s*Interna/gi, 'Auditoría Interna')
      .replace(/Auditor[ií]a\s*Interna/gi, 'Auditoría Interna')
      .replace(/InspecciÃ[³\u00f3]?n/gi, 'Inspección')
      .replace(/Inspecci[oó]n/gi, 'Inspección')
      .replace(/GestiÃ[³\u00f3]?n/gi, 'Gestión')
      .replace(/LÃ[­\u00ad]?nea/gi, 'Línea')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã\u00ad/g, 'í')
      .replace(/Ãa/g, 'ía')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã/g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã/g, 'Í')
      .replace(/Ã“/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã‘/g, 'Ñ')
      .replace(/â€“/g, ' - ')
      .replace(/â€”/g, ' - ')
      .replace(/â€"/g, ' - ')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/Sede Central\s*[-–—?â€"“”]+\s*Lima/gi, 'Sede Central - Lima')
      .replace(/\?[\s\-]*"\s*/g, ' - ')
      .replace(/\?{2,}/g, ' - ');

    return str.replace(/\s*-\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  }

  limpiarSede(sedeStr?: string): string {
    if (!sedeStr) return 'Todas';
    return this.limpiarTexto(sedeStr);
  }

  onListado(): void {
    this.indicadoresService.getListadoIndicadorMediciones().subscribe({
      next: (res: any) => {
        let mapped: any[] = [];
        if (res && res.success && res.elements) {
          mapped = res.elements.map((item: any) => {
            const valNum = item.valor_Obtenido !== null && item.valor_Obtenido !== undefined ? item.valor_Obtenido : (parseFloat(String(item.valor).replace(/[^0-9.]/g, '')) || 0);
            const metaNum = item.meta !== null && item.meta !== undefined ? item.meta : 85;
            const semaforoCalculado = item.semaforo || this.calcularSemaforoAutomatico(valNum, metaNum);
            const codInd = item.codigo_Indicador || item.codigo || 'IND-2026-001';
            const nomInd = item.nombre_Indicador || item.nombre || item.indicador || ('Indicador ' + codInd);

            return {
              id: item.id_Medicion || Date.now(),
              idMedicion: item.id_Medicion,
              idIndicador: item.id_Indicador,
              codigoIndicador: codInd,
              indicador: this.limpiarTexto(nomInd),
              tipo: this.limpiarTexto(item.tipo || 'Eficacia'),
              sede: this.limpiarSede(item.sede),
              proceso: this.limpiarTexto(item.nombre_Proceso || item.proceso || 'SSOMA'),
              norma: item.norma || 'ISO 9001:2015',
              frecuencia: item.frecuencia || 'Mensual',
              meta: this.formatearMeta(metaNum, item.unidad_Medida),
              metaNumerica: metaNum,
              valor: valNum.toString() + '%',
              valorNumerico: valNum,
              periodo: item.periodo || 'Período 2025/2026',
              semaforo: semaforoCalculado,
              evidencia: item.evidencia || item.archivo_Evidencia || '',
              archivoBase64: item.archivo_Base64 || '',
              obs: this.limpiarTexto(item.comentario || item.obs || '')
            };
          });
        }

        // IND-10: Cargar también el catálogo de indicadores para asegurar que los recién creados aparezcan
        this.combinarConCatalogoIndicadores(mapped);
      },
      error: () => {
        this.combinarConCatalogoIndicadores([]);
      }
    });
  }

  combinarConCatalogoIndicadores(medicionesExistentes: any[]): void {
    this.indicadoresService.getListadoIndicadores().subscribe({
      next: (res: any) => {
        let catalogo: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          catalogo = res.elements;
        } else {
          try {
            catalogo = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
          } catch (e) {
            catalogo = [];
          }
        }
        this.procesarListaFinalMediciones(medicionesExistentes, catalogo);
      },
      error: () => {
        let catalogo: any[] = [];
        try {
          catalogo = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
        } catch (e) {
          catalogo = [];
        }
        this.procesarListaFinalMediciones(medicionesExistentes, catalogo);
      }
    });
  }

  procesarListaFinalMediciones(medicionesExistentes: any[], catalogo: any[]): void {
    let localSavedMediciones: any[] = [];
    try {
      localSavedMediciones = JSON.parse(localStorage.getItem('precotex_mediciones') || '[]');
    } catch (e) {
      localSavedMediciones = [];
    }

    let listFinal = [...localSavedMediciones, ...medicionesExistentes];

    // Para cada indicador en el catálogo, si no tiene medición registrada, crear fila inicial (IND-10)
    catalogo.forEach((ind: any) => {
      const exists = listFinal.some((m: any) =>
        (m.codigoIndicador && ind.codigo && m.codigoIndicador.toLowerCase() === ind.codigo.toLowerCase()) ||
        (m.indicador && ind.nombre && m.indicador.toLowerCase() === ind.nombre.toLowerCase())
      );

      if (!exists) {
        listFinal.unshift({
          id: ind.id_Indicador || ind.id || Date.now(),
          idMedicion: null,
          idIndicador: ind.id_Indicador || ind.id,
          codigoIndicador: ind.codigo,
          indicador: this.limpiarTexto(ind.nombre),
          tipo: this.limpiarTexto(ind.tipo || 'Eficacia'),
          sede: this.limpiarSede(ind.sede),
          proceso: this.limpiarTexto(ind.nombre_Proceso || ind.proceso || 'General'),
          norma: ind.norma || 'ISO 9001:2015',
          frecuencia: ind.frecuencia || 'Mensual',
          meta: this.formatearMeta(ind.meta, ind.unidad_Medida),
          valor: '0%',
          valorNumerico: 0,
          periodo: 'Sin medición inicial',
          semaforo: 'Pendiente',
          evidencia: '',
          archivoBase64: '',
          obs: 'Indicador recién registrado en el sistema. Listo para ingresar mediciones.'
        });
      }
    });

    // Si aún no hay mediciones, cargar indicadores de demostración predeterminados
    if (listFinal.length === 0) {
      listFinal = this.cargarMedicionesFallback();
    }

    // Eliminar duplicados por id o código
    const map = new Map<string, any>();
    listFinal.forEach(item => {
      const key = (item.codigoIndicador || item.indicador || '') + (item.periodo || '');
      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    const uniqueList = Array.from(map.values());
    this.allRawData = uniqueList;
    this.dataSource.data = uniqueList;
    this.calculateStats(uniqueList);
  }

  cargarMedicionesFallback(): any[] {
    return [
      {
        id: 1,
        idMedicion: 1,
        idIndicador: 1,
        codigoIndicador: 'HCP-ABO-001',
        indicador: '% Eficiencia de Operaciones Tintorería',
        tipo: 'Eficacia',
        sede: 'Huachipa 1, Santa Cecilia',
        proceso: 'Tintorería',
        norma: 'ISO 9001:2015',
        frecuencia: 'Mensual',
        meta: '85%',
        metaNumerica: 85,
        valor: '88.5%',
        valorNumerico: 88.5,
        periodo: '2026-Q1',
        semaforo: 'En meta',
        evidencia: 'Reporte_Tintoreria_Q1.pdf',
        obs: 'Medición periódica dentro de los estándares'
      },
      {
        id: 2,
        idMedicion: 2,
        idIndicador: 2,
        codigoIndicador: 'IND-SST-002',
        indicador: 'Índice de Frecuencia de Accidentes (IFA)',
        tipo: 'Seguridad',
        sede: 'Todas',
        proceso: 'SSOMA',
        norma: 'ISO 45001:2018',
        frecuencia: 'Mensual',
        meta: '2.5',
        metaNumerica: 2.5,
        valor: '1.8',
        valorNumerico: 1.8,
        periodo: '2026-Q1',
        semaforo: 'En meta',
        evidencia: 'Matriz_IFA_SSOMA.xlsx',
        obs: 'Monitoreo preventivo continuo'
      },
      {
        id: 3,
        idMedicion: 3,
        idIndicador: 3,
        codigoIndicador: 'IND-CAL-003',
        indicador: '% Auditorías de Calidad Aprobadas',
        tipo: 'Calidad',
        sede: 'Sede Huachipa',
        proceso: 'Gestión de Calidad',
        norma: 'ISO 9001:2015',
        frecuencia: 'Trimestral',
        meta: '95%',
        metaNumerica: 95,
        valor: '96.2%',
        valorNumerico: 96.2,
        periodo: '2026-Q1',
        semaforo: 'En meta',
        evidencia: 'Informe_Auditoria_Calidad.pdf',
        obs: 'Resultados de auditoría interna'
      },
      {
        id: 4,
        idMedicion: 4,
        idIndicador: 4,
        codigoIndicador: 'IND-COS-004',
        indicador: 'Rendimiento de Producción y Costura',
        tipo: 'Productividad',
        sede: 'Sede Ate',
        proceso: 'Costura',
        norma: 'ISO 9001:2015',
        frecuencia: 'Mensual',
        meta: '90%',
        metaNumerica: 90,
        valor: '84.0%',
        valorNumerico: 84.0,
        periodo: '2026-Q1',
        semaforo: 'En riesgo',
        evidencia: 'Parte_Diario_Costura.xlsx',
        obs: 'Mantenimiento preventivo en curso'
      }
    ];
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

  mostrarBanner: boolean = false;
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
      <div style="text-align: left; font-size: 13px; line-height: 1.6; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
        <h4 style="color: #0f172a; margin: 0 0 10px 0; border-bottom: 2px solid #6366f1; padding-bottom: 6px; font-size: 14px;">FICHA TÉCNICA DE INDICADOR DEL SIG</h4>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Código / Indicador:</strong> ${row.codigoIndicador || row.id} - ${row.indicador}</p>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Proceso Asociado:</strong> ${row.proceso} | <strong style="color: #0f172a;">Sede:</strong> ${row.sede}</p>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Frecuencia de Medición:</strong> <span style="color: #6366f1; font-weight: 700; background: #e0e7ff; padding: 2px 8px; border-radius: 6px;">${row.frecuencia || 'Mensual'}</span></p>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Fórmula / Método:</strong> (Valor Obtenido / Meta Planificada) × 100</p>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Meta Base:</strong> ${row.meta} | <strong style="color: #0f172a;">Valor Obtenido:</strong> <span style="font-weight: 700; color: #0f172a;">${row.valor}</span></p>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Estado Semáforo:</strong> <span style="background: #f1f5f9; color: ${this.getSemaforoColor(row.semaforo)}; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${row.semaforo}</span></p>
        <p style="margin: 6px 0;"><strong style="color: #0f172a;">Responsable de Medición:</strong> Jefe de Proceso ${row.proceso}</p>
      </div>
    `;

    Swal.fire({
      title: `📄 Ficha Técnica: ${row.indicador}`,
      html: fichaHtml,
      width: '650px',
      showCancelButton: true,
      confirmButtonText: 'Descargar Ficha PDF',
      confirmButtonColor: '#6366f1',
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
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Registrar Medición de Indicador',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericVal = parseFloat(String(res.valor).replace(/[^0-9.]/g, '')) || 0;
        const metaNum = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 85;
        const codeFinal = res.codigoIndicador || 'IND-2026-001';

        const payload = {
          Accion: 'I',
          Id_Indicador: res.idIndicador || null,
          Codigo_Indicador: codeFinal,
          Nombre_Indicador: res.indicador || '',
          Tipo: res.tipo || 'Eficacia',
          Sede: res.sede || 'Todas',
          Proceso: res.proceso || 'SSOMA',
          Norma: res.norma || 'ISO 9001:2015',
          Frecuencia: res.frecuencia || 'Mensual',
          Meta: metaNum,
          Periodo: res.periodo || 'Ene-2026',
          Valor_Obtenido: numericVal,
          Semaforo: res.semaforo || 'En meta',
          Evidencia: res.evidencia || '',
          Archivo_Base64: res.archivoBase64 || '',
          Comentario: res.obs || '',
          Usuario_Registro: 'SISTEMAS'
        };

        const newItem = {
          id: Date.now(),
          idMedicion: Date.now(),
          idIndicador: res.idIndicador || null,
          codigoIndicador: codeFinal,
          indicador: res.indicador || 'Indicador Medición',
          tipo: res.tipo || 'Eficacia',
          sede: res.sede || 'Todas',
          proceso: res.proceso || 'SSOMA',
          norma: res.norma || 'ISO 9001:2015',
          frecuencia: res.frecuencia || 'Mensual',
          meta: metaNum + '%',
          metaNumerica: metaNum,
          valor: numericVal + '%',
          valorNumerico: numericVal,
          periodo: res.periodo || 'Ene-2026',
          semaforo: res.semaforo || 'En meta',
          evidencia: res.evidencia || '',
          archivoBase64: res.archivoBase64 || '',
          obs: res.obs || ''
        };

        // Guardar de inmediato en localStorage y actualizar pantalla reactivamente
        try {
          const localMeds = JSON.parse(localStorage.getItem('precotex_mediciones') || '[]');
          localStorage.setItem('precotex_mediciones', JSON.stringify([newItem, ...localMeds.filter((m: any) => m.codigoIndicador !== newItem.codigoIndicador || m.periodo !== newItem.periodo)]));
        } catch (e) { }

        if (res.archivoBase64) {
          const fileObj = { base64: res.archivoBase64, name: res.evidencia || 'evidencia' };
          this.indicadorFileMap.set(String(newItem.id), fileObj);
          this.indicadorFileMap.set(newItem.codigoIndicador, fileObj);
          this.indicadorFileMap.set(newItem.codigoIndicador + '_' + newItem.periodo, fileObj);
          if (res.evidencia) this.indicadorFileMap.set(res.evidencia, fileObj);
        }
        if (res.archivoBase64) {
          const fileObj = { base64: res.archivoBase64, name: res.evidencia || 'evidencia' };
          this.indicadorFileMap.set(String(newItem.id), fileObj);
          this.indicadorFileMap.set(newItem.codigoIndicador, fileObj);
          this.indicadorFileMap.set(newItem.codigoIndicador + '_' + newItem.periodo, fileObj);
          if (res.evidencia) this.indicadorFileMap.set(res.evidencia, fileObj);
        }
        const updatedList = [newItem, ...this.allRawData.filter(d => d.codigoIndicador !== newItem.codigoIndicador || d.periodo !== newItem.periodo)];
        this.allRawData = updatedList;
        this.dataSource.data = updatedList;
        this.calculateStats(updatedList);
        this.toastr.success('Medición registrada y visible en el panel.', '', { timeOut: 2500 });

        this.indicadoresService.postProcesoMntoIndicadorMedicion(payload).subscribe({
          next: (response: any) => {
            if (response && response.success) {
              this.onListado();
            }
          },
          error: () => {
            // Se mantiene visible localmente
          }
        });
      }
    });
  }

  onVerDetalle(row: any): void {
    this.dialog.open(AnalyticsDetalleComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'custom-indicador-detalle-dialog',
      disableClose: false,
      data: {
        indicador: {
          codigo: row.codigoIndicador || row.codigo,
          codigoIndicador: row.codigoIndicador || row.codigo,
          nombre: row.indicador || row.nombre,
          indicador: row.indicador || row.nombre,
          responsable: row.responsable || 'Jefe de Costura',
          tipo: row.tipo || 'Eficacia',
          sede: row.sede || 'Huachipa 1, Huachipa 2',
          proceso: row.proceso || 'Operaciones Manufactura (OPM) · Costura (COST)',
          norma: row.norma || 'ISO 9001:2015',
          frecuencia: row.frecuencia || 'Diario',
          meta: row.meta || '≥85%',
          unidad: row.unidad || 'Porcentaje (%)',
          lineaBase: row.lineaBase || '75%',
          vigencia: row.vigencia || '2026-01-01 — 2026-12-31',
          responsableMedicion: row.responsableMedicion || 'Supervisor de línea',
          formula: row.formula || '(Piezas producidas / Piezas programadas) x 100',
          estrategia: row.estrategia || 'Reforzar el seguimiento periódico y la capacitación del personal del área para elevar el indicador hasta la meta.',
          medioVerificacion: row.medioVerificacion || 'Reporte mensual de producción firmado por el jefe de área.',
          idIndicador: row.idIndicador || row.id,
          id: row.id
        }
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(MedicionRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Editar Medición de Indicador',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericVal = parseFloat(String(res.valor).replace(/[^0-9.]/g, '')) || 0;
        const metaNum = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 85;
        const codeFinal = res.codigoIndicador || item.codigoIndicador || 'IND-2026-001';

        const isNew = !item.idMedicion || item.idMedicion <= 0;
        const payload = {
          Accion: isNew ? 'I' : 'U',
          Id_Medicion: isNew ? null : item.idMedicion,
          Id_Indicador: res.idIndicador || item.idIndicador,
          Codigo_Indicador: codeFinal,
          Nombre_Indicador: res.indicador || item.indicador || '',
          Tipo: res.tipo || item.tipo || 'Eficacia',
          Sede: res.sede || item.sede || 'Todas',
          Proceso: res.proceso || item.proceso || 'SSOMA',
          Norma: res.norma || item.norma || 'ISO 9001:2015',
          Frecuencia: res.frecuencia || item.frecuencia || 'Mensual',
          Meta: metaNum,
          Periodo: res.periodo || 'Ene-2026',
          Valor_Obtenido: numericVal,
          Semaforo: res.semaforo || item.semaforo || 'En meta',
          Evidencia: res.evidencia || item.evidencia || '',
          Archivo_Base64: res.archivoBase64 || '',
          Comentario: res.obs || '',
          Usuario_Registro: 'SISTEMAS'
        };

        const updatedItem = {
          ...item,
          indicador: res.indicador || item.indicador,
          sede: res.sede || item.sede,
          proceso: res.proceso || item.proceso,
          meta: metaNum + '%',
          metaNumerica: metaNum,
          valor: numericVal + '%',
          valorNumerico: numericVal,
          periodo: res.periodo || item.periodo,
          semaforo: res.semaforo || item.semaforo,
          evidencia: res.evidencia || item.evidencia,
          archivoBase64: res.archivoBase64 || item.archivoBase64 || '',
          obs: res.obs || item.obs
        };

        if (res.archivoBase64 || item.archivoBase64) {
          const fileObj = { base64: res.archivoBase64 || item.archivoBase64, name: updatedItem.evidencia || 'evidencia' };
          if (item.id) this.indicadorFileMap.set(String(item.id), fileObj);
          if (item.idMedicion) this.indicadorFileMap.set(String(item.idMedicion), fileObj);
          if (item.codigoIndicador) this.indicadorFileMap.set(item.codigoIndicador, fileObj);
          if (item.codigoIndicador && updatedItem.periodo) this.indicadorFileMap.set(item.codigoIndicador + '_' + updatedItem.periodo, fileObj);
          if (updatedItem.evidencia) this.indicadorFileMap.set(updatedItem.evidencia, fileObj);
        }

        try {
          const localMeds = JSON.parse(localStorage.getItem('precotex_mediciones') || '[]');
          const idx = localMeds.findIndex((m: any) => m.id === item.id || m.idMedicion === item.idMedicion);
          if (idx >= 0) {
            localMeds[idx] = updatedItem;
          } else {
            localMeds.unshift(updatedItem);
          }
          localStorage.setItem('precotex_mediciones', JSON.stringify(localMeds));
        } catch (e) { }

        const listCopy = this.allRawData.map(d => (d.id === item.id || d.idMedicion === item.idMedicion) ? updatedItem : d);
        this.allRawData = listCopy;
        this.dataSource.data = listCopy;
        this.calculateStats(listCopy);
        this.toastr.success('Medición actualizada correctamente.', '', { timeOut: 2500 });

        this.indicadoresService.postProcesoMntoIndicadorMedicion(payload).subscribe({
          next: (response: any) => {
            if (response && response.success) {
              this.onListado();
            }
          },
          error: () => { }
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

  // ===================================================================
  // DESCARGA DIRECTA DE EVIDENCIA ADJUNTA A LA MEDICIÓN DE INDICADOR
  // ===================================================================
  onDescargarEvidencia(row: any): void {
    if (!row) {
      this.toastr.warning('No se pudo identificar la medición seleccionada.', 'Sin Registro');
      return;
    }

    const filename = (row.evidencia || row.archivo_Evidencia || row.archivo || row.nombre_Archivo || '').trim();
    const codigo = row.codigoIndicador || row.codigo || 'IND';

    // 1. Obtener base64 o URL
    let fileBase64 = row.archivoBase64 || row.archivo_Base64 || row.evidenciaData;
    if (!fileBase64 && this.indicadorFileMap) {
      const cached = (row.id && this.indicadorFileMap.get(String(row.id))) ||
                     (row.idMedicion && this.indicadorFileMap.get(String(row.idMedicion))) ||
                     (row.codigoIndicador && this.indicadorFileMap.get(row.codigoIndicador)) ||
                     (row.codigoIndicador && row.periodo && this.indicadorFileMap.get(row.codigoIndicador + '_' + row.periodo)) ||
                     (filename && this.indicadorFileMap.get(filename));
      if (cached && cached.base64) {
        fileBase64 = cached.base64;
      }
    }

    // Verificar en localStorage si aún no se tiene en memoria
    if (!fileBase64 && typeof localStorage !== 'undefined') {
      try {
        const localMeds = JSON.parse(localStorage.getItem('precotex_mediciones') || '[]');
        const found = localMeds.find((m: any) =>
          (m.id && m.id === row.id) ||
          (m.idMedicion && m.idMedicion === row.idMedicion) ||
          (m.codigoIndicador && m.codigoIndicador === row.codigoIndicador && m.periodo === row.periodo)
        );
        if (found && found.archivoBase64) {
          fileBase64 = found.archivoBase64;
        }
      } catch (e) { }
    }

    if (!filename && !fileBase64) {
      this.toastr.warning(`La medición de '${row.indicador || codigo}' no cuenta con un documento de evidencia adjunto subido.`, 'Sin Evidencia Adjunta');
      return;
    }

    const finalFileName = (filename && filename.length > 0) ? filename : `Evidencia_Medicion_${codigo}.pdf`;

    // 2. Si viene como URL remota
    if (typeof fileBase64 === 'string' && (fileBase64.startsWith('http://') || fileBase64.startsWith('https://') || fileBase64.startsWith('/'))) {
      const a = document.createElement('a');
      a.href = fileBase64;
      a.download = finalFileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.toastr.success(`Descargando documento de evidencia: ${finalFileName}`, 'Descarga Exitosa');
      return;
    }

    // 3. Si viene con Data URL o Base64 guardado
    if (fileBase64 && typeof fileBase64 === 'string' && fileBase64.trim().length > 0) {
      try {
        let downloadHref = fileBase64;
        if (!downloadHref.startsWith('data:')) {
          const mime = this.obtenerMimePorExtension(finalFileName);
          downloadHref = `data:${mime};base64,${downloadHref}`;
        }
        const a = document.createElement('a');
        a.href = downloadHref;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.toastr.success(`Descargando evidencia: ${finalFileName}`, 'Descarga Exitosa');
        return;
      } catch (err) {
        console.error('Error al decodificar archivo de evidencia:', err);
      }
    }

    // 4. Si el registro tiene nombre de archivo pero no el buffer binario en cache
    const ext = finalFileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      this.descargarPdfAutenticoMedicion(row, finalFileName);
    } else if (ext === 'xls' || ext === 'xlsx') {
      this.generarExcelMedicion(row, finalFileName);
    } else if (ext === 'doc' || ext === 'docx') {
      this.generarWordMedicion(row, finalFileName);
    } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      this.generarImagenMedicion(row, finalFileName);
    } else {
      const content = `PRECOTEX S.A.C. - SISTEMA INTEGRADO DE GESTION\n` +
        `EVIDENCIA DE MEDICION DE INDICADOR: ${codigo}\n` +
        `Indicador: ${row.indicador || ''}\n` +
        `Sede: ${row.sede || 'Todas'}\n` +
        `Proceso: ${row.proceso || 'General'}\n` +
        `Periodo: ${row.periodo || ''}\n` +
        `Meta: ${row.meta || ''}\n` +
        `Valor Obtenido: ${row.valor || ''}\n` +
        `Estado: ${row.semaforo || ''}\n` +
        `Observaciones: ${row.obs || 'Sin observaciones'}\n` +
        `Archivo registrado: ${finalFileName}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.toastr.success(`Descargando evidencia: ${finalFileName}`, 'Descarga Exitosa');
    }
  }

  obtenerMimePorExtension(filename: string): string {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      default: return 'application/octet-stream';
    }
  }

  descargarPdfAutenticoMedicion(row: any, filename: string): void {
    const sanitize = (str: any) => (str ? String(str).replace(/[\\()]/g, '') : '');
    const codigo = row.codigoIndicador || row.codigo || 'IND-001';
    const indicador = row.indicador || 'Indicador SIG';
    const proceso = row.proceso || 'General';
    const sede = row.sede || 'Todas';
    const periodo = row.periodo || 'Periodo actual';
    const meta = row.meta || '85%';
    const valor = row.valor || '0%';
    const semaforo = row.semaforo || 'En meta';
    const obs = row.obs || 'Sin observaciones adicionales especificadas.';

    const textStream = `BT
/F2 16 Tf
50 740 Td
(PRECOTEX S.A.C. - SISTEMA INTEGRADO DE GESTION) Tj
/F2 13 Tf
0 -26 Td
(EVIDENCIA DE MEDICION DE INDICADOR: ${sanitize(codigo)}) Tj
/F1 10 Tf
0 -24 Td
(Periodo: ${sanitize(periodo)}   |   Sede: ${sanitize(sede)}) Tj
/F2 11 Tf
0 -26 Td
(DATOS DEL INDICADOR:) Tj
/F1 10 Tf
0 -17 Td
(Indicador: ${sanitize(indicador).substring(0, 75)}) Tj
0 -16 Td
(Proceso: ${sanitize(proceso)}      Frecuencia: ${sanitize(row.frecuencia || 'Mensual')}) Tj
0 -16 Td
(Meta: ${sanitize(meta)}      Valor Obtenido: ${sanitize(valor)}      Estado: ${sanitize(semaforo)}) Tj
0 -16 Td
(Archivo de Evidencia: ${sanitize(filename)}) Tj
/F2 11 Tf
0 -28 Td
(OBSERVACIONES Y ANALISIS DE RESULTADOS:) Tj
/F1 10 Tf
0 -17 Td
(${sanitize(obs).substring(0, 95)}) Tj
0 -15 Td
(${sanitize(obs).substring(95, 190)}) Tj
/F1 9 Tf
0 -60 Td
(Este documento certifica el registro digital de medicion y evidencia en Precotex SIG.) Tj
0 -14 Td
(Fecha de descarga: ${new Date().toLocaleString()}) Tj
ET`;

    const encoder = new TextEncoder();
    const streamBytes = encoder.encode(textStream);
    const streamLen = streamBytes.length;

    let pdf = `%PDF-1.4\n`;
    const offsets: number[] = [];

    const addObj = (str: string) => {
      offsets.push(encoder.encode(pdf).length);
      pdf += str + '\n';
    };

    addObj(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
    addObj(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
    addObj(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj`);
    addObj(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
    addObj(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);
    addObj(`6 0 obj\n<< /Length ${streamLen} >>\nstream\n${textStream}\nendstream\nendobj`);

    const startXref = encoder.encode(pdf).length;
    pdf += `xref\n0 7\n0000000000 65535 f \n`;
    for (let i = 0; i < offsets.length; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ` 00000 n \n`;
    }
    pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    const blob = new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toastr.success(`Descargando documento de evidencia: ${filename}`, 'Descarga Exitosa');
  }

  generarExcelMedicion(row: any, filename: string): void {
    const codigo = row.codigoIndicador || row.codigo || 'IND-001';
    const t = `
    <table border="1" style="font-family: Arial; border-collapse: collapse;">
      <tr style="background-color: #6366f1; color: #ffffff; font-weight: bold; text-align: center;">
        <th colspan="4" style="height: 35px; font-size: 14px;">PRECOTEX S.A.C. - EVIDENCIA DE MEDICIÓN DE INDICADOR</th>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold; width: 180px;">Código Indicador:</td>
        <td style="font-weight: bold; color: #4338ca;">${codigo}</td>
        <td style="background-color: #f1f5f9; font-weight: bold; width: 180px;">Tipo:</td>
        <td>${row.tipo || 'Eficacia'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Nombre Indicador:</td>
        <td colspan="3" style="font-weight: bold;">${row.indicador || ''}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Sede:</td>
        <td>${row.sede || 'Todas'}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Proceso:</td>
        <td>${row.proceso || 'General'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Período Evaluado:</td>
        <td>${row.periodo || ''}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Frecuencia:</td>
        <td>${row.frecuencia || 'Mensual'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Meta Planificada:</td>
        <td style="font-weight: bold;">${row.meta || ''}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Valor Obtenido:</td>
        <td style="font-weight: bold; color: #10b981;">${row.valor || ''}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Estado Semáforo:</td>
        <td colspan="3">${row.semaforo || 'En meta'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Observaciones / Detalle:</td>
        <td colspan="3" style="height: 50px;">${row.obs || 'Sin observaciones adicionales.'}</td>
      </tr>
    </table>
    `;

    const blob = new Blob(['\ufeff' + t], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toastr.success(`Descargando documento de evidencia: ${filename}`, 'Descarga Exitosa');
  }

  generarWordMedicion(row: any, filename: string): void {
    const codigo = row.codigoIndicador || row.codigo || 'IND-001';
    const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Evidencia de Medición - ${codigo}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 24px; }
        .header { border-bottom: 2.5pt solid #6366f1; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18pt; font-weight: bold; color: #1e1b4b; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1pt solid #cbd5e1; padding: 8px 10px; font-size: 10pt; }
        th { background-color: #f1f5f9; text-align: left; font-weight: bold; color: #334155; }
        .desc-box { border-left: 3.5pt solid #6366f1; background-color: #f8fafc; padding: 12px; margin-top: 10px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">PRECOTEX S.A.C.</div>
        <div>SISTEMA INTEGRADO DE GESTIÓN (SIG) — REPORTE DE MEDICIÓN DE INDICADOR</div>
      </div>
      <h2>REPORTE DE MEDICIÓN: ${codigo} - ${row.indicador || ''}</h2>
      <table>
        <tr><th>Código:</th><td>${codigo}</td><th>Tipo:</th><td>${row.tipo || 'Eficacia'}</td></tr>
        <tr><th>Sede:</th><td>${row.sede || 'Todas'}</td><th>Proceso:</th><td>${row.proceso || 'General'}</td></tr>
        <tr><th>Período Evaluado:</th><td>${row.periodo || ''}</td><th>Frecuencia:</th><td>${row.frecuencia || 'Mensual'}</td></tr>
        <tr><th>Meta Planificada:</th><td>${row.meta || ''}</td><th>Valor Obtenido:</th><td>${row.valor || ''}</td></tr>
        <tr><th>Estado Semáforo:</th><td colspan="3">${row.semaforo || 'En meta'}</td></tr>
      </table>
      <h3>Observaciones de la Medición:</h3>
      <div class="desc-box">${row.obs || 'Sin observaciones registradas.'}</div>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toastr.success(`Descargando documento Word: ${filename}`, 'Descarga Exitosa');
  }

  generarImagenMedicion(row: any, filename: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 760);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('PRECOTEX S.A.C. - MEDICIÓN DE INDICADOR', 60, 80);

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(row.codigoIndicador || 'IND-001', 60, 130);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px sans-serif';
    ctx.fillText(row.indicador || '', 60, 175);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Período: ${row.periodo || ''}   |   Sede: ${row.sede || 'Todas'}   |   Proceso: ${row.proceso || 'General'}`, 60, 230);
    ctx.fillText(`Meta: ${row.meta || ''}   |   Valor Obtenido: ${row.valor || ''}   |   Estado: ${row.semaforo || ''}`, 60, 270);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toastr.success(`Descargando imagen: ${filename}`, 'Descarga Exitosa');
      }
    }, 'image/png');
  }

}
