import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriasRegeditComponent } from './auditorias-regedit/auditorias-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AuditoriasService } from '../../services/auditorias.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auditorias',
  standalone: false,
  templateUrl: './auditorias.component.html',
  styleUrl: './auditorias.component.css'
})
export class AuditoriasComponent implements OnInit {

  // Navegación por pestañas internas
  activeSubTab: 'planificacion' | 'ejecucion' = 'planificacion';

  // Estadísticas Planificación
  stats = {
    total: 0,
    realizadas: 0,
    programadas: 0,
    noRealizadas: 0
  };

  // Estadísticas Ejecución y Resultados (AUDEJEC)
  ejecucionStats = {
    total: 0,
    conformidades: 0,
    observaciones: 0,
    noConformidades: 0
  };

  ejecucionList: any[] = [];
  ejecucionFilter: string = '';

  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  setSubTab(tab: 'planificacion' | 'ejecucion'): void {
    this.activeSubTab = tab;
  }

  displayedColumns: string[] = [
    'codigo',
    'tipo',
    'norma',
    'responsable',
    'sedes',
    'areas',
    'inicio',
    'fin',
    'frecuencia',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  defaultEjecucionSeed = [
    {
      id: 'EJEC-001',
      auditoria: 'AUD-INT-2025-001',
      norma: 'ISO 9001:2015',
      proceso: 'Costura, Aseguramiento de la Calidad',
      clausula: 'ISO 9001: 8.5, 9.1',
      fecha: '2025-01-15',
      auditados: 'Carlos Ríos (Línea 3)',
      tipo: 'No conformidad',
      descripcion: 'Reproceso por costura fuera de especificación en línea 3 de manufactura.',
      nc: 'NC-INT-2025-002',
      responsable: 'Juan Pérez (Auditor Lider)',
      estado: 'Cerrado',
      archivo: 'informe_costura_linea3.pdf',
      notas: 'Verificado cierre satisfactorio en auditoría de seguimiento.'
    },
    {
      id: 'EJEC-002',
      auditoria: 'AUD-INT-2025-002',
      norma: 'ISO 45001 / ISO 14001',
      proceso: 'SSOMA, Mantenimiento',
      clausula: 'ISO 45001: 6.1, 8.1',
      fecha: '2025-02-20',
      auditados: 'Jefe SSOMA, Mantenimiento',
      tipo: 'Observación',
      descripcion: 'Extintor PQS sin rotulado de mantenimiento vigente en almacén central.',
      nc: 'NC-INT-2025-004',
      responsable: 'María Torres (Auditora SST)',
      estado: 'Abierto',
      archivo: 'inspeccion_extintores_feb.pdf',
      notas: 'Se solicita orden de servicio para recarga y etiquetado.'
    },
    {
      id: 'EJEC-003',
      auditoria: 'AUD-INT-2025-003',
      norma: 'ISO 9001:2015',
      proceso: 'Control Patrimonial, Logística',
      clausula: 'ISO 9001: 7.1.5',
      fecha: '2025-03-10',
      auditados: 'Control Patrimonial',
      tipo: 'Conformidad',
      descripcion: 'Control de inventarios y trazabilidad con 100% de cumplimiento operativo.',
      nc: '—',
      responsable: 'Carlos Rivas (Auditor Calidad)',
      estado: 'Cerrado',
      archivo: 'acta_trazabilidad_marzo.pdf',
      notas: 'Conforme sin observaciones ni hallazgos pendientes.'
    }
  ];

  constructor(
    private dialog : MatDialog,
    private toastr : ToastrService,
    private auditoriasService : AuditoriasService,
    private router : Router
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('ejecucion-resultados')) {
      this.activeSubTab = 'ejecucion';
    }
    this.onListado();
    this.loadEjecucionData();
  }

  onListado(): void {
    this.auditoriasService.getListadoAuditorias('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const list = res.elements.map((d: any) => ({
            id: d.id_Auditoria || d.id || d.codigo_Auditoria,
            id_Auditoria: d.id_Auditoria || d.id,
            codigo_Auditoria: d.codigo_Auditoria || d.codigoAuditoria || d.codigo,
            tipo: d.tipo,
            norma: d.norma,
            responsable: d.responsable,
            sedes: d.sedes || d.sede || d.sede_Auditoria || d.sedes_Participantes || '',
            sede: d.sede || d.sedes || '',
            areas: d.areas || d.area || d.procesos || d.proceso || '',
            inicio: d.fecha_Inicio ? d.fecha_Inicio.split('T')[0] : (d.inicio ? d.inicio.split('T')[0] : ''),
            fin: d.fecha_Fin ? d.fecha_Fin.split('T')[0] : (d.fin ? d.fin.split('T')[0] : ''),
            frecuencia: d.frecuencia,
            estado: d.estado,
            alcance: d.alcance
          }));
          this.dataSource.data = list;
          this.calculateStats(list);
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: () => {
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total        : data.length,
      realizadas   : data.filter(d => d.estado === 'Realizada').length,
      programadas  : data.filter(d => d.estado === 'Programada').length,
      noRealizadas : data.filter(d => d.estado === 'No realizada').length,
    };
  }

  // --- LÓGICA PANEL DE EJECUCIÓN Y RESULTADOS (AUDEJEC - BD + LOCALSTORAGE FALLBACK) ---
  loadEjecucionData(): void {
    let fileCache: Record<string, any> = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const rawCache = localStorage.getItem('precotex:auditorias:file_cache');
        if (rawCache) fileCache = JSON.parse(rawCache);
      } catch {}
    }

    this.auditoriasService.getListadoEjecucionAuditorias('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          this.ejecucionList = res.elements.map((d: any) => {
            const ejecId = d.codigo_Ejecucion || d.id || ('EJEC-' + (d.id_Ejecucion || Math.floor(1000 + Math.random() * 9000)));
            const auditCode = d.codigo_Auditoria || d.auditoria;
            const cached = fileCache[ejecId] || fileCache[auditCode] || (d.archivo ? fileCache[d.archivo] : null);

            return {
              id: ejecId,
              id_Ejecucion: d.id_Ejecucion || (typeof d.id === 'number' ? d.id : 0),
              codigo_Ejecucion: d.codigo_Ejecucion || d.codigo || (typeof d.id === 'string' ? d.id : ''),
              auditoria: auditCode,
              tipoAuditoria: d.tipoAuditoria || d.tipo || (auditCode && auditCode.includes('-EXT-') ? 'Externa' : (auditCode && auditCode.includes('-CLI-') ? 'Cliente' : 'Interna')),
              norma: d.norma || 'ISO 9001:2015',
              proceso: d.proceso || 'General',
              fecha: d.fecha ? d.fecha.split('T')[0] : '',
              auditados: d.auditados || '',
              tipo: d.tipo || 'Observación',
              descripcion: d.descripcion || '',
              nc: d.nc || '—',
              responsable: d.responsable || '',
              estado: d.estado || 'Abierto',
              archivo: d.archivo || '',
              archivoBase64: cached?.base64 || d.archivoBase64 || '',
              archivoType: cached?.type || d.archivoType || '',
              notas: d.notas || ''
            };
          });
          this.saveLocalBackupEjecucion();
        } else {
          this.loadLocalBackupEjecucion();
        }
      },
      error: () => {
        this.loadLocalBackupEjecucion();
      }
    });
  }

  loadLocalBackupEjecucion(): void {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('precotex:auditorias:ejecucion') : null;
    if (raw !== null && raw !== undefined) {
      try {
        const parsed = JSON.parse(raw);
        this.ejecucionList = Array.isArray(parsed) ? parsed : [];
      } catch {
        this.ejecucionList = [];
      }
    } else {
      this.ejecucionList = [];
      this.saveLocalBackupEjecucion();
    }
    this.calculateEjecucionStats();
  }

  saveLocalBackupEjecucion(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('precotex:auditorias:ejecucion', JSON.stringify(this.ejecucionList));
    }
    this.calculateEjecucionStats();
  }

  saveEjecucionData(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('precotex:auditorias:ejecucion', JSON.stringify(this.ejecucionList));
    }
    this.calculateEjecucionStats();
  }

  calculateEjecucionStats(): void {
    this.ejecucionStats = {
      total: this.ejecucionList.length,
      conformidades: this.ejecucionList.filter(d => (d.tipo || '').toLowerCase().includes('conformidad') && !(d.tipo || '').toLowerCase().includes('no')).length,
      observaciones: this.ejecucionList.filter(d => (d.tipo || '').toLowerCase().includes('observación') || (d.tipo || '').toLowerCase().includes('observacion')).length,
      noConformidades: this.ejecucionList.filter(d => (d.tipo || '').toLowerCase().includes('no conformidad')).length
    };
  }

  getFilteredEjecucionList(): any[] {
    if (!this.ejecucionFilter.trim()) return this.ejecucionList;
    const q = this.ejecucionFilter.toLowerCase().trim();
    return this.ejecucionList.filter(d =>
      (d.auditoria || '').toLowerCase().includes(q) ||
      (d.norma || '').toLowerCase().includes(q) ||
      (d.proceso || '').toLowerCase().includes(q) ||
      (d.tipo || '').toLowerCase().includes(q) ||
      (d.descripcion || '').toLowerCase().includes(q) ||
      (d.responsable || '').toLowerCase().includes(q) ||
      (d.nc || '').toLowerCase().includes(q) ||
      (d.estado || '').toLowerCase().includes(q)
    );
  }

  getSiguienteCodigoAuditoria(tipo: 'Interna' | 'Externa' | 'Cliente' = 'Interna'): string {
    const year = new Date().getFullYear();
    const tipoCode = tipo === 'Externa' ? 'EXT' : (tipo === 'Cliente' ? 'CLI' : 'INT');
    const list = this.dataSource?.data || [];
    let maxNum = 0;
    const regex = new RegExp(`^AUD-(?:INT|EXT|CLI)-${year}-(\\d+)$`, 'i');

    for (const item of list) {
      const code = String(item.codigo_Auditoria || item.codigo || '').trim();
      const match = code.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    for (const item of this.ejecucionList || []) {
      const code = String(item.auditoria || '').trim();
      const match = code.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextCorrelative = String(maxNum + 1).padStart(3, '0');
    return `AUD-${tipoCode}-${year}-${nextCorrelative}`;
  }

  onRegistrarEjecucion(itemEdit?: any): void {
    const isEdit = !!itemEdit;
    const defaultTipo = (itemEdit?.tipoAuditoria || (itemEdit?.auditoria && itemEdit.auditoria.includes('-EXT-') ? 'Externa' : (itemEdit?.auditoria && itemEdit.auditoria.includes('-CLI-') ? 'Cliente' : 'Interna'))) as 'Interna' | 'Externa' | 'Cliente';
    const initialCode = itemEdit?.auditoria || this.getSiguienteCodigoAuditoria(defaultTipo);

    const item = itemEdit || {
      id: 'EJEC-' + Math.floor(1000 + Math.random() * 9000),
      auditoria: initialCode,
      tipoAuditoria: defaultTipo,
      norma: 'ISO 9001:2015',
      proceso: 'General',
      fecha: new Date().toISOString().split('T')[0],
      auditados: '',
      tipo: 'Observación',
      descripcion: '',
      nc: '',
      responsable: localStorage.getItem('precotex:usuario:nombre') || 'Auditor Líder',
      estado: 'Abierto',
      archivo: '',
      notas: ''
    };

    const modalHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; text-align: left; overflow: hidden; border-radius: 16px;">
        
        <!-- Top Accent Gradient -->
        <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);"></div>

        <!-- Header -->
        <div style="padding: 20px 24px 16px 24px; border-bottom: 1px solid var(--line, #e2e8f0); display: flex; align-items: center; justify-content: space-between; background: var(--panel, #ffffff);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; color: #6366f1;">
              <span class="material-icons" style="font-size: 24px;">${isEdit ? 'edit_note' : 'fact_check'}</span>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.18rem; font-weight: 700; color: var(--txt, #0f172a); letter-spacing: -0.01em;">
                ${isEdit ? 'Editar Hallazgo / Evidencia' : 'Registrar Hallazgo / Evidencia'}
              </h3>
              <p style="margin: 3px 0 0 0; font-size: 0.82rem; color: var(--muted, #64748b);">
                Ejecución técnica de auditoría, registro de evidencias y levantamiento de hallazgos
              </p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.84rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 14px; border-radius: 20px; white-space: nowrap;">
              <span class="material-icons" style="font-size: 15px;">tag</span>
              <span id="swal-codigo-badge">${item.auditoria || initialCode}</span>
            </div>
            <input type="hidden" id="swal-codigo-input" value="${item.auditoria || initialCode}">
          </div>
        </div>

        <!-- Scrollable Form Body -->
        <div style="padding: 20px 24px; max-height: calc(85vh - 170px); overflow-y: auto; display: flex; flex-direction: column; gap: 18px; background: var(--panel, #ffffff);">

          <!-- SECCIÓN 1: TIPO DE AUDITORÍA Y PARTICIPANTES -->
          <div style="background: var(--panel-2, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line, #e2e8f0);">
              <span class="material-icons" style="font-size: 18px; color: #6366f1;">assignment</span>
              <span style="font-size: 0.84rem; font-weight: 700; color: var(--txt, #0f172a); text-transform: uppercase; letter-spacing: 0.4px;">1. Auditoría Ejecutada y Participantes</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                  <span class="material-icons" style="font-size: 15px; color: #6366f1;">category</span>
                  Tipo de auditoría <span style="color: #ef4444;">*</span>
                </label>
                <select id="swal-tipo-auditoria" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; font-weight: 500; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none; cursor: pointer;">
                  <option value="Interna" ${(!item.tipoAuditoria || item.tipoAuditoria === 'Interna' || (item.auditoria && item.auditoria.includes('-INT-'))) ? 'selected' : ''}>Interna</option>
                  <option value="Externa" ${(item.tipoAuditoria === 'Externa' || (item.auditoria && item.auditoria.includes('-EXT-'))) ? 'selected' : ''}>Externa</option>
                  <option value="Cliente" ${(item.tipoAuditoria === 'Cliente' || (item.auditoria && item.auditoria.includes('-CLI-'))) ? 'selected' : ''}>Cliente</option>
                </select>
              </div>
              <div>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                  <span class="material-icons" style="font-size: 15px; color: #6366f1;">event</span>
                  Fecha de Ejecución <span style="color: #ef4444;">*</span>
                </label>
                <input type="date" id="swal-fecha" value="${item.fecha}" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; font-weight: 500; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none; cursor: pointer;">
              </div>
            </div>

            <div>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                <span class="material-icons" style="font-size: 15px; color: #6366f1;">people</span>
                Auditados / Participantes Entrevistados
              </label>
              <input type="text" id="swal-auditados" value="${item.auditados || ''}" placeholder="Ej. Carlos Ríos, Jefes de Línea" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none;">
            </div>
          </div>

          <!-- SECCIÓN 2: CLASIFICACIÓN Y DETALLE DEL HALLAZGO -->
          <div style="background: var(--panel-2, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line, #e2e8f0);">
              <span class="material-icons" style="font-size: 18px; color: #8b5cf6;">manage_search</span>
              <span style="font-size: 0.84rem; font-weight: 700; color: var(--txt, #0f172a); text-transform: uppercase; letter-spacing: 0.4px;">2. Clasificación y Evidencias de Campo</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                  Tipo de Hallazgo <span style="color: #ef4444;">*</span>
                </label>
                <select id="swal-tipo" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; font-weight: 600; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none; cursor: pointer;">
                  <option value="Conformidad" ${item.tipo === 'Conformidad' ? 'selected' : ''}>🟢 Conformidad</option>
                  <option value="Observación" ${item.tipo === 'Observación' ? 'selected' : ''}>🟡 Observación</option>
                  <option value="Oportunidad de mejora" ${item.tipo === 'Oportunidad de mejora' ? 'selected' : ''}>🔵 Oportunidad de mejora</option>
                  <option value="No conformidad" ${item.tipo === 'No conformidad' ? 'selected' : ''}>🔴 No conformidad</option>
                  <option value="Checklist" ${item.tipo === 'Checklist' ? 'selected' : ''}>🟣 Checklist de Evaluación</option>
                  <option value="Evidencia / Informe" ${item.tipo === 'Evidencia / Informe' ? 'selected' : ''}>📄 Evidencia / Informe Técnico</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                  Estado del Hallazgo <span style="color: #ef4444;">*</span>
                </label>
                <select id="swal-estado" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; font-weight: 600; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none; cursor: pointer;">
                  <option value="Abierto" ${item.estado === 'Abierto' ? 'selected' : ''}>⏳ Abierto (En seguimiento)</option>
                  <option value="Cerrado" ${item.estado === 'Cerrado' ? 'selected' : ''}>✅ Cerrado (Subsanado)</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                Descripción del Hallazgo / Detalle <span style="color: #ef4444;">*</span>
              </label>
              <textarea id="swal-descripcion" rows="3" placeholder="Describe detalladamente la evidencia u observación encontrada..." style="width: 100%; padding: 10px 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; line-height: 1.5; background: var(--panel, #ffffff); color: var(--txt, #0f172a); resize: vertical; outline: none;">${item.descripcion || ''}</textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                  NC Vinculada (si aplica)
                </label>
                <input type="text" id="swal-nc" value="${item.nc || ''}" placeholder="Ej. NC-INT-2026-001" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; font-weight: 600; font-family: 'JetBrains Mono', monospace; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none;">
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                  Auditor / Responsable <span style="color: #ef4444;">*</span>
                </label>
                <input type="text" id="swal-responsable" value="${item.responsable || ''}" placeholder="Nombre del auditor" style="width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; background: var(--panel, #ffffff); color: var(--txt, #0f172a); outline: none;">
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--txt, #334155); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                Archivo de Evidencia / Checklist
              </label>
              <div style="border: 1.5px dashed var(--line, #cbd5e1); background: var(--panel, #ffffff); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                <input type="file" id="swal-archivo" style="font-size: 0.84rem; color: var(--txt, #0f172a); cursor: pointer; width: 100%;">
                ${item.archivo ? `
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.84rem; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 8px 12px; margin-top: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      <span class="material-icons" style="font-size: 18px; color: #6366f1;">attach_file</span>
                      <span style="color: var(--muted, #64748b);">Archivo actual:</span>
                      <strong id="swal-txt-archivo-actual" style="color: #6366f1; font-weight: 700;">${item.archivo}</strong>
                    </div>
                    <button type="button" id="swal-btn-descargar-modal-actual" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(99, 102, 241, 0.3); flex-shrink: 0;">
                      <span class="material-icons" style="font-size: 15px;">file_download</span> Descargar
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: NOTAS ADICIONALES -->
          <div style="background: var(--panel-2, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line, #e2e8f0);">
              <span class="material-icons" style="font-size: 18px; color: #10b981;">notes</span>
              <span style="font-size: 0.84rem; font-weight: 700; color: var(--txt, #0f172a); text-transform: uppercase; letter-spacing: 0.4px;">3. Notas y Recomendaciones Adicionales</span>
            </div>
            <div>
              <textarea id="swal-notas" rows="2" placeholder="Comentarios adicionales o recomendaciones..." style="width: 100%; padding: 10px 12px; border: 1.5px solid var(--line, #cbd5e1); border-radius: 8px; font-size: 0.88rem; line-height: 1.5; background: var(--panel, #ffffff); color: var(--txt, #0f172a); resize: vertical; outline: none;">${item.notas || ''}</textarea>
            </div>
          </div>

        </div>
      </div>
    `;

    Swal.fire({
      html: modalHtml,
      width: '780px',
      padding: '0',
      background: 'var(--panel, #ffffff)',
      color: 'var(--txt, #0f172a)',
      showCancelButton: true,
      confirmButtonText: isEdit ? '💾 Guardar Cambios' : '➕ Registrar Hallazgo',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-ejecucion-popup',
        confirmButton: 'swal-btn-save',
        cancelButton: 'swal-btn-cancel'
      },
      didOpen: () => {
        const selectTipo = document.getElementById('swal-tipo-auditoria') as HTMLSelectElement;
        const badgeCodigo = document.getElementById('swal-codigo-badge');
        const inputCodigo = document.getElementById('swal-codigo-input') as HTMLInputElement;

        if (selectTipo && badgeCodigo && inputCodigo && !isEdit) {
          selectTipo.addEventListener('change', (e: Event) => {
            const sTipo = ((e.target as HTMLSelectElement).value || 'Interna') as 'Interna' | 'Externa' | 'Cliente';
            const nuevoCodigo = this.getSiguienteCodigoAuditoria(sTipo);
            badgeCodigo.innerText = nuevoCodigo;
            inputCodigo.value = nuevoCodigo;
          });
        }

        const btnDescargarActual = document.getElementById('swal-btn-descargar-modal-actual');
        if (btnDescargarActual && item.archivo) {
          btnDescargarActual.addEventListener('click', (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            this.onDescargarEjecucion(item);
          });
        }

        const fileInput = document.getElementById('swal-archivo') as HTMLInputElement;
        const txtArchivoActual = document.getElementById('swal-txt-archivo-actual');
        if (fileInput) {
          fileInput.addEventListener('change', (e: any) => {
            const f = e.target?.files?.[0];
            if (f) {
              const reader = new FileReader();
              reader.onload = () => {
                item.archivo = f.name;
                item.archivoBase64 = reader.result as string;
                item.archivoType = f.type || 'application/octet-stream';
                if (txtArchivoActual) {
                  txtArchivoActual.innerText = f.name;
                }
                this.toastr.info(`Archivo "${f.name}" adjuntado listo para descarga y guardado.`, 'Evidencia Adjunta');
              };
              reader.readAsDataURL(f);
            }
          });
        }
      },
      preConfirm: () => {
        const tipoAuditoria = (document.getElementById('swal-tipo-auditoria') as HTMLSelectElement)?.value || 'Interna';
        const codigoInput = (document.getElementById('swal-codigo-input') as HTMLInputElement)?.value || this.getSiguienteCodigoAuditoria(tipoAuditoria as any);
        const fecha = (document.getElementById('swal-fecha') as HTMLInputElement)?.value;
        const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement)?.value;
        const descripcion = (document.getElementById('swal-descripcion') as HTMLTextAreaElement)?.value;
        
        if (!fecha || !descripcion) {
          Swal.showValidationMessage('Por favor complete la Fecha y la Descripción del Hallazgo.');
          return false;
        }

        const auditados = (document.getElementById('swal-auditados') as HTMLInputElement)?.value || '';
        const estado = (document.getElementById('swal-estado') as HTMLSelectElement)?.value || 'Abierto';
        const nc = (document.getElementById('swal-nc') as HTMLInputElement)?.value || '';
        const responsable = (document.getElementById('swal-responsable') as HTMLInputElement)?.value || '';
        const notas = (document.getElementById('swal-notas') as HTMLTextAreaElement)?.value || '';
        
        const fileInput = document.getElementById('swal-archivo') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        const payload: any = {
          id: item.id,
          id_Ejecucion: item.id_Ejecucion || (typeof item.id === 'number' ? item.id : 0),
          codigo_Ejecucion: item.codigo_Ejecucion || (typeof item.id === 'string' ? item.id : ''),
          auditoria: codigoInput,
          tipoAuditoria: tipoAuditoria,
          norma: item.norma || 'ISO 9001:2015',
          fecha,
          auditados,
          tipo,
          descripcion,
          nc,
          responsable,
          estado,
          archivo: file ? file.name : (item.archivo || 'evidencia_audit.pdf'),
          archivoBase64: item.archivoBase64 || '',
          archivoType: file ? (file.type || 'application/octet-stream') : (item.archivoType || ''),
          notas
        };

        if (file) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              payload.archivoBase64 = reader.result as string;
              payload.archivo = file.name;
              payload.archivoType = file.type || 'application/octet-stream';
              resolve(payload);
            };
            reader.onerror = () => {
              resolve(payload);
            };
            reader.readAsDataURL(file);
          });
        }

        return payload;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const val = result.value;
        if (isEdit) {
          const idx = this.ejecucionList.findIndex(e => e.id === val.id);
          if (idx !== -1) {
            this.ejecucionList[idx] = val;
          }
        } else {
          val.id = 'EJEC-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
          this.ejecucionList.unshift(val);
        }

        // Cache file Base64
        if (val.archivoBase64 && typeof localStorage !== 'undefined') {
          try {
            const rawCache = localStorage.getItem('precotex:auditorias:file_cache') || '{}';
            const cache = JSON.parse(rawCache);
            const fileObj = { base64: val.archivoBase64, type: val.archivoType, name: val.archivo };
            if (val.id) cache[val.id] = fileObj;
            if (val.codigo_Ejecucion) cache[val.codigo_Ejecucion] = fileObj;
            if (val.auditoria) cache[val.auditoria] = fileObj;
            if (val.archivo) cache[val.archivo] = fileObj;
            localStorage.setItem('precotex:auditorias:file_cache', JSON.stringify(cache));
          } catch (e) {
            console.warn('LocalStorage limit for file cache:', e);
          }
        }

        this.saveLocalBackupEjecucion();
        
        this.auditoriasService.postProcesoMntoEjecucion({
          Accion: isEdit ? 'U' : 'I',
          Id_Ejecucion: val.id_Ejecucion || 0,
          Codigo_Ejecucion: val.codigo_Ejecucion || (typeof val.id === 'string' ? val.id : ''),
          Codigo_Auditoria: val.auditoria || '',
          Fecha: val.fecha,
          Auditados: val.auditados,
          Tipo: val.tipo,
          Descripcion: val.descripcion,
          Nc: val.nc,
          Responsable: val.responsable,
          Estado: val.estado,
          Archivo: val.archivo,
          Notas: val.notas,
          Cod_Usuario: 'SISTEMAS'
        }).subscribe({
          next: () => {
            this.loadEjecucionData();
          },
          error: () => {}
        });

        this.toastr.success(isEdit ? 'Hallazgo actualizado' : 'Hallazgo / Evidencia registrado con éxito', 'Ejecución y Resultados');
      }
    });
  }

  onEliminarEjecucion(item: any): void {
    Swal.fire({
      title: '¿Eliminar registro de hallazgo?',
      text: `Se eliminará el hallazgo: ${item.descripcion || item.auditoria}`,
      icon: 'warning',
      background: '#ffffff',
      color: '#1e2545',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d23a54',
      cancelButtonColor: '#94a3b8'
    }).then((res) => {
      if (res.isConfirmed) {
        this.ejecucionList = this.ejecucionList.filter(e => {
          if (item.id && e.id && e.id === item.id) return false;
          if (item.codigo_Ejecucion && e.codigo_Ejecucion && e.codigo_Ejecucion === item.codigo_Ejecucion) return false;
          if (e === item) return false;
          if (e.auditoria === item.auditoria && e.descripcion === item.descripcion && e.fecha === item.fecha) return false;
          return true;
        });
        this.saveLocalBackupEjecucion();
        
        const payload = {
          Accion: 'D',
          Id_Ejecucion: typeof item.id_Ejecucion === 'number' ? item.id_Ejecucion : (typeof item.id === 'number' ? item.id : 0),
          Codigo_Ejecucion: item.codigo_Ejecucion || item.id || '',
          Codigo_Auditoria: item.auditoria || item.codigo_Auditoria || '',
          Descripcion_Hallazgo: item.descripcion || '',
          Cod_Usuario: 'SISTEMAS'
        };

        this.auditoriasService.postProcesoMntoEjecucion(payload).subscribe({
          next: () => {
            this.toastr.success('Registro eliminado correctamente', 'Éxito');
            this.loadEjecucionData();
          },
          error: () => {
            this.toastr.success('Registro eliminado', 'Éxito');
          }
        });
      }
    });
  }

  onVerEvidenciaEjecucion(item: any): void {
    Swal.fire({
      width: '680px',
      padding: '0',
      background: 'var(--panel, #ffffff)',
      color: 'var(--txt, #0f172a)',
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#6366f1',
      customClass: {
        popup: 'premium-swal-popup',
        confirmButton: 'premium-swal-btn'
      },
      didOpen: () => {
        const btnDescargar = document.getElementById('swal-btn-descargar-adjunto');
        if (btnDescargar) {
          btnDescargar.addEventListener('click', () => {
            this.onDescargarEjecucion(item);
          });
        }
      },
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; text-align: left; overflow: hidden; border-radius: 16px;">
          <!-- Top Accent Gradient -->
          <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);"></div>
          
          <!-- Header -->
          <div style="padding: 20px 24px 16px 24px; border-bottom: 1px solid var(--line, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; color: #6366f1;">
                <span class="material-icons" style="font-size: 22px;">description</span>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--txt, #0f172a); letter-spacing: -0.01em;">Evidencia & Hallazgo</h3>
                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--muted, #64748b);">Resultado de la ejecución de auditoría</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 12px; border-radius: 20px; white-space: nowrap;">
                # ${item.auditoria}
              </span>
            </div>
          </div>

          <!-- Body Container -->
          <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Primary Info -->
            <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.84rem;">
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Clasificación / Tipo</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.tipo}</span>
                </div>
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Estado del Hallazgo</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.estado || 'Abierto'}</span>
                </div>
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Fecha de Registro</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.fecha || '—'}</span>
                </div>
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Auditados / Responsables</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.auditados || item.responsable || '—'}</span>
                </div>
              </div>
            </div>

            <!-- Findings Description -->
            <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 14px 18px;">
              <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 5px; margin-bottom: 6px;">
                <span class="material-icons" style="font-size: 15px; color: #818cf8;">rule</span> Descripción del Hallazgo
              </span>
              <p style="margin: 0; color: var(--txt, #0f172a); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${item.descripcion}</p>
            </div>

            ${item.nc && item.nc !== '—' ? `
              <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #ef4444; font-size: 0.8rem; font-weight: 700;">No Conformidad Vinculada</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 10px; border-radius: 6px;">
                  ${item.nc}
                </span>
              </div>
            ` : ''}

            <!-- File info & Download button -->
            <div style="background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-icons" style="font-size: 22px; color: #6366f1;">attach_file</span>
                <div style="font-size: 0.84rem;">
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; display: block;">Evidencia Adjunta:</span>
                  <strong style="color: #6366f1;">${item.archivo || 'evidencia.pdf'}</strong>
                </div>
              </div>
              <button type="button" id="swal-btn-descargar-adjunto" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);">
                <span class="material-icons" style="font-size: 16px;">file_download</span> Descargar Documento
              </button>
            </div>

          </div>
        </div>
      `
    });
  }

  // ===================================================================
  // CENTRO DE DESCARGAS MULTI-FORMATO (WORD, PDF, IMÁGENES, EXCEL, ORIGINAL)
  // ===================================================================

  onDescargarEjecucion(item: any): void {
    this.mostrarOpcionesDescarga(item, false);
  }

  onDescargarPlanificada(item: any): void {
    this.mostrarOpcionesDescarga(item, true);
  }

  mostrarOpcionesDescarga(item: any, isPlanificada: boolean = false): void {
    const codigo = isPlanificada ? (item.codigo_Auditoria || item.codigo || 'AUD') : (item.auditoria || item.codigo_Auditoria || 'AUD');
    const hasOriginal = !!(item.archivoBase64 || (item.archivo && item.archivo.trim() !== '' && !item.archivo.startsWith('Informe_') && !item.archivo.startsWith('Plan_')));
    const nombreOriginal = item.archivo || 'documento_adjunto';

    const modalHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; text-align: left; overflow: hidden; border-radius: 16px;">
        <!-- Top Accent Gradient -->
        <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);"></div>

        <!-- Header -->
        <div style="padding: 20px 24px 16px; border-bottom: 1px solid var(--line, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; color: #6366f1;">
              <span class="material-icons" style="font-size: 22px;">cloud_download</span>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--txt, #0f172a); letter-spacing: -0.01em;">Centro de Descargas</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--muted, #64748b);">Selecciona el formato en el que deseas exportar</p>
            </div>
          </div>
          <div>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 12px; border-radius: 20px;">
              # ${codigo}
            </span>
          </div>
        </div>

        <!-- Formatos Grid -->
        <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 10px;">

          ${hasOriginal ? `
            <!-- Opción: Archivo Original Adjunto -->
            <button type="button" id="btn-dl-original" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid #6366f1; background: rgba(99, 102, 241, 0.06); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
              <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: #6366f1; color: #ffffff; display: flex; align-items: center; justify-content: center;">
                  <span class="material-icons" style="font-size: 20px;">attach_file</span>
                </div>
                <div style="overflow: hidden;">
                  <div style="font-weight: 700; font-size: 0.9rem; color: #4f46e5;">Descargar Archivo Adjunto Original</div>
                  <div style="font-size: 0.76rem; color: var(--muted, #64748b); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${nombreOriginal}</div>
                </div>
              </div>
              <span class="material-icons" style="color: #6366f1; font-size: 20px;">file_download</span>
            </button>
          ` : ''}

          <!-- Opción: PDF -->
          <button type="button" id="btn-dl-pdf" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">picture_as_pdf</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Documento PDF Oficial</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Membrete institucional, estructura A4 y firmas listas para imprimir</div>
              </div>
            </div>
            <span class="material-icons" style="color: #ef4444; font-size: 20px;">arrow_forward</span>
          </button>

          <!-- Opción: Word -->
          <button type="button" id="btn-dl-word" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(37, 99, 235, 0.12); color: #2563eb; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">description</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Documento Word (.docx / .doc)</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Documento editable para Microsoft Word con formato SIG</div>
              </div>
            </div>
            <span class="material-icons" style="color: #2563eb; font-size: 20px;">arrow_forward</span>
          </button>

          <!-- Opción: Imagen HD -->
          <button type="button" id="btn-dl-img" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(139, 92, 246, 0.12); color: #8b5cf6; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">image</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Imagen Digital de Evidencia (.png)</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Certificado gráfico de alta definición (1200x760 px)</div>
              </div>
            </div>
            <span class="material-icons" style="color: #8b5cf6; font-size: 20px;">arrow_forward</span>
          </button>

          <!-- Opción: Excel -->
          <button type="button" id="btn-dl-excel" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(16, 185, 129, 0.12); color: #10b981; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">table_view</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Hoja de Cálculo Excel (.xlsx)</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Tabla de datos tabulada y estructurada en celdas</div>
              </div>
            </div>
            <span class="material-icons" style="color: #10b981; font-size: 20px;">arrow_forward</span>
          </button>

        </div>
      </div>
    `;

    Swal.fire({
      html: modalHtml,
      width: '600px',
      padding: '0',
      background: 'var(--panel, #ffffff)',
      color: 'var(--txt, #0f172a)',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        const btnOriginal = document.getElementById('btn-dl-original');
        if (btnOriginal) {
          btnOriginal.addEventListener('click', () => {
            Swal.close();
            this.descargarArchivoOriginal(item, isPlanificada);
          });
        }

        const btnPdf = document.getElementById('btn-dl-pdf');
        if (btnPdf) {
          btnPdf.addEventListener('click', () => {
            Swal.close();
            this.generarDocumentoPDF(item, isPlanificada);
          });
        }

        const btnWord = document.getElementById('btn-dl-word');
        if (btnWord) {
          btnWord.addEventListener('click', () => {
            Swal.close();
            this.generarDocumentoWord(item, isPlanificada);
          });
        }

        const btnImg = document.getElementById('btn-dl-img');
        if (btnImg) {
          btnImg.addEventListener('click', () => {
            Swal.close();
            this.generarDocumentoImagen(item, isPlanificada);
          });
        }

        const btnExcel = document.getElementById('btn-dl-excel');
        if (btnExcel) {
          btnExcel.addEventListener('click', () => {
            Swal.close();
            this.generarDocumentoExcel(item, isPlanificada);
          });
        }
      }
    });
  }

  descargarArchivoOriginal(item: any, isPlanificada: boolean = false): void {
    const filename = item.archivo || (isPlanificada ? `Plan_${item.codigo_Auditoria}.pdf` : `Evidencia_${item.auditoria}.pdf`);

    if (item.archivoBase64 && typeof item.archivoBase64 === 'string') {
      try {
        let base64Data = item.archivoBase64;
        let mimeType = item.archivoType || 'application/octet-stream';

        if (base64Data.includes(';base64,')) {
          const parts = base64Data.split(';base64,');
          mimeType = parts[0].replace('data:', '') || mimeType;
          base64Data = parts[1];
        }

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toastr.success(`Descargando archivo adjunto: ${filename}`, 'Descarga Exitosa');
        return;
      } catch (err) {
        console.error('Error al decodificar base64:', err);
      }
    }

    // Fallback si no hay base64 original en memoria
    const lower = filename.toLowerCase();
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      this.generarDocumentoWord(item, isPlanificada);
    } else if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      this.generarDocumentoImagen(item, isPlanificada);
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      this.generarDocumentoExcel(item, isPlanificada);
    } else {
      this.generarDocumentoPDF(item, isPlanificada);
    }
  }

  generarDocumentoPDF(item: any, isPlanificada: boolean = false): void {
    const codigo = isPlanificada ? (item.codigo_Auditoria || item.codigo || 'AUD') : (item.auditoria || item.codigo_Auditoria || 'AUD');
    const estadoColor = (item.estado === 'Realizada' || item.estado === 'Cerrado') ? '#10b981' : ((item.estado === 'No realizada' || item.tipo === 'No conformidad') ? '#ef4444' : '#6366f1');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Informe Oficial - ${codigo}</title>
      <style>
        @page { size: A4; margin: 12mm 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
        .no-print { background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 12px 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .btn-print { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #fff; border: none; padding: 9px 20px; border-radius: 7px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3); }
        .header { border-bottom: 2.5px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .logo-title { font-size: 20px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 600; }
        .badge-code { font-family: monospace; font-size: 14px; font-weight: 800; color: #4f46e5; background: #eef2ff; border: 1.5px solid #c7d2fe; padding: 6px 14px; border-radius: 6px; }
        .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; }
        .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        .value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .desc-box { background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 12px 14px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; margin-top: 6px; }
        .footer { margin-top: 35px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 35px; text-align: center; }
        .sign-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11.5px; font-weight: 600; color: #334155; }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong style="color: #4f46e5; font-size: 14px;">Vista previa de impresión oficial (PDF)</strong>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">Para descargar en PDF, haz clic en el botón de la derecha y selecciona <strong>"Guardar como PDF"</strong> en tu navegador.</div>
        </div>
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="logo-title">PRECOTEX S.A.C.</div>
          <div class="subtitle">SISTEMA INTEGRADO DE GESTIÓN (SIG) — INFORME TÉCNICO DE AUDITORÍA Y EVIDENCIAS</div>
        </div>
        <div class="badge-code">${codigo}</div>
      </div>

      <div class="section-box">
        <div class="section-title">1. Datos Generales de la Auditoría</div>
        <div class="grid-2">
          <div><div class="label">Código de Auditoría</div><div class="value">${codigo}</div></div>
          <div><div class="label">Tipo de Auditoría</div><div class="value">${item.tipo || item.tipoAuditoria || 'Interna'}</div></div>
          <div><div class="label">Norma Auditada</div><div class="value">${item.norma || 'ISO 9001:2015'}</div></div>
          <div><div class="label">Estado</div><div class="value" style="color: ${estadoColor}; font-weight: 800;">● ${item.estado || 'Programada'}</div></div>
          <div><div class="label">Auditor / Responsable</div><div class="value">${item.responsable || '—'}</div></div>
          <div><div class="label">${isPlanificada ? 'Sedes Participantes' : 'Auditados / Entrevistados'}</div><div class="value">${item.sedes || item.auditados || '—'}</div></div>
          <div style="grid-column: span 2;"><div class="label">Procesos / Áreas Auditadas</div><div class="value">${item.areas || item.proceso || 'General'}</div></div>
          ${isPlanificada ? `
            <div><div class="label">Fecha Inicio</div><div class="value">${item.inicio || '—'}</div></div>
            <div><div class="label">Fecha Fin</div><div class="value">${item.fin || '—'}</div></div>
            <div><div class="label">Frecuencia</div><div class="value">${item.frecuencia || 'Anual'}</div></div>
          ` : `
            <div><div class="label">Fecha de Ejecución</div><div class="value">${item.fecha || '—'}</div></div>
            <div><div class="label">No Conformidad Vinculada</div><div class="value" style="color: #ef4444; font-weight: 800;">${item.nc || '—'}</div></div>
            <div><div class="label">Archivo / Evidencia Registrada</div><div class="value">${item.archivo || 'evidencia.pdf'}</div></div>
          `}
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">2. ${isPlanificada ? 'Alcance y Criterios de la Auditoría' : 'Detalle del Hallazgo y Evidencias de Campo'}</div>
        <div class="label">${isPlanificada ? 'Alcance Programado' : 'Descripción del Hallazgo'}</div>
        <div class="desc-box">${item.alcance || item.descripcion || 'Sin descripción especificada.'}</div>
        ${item.notas ? `
          <div style="margin-top: 12px;">
            <div class="label">Notas Adicionales y Recomendaciones</div>
            <div class="desc-box" style="border-left-color: #10b981;">${item.notas}</div>
          </div>
        ` : ''}
      </div>

      <div class="signatures">
        <div>
          <div style="height: 45px;"></div>
          <div class="sign-line">Firma del Auditor Líder<br><span style="font-size: 10px; color: #64748b;">${item.responsable || 'Auditor Precotex'}</span></div>
        </div>
        <div>
          <div style="height: 45px;"></div>
          <div class="sign-line">Firma del Responsable del Proceso<br><span style="font-size: 10px; color: #64748b;">${item.auditados || 'Responsable de Área'}</span></div>
        </div>
      </div>

      <div class="footer">
        <span>Documento oficial generado por Precotex SIG Security System</span>
        <span>Fecha de emisión: ${new Date().toLocaleString()}</span>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => { window.print(); }, 400);
        });
      </script>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      this.toastr.success(`Generando vista de impresión / PDF de: ${codigo}`, 'Documento PDF');
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${codigo}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.toastr.info('Descargando archivo HTML imprimible a PDF.', 'Documento');
    }
  }

  generarDocumentoWord(item: any, isPlanificada: boolean = false): void {
    const codigo = isPlanificada ? (item.codigo_Auditoria || item.codigo || 'AUD') : (item.auditoria || item.codigo_Auditoria || 'AUD');
    const filename = isPlanificada ? `Plan_Auditoria_${codigo}.doc` : `Informe_Evidencia_${codigo}.doc`;

    const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Informe de Auditoría - ${codigo}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 24px; }
        .header { border-bottom: 2.5pt solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18pt; font-weight: bold; color: #1e1b4b; }
        .subtitle { font-size: 10pt; color: #64748b; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1pt solid #cbd5e1; padding: 8px 10px; font-size: 10pt; }
        th { background-color: #f1f5f9; text-align: left; font-weight: bold; color: #334155; }
        .highlight { background-color: #eef2ff; color: #4f46e5; font-weight: bold; font-family: monospace; }
        .desc-box { border-left: 3.5pt solid #4f46e5; background-color: #f8fafc; padding: 12px; margin-top: 10px; line-height: 1.5; }
        .footer { margin-top: 30px; border-top: 1pt solid #e2e8f0; padding-top: 10px; font-size: 9pt; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">PRECOTEX S.A.C.</div>
        <div class="subtitle">SISTEMA INTEGRADO DE GESTIÓN (SIG) — INFORME DE AUDITORÍA Y EVIDENCIAS</div>
      </div>
      <h2>${isPlanificada ? 'PLAN DE AUDITORÍA' : 'INFORME DE HALLAZGO Y EVIDENCIA'}: ${codigo}</h2>
      <table>
        <tr>
          <th>Código Auditoría:</th>
          <td class="highlight">${codigo}</td>
          <th>Norma Auditada:</th>
          <td><strong>${item.norma || 'ISO 9001:2015'}</strong></td>
        </tr>
        <tr>
          <th>Tipo de Auditoría:</th>
          <td>${item.tipo || item.tipoAuditoria || 'Interna'}</td>
          <th>Estado:</th>
          <td><strong>${item.estado || 'Programada'}</strong></td>
        </tr>
        <tr>
          <th>Auditor / Responsable:</th>
          <td>${item.responsable || '—'}</td>
          <th>${isPlanificada ? 'Sedes Participantes:' : 'Auditados / Entrevistados:'}</th>
          <td>${item.sedes || item.auditados || '—'}</td>
        </tr>
        <tr>
          <th>Procesos / Áreas:</th>
          <td colspan="3">${item.areas || item.proceso || 'General'}</td>
        </tr>
        ${isPlanificada ? `
          <tr>
            <th>Fecha Inicio:</th>
            <td>${item.inicio || '—'}</td>
            <th>Fecha Fin:</th>
            <td>${item.fin || '—'}</td>
          </tr>
        ` : `
          <tr>
            <th>Fecha de Ejecución:</th>
            <td>${item.fecha || '—'}</td>
            <th>NC Vinculada:</th>
            <td style="color: #ef4444; font-weight: bold;">${item.nc || '—'}</td>
          </tr>
        `}
      </table>
      <h3>${isPlanificada ? 'Alcance y Criterios de la Auditoría:' : 'Descripción del Hallazgo / Evidencia:'}</h3>
      <div class="desc-box">${item.alcance || item.descripcion || 'Sin detalle especificado.'}</div>
      ${item.notas ? `<h3>Notas Adicionales:</h3><div class="desc-box" style="border-left-color: #10b981;">${item.notas}</div>` : ''}
      <div class="footer">
        Documento generado automáticamente por Precotex SIG Security System • Fecha: ${new Date().toLocaleString()}
      </div>
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

  generarDocumentoImagen(item: any, isPlanificada: boolean = false): void {
    const codigo = isPlanificada ? (item.codigo_Auditoria || item.codigo || 'AUD') : (item.auditoria || item.codigo_Auditoria || 'AUD');
    const filename = isPlanificada ? `Plan_Auditoria_${codigo}.png` : `Evidencia_${codigo}.png`;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 760);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#eef2ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 760);

    // Top Accent Bar
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 1200, 10);

    // Card Container
    ctx.fillStyle = '#ffffff';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(35, 35, 1130, 690, 16);
      ctx.fill();
    } else {
      ctx.fillRect(35, 35, 1130, 690);
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header Title
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('PRECOTEX S.A.C.', 70, 95);

    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText('SISTEMA INTEGRADO DE GESTIÓN (SIG) — CERTIFICADO DIGITAL DE AUDITORÍA', 70, 125);

    // Badge
    ctx.fillStyle = '#eef2ff';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(830, 65, 300, 48, 8);
      ctx.fill();
    } else {
      ctx.fillRect(830, 65, 300, 48);
    }
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(codigo, 850, 96);

    // Separator line
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(70, 150);
    ctx.lineTo(1130, 150);
    ctx.stroke();

    // Grid 1
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isPlanificada ? 'TIPO DE AUDITORÍA:' : 'TIPO DE HALLAZGO:', 70, 195);
    ctx.fillText('ESTADO:', 420, 195);
    ctx.fillText(isPlanificada ? 'FECHA INICIO:' : 'FECHA EJECUCIÓN:', 770, 195);

    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(item.tipo || item.tipoAuditoria || 'Interna', 70, 225);
    ctx.fillText(item.estado || 'Programada', 420, 225);
    ctx.fillText(isPlanificada ? (item.inicio || '—') : (item.fecha || '—'), 770, 225);

    // Grid 2
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NORMA AUDITADA:', 70, 280);
    ctx.fillText('PROCESO / ÁREA:', 420, 280);
    ctx.fillText('RESPONSABLE:', 770, 280);

    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(item.norma || 'ISO 9001:2015', 70, 310);
    ctx.fillText(item.areas || item.proceso || 'General', 420, 310);
    ctx.fillText(item.responsable || '—', 770, 310);

    // Description Box
    ctx.fillStyle = '#f8fafc';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(70, 360, 1060, 240, 10);
      ctx.fill();
    } else {
      ctx.fillRect(70, 360, 1060, 240);
    }
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(70, 360, 8, 240);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(isPlanificada ? 'ALCANCE Y OBJETIVOS PROGRAMADOS:' : 'DESCRIPCIÓN DEL HALLAZGO / EVIDENCIA:', 95, 395);

    ctx.fillStyle = '#0f172a';
    ctx.font = '15px sans-serif';
    const text = item.alcance || item.descripcion || 'Evidencia de cumplimiento registrada en el sistema.';
    ctx.fillText(text.length > 110 ? text.substring(0, 110) + '...' : text, 95, 435);

    if (item.nc && item.nc !== '—') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`NO CONFORMIDAD VINCULADA: ${item.nc}`, 95, 490);
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Precotex SIG Security System • Emisión: ' + new Date().toLocaleString(), 70, 680);
    ctx.fillText('Archivo de evidencia: ' + filename, 770, 680);

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

  generarDocumentoExcel(item: any, isPlanificada: boolean = false): void {
    const codigo = isPlanificada ? (item.codigo_Auditoria || item.codigo || 'AUD') : (item.auditoria || item.codigo_Auditoria || 'AUD');
    const filename = isPlanificada ? `Plan_Auditoria_${codigo}.xlsx` : `Evidencia_${codigo}.xlsx`;

    const t = `
    <table border="1" style="font-family: Arial; border-collapse: collapse;">
      <tr style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center;">
        <th colspan="4" style="height: 35px; font-size: 14px;">PRECOTEX S.A.C. - ${isPlanificada ? 'PLAN DE AUDITORÍA' : 'REPORTE DE HALLAZGO Y EVIDENCIA'}</th>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold; width: 180px;">Código Auditoría:</td>
        <td style="font-weight: bold; color: #4f46e5;">${codigo}</td>
        <td style="background-color: #f1f5f9; font-weight: bold; width: 180px;">Norma Auditada:</td>
        <td>${item.norma || 'ISO 9001:2015'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Tipo de Auditoría:</td>
        <td>${item.tipo || item.tipoAuditoria || 'Interna'}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Estado:</td>
        <td style="font-weight: bold;">${item.estado || 'Programada'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Responsable / Auditor:</td>
        <td>${item.responsable || '—'}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">${isPlanificada ? 'Sedes:' : 'Auditados:'}</td>
        <td>${item.sedes || item.auditados || '—'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Procesos / Áreas:</td>
        <td colspan="3">${item.areas || item.proceso || 'General'}</td>
      </tr>
      ${isPlanificada ? `
        <tr>
          <td style="background-color: #f1f5f9; font-weight: bold;">Fecha Inicio:</td>
          <td>${item.inicio || '—'}</td>
          <td style="background-color: #f1f5f9; font-weight: bold;">Fecha Fin:</td>
          <td>${item.fin || '—'}</td>
        </tr>
      ` : `
        <tr>
          <td style="background-color: #f1f5f9; font-weight: bold;">Fecha Ejecución:</td>
          <td>${item.fecha || '—'}</td>
          <td style="background-color: #f1f5f9; font-weight: bold;">NC Vinculada:</td>
          <td style="color: #ef4444; font-weight: bold;">${item.nc || '—'}</td>
        </tr>
      `}
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold; vertical-align: top;">${isPlanificada ? 'Alcance / Objetivos:' : 'Descripción del Hallazgo:'}</td>
        <td colspan="3" style="height: 60px; vertical-align: top;">${item.alcance || item.descripcion || 'Sin detalle.'}</td>
      </tr>
      ${item.notas ? `
        <tr>
          <td style="background-color: #f1f5f9; font-weight: bold; vertical-align: top;">Notas Adicionales:</td>
          <td colspan="3" style="height: 40px; vertical-align: top;">${item.notas}</td>
        </tr>
      ` : ''}
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
    this.toastr.success(`Descargando archivo Excel: ${filename}`, 'Descarga Exitosa');
  }

  // AUD-07: Exportar lista de Ejecución y Resultados a Excel
  exportarEjecucionExcel(): void {
    const list = this.getFilteredEjecucionList();
    if (list.length === 0) {
      this.toastr.warning('No hay registros de ejecución para exportar.', 'Atención');
      return;
    }

    let t = '<table border="1"><tr><th>Auditoría</th><th>Norma</th><th>Fecha</th><th>Auditados</th><th>Tipo de Hallazgo</th><th>Descripción / Evidencia</th><th>NC Vinculada</th><th>Auditor / Responsable</th><th>Estado</th><th>Notas</th></tr>';
    list.forEach(d => {
      t += `<tr>
        <td>${d.auditoria || ''}</td>
        <td>${d.norma || ''}</td>
        <td>${d.fecha || ''}</td>
        <td>${d.auditados || ''}</td>
        <td>${d.tipo || ''}</td>
        <td>${d.descripcion || ''}</td>
        <td>${d.nc || ''}</td>
        <td>${d.responsable || ''}</td>
        <td>${d.estado || ''}</td>
        <td>${d.notas || ''}</td>
      </tr>`;
    });
    t += '</table>';
    const blob = new Blob(['\ufeff' + t], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Ejecucion_y_Resultados_Auditorias_Precotex.xls';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Informe de Ejecución y Resultados exportado a Excel', 'Éxito');
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'programada';
    const s = estado.toLowerCase().trim();
    if (s.includes('realizada') && !s.includes('no')) return 'realizada';
    if (s.includes('programada')) return 'programada';
    if (s.includes('no realizada')) return 'no-realizada';
    return 'programada';
  }

  getTipoClass(tipo: string): string {
    return tipo === 'Externa' ? 'externa' : 'interna';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(AuditoriasRegeditComponent, {
      width: '740px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-container',
      data: {
        Title  : '::. Planificar auditoría .::'  ,
        Accion : 'I'                              ,
        Datos  : null,
        AuditoriasList: this.dataSource.data
      }
    });
    dialogRef.afterClosed().subscribe(res => { if (res) this.onListado(); });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(AuditoriasRegeditComponent, {
      width: '740px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-container',
      data: {
        Title  : '::. Editar auditoría .::'  ,
        Accion : 'U'                          ,
        Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(res => { if (res) this.onListado(); });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar la auditoría?, Confirme',
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
          Codigo_Auditoria: item.codigo_Auditoria || item.codigo || item.id || '',
          Cod_Usuario: 'SISTEMAS'
        };
        this.auditoriasService.postProcesoMntoAuditoria(payload).subscribe({
          next: () => {
            this.toastr.success('Auditoría eliminada correctamente en la BD.', '', { timeOut: 2500 });
            this.onListado();
          },
          error: () => {
            this.dataSource.data = this.dataSource.data.filter((d: any) => 
              (d.codigo_Auditoria && d.codigo_Auditoria !== item.codigo_Auditoria) &&
              (d.id && d.id !== item.id)
            );
            this.calculateStats(this.dataSource.data);
            this.toastr.warning('Auditoría retirada de la vista local (verifique que el backend esté en ejecución).', '', { timeOut: 3000 });
          }
        });
      }
    });
  }

  // AUD-03: Botones VER y DESCARGAR en Auditorías Planificadas
  onVerPlanificada(item: any): void {
    const estadoColor = item.estado === 'Realizada' 
      ? '#10b981' 
      : (item.estado === 'No realizada' ? '#ef4444' : '#6366f1');
    const estadoBg = item.estado === 'Realizada' 
      ? 'rgba(16, 185, 129, 0.12)' 
      : (item.estado === 'No realizada' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)');

    Swal.fire({
      width: '680px',
      padding: '0',
      background: 'var(--panel, #ffffff)',
      color: 'var(--txt, #0f172a)',
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#6366f1',
      customClass: {
        popup: 'premium-swal-popup',
        confirmButton: 'premium-swal-btn'
      },
      didOpen: () => {
        const btnDescargar = document.getElementById('swal-btn-descargar-plan');
        if (btnDescargar) {
          btnDescargar.addEventListener('click', () => {
            this.mostrarOpcionesDescarga(item, true);
          });
        }
      },
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; text-align: left; overflow: hidden; border-radius: 16px;">
          <!-- Top Accent Gradient -->
          <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);"></div>
          
          <!-- Header -->
          <div style="padding: 20px 24px 16px 24px; border-bottom: 1px solid var(--line, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; color: #6366f1;">
                <span class="material-icons" style="font-size: 22px;">assignment</span>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--txt, #0f172a); letter-spacing: -0.01em;">Plan de Auditoría</h3>
                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--muted, #64748b);">Detalle de planificación y alcance programado</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 12px; border-radius: 20px; white-space: nowrap;">
                # ${item.codigo_Auditoria}
              </span>
            </div>
          </div>

          <!-- Body Container -->
          <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Cards Grid: Primary Info -->
            <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px;">
              <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--txt, #475569); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span class="material-icons" style="font-size: 16px; color: #6366f1;">info</span> Datos de la Auditoría
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.84rem;">
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Norma Auditada</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.norma || 'General'}</span>
                </div>
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Tipo de Auditoría</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.tipo}</span>
                </div>
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Responsable Líder</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.responsable || '—'}</span>
                </div>
                <div>
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Estado del Plan</span>
                  <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; color: ${estadoColor}; background: ${estadoBg}; border: 1px solid ${estadoColor}40;">
                    ● ${item.estado || 'Programada'}
                  </span>
                </div>
                <div style="grid-column: span 2;">
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Sedes Participantes</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.sedes || '—'}</span>
                </div>
                <div style="grid-column: span 2;">
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Procesos / Áreas Auditadas</span>
                  <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.areas || 'General'}</span>
                </div>
              </div>
            </div>

            <!-- Card: Dates and Frequency -->
            <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 14px 18px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.84rem;">
              <div>
                <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Fechas Programadas</span>
                <span style="color: var(--txt, #0f172a); font-weight: 600;">
                  ${item.inicio ? (item.inicio + ' al ' + (item.fin || 'Pendiente')) : 'Por definir'}
                </span>
              </div>
              <div>
                <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600; display: block;">Frecuencia</span>
                <span style="color: var(--txt, #0f172a); font-weight: 600;">${item.frecuencia || 'Anual'}</span>
              </div>
            </div>

            <!-- Card: Scope & Objectives -->
            ${item.alcance ? `
              <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 14px 18px;">
                <span style="color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 5px; margin-bottom: 6px;">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">flag</span> Alcance y Objetivos de la Evaluación
                </span>
                <p style="margin: 0; color: var(--txt, #0f172a); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${item.alcance}</p>
              </div>
            ` : ''}

            <!-- Download Button -->
            <div style="background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-icons" style="font-size: 22px; color: #6366f1;">file_download</span>
                <div style="font-size: 0.84rem;">
                  <span style="color: var(--muted, #64748b); font-size: 0.75rem; display: block;">Descargar Informe / Plan:</span>
                  <strong style="color: #6366f1;">PDF, Word, Imagen, Excel</strong>
                </div>
              </div>
              <button type="button" id="swal-btn-descargar-plan" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; padding: 7px 16px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);">
                <span class="material-icons" style="font-size: 16px;">download</span> Exportar Documento
              </button>
            </div>

          </div>
        </div>
      `
    });
  }
}
