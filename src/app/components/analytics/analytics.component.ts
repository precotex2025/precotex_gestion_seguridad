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

  mostrarBanner: boolean = false;

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
      .replace(/Ã /g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã /g, 'Í')
      .replace(/Ã“/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã‘/g, 'Ñ')
      .replace(/â€“/g, ' - ')
      .replace(/â€”/g, ' - ')
      .replace(/â€"/g, ' - ')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€ /g, '"')
      .replace(/Sede Central\s*[-–—?â€"“”]+\s*Lima/gi, 'Sede Central - Lima')
      .replace(/\?[\s\-]*"\s*/g, ' - ')
      .replace(/\?{2,}/g, ' - ');

    return str.replace(/\s*-\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  }

  onListado(): void {
    this.indicadoresService.getListadoIndicadores().subscribe({
      next: (res: any) => {
        if (res && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            ...item,
            codigo: item.codigo,
            nombre: this.limpiarTexto(item.nombre),
            tipo: item.tipo || 'Eficacia',
            sede: this.limpiarTexto(item.sede || 'Todas'),
            proceso: this.limpiarTexto(item.nombre_Proceso || item.proceso || item.codigo_Proceso || 'General'),
            codigoProceso: item.codigo_Proceso,
            codigo_proceso: item.codigo_Proceso,
            nombre_proceso: this.limpiarTexto(item.nombre_Proceso || item.proceso || 'General'),
            norma: item.norma || 'ISO 9001:2015',
            frecuencia: item.frecuencia || 'Mensual',
            unidad: item.unidad_Medida || item.unidad || '%',
            unidad_medida: item.unidad_Medida || item.unidad || '%',
            meta: item.meta !== null && item.meta !== undefined ? item.meta.toString() : '0',
            estado: item.estado || 'Activo',
            idIndicador: item.id_Indicador,
            fuente: this.limpiarTexto(item.fuente_Datos || item.fuente || 'Reporte de producción'),
            fuente_datos: this.limpiarTexto(item.fuente_Datos || item.fuente || 'Reporte de producción'),
            responsable: this.limpiarTexto(item.responsable || ''),
            respmed: this.limpiarTexto(item.resp_Medicion || item.respmed || ''),
            resp_medicion: this.limpiarTexto(item.resp_Medicion || item.respmed || ''),
            formula: item.formula || '',
            base: item.linea_Base || item.base || '',
            linea_base: item.linea_Base || item.base || '',
            tipometa: item.tipo_Meta || item.tipometa || 'Mayor o igual (≥)',
            tipo_meta: item.tipo_Meta || item.tipometa || 'Mayor o igual (≥)',
            sentido: item.sentido || '↑ Sube es bueno',
            inicio: item.fecha_Inicio || item.fec_Inicio || item.inicio || '',
            fecha_inicio: item.fecha_Inicio || item.fec_Inicio || item.inicio || '',
            fin: item.fecha_Fin || item.fec_Fin || item.fin || '',
            fecha_fin: item.fecha_Fin || item.fec_Fin || item.fin || '',
            areasacc: this.limpiarTexto(item.areas_Acceso || item.sede || 'Todas')
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
      { codigo: 'IND-COS-001', nombre: '% Eficiencia de Costura', tipo: 'Eficiencia', sede: 'Sede Huachipa', proceso: 'Costura', norma: 'ISO 9001:2015', frecuencia: 'Mensual', meta: '85', unidad: '%', estado: 'Activo', fuente: 'Reporte de producción', responsable: 'Jefe de Costura', respmed: 'Supervisor de Costura' },
      { codigo: 'IND-SST-002', nombre: 'Índice de Frecuencia de Accidentes (IFA)', tipo: 'Eficacia', sede: 'Todas', proceso: 'SSOMA', norma: 'ISO 45001:2018', frecuencia: 'Mensual', meta: '2.5', unidad: 'Índice', estado: 'Activo', fuente: 'Reporte SSOMA', responsable: 'Jefe de SSOMA', respmed: 'Analista de Seguridad' },
      { codigo: 'IND-CAL-003', nombre: '% Auditorías de Calidad Aprobadas', tipo: 'Efectividad', sede: 'Sede Huachipa', proceso: 'Gestión de Calidad', norma: 'ISO 9001:2015', frecuencia: 'Trimestral', meta: '95', unidad: '%', estado: 'Activo', fuente: 'Informe de Auditoría Interna', responsable: 'Líder de Calidad', respmed: 'Auditor Interno' },
      { codigo: 'IND-TIN-004', nombre: 'Rendimiento de Tintorería', tipo: 'Eficiencia', sede: 'Sede Santa Cecilia', proceso: 'Tintorería', norma: 'ISO 14001:2015', frecuencia: 'Mensual', meta: '90', unidad: '%', estado: 'Activo', fuente: 'Sistema ERP', responsable: 'Jefe de Tintorería', respmed: 'Supervisor de Tintorería' }
    ];

    const localInds = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
    if (localInds && localInds.length > 0) {
      const allCodes = new Set(localInds.map((i: any) => i.codigo));
      const combined = [...localInds, ...defaultData.filter(d => !allCodes.has(d.codigo))];
      this.dataSource.data = combined;
      this.calculateStats(combined);
      return;
    }

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
      width: '740px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Registrar Indicador SIG',
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
        let sedeStr = 'Todas';
        if (Array.isArray(res.sede)) {
          const specific = res.sede.filter((s: string) => s && s.trim().toLowerCase() !== 'todas');
          sedeStr = specific.length > 0 ? specific.join(', ') : 'Todas';
        } else if (typeof res.sede === 'string' && res.sede.trim() !== '') {
          sedeStr = res.sede.trim();
        }

        const payload = {
          Accion: 'I',
          Codigo: res.codigo,
          Nombre: res.nombre,
          Tipo: res.tipo || 'Eficacia',
          Sede: sedeStr,
          Norma: res.norma || 'ISO 9001:2015',
          Codigo_Proceso: res.proceso || '001',
          Nombre_Proceso: res.proceso || 'General',
          Unidad_Medida: res.unidad || '%',
          Meta: numericMeta,
          Tipo_Meta: res.tipometa || 'Mayor o igual (≥)',
          Sentido: res.sentido || '↑ Sube es bueno',
          Linea_Base: res.base || '',
          Formula: res.formula || '',
          Frecuencia: res.frecuencia || 'Mensual',
          Fuente_Datos: res.fuente || '',
          Responsable: res.responsable || '',
          Resp_Medicion: res.respmed || '',
          Fecha_Inicio: res.inicio ? `${res.inicio}T00:00:00` : null,
          Fecha_Fin: res.fin ? `${res.fin}T00:00:00` : null,
          Areas_Acceso: sedeStr,
          Estado: res.estado || 'Activo',
          Usuario_Registro: 'SISTEMAS'
        };

        // Sincronizar inmediatamente en catálogo local (IND-10)
        const localInds = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
        const newLocalItem = {
          id: Date.now(),
          codigo: res.codigo,
          nombre: res.nombre,
          tipo: res.tipo || 'Eficacia',
          sede: sedeStr,
          norma: res.norma || 'ISO 9001:2015',
          proceso: res.proceso || 'General',
          meta: numericMeta,
          tipo_meta: res.tipometa || 'Mayor o igual (≥)',
          sentido: res.sentido || '↑ Sube es bueno',
          linea_base: res.base || '',
          formula: res.formula || '',
          frecuencia: res.frecuencia || 'Mensual',
          unidad: res.unidad || '%',
          unidad_medida: res.unidad || '%',
          estado: res.estado || 'Activo',
          fuente: res.fuente || '',
          fuente_datos: res.fuente || '',
          Fuente_Datos: res.fuente || '',
          responsable: res.responsable || '',
          respmed: res.respmed || '',
          resp_medicion: res.respmed || '',
          fecha_inicio: res.inicio || '',
          fecha_fin: res.fin || ''
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
      panelClass: 'custom-indicador-detalle-dialog',
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
      width: '740px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Editar Indicador SIG',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;
        let sedeStr = 'Todas';
        if (Array.isArray(res.sede)) {
          const specific = res.sede.filter((s: string) => s && s.trim().toLowerCase() !== 'todas');
          sedeStr = specific.length > 0 ? specific.join(', ') : 'Todas';
        } else if (typeof res.sede === 'string' && res.sede.trim() !== '') {
          sedeStr = res.sede.trim();
        }

        const payload = {
          Accion: 'U',
          Id_Indicador: item.idIndicador || item.id_Indicador || item.Id_Indicador || item.id || 0,
          Codigo: item.codigo,
          Nombre: res.nombre,
          Tipo: res.tipo || 'Eficacia',
          Sede: sedeStr,
          Norma: res.norma || 'ISO 9001:2015',
          Codigo_Proceso: res.proceso || item.codigo_proceso || '001',
          Nombre_Proceso: res.proceso || item.nombre_proceso || 'General',
          Unidad_Medida: res.unidad || '%',
          Meta: numericMeta,
          Tipo_Meta: res.tipometa || 'Mayor o igual (≥)',
          Sentido: res.sentido || '↑ Sube es bueno',
          Linea_Base: res.base || '',
          Formula: res.formula || '',
          Frecuencia: res.frecuencia || 'Mensual',
          Fuente_Datos: res.fuente || '',
          Responsable: res.responsable || '',
          Resp_Medicion: res.respmed || '',
          Fecha_Inicio: res.inicio ? `${res.inicio}T00:00:00` : null,
          Fecha_Fin: res.fin ? `${res.fin}T00:00:00` : null,
          Areas_Acceso: sedeStr,
          Estado: res.estado || 'Activo',
          Usuario_Registro: 'SISTEMAS'
        };

        // Actualizar en catálogo local
        const localInds = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
        const updatedLocal = localInds.map((i: any) => {
          if (i.codigo === item.codigo) {
            return {
              ...i,
              ...res,
              sede: sedeStr,
              Fuente_Datos: res.fuente,
              fuente: res.fuente,
              fuente_datos: res.fuente,
              meta: numericMeta,
              tipo_meta: res.tipometa,
              sentido: res.sentido,
              linea_base: res.base,
              formula: res.formula,
              unidad_medida: res.unidad,
              responsable: res.responsable,
              respmed: res.respmed,
              resp_medicion: res.respmed
            };
          }
          return i;
        });
        localStorage.setItem('precotex_indicadores', JSON.stringify(updatedLocal));

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
          Id_Indicador: item.idIndicador || item.id_Indicador || item.Id_Indicador || item.id || 0,
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
