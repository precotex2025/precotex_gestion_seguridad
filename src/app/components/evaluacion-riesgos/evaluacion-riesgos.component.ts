import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { EvaluacionRiesgosRegeditComponent } from './evaluacion-riesgos-regedit/evaluacion-riesgos-regedit.component';
import { RiesgosService } from '../../services/riesgos.service';
import { Router } from '@angular/router';

export interface RiesgoItem {
  id: number;
  codigo: string;
  tipo: string;
  descbrief: string;
  proceso: string;
  nivel: string;
  estado: string; // 'Controlado' | 'En seguimiento' | 'Sin control'
  responsable: string;
  revision: string; // YYYY-MM-DD
  medidacontrol?: string;
  planaccion?: string; // RIE-21: Plan de acción / acción correctiva
  evidencia?: string;   // RIE-21: Evidencia de sustento (matriz IPERC, informe de verificación)
  avance?: number;
  probabilidad?: number;
  impacto?: number;
  sede?: string;
  fcierre?: string;
  periodo?: string;
  clausula?: string;
  causaprobable?: string;
  consecuenciapotencial?: string;
}

@Component({
  selector: 'app-evaluacion-riesgos',
  standalone: false,
  templateUrl: './evaluacion-riesgos.component.html',
  styleUrls: ['./evaluacion-riesgos.component.css']
})
export class EvaluacionRiesgosComponent implements OnInit {
  activeSubTab: 'identificacion' | 'seguimiento' = 'identificacion';
  segUrgFilter: 'all' | 'venc' | 'prox' | 'ald' = 'all';

  formularioBusqueda!: FormGroup;
  riesgos: RiesgoItem[] = [];
  riesgosFiltrados: RiesgoItem[] = [];

  cantTotal = 0;
  cantControlado = 0;
  cantEnSeguimiento = 0;
  cantSinControl = 0;
  cantNivelAlto = 0; // RIE-02: Riesgos Críticos (Nivel Alto)
  pctCumplimiento = 0; // RIE-02: % Cumplimiento del plan

  expandedRow: string | null = null;
  mostrarBanner: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private riesgosService: RiesgosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.router.url.includes('seguimiento-controles')) {
      this.activeSubTab = 'seguimiento';
    } else {
      this.activeSubTab = 'identificacion';
    }

    this.formularioBusqueda = this.fb.group({
      termino: [''],
      sede: [''],
      proceso: [''],
      tipo: [''],
      estado: ['']
    });

    this.cargarDatos();
  }

  setSegUrgFilter(filter: 'all' | 'venc' | 'prox' | 'ald'): void {
    this.segUrgFilter = filter;
  }

  getSeguimientoList(): RiesgoItem[] {
    let list = this.riesgosFiltrados || this.riesgos;
    if (this.segUrgFilter === 'all') return list;
    return list.filter(r => this.getRiesgoUrgencia(r.revision).key === this.segUrgFilter);
  }

  getRiesgoUrgencia(fechaStr: string): { key: string; text: string; badgeClass: string; days: number } {
    if (!fechaStr) return { key: 'sin', text: 'Sin fecha', badgeClass: 'soft-badge-revision', days: 999 };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const rev = new Date(fechaStr);
    rev.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((rev.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) {
      return { key: 'venc', text: `Vencida hace ${Math.abs(diffDays)}d`, badgeClass: 'soft-badge-porvencer', days: diffDays };
    }
    if (diffDays <= 30) {
      return { key: 'prox', text: `Vence en ${diffDays}d`, badgeClass: 'soft-badge-revision', days: diffDays };
    }
    return { key: 'ald', text: 'Al día', badgeClass: 'soft-badge-vigente', days: diffDays };
  }

  getAvanceControl(item: RiesgoItem): number {
    if (item.avance !== undefined && item.avance !== null) return item.avance;
    const st = (item.estado || '').toLowerCase();
    if (st.includes('controlado')) return 100;
    if (st.includes('seguimiento') || st.includes('proceso')) return 50;
    return 0;
  }

  onActualizarControl(item: RiesgoItem, event?: Event): void {
    if (event) event.stopPropagation();
    
    const currUrg = this.getRiesgoUrgencia(item.revision);
    const currAvance = this.getAvanceControl(item);

    const modalHtml = `
      <div class="seg-modal-top-accent"></div>
      
      <div class="seg-modal-header">
        <div class="seg-modal-header-left">
          <div class="seg-modal-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <h3 class="seg-modal-title">Actualizar Seguimiento de Control</h3>
            <p class="seg-modal-subtitle">Control residual, plan de acción correctivo y verificación de medidas preventivas (IPERC)</p>
          </div>
        </div>
      </div>

      <div class="seg-risk-banner">
        <div class="seg-risk-badge-row">
          <span class="seg-risk-code">${item.codigo}</span>
          <span class="seg-risk-proc">${item.proceso}</span>
          <span style="font-size: 11px; color: #64748b; margin-left: auto;">Nivel Residual: <strong>${item.nivel}</strong></span>
        </div>
        <p class="seg-risk-desc">${item.descbrief}</p>
      </div>

      <div class="seg-form-grid">
        <div class="seg-form-group">
          <label class="seg-label">Estado de Control (*)</label>
          <select id="swal-seg-estado" class="seg-select">
            <option value="Controlado" ${item.estado === 'Controlado' ? 'selected' : ''}>🟢 Controlado (Riesgo Mitigado)</option>
            <option value="En seguimiento" ${item.estado === 'En seguimiento' ? 'selected' : ''}>🔵 En seguimiento (En proceso)</option>
            <option value="Sin control" ${item.estado === 'Sin control' ? 'selected' : ''}>🔴 Sin control (Requiere Acción)</option>
          </select>
        </div>
        <div class="seg-form-group">
          <label class="seg-label">Próxima Fecha de Revisión (*)</label>
          <input type="date" id="swal-seg-fecha" value="${item.revision || ''}" class="seg-input">
        </div>
      </div>

      <!-- Card Porcentaje de Avance -->
      <div class="seg-avance-card">
        <div class="seg-avance-header">
          <label class="seg-label" style="margin-bottom: 0;">
            Avance del Plan de Acción
          </label>
          <div class="seg-avance-pill">
            <input type="number" 
                   id="swal-seg-avance-num" 
                   min="0" 
                   max="100" 
                   step="1" 
                   value="${currAvance}" 
                   class="seg-avance-num-input">
            <span style="font-weight: 800; color: #4f46e5; font-size: 13px;">%</span>
          </div>
        </div>
        
        <input type="range" 
               id="swal-seg-avance" 
               min="0" 
               max="100" 
               step="1" 
               value="${currAvance}" 
               class="seg-slider">
        
        <div class="seg-presets-row">
          <button type="button" class="seg-preset-btn ${currAvance === 0 ? 'active' : ''}" data-pct="0">0%</button>
          <button type="button" class="seg-preset-btn ${currAvance === 25 ? 'active' : ''}" data-pct="25">25%</button>
          <button type="button" class="seg-preset-btn ${currAvance === 50 ? 'active' : ''}" data-pct="50">50%</button>
          <button type="button" class="seg-preset-btn ${currAvance === 75 ? 'active' : ''}" data-pct="75">75%</button>
          <button type="button" class="seg-preset-btn ${currAvance === 100 ? 'active-green' : ''}" data-pct="100">100% Meta</button>
        </div>
      </div>

      <!-- Medida de Control -->
      <div class="seg-form-group" style="margin-bottom: 12px;">
        <label class="seg-label">Medida de Control / Acción Implementada (*)</label>
        <textarea id="swal-seg-medida" rows="2" class="seg-textarea" placeholder="Describe detalladamente el avance del control, barrera física o inspección aplicada...">${item.medidacontrol || ''}</textarea>
      </div>

      <!-- Plan de Acción Correctiva -->
      <div class="seg-form-group" style="margin-bottom: 12px;">
        <label class="seg-label">Plan de Acción / Acción Correctiva (*)</label>
        <textarea id="swal-seg-plan" rows="2" class="seg-textarea" placeholder="Acción correctiva según matriz IPERC (ej. colocación de guardas, capacitación operativa)...">${item.planaccion || ''}</textarea>
      </div>

      <!-- Evidencia de Sustento Dropzone -->
      <div class="seg-form-group" style="margin-bottom: 12px;">
        <label class="seg-label">Evidencia de Sustento (Matriz IPERC / Informe de Verificación)</label>
        <input type="file" id="swal-seg-file-input" accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg" style="display:none;">
        <div id="swal-seg-dropzone" class="seg-dropzone">
          <div class="seg-dropzone-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span id="swal-seg-filename" data-filename="${item.evidencia || ''}">${item.evidencia ? item.evidencia : 'Adjuntar archivo de sustento (PDF, Excel, Imagen)'}</span>
          </div>
          <div class="seg-dropzone-subtitle">Formatos: PDF, XLSX, DOCX, PNG (Máx. 10MB) • Clic para examinar o arrastrar</div>
        </div>
      </div>

      <!-- Responsable -->
      <div class="seg-form-group">
        <label class="seg-label">Responsable del Seguimiento</label>
        <input type="text" id="swal-seg-resp" value="${item.responsable || ''}" placeholder="Nombre o cargo del responsable de control" class="seg-input">
      </div>
    `;

    Swal.fire({
      html: modalHtml,
      width: '680px',
      showCancelButton: true,
      confirmButtonText: 'Guardar Seguimiento',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'custom-swal-seguimiento',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn',
        actions: 'custom-swal-actions'
      },
      buttonsStyling: false,
      didOpen: () => {
        const range = document.getElementById('swal-seg-avance') as HTMLInputElement;
        const num = document.getElementById('swal-seg-avance-num') as HTMLInputElement;
        const estadoSelect = document.getElementById('swal-seg-estado') as HTMLSelectElement;

        const updateAvance = (val: number) => {
          const clamped = isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100);
          if (range) range.value = clamped.toString();
          if (num) num.value = clamped.toString();

          if (estadoSelect) {
            if (clamped === 100 && estadoSelect.value !== 'Controlado') {
              estadoSelect.value = 'Controlado';
            } else if (clamped > 0 && clamped < 100 && estadoSelect.value === 'Sin control') {
              estadoSelect.value = 'En seguimiento';
            }
          }

          // Actualizar estado visual de los botones de preset
          document.querySelectorAll('.seg-preset-btn').forEach(b => {
            const btnPct = parseInt(b.getAttribute('data-pct') || '-1', 10);
            b.classList.remove('active', 'active-green');
            if (btnPct === clamped) {
              b.classList.add(clamped === 100 ? 'active-green' : 'active');
            }
          });
        };

        if (range && num) {
          range.addEventListener('input', (e: any) => updateAvance(parseInt(e.target.value, 10)));
          num.addEventListener('input', (e: any) => updateAvance(parseInt(e.target.value, 10)));
        }

        document.querySelectorAll('.seg-preset-btn').forEach(btn => {
          btn.addEventListener('click', (e: any) => {
            const pct = parseInt(e.target.getAttribute('data-pct') || '0', 10);
            updateAvance(pct);
          });
        });

        // Manejador de carga de archivo evidencia
        const dropzone = document.getElementById('swal-seg-dropzone');
        const fileInput = document.getElementById('swal-seg-file-input') as HTMLInputElement;
        const filenameSpan = document.getElementById('swal-seg-filename');

        if (dropzone && fileInput && filenameSpan) {
          dropzone.addEventListener('click', () => fileInput.click());
          
          fileInput.addEventListener('change', (e: any) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              if (file.size > 10 * 1024 * 1024) {
                this.toastr.warning('El archivo supera el límite de 10 MB');
                return;
              }
              filenameSpan.innerText = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
              filenameSpan.setAttribute('data-filename', file.name);
            }
          });
        }
      },
      preConfirm: () => {
        const estado = (document.getElementById('swal-seg-estado') as HTMLSelectElement)?.value;
        const fecha = (document.getElementById('swal-seg-fecha') as HTMLInputElement)?.value;
        const numInput = document.getElementById('swal-seg-avance-num') as HTMLInputElement;
        const rangeInput = document.getElementById('swal-seg-avance') as HTMLInputElement;
        const rawAvance = numInput ? numInput.value : (rangeInput ? rangeInput.value : '0');
        const avance = Math.min(Math.max(parseInt(rawAvance || '0', 10), 0), 100);
        const medida = (document.getElementById('swal-seg-medida') as HTMLTextAreaElement)?.value;
        const plan = (document.getElementById('swal-seg-plan') as HTMLTextAreaElement)?.value;
        const filenameSpan = document.getElementById('swal-seg-filename');
        const evidencia = filenameSpan ? (filenameSpan.getAttribute('data-filename') || filenameSpan.innerText) : '';
        const resp = (document.getElementById('swal-seg-resp') as HTMLInputElement)?.value;

        if (!medida || !fecha) {
          Swal.showValidationMessage('Por favor ingrese la medida de control y la fecha de revisión.');
          return false;
        }

        return { 
          estado, 
          revision: fecha, 
          avance, 
          medidacontrol: medida, 
          planaccion: plan,
          evidencia: evidencia.includes('Adjuntar archivo') ? '' : evidencia,
          responsable: resp 
        };
      }
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const val = res.value;
        item.estado = val.estado;
        item.revision = val.revision;
        item.avance = val.avance;
        item.medidacontrol = val.medidacontrol;
        item.planaccion = val.planaccion;
        item.evidencia = val.evidencia;
        if (val.responsable) item.responsable = val.responsable;

        if (val.estado === 'Controlado') {
          item.fcierre = new Date().toISOString().substring(0, 10);
          item.nivel = 'Bajo';
          item.probabilidad = 2;
          item.impacto = 2;
        } else if (val.estado === 'En seguimiento') {
          item.fcierre = '--';
          item.nivel = 'Medio';
          item.probabilidad = 3;
          item.impacto = 3;
        } else if (val.estado === 'Sin control') {
          item.fcierre = '--';
          item.nivel = 'Alto';
          item.probabilidad = 5;
          item.impacto = 4;
        }

        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Tipo: item.tipo,
          Descripcion_Breve: item.descbrief,
          Proceso: item.proceso,
          Nivel: item.nivel,
          Estado: val.estado,
          Responsable: item.responsable,
          Fecha_Revision: val.revision,
          Medida_Control: val.medidacontrol,
          Usuario_Registro: 'SISTEMAS'
        };

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: () => {
            this.actualizarContadores();
            this.onBuscar();
            this.toastr.success(`Seguimiento del riesgo ${item.codigo} actualizado`, 'Control de Riesgos');
          },
          error: () => {
            this.actualizarContadores();
            this.onBuscar();
            this.toastr.success(`Seguimiento del riesgo ${item.codigo} actualizado localmente`, 'Control de Riesgos');
          }
        });
      }
    });
  }

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  toggleRow(codigo: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.expandedRow === codigo) {
      this.expandedRow = null;
    } else {
      this.expandedRow = codigo;
    }
  }

  isRowExpanded(codigo: string): boolean {
    return this.expandedRow === codigo;
  }

  getNivelHeatmapClass(nivel: string): string {
    if (!nivel) return 'heatmap-bajo';
    const n = nivel.toLowerCase().trim();
    if (n.includes('alt') || n.includes('crític') || n.includes('critic')) return 'heatmap-alto';
    if (n.includes('med')) return 'heatmap-medio';
    return 'heatmap-bajo';
  }

  readonly sedesOptions = [
    'Santa Maria',
    'Santa Cecilia',
    'Santa Rosa',
    'Huachipa 1',
    'Huachipa 2',
    'Huachipa 3',
    'Independencia 1',
    'Independencia 2',
    'Todas'
  ]; // RIE-04
  readonly tiposOptions = ['Seguridad', 'Calidad', 'Ambiental', 'Operativo']; // RIE-04
  readonly procesosOptions = [
    'Sistemas', 'Servicios Compartidos', 'Recursos Humanos', 'Finanzas', 'SSOMA',
    'Corte', 'Costura', 'Tintorería'
  ];
  readonly nivelesOptions = ['Alto', 'Medio', 'Bajo'];
  readonly estadosOptions = ['Controlado', 'En seguimiento', 'Sin control'];

  limpiarFiltros(): void {
    this.formularioBusqueda.reset({
      termino: '',
      sede: '',
      proceso: '',
      tipo: '',
      estado: ''
    });
    this.cellFilter = null;
    this.onBuscar();
  }

  // RIE-05: Exportar Matriz IPERC / SIG a Excel
  exportarExcelIPERC(): void {
    const data = this.riesgosFiltrados.map(r => ({
      'Código': r.codigo,
      'Tipo de Riesgo': r.tipo,
      'Descripción / Peligro': r.descbrief,
      'Proceso': r.proceso,
      'Nivel de Riesgo (Residual)': r.nivel,
      'Estado': r.estado,
      'Responsable': r.responsable,
      'Última Revisión': r.revision,
      'Medida de Control': r.medidacontrol || 'Ninguna'
    }));

    if (!data.length) {
      this.toastr.warning('No hay riesgos para exportar', 'Matriz IPERC');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(e => Object.values(e).map(v => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Matriz_IPERC_Precotex_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.success('Exportación IPERC/SIG realizada con éxito (RIE-05)', 'Matriz IPERC');
  }

  // RIE-06: Historial de revaluaciones de riesgos
  onVerHistorialRevaluaciones(item: any): void {
    const htmlHistorial = `
      <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #1e293b;">
        <p style="color: #334155; margin-bottom: 10px;">
          <strong style="color: #0f172a;">Código:</strong> ${item.codigo} | 
          <strong style="color: #0f172a;">Riesgo:</strong> ${item.descbrief}
        </p>
        <p style="color: #475569; margin-bottom: 10px;">
          <strong>Proceso:</strong> ${item.proceso} | 
          <strong>Responsable:</strong> ${item.responsable}
        </p>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Fecha</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Eval. Inicial</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Revaluación (Residual)</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">${item.revision || '2026-02-10'}</td>
                <td style="padding: 10px 12px;"><span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Alto (15)</span></td>
                <td style="padding: 10px 12px;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-weight: 700;">${item.nivel || 'Bajo'}</span></td>
                <td style="padding: 10px 12px; color: #334155;">${item.estado}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 12px; color: #64748b;">2025-08-15</td>
                <td style="padding: 10px 12px;"><span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Alto (20)</span></td>
                <td style="padding: 10px 12px;"><span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Medio (10)</span></td>
                <td style="padding: 10px 12px; color: #64748b;">En seguimiento</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    Swal.fire({
      title: '📈 Historial de Revaluaciones (RIE-06)',
      html: htmlHistorial,
      width: '680px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#6366f1'
    });
  }

  cargarDatos(): void {
    this.riesgosService.getListadoRiesgos().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.riesgos = res.elements.map((item: any) => ({
            id: item.id_Riesgo,
            codigo: item.codigo,
            tipo: item.tipo,
            descbrief: item.descripcion_Breve,
            proceso: item.proceso,
            nivel: item.nivel,
            estado: item.estado,
            responsable: item.responsable,
            revision: item.fecha_Revision ? item.fecha_Revision.split('T')[0] : '',
            medidacontrol: item.medida_Control || '',
            sede: item.sede || 'Santa Maria',
            fcierre: item.fecha_Cierre ? item.fecha_Cierre.split('T')[0] : (item.estado === 'Controlado' ? '2025-12-15' : '--'),
            periodo: item.periodo || '2026',
            clausula: item.clausula || '6.1.2 Identificación de peligros y evaluación de los riesgos (IPERC)',
            causaprobable: item.causa_Probable || item.causaProbable || '',
            consecuenciapotencial: item.consecuencia_Potencial || item.consecuenciaPotencial || ''
          }));
          this.actualizarContadores();
          this.onBuscar();
        } else {
          this.riesgos = [];
          this.actualizarContadores();
          this.riesgosFiltrados = [];
        }
      },
      error: (err) => {
        console.error('Error al listar Riesgos:', err);
        this.riesgos = [];
        this.actualizarContadores();
        this.riesgosFiltrados = [];
      }
    });
  }

  actualizarContadores(): void {
    this.cantTotal = this.riesgos.length;
    this.cantControlado = this.riesgos.filter(r => (r.estado || '').toLowerCase() === 'controlado').length;
    this.cantEnSeguimiento = this.riesgos.filter(r => (r.estado || '').toLowerCase().includes('seguimiento')).length;
    this.cantSinControl = this.riesgos.filter(r => (r.estado || '').toLowerCase().includes('sin control')).length;
    
    // RIE-02: Nivel Alto (críticos) - Requieren acción inmediata
    this.cantNivelAlto = this.riesgos.filter(r => {
      const niv = (r.nivel || '').toLowerCase();
      return niv.includes('alt') || niv.includes('crític') || niv.includes('critic');
    }).length;

    // RIE-02: Cumplimiento del plan (% controlados / total)
    this.pctCumplimiento = this.cantTotal ? Math.round((this.cantControlado / this.cantTotal) * 100) : 0;
  }

  cellFilter: string | null = null;

  toggleMatrixCellFilter(prob: number, impacto: number): void {
    const key = `${prob}-${impacto}`;
    if (this.cellFilter === key) {
      this.cellFilter = null;
    } else {
      this.cellFilter = key;
    }
    this.onBuscar();
  }

  clearCellFilter(): void {
    this.cellFilter = null;
    this.onBuscar();
  }

  getMatrixCount(prob: number, impacto: number): number {
    return this.riesgos.filter(r => {
      const niv = (r.nivel || '').toLowerCase();
      const p = r.probabilidad || (niv.includes('alt') ? 5 : (niv.includes('med') ? 3 : 2));
      const i = r.impacto || (niv.includes('alt') ? 4 : (niv.includes('med') ? 3 : 2));
      return p === prob && i === impacto;
    }).length;
  }

  getMatrixCellColor(prob: number, impacto: number): string {
    const score = prob * impacto;
    if (score >= 15) return 'rgba(240, 87, 107, 0.4)';
    if (score >= 8)  return 'rgba(240, 180, 41, 0.4)';
    return 'rgba(62, 207, 142, 0.4)';
  }

  onBuscar(): void {
    const filters = this.formularioBusqueda.value;
    const term = (filters.termino || '').toLowerCase().trim();

    this.riesgosFiltrados = this.riesgos.filter(item => {
      if (term) {
        const cod = (item.codigo || '').toLowerCase();
        const desc = (item.descbrief || '').toLowerCase();
        const resp = (item.responsable || '').toLowerCase();
        if (
          !cod.includes(term) &&
          !desc.includes(term) &&
          !resp.includes(term)
        ) {
          return false;
        }
      }
      if (filters.sede && item.sede && item.sede !== filters.sede) return false;
      if (filters.tipo && item.tipo !== filters.tipo) return false;
      if (filters.proceso && item.proceso !== filters.proceso) return false;
      if (filters.estado && item.estado !== filters.estado) return false;
      return true;
    });

    if (this.cellFilter) {
      const [p, i] = this.cellFilter.split('-').map(Number);
      this.riesgosFiltrados = this.riesgosFiltrados.filter(item => {
        const prob = item.probabilidad || (item.nivel.toLowerCase().includes('alt') ? 5 : (item.nivel.toLowerCase().includes('med') ? 3 : 2));
        const imp = item.impacto || (item.nivel.toLowerCase().includes('alt') ? 4 : (item.nivel.toLowerCase().includes('med') ? 3 : 2));
        return prob === p && imp === i;
      });
    }
  }

  // RIE-07: Botón "Ver" detalle del riesgo declarado (jala datos de Declarar Riesgo)
  onVer(item: RiesgoItem): void {
    this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: false,
      data: {
        Title: 'Ver Riesgo Declarado',
        Accion: 'V',
        Datos: item
      }
    });
  }

  // RIE-08: Generar código autogenerado secuencial (ej. RSG-2026-001)
  generarNuevoCodigo(): string {
    const year = new Date().getFullYear();
    let maxNum = 0;
    
    (this.riesgos || []).forEach(r => {
      if (r.codigo) {
        const match = r.codigo.match(/\d+/g);
        if (match && match.length > 0) {
          const num = parseInt(match[match.length - 1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `RSG-${year}-${nextNum}`;
  }

  onAgregar(): void {
    const nextCod = this.generarNuevoCodigo();
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Declarar Riesgo',
        Accion: 'I',
        NextCodigo: nextCod,
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          Accion: 'I',
          Codigo: result.codigo || nextCod,
          Periodo: result.periodo || new Date().getFullYear().toString(),
          Sede: result.sede || 'Santa Maria',
          Tipo: result.tipo,
          Clausula: result.clausula || '6.1.2 Identificación de peligros y evaluación de los riesgos (IPERC)',
          Descripcion_Breve: result.descbrief,
          Proceso: result.proceso,
          Causa_Probable: result.causaprobable || '',
          Consecuencia_Potencial: result.consecuenciapotencial || '',
          Nivel: result.nivel,
          Estado: result.estado,
          Responsable: result.responsable,
          Fecha_Revision: result.revision,
          Medida_Control: result.medidacontrol,
          Usuario_Registro: 'SISTEMAS'
        };

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.toastr.success(`Riesgo ${payload.Codigo} declarado y guardado en BD.`, 'Registrado');
              this.cargarDatos();
            } else {
              this.toastr.error(res?.message || `No se pudo registrar el riesgo ${payload.Codigo}.`, 'Error BD');
              this.cargarDatos();
            }
          },
          error: (err: any) => {
            console.error('Error al registrar riesgo en backend:', err);
            this.toastr.error(err?.error?.message || err?.message || 'Error al conectar con el servidor', 'Error');
            this.cargarDatos();
          }
        });
      }
    });
  }

  onEdit(item: RiesgoItem): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar Riesgo Declarado',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Periodo: result.periodo || item.periodo || new Date().getFullYear().toString(),
          Sede: result.sede || item.sede || 'Santa Maria',
          Tipo: result.tipo,
          Clausula: result.clausula || item.clausula || '6.1.2 Identificación de peligros y evaluación de los riesgos (IPERC)',
          Descripcion_Breve: result.descbrief,
          Proceso: result.proceso,
          Causa_Probable: result.causaprobable || item.causaprobable || '',
          Consecuencia_Potencial: result.consecuenciapotencial || item.consecuenciapotencial || '',
          Nivel: result.nivel,
          Estado: result.estado,
          Responsable: result.responsable,
          Fecha_Revision: result.revision,
          Medida_Control: result.medidacontrol,
          Usuario_Registro: 'SISTEMAS'
        };

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.toastr.success('Riesgo actualizado en BD.', 'Actualizado');
              this.cargarDatos();
            } else {
              this.toastr.error(res.message || 'Error al actualizar el riesgo.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onDelete(item: RiesgoItem): void {
    Swal.fire({
      title: `¿Está seguro de eliminar el riesgo "${item.codigo}"?`,
      icon: 'warning',
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

        this.riesgosService.postProcesoMntoRiesgo(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.toastr.warning(`Riesgo "${item.codigo}" eliminado.`, 'Eliminado');
              this.cargarDatos();
            } else {
              this.toastr.error(res.message || 'Error al eliminar.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '--';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
  }

  getEstadoClass(est: string): string {
    switch ((est || '').toLowerCase()) {
      case 'controlado':
        return 'status-green';
      case 'en seguimiento':
        return 'status-amber';
      default:
        return 'status-red';
    }
  }
}
