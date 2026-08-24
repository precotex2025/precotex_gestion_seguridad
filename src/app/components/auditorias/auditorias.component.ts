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
            codigo_Auditoria: d.codigo_Auditoria,
            tipo: d.tipo,
            norma: d.norma,
            responsable: d.responsable,
            areas: d.areas,
            inicio: d.fecha_Inicio ? d.fecha_Inicio.split('T')[0] : '',
            fin: d.fecha_Fin ? d.fecha_Fin.split('T')[0] : '',
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
    this.auditoriasService.getListadoEjecucionAuditorias('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          this.ejecucionList = res.elements.map((d: any) => ({
            id: d.codigo_Ejecucion || d.id || ('EJEC-' + Math.floor(1000 + Math.random() * 9000)),
            auditoria: d.codigo_Auditoria || d.auditoria,
            norma: d.norma || 'ISO 9001',
            proceso: d.proceso || 'General',
            fecha: d.fecha ? d.fecha.split('T')[0] : '',
            auditados: d.auditados || '',
            tipo: d.tipo || 'Observación',
            descripcion: d.descripcion || '',
            nc: d.nc || '—',
            responsable: d.responsable || '',
            estado: d.estado || 'Abierto',
            archivo: d.archivo || '',
            notas: d.notas || ''
          }));
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
    if (raw) {
      try {
        this.ejecucionList = JSON.parse(raw);
      } catch {
        this.ejecucionList = [...this.defaultEjecucionSeed];
      }
    } else {
      this.ejecucionList = [...this.defaultEjecucionSeed];
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

  onRegistrarEjecucion(itemEdit?: any): void {
    const isEdit = !!itemEdit;
    const item = itemEdit || {
      id: 'EJEC-' + Math.floor(1000 + Math.random() * 9000),
      auditoria: 'AUD-INT-2025-001',
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

    const auditOptions = this.dataSource.data.length > 0 
      ? this.dataSource.data.map(a => `<option value="${a.codigo_Auditoria}">${a.codigo_Auditoria} (${a.norma})</option>`).join('')
      : `<option value="AUD-INT-2025-001">AUD-INT-2025-001 (ISO 9001)</option><option value="AUD-INT-2025-002">AUD-INT-2025-002 (ISO 45001)</option>`;

    const modalHtml = `
      <div style="text-align: left; font-size: 13px; color: #1e2545; line-height: 1.6; font-family: var(--sn-font-family);">
        
        <!-- SECCIÓN 1: AUDITORÍA EJECUTADA -->
        <h4 style="color: #5b4bd6; border-bottom: 2px solid rgba(91, 75, 214, 0.15); padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;">
          📋 1. AUDITORÍA EJECUTADA
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Código de Auditoría (*)</label>
            <select id="swal-auditoria" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              ${auditOptions}
            </select>
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Fecha de Ejecución (*)</label>
            <input type="date" id="swal-fecha" value="${item.fecha}" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; cursor: pointer;">
          </div>
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Auditados / Participantes Entrevistados</label>
          <input type="text" id="swal-auditados" value="${item.auditados || ''}" placeholder="Ej. Carlos Ríos, Jefes de Línea" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545;">
        </div>

        <!-- SECCIÓN 2: HALLAZGO Y EVIDENCIA -->
        <h4 style="color: #5b4bd6; border-bottom: 2px solid rgba(91, 75, 214, 0.15); padding-bottom: 6px; margin-top: 14px; margin-bottom: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;">
          🔍 2. HALLAZGO Y EVIDENCIAS
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Tipo de Hallazgo (*)</label>
            <select id="swal-tipo" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              <option value="Conformidad" ${item.tipo === 'Conformidad' ? 'selected' : ''}>🟢 Conformidad</option>
              <option value="Observación" ${item.tipo === 'Observación' ? 'selected' : ''}>🟡 Observación</option>
              <option value="Oportunidad de mejora" ${item.tipo === 'Oportunidad de mejora' ? 'selected' : ''}>🔵 Oportunidad de mejora</option>
              <option value="No conformidad" ${item.tipo === 'No conformidad' ? 'selected' : ''}>🔴 No conformidad</option>
              <option value="Checklist" ${item.tipo === 'Checklist' ? 'selected' : ''}>🟣 Checklist</option>
              <option value="Evidencia / Informe" ${item.tipo === 'Evidencia / Informe' ? 'selected' : ''}>🟣 Evidencia / Informe</option>
            </select>
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Estado</label>
            <select id="swal-estado" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              <option value="Abierto" ${item.estado === 'Abierto' ? 'selected' : ''}>⏳ Abierto</option>
              <option value="Cerrado" ${item.estado === 'Cerrado' ? 'selected' : ''}>✅ Cerrado</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Descripción del Hallazgo / Detalle (*)</label>
          <textarea id="swal-descripcion" rows="3" placeholder="Describe la evidencia encontrada..." style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; resize: vertical;">${item.descripcion || ''}</textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">NC Vinculada (si aplica)</label>
            <input type="text" id="swal-nc" value="${item.nc || ''}" placeholder="Ej. NC-INT-2025-001" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Auditor / Responsable</label>
            <input type="text" id="swal-responsable" value="${item.responsable || ''}" placeholder="Nombre del auditor" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545;">
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Archivo de Evidencia / Checklist</label>
          <input type="file" id="swal-archivo" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 12px; background: #f4f6fc; color: #1e2545;">
          ${item.archivo ? `<small style="color: #5b4bd6; display: block; margin-top: 4px; font-weight: 600;">📎 Archivo actual: <strong>${item.archivo}</strong></small>` : ''}
        </div>

        <!-- SECCIÓN 3: NOTAS -->
        <h4 style="color: #5b4bd6; border-bottom: 2px solid rgba(91, 75, 214, 0.15); padding-bottom: 6px; margin-top: 14px; margin-bottom: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;">
          📝 3. NOTAS ADICIONALES
        </h4>
        <div>
          <textarea id="swal-notas" rows="2" placeholder="Comentarios adicionales o recomendaciones..." style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; resize: vertical;">${item.notas || ''}</textarea>
        </div>

      </div>
    `;

    Swal.fire({
      title: isEdit ? '✏️ Editar Hallazgo / Evidencia' : '➕ Registrar Hallazgo / Evidencia (Ejecución)',
      html: modalHtml,
      width: '720px',
      background: '#ffffff',
      color: '#1e2545',
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Guardar Cambios' : 'Registrar Hallazgo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5b4bd6',
      cancelButtonColor: '#94a3b8',
      preConfirm: () => {
        const auditoria = (document.getElementById('swal-auditoria') as HTMLSelectElement)?.value;
        const fecha = (document.getElementById('swal-fecha') as HTMLInputElement)?.value;
        const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement)?.value;
        const descripcion = (document.getElementById('swal-descripcion') as HTMLTextAreaElement)?.value;
        
        if (!auditoria || !fecha || !descripcion) {
          Swal.showValidationMessage('Por favor complete la Auditoría, Fecha y Descripción del Hallazgo.');
          return false;
        }

        const auditados = (document.getElementById('swal-auditados') as HTMLInputElement)?.value || '';
        const estado = (document.getElementById('swal-estado') as HTMLSelectElement)?.value || 'Abierto';
        const nc = (document.getElementById('swal-nc') as HTMLInputElement)?.value || '';
        const responsable = (document.getElementById('swal-responsable') as HTMLInputElement)?.value || '';
        const notas = (document.getElementById('swal-notas') as HTMLTextAreaElement)?.value || '';
        
        const fileInput = document.getElementById('swal-archivo') as HTMLInputElement;
        const archivoName = fileInput?.files?.[0]?.name || item.archivo || 'evidencia_audit.pdf';

        return {
          id: item.id,
          auditoria,
          fecha,
          auditados,
          tipo,
          descripcion,
          nc,
          responsable,
          estado,
          archivo: archivoName,
          notas,
          norma: 'ISO 9001 / ISO 45001'
        };
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
          this.ejecucionList.unshift(val);
        }
        this.saveLocalBackupEjecucion();
        
        this.auditoriasService.postProcesoMntoEjecucion({
          Accion: isEdit ? 'U' : 'I',
          ...val
        }).subscribe({ next: () => {}, error: () => {} });

        this.toastr.success(isEdit ? 'Hallazgo actualizado' : 'Hallazgo / Evidencia registrado con éxito', 'Ejecución y Resultados');
      }
    });
  }

  onEliminarEjecucion(item: any): void {
    Swal.fire({
      title: '¿Eliminar registro de hallazgo?',
      text: `Se eliminará el hallazgo: ${item.descripcion}`,
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
        this.ejecucionList = this.ejecucionList.filter(e => e.id !== item.id);
        this.saveLocalBackupEjecucion();
        
        this.auditoriasService.postProcesoMntoEjecucion({
          Accion: 'D',
          id: item.id
        }).subscribe({ next: () => {}, error: () => {} });

        this.toastr.success('Registro eliminado', 'Éxito');
      }
    });
  }

  onVerEvidenciaEjecucion(item: any): void {
    Swal.fire({
      title: `📄 Evidencia: ${item.auditoria}`,
      background: '#1a1a24',
      color: '#f8fafc',
      html: `
        <div style="text-align: left; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          <div style="background: #111119; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin-bottom: 4px;">${item.tipo} - ${item.estado}</div>
            <div><strong style="color:#94a3b8;">Auditoría:</strong> ${item.auditoria} (${item.norma || 'ISO'})</div>
            <div><strong style="color:#94a3b8;">Fecha:</strong> ${item.fecha}</div>
            <div><strong style="color:#94a3b8;">Auditados:</strong> ${item.auditados || 'N/A'}</div>
            <div><strong style="color:#94a3b8;">Auditor / Responsable:</strong> ${item.responsable}</div>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color:#818cf8;">Descripción del Hallazgo:</strong>
            <p style="background: #111119; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; padding: 8px 12px; border-radius: 6px; margin: 4px 0;">${item.descripcion}</p>
          </div>
          ${item.nc ? `<div><strong style="color:#94a3b8;">NC Vinculada:</strong> <span style="color: #f87171; font-family: monospace; font-weight: 700;">${item.nc}</span></div>` : ''}
          ${item.notas ? `<div style="margin-top: 8px;"><strong style="color:#818cf8;">Notas:</strong> ${item.notas}</div>` : ''}
          <div style="margin-top: 12px; text-align: center; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 10px; border-radius: 6px; color: #a5b4fc;">
            📎 Archivo adjunto: <strong>${item.archivo || 'evidencia.pdf'}</strong>
          </div>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6366f1'
    });
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
      width: '680px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
        Title  : '::. Planificar auditoría .::'  ,
        Accion : 'I'                              ,
        Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe(res => { if (res) this.onListado(); });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(AuditoriasRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'my-class',
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
          Codigo_Auditoria: item.codigo_Auditoria,
          Cod_Usuario: 'SISTEMAS'
        };
        this.auditoriasService.postProcesoMntoAuditoria(payload).subscribe({
          next: () => {
            this.toastr.success('Auditoría eliminada correctamente en la BD.', '', { timeOut: 2500 });
            this.onListado();
          },
          error: () => {
            this.toastr.error('Error al eliminar auditoría en la BD.', '', { timeOut: 2500 });
          }
        });
      }
    });
  }

  // AUD-03: Botones VER y DESCARGAR en Auditorías Planificadas
  onVerPlanificada(item: any): void {
    Swal.fire({
      title: `📋 Plan de Auditoría: ${item.codigo_Auditoria}`,
      background: '#1a1a24',
      color: '#f8fafc',
      width: '620px',
      html: `
        <div style="text-align: left; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          <div style="background: #111119; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #818cf8; font-size: 15px; margin-bottom: 6px;">${item.codigo_Auditoria} — ${item.norma}</div>
            <div><strong style="color:#94a3b8;">Tipo de Auditoría:</strong> ${item.tipo}</div>
            <div><strong style="color:#94a3b8;">Responsable Líder:</strong> ${item.responsable}</div>
            <div><strong style="color:#94a3b8;">Procesos / Áreas Auditadas:</strong> ${item.areas || 'General'}</div>
            <div><strong style="color:#94a3b8;">Fechas Programadas:</strong> ${item.inicio ? (item.inicio + ' al ' + (item.fin || 'Pendiente')) : 'Por definir'}</div>
            <div><strong style="color:#94a3b8;">Frecuencia:</strong> ${item.frecuencia || 'Anual'}</div>
            <div><strong style="color:#94a3b8;">Estado del Plan:</strong> <span style="color:#34d399; font-weight:700;">${item.estado || 'Programada'}</span></div>
          </div>
          ${item.alcance ? `
            <div style="margin-bottom: 10px;">
              <strong style="color:#818cf8;">Alcance / Objetivos de la Evaluación:</strong>
              <p style="background: #111119; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; padding: 10px 12px; border-radius: 6px; margin: 4px 0;">${item.alcance}</p>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6366f1'
    });
  }

  onDescargarPlanificada(item: any): void {
    const docContent = `
===================================================================
                PRECOTEX S.A.C. - PLAN DE AUDITORÍA
===================================================================
Código Auditoría : ${item.codigo_Auditoria}
Tipo de Auditoría: ${item.tipo}
Norma Auditada   : ${item.norma}
Responsable Líder: ${item.responsable}
Procesos / Áreas : ${item.areas || 'General'}
Fecha Inicio     : ${item.inicio || 'N/A'}
Fecha Fin        : ${item.fin || 'N/A'}
Frecuencia       : ${item.frecuencia || 'Anual'}
Estado           : ${item.estado || 'Programada'}
===================================================================
ALCANCE Y OBJETIVOS:
${item.alcance || 'Auditoría interna para verificar el cumplimiento del SIG Precotex.'}
===================================================================
Generado automáticamente por el Sistema Integral de Seguridad (SIG).
Fecha de exportación: ${new Date().toLocaleString()}
`;

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Plan_Auditoria_${item.codigo_Auditoria}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    this.toastr.success(`Descargando informe de plan de auditoría: ${item.codigo_Auditoria}`, 'Descargar');
  }
}
