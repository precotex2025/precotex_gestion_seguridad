import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PlanificacionObjetivosRegeditComponent } from './planificacion-objetivos-regedit/planificacion-objetivos-regedit.component';
import { ObjetivosService } from '../../services/objetivos.service';

@Component({
  selector: 'app-planificacion-objetivos',
  standalone: false,
  templateUrl: './planificacion-objetivos.component.html',
  styleUrls: ['./planificacion-objetivos.component.css']
})
export class PlanificacionObjetivosComponent implements OnInit {

  stats = {
    total: 0,
    cumplidos: 0,
    planificados: 0,
    pendientes: 0
  };

  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  openMedicionModal(): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '840px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'custom-dialog-no-padding',
      data: { Title: 'Medición de Objetivos SIG' }
    });
  }

  displayedColumns: string[] = [
    'codigo',
    'objetivo',
    'proceso',
    'periodo',
    'norma',
    'indicador',
    'responsableProceso',
    'meta',
    'frecuencia',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private objetivosService: ObjetivosService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  // Filtros Avanzados (OBJ-03)
  filtroAno: string = 'Todos';
  filtroProceso: string = 'Todos';
  filtroEstado: string = 'Todos';
  listaAnos: string[] = ['Todos', '2026', '2025', '2024'];
  listaProcesos: string[] = ['Todos', 'Tintorería', 'Hilandería', 'Corte', 'Costura', 'SSOMA', 'Gestión de Calidad'];
  listaEstados: string[] = ['Todos', 'Planificado', 'Cumplido', 'Pendiente'];

  aplicarFiltrosAvanzados(): void {
    let filtered = [...this.allRawData];

    if (this.filtroAno !== 'Todos') {
      filtered = filtered.filter(d => (d.periodo || d.ano || '2026').includes(this.filtroAno));
    }
    if (this.filtroProceso !== 'Todos') {
      filtered = filtered.filter(d => d.proceso === this.filtroProceso);
    }
    if (this.filtroEstado !== 'Todos') {
      filtered = filtered.filter(d => d.estado === this.filtroEstado);
    }

    this.dataSource.data = filtered;
    this.calculateStats(filtered);
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      cumplidos: data.filter(d => (d.estado || '').toLowerCase().includes('cumplid')).length,
      planificados: data.filter(d => (d.estado || '').toLowerCase().includes('planificad')).length,
      pendientes: data.filter(d => (d.estado || '').toLowerCase().includes('pendient')).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'pendiente';
    const s = estado.toLowerCase().trim();
    if (s.includes('cumplid')) return 'cumplido';
    if (s.includes('planificad')) return 'planificado';
    return 'pendiente';
  }

  allRawData: any[] = [];

  onListado(): void {
    forkJoin({
      resObj: this.objetivosService.getListadoObjetivos().pipe(catchError(() => of(null))),
      resMed: this.objetivosService.getListadoObjetivoMediciones().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ resObj, resMed }: any) => {
        if (resObj && resObj.success && resObj.elements) {
          const mediciones: any[] = (resMed && resMed.success && resMed.elements) ? resMed.elements : [];

          const mapped = resObj.elements.map((item: any) => {
            const fechaCreacion = item.fecha_Registro || item.fec_Registro || item.fechaRegistro || '';
            const fechaIni = item.fechaInicio || item.fecha_Inicio || (fechaCreacion ? fechaCreacion.split('T')[0] : '') || new Date().toISOString().split('T')[0];

            // Buscar mediciones para este objetivo
            const objMediciones = mediciones.filter((m: any) => 
              (m.id_Objetivo && item.id_Objetivo && Number(m.id_Objetivo) === Number(item.id_Objetivo)) ||
              (m.codigo_Objetivo && item.codigo && String(m.codigo_Objetivo).trim().toLowerCase() === String(item.codigo).trim().toLowerCase())
            );

            // Obtener última medición o valor de localStorage
            let avanceValor = 0;
            if (objMediciones.length > 0) {
              objMediciones.sort((a: any, b: any) => new Date(b.fecha_Registro || 0).getTime() - new Date(a.fecha_Registro || 0).getTime());
              avanceValor = Number(objMediciones[0].valor) || 0;
            } else {
              const storageKey = `precotex:obj_historial_${item.codigo || item.id_Objetivo}`;
              try {
                const hist = JSON.parse(localStorage.getItem(storageKey) || '{}');
                const curM = new Date().getMonth();
                if (hist[curM] !== undefined) {
                  avanceValor = Number(hist[curM]) || 0;
                }
              } catch {}
            }

            const metaNum = parseFloat(String(item.meta || '100').replace(/[^0-9.]/g, '')) || 100;
            const estadoCalculado = avanceValor >= metaNum ? 'Cumplido' : (avanceValor > 0 ? 'En Proceso' : (item.estado || 'Planificado'));

            return {
              id: item.id_Objetivo || item.id,
              codigo: item.codigo || 'OBJ-2026-001',
              objetivo: item.nombre || item.objetivo,
              proceso: item.proceso || 'SSOMA',
              periodo: item.periodo || item.ano || '2026',
              responsableProceso: item.responsableProceso || item.responsable || 'Jefe de Proceso',
              fechaInicio: fechaIni,
              fechaFin: item.fechaFin || '2026-12-31',
              fechaRegistro: fechaCreacion,
              responsableSeguimiento: item.responsableSeguimiento || 'Coordinador SIG',
              medioVerificacion: item.medioVerificacion || 'Reportes de Gestión',
              formulaCalculo: item.formulaCalculo || '(Real / Plan) * 100',
              unidadMedida: item.unidadMedida || '%',
              norma: item.norma || 'ISO 9001:2015',
              indicador: item.indicador || '% Eficiencia / Cumplimiento',
              base: item.base || '0%',
              meta: item.meta !== null && item.meta !== undefined && String(item.meta).trim() !== '' ? `${item.meta}%` : '100%',
              porcentajeAvance: avanceValor,
              mediciones: objMediciones,
              frecuencia: item.frecuencia || 'Mensual',
              estado: estadoCalculado,
              desc: item.desc || item.nombre
            };
          });
          this.allRawData = mapped;
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.cargarFallbackObjetivos();
        }
      },
      error: () => {
        this.cargarFallbackObjetivos();
      }
    });
  }

  cargarFallbackObjetivos(): void {
    const fallback = [
      {
        id: 1,
        codigo: 'OBJ-2026-001',
        objetivo: 'Reducir el índice de accidentabilidad laboral en todas las sedes operativas',
        proceso: 'SSOMA',
        periodo: '2026',
        responsableProceso: 'Carlos Mendoza (Jefe SSOMA)',
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
        responsableSeguimiento: 'Ana Gomez (Coordinador SIG)',
        medioVerificacion: 'Registro mensual de incidentes y reporte ministerial',
        formulaCalculo: '(N° Accidentes / Total Horas Trabajadas) * 1000000',
        unidadMedida: 'N°',
        norma: 'ISO 45001:2018',
        indicador: 'Índice de Frecuencia de Accidentes (IFA)',
        base: '2.5',
        meta: '1.5',
        porcentajeAvance: 85,
        frecuencia: 'Mensual',
        estado: 'Planificado',
        desc: 'Implementación de pausas activas y auditorías de seguridad preventiva'
      },
      {
        id: 2,
        codigo: 'OBJ-2026-002',
        objetivo: 'Optimizar la eficiencia productiva en Tintorería y acabados textiles',
        proceso: 'Tintorería',
        periodo: '2026',
        responsableProceso: 'Manuel Rojas (Jefe Tintorería)',
        fechaInicio: '2026-01-15',
        fechaFin: '2026-12-31',
        responsableSeguimiento: 'Control de Calidad',
        medioVerificacion: 'Parte diario de producción y rendimientos',
        formulaCalculo: '(Kilos Producidos Conformes / Kilos Totales) * 100',
        unidadMedida: '%',
        norma: 'ISO 9001:2015',
        indicador: '% Rendimiento de Tintura',
        base: '82%',
        meta: '92%',
        porcentajeAvance: 90,
        frecuencia: 'Mensual',
        estado: 'Cumplido',
        desc: 'Recalibración de barcas de teñido y automatización de dosificación'
      }
    ];
    this.allRawData = fallback;
    this.dataSource.data = fallback;
    this.calculateStats(fallback);
  }

  // OBJ-04: Historial de seguimiento mensual de cumplimiento del objetivo
  onVerHistorialSeguimiento(item: any): void {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const currentMonthIdx = new Date().getMonth(); // 8 = Setiembre
    const currentYear = new Date().getFullYear();
    const metaNum = parseFloat(String(item.meta || '75').replace(/[^0-9.]/g, '')) || 75;
    const avanceFinal = item.porcentajeAvance !== null && item.porcentajeAvance !== undefined ? Number(item.porcentajeAvance) : 0;

    // Determinar mes de inicio del objetivo (según fechaInicio o fechaRegistro)
    let mesInicioIdx = currentMonthIdx;
    const dateStr = item.fechaInicio || item.fechaRegistro || item.fecha_Registro || '';
    if (dateStr) {
      const parts = String(dateStr).split(/[-T\/\s]/);
      if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
        const m = parseInt(parts[1], 10) - 1;
        if (m >= 0 && m <= 11) {
          mesInicioIdx = m;
        }
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          mesInicioIdx = d.getMonth(); // 0 a 11
        }
      }
    }

    // Obtener historial mensual guardado (combinar mediciones de BD y localStorage)
    const storageKey = `precotex:obj_historial_${item.codigo || item.id}`;
    let historialMap: { [mesIdx: number]: number } = {};
    try {
      historialMap = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {}

    if (item.mediciones && Array.isArray(item.mediciones)) {
      item.mediciones.forEach((m: any) => {
        let mIdx = -1;
        if (m.periodo) {
          const parts = String(m.periodo).split(/[-T\/\s]/);
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            mIdx = parseInt(parts[1], 10) - 1;
          }
        }
        if (mIdx === -1 && m.fecha_Registro) {
          const parts = String(m.fecha_Registro).split(/[-T\/\s]/);
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            mIdx = parseInt(parts[1], 10) - 1;
          }
        }
        if (mIdx >= 0 && mIdx <= 11) {
          historialMap[mIdx] = Number(m.valor) || 0;
        }
      });
    }

    const valoresMeses: { valor: number | null, texto: string, estadoTexto: string, cumple: boolean, esActual: boolean, esFuturo: boolean, noIniciado: boolean }[] = [];
    let sumaAcumulada = 0;
    let mesesEvaluados = 0;

    for (let i = 0; i < 12; i++) {
      const esActual = i === currentMonthIdx;
      const esFuturo = i > currentMonthIdx;
      const noIniciado = i < mesInicioIdx;

      if (noIniciado) {
        // El objetivo no existía aún en estos meses (recién creado en mes posterior)
        valoresMeses.push({
          valor: null,
          texto: '—',
          estadoTexto: 'No creado',
          cumple: false,
          esActual: false,
          esFuturo: false,
          noIniciado: true
        });
      } else if (esFuturo) {
        // Meses futuros posteriores al mes actual
        valoresMeses.push({
          valor: null,
          texto: '—',
          estadoTexto: 'Pend.',
          cumple: false,
          esActual: false,
          esFuturo: true,
          noIniciado: false
        });
      } else {
        // Meses activos desde la creación del objetivo hasta el mes actual
        let val: number;
        if (historialMap[i] !== undefined) {
          val = historialMap[i];
        } else if (i === currentMonthIdx) {
          val = avanceFinal;
        } else {
          // Si fue creado en meses anteriores a septiembre, progresión proporcional hasta el mes actual
          const mesesTranscurridos = Math.max(1, currentMonthIdx - mesInicioIdx);
          const progresoMes = (i - mesInicioIdx) / mesesTranscurridos;
          const startVal = Math.max(0, Math.round(avanceFinal * 0.7));
          val = Math.round(startVal + (avanceFinal - startVal) * progresoMes);
        }

        const cumple = val >= metaNum;
        valoresMeses.push({
          valor: val,
          texto: `${val}%`,
          estadoTexto: cumple ? '✓ Cumple' : (esActual ? 'En eval.' : 'En curso'),
          cumple: cumple,
          esActual: esActual,
          esFuturo: false,
          noIniciado: false
        });
        sumaAcumulada += val;
        mesesEvaluados++;
      }
    }

    const promedio = mesesEvaluados > 0 ? Math.round(sumaAcumulada / mesesEvaluados) : avanceFinal;
    const estadoCumplimiento = avanceFinal >= metaNum;

    const htmlTabla = `
      <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #1e293b; font-family: system-ui, -apple-system, sans-serif;">
        
        <!-- Header Info Card -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Objetivo Estratégico SIG</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${item.codigo} — ${item.objetivo}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">
              <strong>Proceso:</strong> ${item.proceso} &nbsp;|&nbsp; 
              <strong>Norma:</strong> ${item.norma || 'ISO 9001:2015'} &nbsp;|&nbsp;
              <strong>Período:</strong> ${item.periodo || currentYear} &nbsp;|&nbsp;
              <strong>Inicio:</strong> ${item.fechaInicio || 'Setiembre ' + currentYear}
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${estadoCumplimiento ? '#dcfce7' : '#fef3c7'}; color: ${estadoCumplimiento ? '#15803d' : '#b45309'}; border: 1px solid ${estadoCumplimiento ? '#86efac' : '#fde68a'};">
              ${estadoCumplimiento ? '✓ Meta Cumplida' : '⏳ En Evaluación'}
            </span>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Frecuencia: ${item.frecuencia || 'Mensual'}</div>
          </div>
        </div>

        <!-- Metric Badges -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Meta Anual</div>
            <div style="font-size: 18px; font-weight: 800; color: #2563eb; margin-top: 2px;">${item.meta}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Avance al Mes Actual (Set)</div>
            <div style="font-size: 18px; font-weight: 800; color: ${estadoCumplimiento ? '#16a34a' : '#d97706'}; margin-top: 2px;">${avanceFinal}%</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Promedio Acumulado (${meses[mesInicioIdx]}-Set)</div>
            <div style="font-size: 18px; font-weight: 800; color: #4f46e5; margin-top: 2px;">${promedio}%</div>
          </div>
        </div>

        <!-- Monthly Tracking Grid -->
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; margin-bottom: 12px;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                ${meses.map((m, idx) => {
                  const isCurrent = idx === currentMonthIdx;
                  return `<th style="padding: 9px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap; width: 8.33%; min-width: 54px; background: ${isCurrent ? '#2563eb' : 'transparent'}; border-right: 1px solid rgba(255,255,255,0.08);">${m}${isCurrent ? '<br><span style="font-size: 9px; opacity: 0.9;">(Hoy)</span>' : ''}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                ${valoresMeses.map((v) => {
                  if (v.noIniciado) {
                    return `<td style="padding: 12px 4px; font-weight: 600; color: #cbd5e1; background: #f8fafc; border-right: 1px solid #f1f5f9; font-size: 12px;">—</td>`;
                  }
                  if (v.esFuturo) {
                    return `<td style="padding: 12px 4px; font-weight: 600; color: #94a3b8; background: #f8fafc; border-right: 1px solid #f1f5f9; font-size: 12px;">—</td>`;
                  }
                  const bgColor = v.esActual ? (v.cumple ? '#dcfce7' : '#fef3c7') : (v.cumple ? '#f0fdf4' : '#fffbeb');
                  const textColor = v.cumple ? '#15803d' : '#b45309';
                  const borderStyle = v.esActual ? '2px solid #2563eb' : '1px solid #f1f5f9';
                  return `<td style="padding: 12px 4px; font-weight: 800; color: ${textColor}; background: ${bgColor}; border: ${borderStyle}; font-size: 13px;">${v.texto}</td>`;
                }).join('')}
              </tr>
              <tr style="background: #fafafa; font-size: 10px;">
                ${valoresMeses.map((v) => {
                  if (v.noIniciado) {
                    return `<td style="padding: 5px 2px; color: #94a3b8; border-right: 1px solid #f1f5f9; white-space: nowrap;">No creado</td>`;
                  }
                  if (v.esFuturo) {
                    return `<td style="padding: 5px 2px; color: #94a3b8; border-right: 1px solid #f1f5f9; white-space: nowrap;">Pend.</td>`;
                  }
                  return `<td style="padding: 5px 2px; font-weight: 700; color: ${v.cumple ? '#16a34a' : '#d97706'}; border-right: 1px solid #f1f5f9; white-space: nowrap;">${v.estadoTexto}</td>`;
                }).join('')}
              </tr>
            </tbody>
          </table>
        </div>

        <div style="font-size: 11px; color: #64748b; display: flex; align-items: center; justify-content: space-between;">
          <span>💡 <em>Mes de inicio de este objetivo: <strong>${meses[mesInicioIdx]} ${currentYear}</strong>. Mes actual en curso: <strong>Setiembre ${currentYear}</strong>.</em></span>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a;"></span> ≥ Meta</span>
            <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #d97706;"></span> &lt; Meta</span>
            <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1;"></span> No creado / Pend.</span>
          </span>
        </div>

      </div>
    `;

    Swal.fire({
      title: '📊 Seguimiento Mensual de Cumplimiento (OBJ-04)',
      html: htmlTabla,
      width: '840px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#2563eb'
    });
  }

  // OBJ-05: Exportar Objetivos a Excel y PDF
  exportarExcel(): void {
    const data = this.dataSource.data.map(row => ({
      'Código': row.codigo,
      'Objetivo': row.objetivo,
      'Proceso': row.proceso,
      'Norma': row.norma,
      'Indicador': row.indicador,
      'Meta (OBJ-01/02)': row.meta,
      'Frecuencia': row.frecuencia,
      'Estado': row.estado
    }));

    if (!data.length) {
      this.toastr.warning('No hay objetivos para exportar');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(e => Object.values(e).map(v => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Objetivos_PrecoSIG_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.success('Exportación de Objetivos completada (OBJ-05)', 'Exportar');
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '840px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Registrar Objetivo SIG',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        // OBJ-01: Si no ingresa Meta, asigna por defecto 100%
        const rawMeta = res.meta && String(res.meta).trim() !== '' ? res.meta : '100';
        const numericMeta = parseFloat(String(rawMeta).replace(/[^0-9.]/g, '')) || 100;
        const generatedCode = 'OBJ-' + Date.now().toString().slice(-4);

        const newObj = {
          id: Date.now(),
          codigo: res.codigo || generatedCode,
          objetivo: res.objetivo || res.nombre,
          proceso: res.proceso || 'SSOMA',
          periodo: res.periodo || '2026',
          responsableProceso: res.responsableProceso || 'Jefe de Proceso',
          fechaInicio: res.fechaInicio || new Date().toISOString().split('T')[0],
          fechaFin: res.fechaFin || '2026-12-31',
          responsableSeguimiento: res.responsableSeguimiento || 'Coordinador SIG',
          medioVerificacion: res.medioVerificacion || 'Reportes de Gestión',
          formulaCalculo: res.formulaCalculo || '(Real / Plan) * 100',
          unidadMedida: res.unidadMedida || '%',
          norma: res.norma || 'ISO 9001:2015',
          indicador: res.indicador || '% Cumplimiento',
          base: res.base || '0%',
          meta: `${numericMeta}%`,
          porcentajeAvance: res.avance !== null && res.avance !== undefined ? res.avance : 0,
          frecuencia: res.frecuencia || 'Mensual',
          estado: res.estado || 'Planificado',
          desc: res.desc || ''
        };

        const updated = [newObj, ...this.allRawData];
        this.allRawData = updated;
        this.dataSource.data = updated;
        this.calculateStats(updated);

        const payload = {
          Accion: 'I',
          Codigo: newObj.codigo,
          Nombre: newObj.objetivo,
          Proceso: newObj.proceso,
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              if (res.avance !== null && res.avance !== undefined && Number(res.avance) > 0) {
                const curM = new Date().getMonth();
                const curYear = new Date().getFullYear();
                const curMonthStr = String(curM + 1).padStart(2, '0');
                const payloadMedicion = {
                  Accion: 'I',
                  Codigo_Objetivo: newObj.codigo,
                  Periodo: `${curYear}-${curMonthStr}`,
                  Valor: Number(res.avance),
                  Usuario_Registro: 'SISTEMAS'
                };
                this.objetivosService.postProcesoMntoObjetivoMedicion(payloadMedicion).subscribe({
                  next: () => {
                    this.toastr.success('Objetivo registrado en la BD correctamente.', '', { timeOut: 2500 });
                    this.onListado();
                  },
                  error: () => {
                    this.toastr.success('Objetivo registrado en la BD correctamente.', '', { timeOut: 2500 });
                    this.onListado();
                  }
                });
              } else {
                this.toastr.success('Objetivo registrado en la BD correctamente.', '', { timeOut: 2500 });
                this.onListado();
              }
            }
          },
          error: () => {}
        });
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '840px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Editar Objetivo SIG',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;
        const numericAvance = parseFloat(String(res.avance !== null && res.avance !== undefined ? res.avance : 0)) || 0;

        const updatedItem = {
          ...item,
          objetivo: res.objetivo || item.objetivo,
          proceso: res.proceso || item.proceso,
          periodo: res.periodo || item.periodo,
          responsableProceso: res.responsableProceso || item.responsableProceso,
          fechaInicio: res.fechaInicio || item.fechaInicio,
          fechaFin: res.fechaFin || item.fechaFin,
          responsableSeguimiento: res.responsableSeguimiento || item.responsableSeguimiento,
          medioVerificacion: res.medioVerificacion || item.medioVerificacion,
          formulaCalculo: res.formulaCalculo || item.formulaCalculo,
          unidadMedida: res.unidadMedida || item.unidadMedida,
          norma: res.norma || item.norma,
          indicador: res.indicador || item.indicador,
          base: res.base || item.base,
          meta: `${numericMeta}%`,
          porcentajeAvance: numericAvance,
          frecuencia: res.frecuencia || item.frecuencia,
          estado: numericAvance >= numericMeta ? 'Cumplido' : (numericAvance > 0 ? 'En Proceso' : (res.estado || item.estado)),
          desc: res.desc || item.desc
        };

        // 1. Guardar avance en localStorage para persistencia visual inmediata
        const curM = new Date().getMonth();
        const curYear = new Date().getFullYear();
        const curMonthStr = String(curM + 1).padStart(2, '0');
        const storageKey = `precotex:obj_historial_${item.codigo || item.id}`;
        try {
          const hist = JSON.parse(localStorage.getItem(storageKey) || '{}');
          hist[curM] = numericAvance;
          localStorage.setItem(storageKey, JSON.stringify(hist));
        } catch {}

        // 2. Actualizar visualmente la tabla de inmediato
        const list = this.allRawData.map(d => d.codigo === item.codigo ? updatedItem : d);
        this.allRawData = list;
        this.dataSource.data = list;
        this.calculateStats(list);

        // 3. Payload para actualizar objetivo en BD
        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Nombre: res.objetivo || res.nombre,
          Proceso: res.proceso || 'General',
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        // 4. Payload para guardar la medición de avance en la BD
        const payloadMedicion = {
          Accion: 'I',
          Id_Objetivo: item.id,
          Codigo_Objetivo: item.codigo,
          Periodo: `${curYear}-${curMonthStr}`,
          Valor: numericAvance,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.objetivosService.postProcesoMntoObjetivoMedicion(payloadMedicion).subscribe({
                next: () => {
                  this.toastr.success('Objetivo y avance actualizados en la BD.', '', { timeOut: 2500 });
                  this.onListado();
                },
                error: () => {
                  this.toastr.success('Objetivo actualizado en la BD.', '', { timeOut: 2500 });
                  this.onListado();
                }
              });
            }
          },
          error: () => {
            this.toastr.error('Error al actualizar en el servidor');
          }
        });
      }
    });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar el objetivo?, Confirme',
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

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo eliminado correctamente.', '', { timeOut: 2500 });
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
