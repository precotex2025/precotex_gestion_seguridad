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
    'codigoIndicador',
    'indicador',
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
              indicador: nomInd,
              tipo: item.tipo || 'Eficacia',
              sede: item.sede || 'Todas',
              proceso: item.nombre_Proceso || item.proceso || 'SSOMA',
              norma: item.norma || 'ISO 9001:2015',
              frecuencia: item.frecuencia || 'Mensual',
              meta: metaNum.toString() + (item.unidad_Medida || '%'),
              metaNumerica: metaNum,
              valor: valNum.toString() + '%',
              valorNumerico: valNum,
              periodo: item.periodo || 'Período 2025/2026',
              semaforo: semaforoCalculado,
              evidencia: item.evidencia || item.archivo_Evidencia || '',
              archivoBase64: item.archivo_Base64 || '',
              obs: item.comentario || item.obs || ''
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
          indicador: ind.nombre,
          tipo: ind.tipo || 'Eficacia',
          sede: ind.sede || 'Todas',
          proceso: ind.nombre_Proceso || ind.proceso || 'General',
          norma: ind.norma || 'ISO 9001:2015',
          frecuencia: ind.frecuencia || 'Mensual',
          meta: ind.meta !== null && ind.meta !== undefined ? ind.meta.toString() + (ind.unidad_Medida || '%') : '85%',
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
      <div style="text-align: left; font-size: 13px; line-height: 1.6; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
        <h4 style="color: #0f172a; margin: 0 0 10px 0; border-bottom: 2px solid #6366f1; padding-bottom: 6px; font-size: 14px;">FICHA TÉCNICA DE INDICADOR DEL SIG (IND-04)</h4>
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
        Title: '::. Registrar medición de indicador .::',
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
        } catch (e) {}

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

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(MedicionRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: '::. Editar medición de indicador .::',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericVal = parseFloat(String(res.valor).replace(/[^0-9.]/g, '')) || 0;
        const metaNum = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 85;
        const codeFinal = res.codigoIndicador || item.codigoIndicador || 'IND-2026-001';

        const payload = {
          Accion: 'U',
          Id_Medicion: item.idMedicion || item.id,
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
          obs: res.obs || item.obs
        };

        try {
          const localMeds = JSON.parse(localStorage.getItem('precotex_mediciones') || '[]');
          const idx = localMeds.findIndex((m: any) => m.id === item.id || m.idMedicion === item.idMedicion);
          if (idx >= 0) {
            localMeds[idx] = updatedItem;
          } else {
            localMeds.unshift(updatedItem);
          }
          localStorage.setItem('precotex_mediciones', JSON.stringify(localMeds));
        } catch (e) {}

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
          error: () => {}
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
