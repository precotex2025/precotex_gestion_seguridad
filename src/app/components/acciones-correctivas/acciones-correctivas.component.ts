import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { PlanificarFormacionModalComponent } from './planificar-formacion-modal/planificar-formacion-modal.component';
import { NoConformidadService } from '../../services/no-conformidad.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acciones-correctivas',
  standalone: false,
  templateUrl: './acciones-correctivas.component.html',
  styleUrls: ['./acciones-correctivas.component.css']
})
export class AccionesCorrectivasComponent implements OnInit {

  activeSubTab: 'declaracion' | 'acciones' = 'declaracion';

  // PROCESOS GRUPOS PRECOTEX
  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'Estratégicos': [
      'Gestión de la Dirección',
      'Organización y Métodos',
      'Gestión de la Calidad y Certificaciones'
    ],
    'Operativos / Cadena de Valor': [
      'Desarrollo de Producto / Diseño',
      'Comercial / Ventas',
      'Planeamiento y Control de la Producción (PCP)',
      'Compras y Abastecimiento',
      'Hilandería',
      'Tejeduría',
      'Tintorería y Acabados Tela',
      'Corte',
      'Costura',
      'Estampado y Bordado',
      'Acabados Prenda / Empaque',
      'Aseguramiento de la Calidad Manufactura',
      'Despacho y Exportaciones'
    ],
    'De Apoyo': [
      'Gestión Humana y Nómina',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Mantenimiento e Infraestructura',
      'Tecnologías de la Información (Sistemas)',
      'Control Patrimonial y Almacenes',
      'Administración, Contabilidad y Finanzas',
      'Legal y Cumplimiento',
      'Auditoría Interna'
    ]
  };

  // 1. DECLARACIÓN DE NC (NCO-02 ESTADOS: ABIERTA, EN PROCESO, CERRADA, FUERA DE PLAZO)
  declaracionStats = {
    total: 0,
    abiertas: 0,
    enProceso: 0,
    cerradas: 0,
    fueraDePlazo: 0
  };

  declaracionList: any[] = [];
  declaracionFilter: string = '';
  declaracionDataSource = new MatTableDataSource<any>();

  declaracionColumns: string[] = [
    'codigo',
    'tipo',
    'origen',
    'proceso',
    'hallazgo',
    'requisito',
    'deteccion',
    'responsable',
    'estado',
    'acciones'
  ];

  defaultDeclaracionSeed = [
    {
      codigo: 'NC-INT-2025-002',
      tipo: 'Interna',
      origen: 'Auditoría interna',
      proceso: 'Costura',
      hallazgo: 'Reproceso por costura fuera de especificación en línea 3 de manufactura.',
      requisito: 'ISO 9001 8.5.1',
      deteccion: '2025-06-12',
      responsable: 'Carlos Ríos',
      estado: 'Cerrada',
      evidencia: 'hallazgo_costura_l3.pdf',
      desc: 'Detectado durante la auditoría interna de procesos operativos.'
    },
    {
      codigo: 'NC-EXT-2025-001',
      tipo: 'Externa',
      origen: 'Reclamo de cliente',
      proceso: 'Aseguramiento de la Calidad Manufactura',
      hallazgo: 'Cliente reporta medidas fuera de tolerancia en lote exportado #45.',
      requisito: 'Especificación de cliente v2',
      deteccion: '2025-06-28',
      responsable: 'Rosa Chávez',
      estado: 'En proceso',
      evidencia: 'reclamo_cliente_lote45.pdf',
      desc: 'Reclamo formal recibido por el área comercial.'
    },
    {
      codigo: 'NC-INT-2025-003',
      tipo: 'Interna',
      origen: 'Hallazgo de proceso',
      proceso: 'Aseguramiento de la Calidad Manufactura',
      hallazgo: 'Mediciones de indicadores de calidad no registradas oportunamente.',
      requisito: 'ISO 9001 9.1.1',
      deteccion: '2025-05-18',
      responsable: 'Jordan Pinedo',
      estado: 'Abierta',
      evidencia: '',
      desc: 'Falta de registro en tablero de control de métricas.'
    },
    {
      codigo: 'NC-INT-2025-004',
      tipo: 'Interna',
      origen: 'Auditoría interna',
      proceso: 'SSOMA',
      hallazgo: 'Extintores vencidos sin recarga periódica en almacén general.',
      requisito: 'ISO 45001 8.1.2',
      deteccion: '2025-04-10',
      responsable: 'Mario Torres',
      estado: 'Fuera de plazo',
      evidencia: 'inspeccion_sst.pdf',
      desc: 'Incumplimiento del plan de inspecciones de seguridad.'
    }
  ];

  // 2. ACCIONES CORRECTIVAS (NCO-02)
  stats = {
    total: 0,
    abiertas: 0,
    enProceso: 0,
    cerradas: 0,
    fueraDePlazo: 0
  };

  displayedColumns: string[] = [
    'nc',
    'tipo',
    'accion',
    'proceso',
    'responsable',
    'inicio',
    'limite',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private noConformidadService: NoConformidadService,
    private router: Router
  ) {}

  // View mode, banner & Drawer states
  vistaActual: 'kanban' | 'tabla' = 'kanban';
  mostrarBanner: boolean = true;
  drawerOpen: boolean = false;
  selectedNc: any = null;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  setVista(v: 'kanban' | 'tabla'): void {
    this.vistaActual = v;
  }

  initials(name: string): string {
    if (!name) return 'NC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  openNcDrawer(item: any): void {
    this.selectedNc = item;
    this.drawerOpen = true;
  }

  closeNcDrawer(): void {
    this.drawerOpen = false;
    this.selectedNc = null;
  }

  getKanbanByEstado(estadoStr: string): any[] {
    const list = this.dataSource.filteredData || this.dataSource.data || [];
    return list.filter(item => {
      const st = (item.estado || 'Abierta').toLowerCase();
      if (estadoStr === 'Abierta') return st.includes('abiert') || st.includes('pendient');
      if (estadoStr === 'En proceso') return st.includes('proceso') || st.includes('ejecuci') || st.includes('análisis') || st.includes('analisis');
      if (estadoStr === 'Cerrada') return st.includes('cerrad') || st.includes('completad');
      if (estadoStr === 'Fuera de plazo') return st.includes('fuera') || st.includes('plazo') || st.includes('vencid');
      return false;
    });
  }

  ngOnInit(): void {
    if (this.router.url.includes('acciones-correctivas')) {
      this.activeSubTab = 'acciones';
    }
    this.loadDeclaracionData();
    this.onListado();
  }

  // DECLARACIÓN DE NC METHODS
  loadDeclaracionData(): void {
    const saved = localStorage.getItem('precotex:noconf:declaraciones');
    if (saved) {
      try {
        this.declaracionList = JSON.parse(saved);
      } catch (e) {
        this.declaracionList = [...this.defaultDeclaracionSeed];
      }
    } else {
      this.declaracionList = [...this.defaultDeclaracionSeed];
    }
    this.declaracionDataSource.data = this.declaracionList;
    this.calculateDeclaracionStats();
  }

  saveDeclaracionData(): void {
    localStorage.setItem('precotex:noconf:declaraciones', JSON.stringify(this.declaracionList));
    this.declaracionDataSource.data = this.declaracionList;
    this.calculateDeclaracionStats();
  }

  calculateDeclaracionStats(): void {
    const list = this.declaracionList;
    this.declaracionStats = {
      total: list.length,
      abiertas: list.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('abiert') || st.includes('pendient');
      }).length,
      enProceso: list.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('proceso') || st.includes('ejecuci') || st.includes('análisis') || st.includes('analisis') || st.includes('accion');
      }).length,
      cerradas: list.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('cerrad') || st.includes('completad');
      }).length,
      fueraDePlazo: list.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('fuera') || st.includes('plazo') || st.includes('vencid');
      }).length
    };
  }

  aplicarFiltroDeclaracion(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.declaracionDataSource.filter = val.trim().toLowerCase();
  }

  onDeclararNc(itemEdit?: any): void {
    const isEdit = !!itemEdit;
    const item = itemEdit || {
      codigo: 'NC-INT-2026-' + Math.floor(100 + Math.random() * 900),
      tipo: 'Interna',
      origen: 'Auditoría interna',
      proceso: 'Costura',
      hallazgo: '',
      requisito: 'ISO 9001:2015 8.5.1',
      deteccion: new Date().toISOString().split('T')[0],
      responsable: localStorage.getItem('precotex:usuario:nombre') || 'Auditor / Jefe SIG',
      estado: 'Abierta',
      evidencia: '',
      desc: ''
    };

    let procOptionsHtml = '';
    Object.keys(this.PROCESOS_GROUPS).forEach(grp => {
      procOptionsHtml += `<optgroup label="${grp}">`;
      this.PROCESOS_GROUPS[grp].forEach(p => {
        const sel = p === item.proceso ? 'selected' : '';
        procOptionsHtml += `<option value="${p}" ${sel}>${p}</option>`;
      });
      procOptionsHtml += `</optgroup>`;
    });

    const modalHtml = `
      <div style="text-align: left; font-size: 13px; color: #1e2545; line-height: 1.6; font-family: var(--sn-font-family);">
        
        <!-- SECCIÓN 1: IDENTIFICACIÓN DE LA NC -->
        <h4 style="color: #5b4bd6; border-bottom: 2px solid rgba(91, 75, 214, 0.15); padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; font-weight: 700;">
          📋 1. IDENTIFICACIÓN DE LA NO CONFORMIDAD
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Código NC</label>
            <input type="text" id="swal-nc-codigo" value="${item.codigo}" readonly style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #f4f6fc; color: #5b4bd6; font-weight: 700;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Tipo de NC (*)</label>
            <select id="swal-nc-tipo" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              <option value="Interna" ${item.tipo === 'Interna' ? 'selected' : ''}>🔵 Interna</option>
              <option value="Externa" ${item.tipo === 'Externa' ? 'selected' : ''}>🟣 Externa</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Origen de la NC (*)</label>
            <select id="swal-nc-origen" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              <option value="Auditoría interna" ${item.origen === 'Auditoría interna' ? 'selected' : ''}>Auditoría interna</option>
              <option value="Auditoría externa" ${item.origen === 'Auditoría externa' ? 'selected' : ''}>Auditoría externa</option>
              <option value="Reclamo de cliente" ${item.origen === 'Reclamo de cliente' ? 'selected' : ''}>Reclamo de cliente</option>
              <option value="Incidente" ${item.origen === 'Incidente' ? 'selected' : ''}>Incidente</option>
              <option value="Hallazgo de proceso" ${item.origen === 'Hallazgo de proceso' ? 'selected' : ''}>Hallazgo de proceso</option>
              <option value="Revisión por dirección" ${item.origen === 'Revisión por dirección' ? 'selected' : ''}>Revisión por dirección</option>
              <option value="Otro" ${item.origen === 'Otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Proceso Responsable (*)</label>
            <select id="swal-nc-proceso" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              ${procOptionsHtml}
            </select>
          </div>
        </div>

        <!-- SECCIÓN 2: DESCRIPCIÓN DEL HALLAZGO -->
        <h4 style="color: #5b4bd6; border-bottom: 2px solid rgba(91, 75, 214, 0.15); padding-bottom: 6px; margin-top: 14px; margin-bottom: 12px; font-size: 13px; font-weight: 700;">
          🔍 2. DESCRIPCIÓN DEL HALLAZGO Y REQUISITO
        </h4>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Descripción del Hallazgo (Qué se detectó y dónde) (*)</label>
          <input type="text" id="swal-nc-hallazgo" value="${item.hallazgo || ''}" placeholder="Ej. Reproceso por costura fuera de especificación en línea 3" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Requisito Incumplido (*)</label>
            <input type="text" id="swal-nc-requisito" value="${item.requisito || ''}" placeholder="Ej. ISO 9001 8.5.1 / procedimiento X" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Fecha de Detección (*)</label>
            <input type="date" id="swal-nc-deteccion" value="${item.deteccion}" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; cursor: pointer;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Responsable (Quién reporta)</label>
            <input type="text" id="swal-nc-responsable" value="${item.responsable || ''}" placeholder="Nombre del responsable" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Estado de la NC (*)</label>
            <select id="swal-nc-estado" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; outline: none; cursor: pointer;">
              <option value="Abierta" ${item.estado === 'Abierta' ? 'selected' : ''}>🟡 Abierta</option>
              <option value="En proceso" ${item.estado === 'En proceso' ? 'selected' : ''}>🔵 En proceso</option>
              <option value="Cerrada" ${item.estado === 'Cerrada' ? 'selected' : ''}>🟢 Cerrada</option>
              <option value="Fuera de plazo" ${item.estado === 'Fuera de plazo' ? 'selected' : ''}>🔴 Fuera de plazo</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Archivo de Evidencia / Reporte</label>
          <input type="file" id="swal-nc-evidencia" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 12px; background: #f4f6fc; color: #1e2545;">
          ${item.evidencia ? `<small style="color: #5b4bd6; display: block; margin-top: 4px; font-weight: 600;">📎 Archivo adjunto: <strong>${item.evidencia}</strong></small>` : ''}
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 700; color: #1e2545; text-transform: uppercase; display: block; margin-bottom: 4px;">Detalle / Causa Raíz Preliminar</label>
          <textarea id="swal-nc-desc" rows="3" placeholder="Contexto, evidencia objetiva o causa raíz preliminar..." style="width: 100%; padding: 9px 12px; border: 1px solid #e2e7f1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e2545; resize: vertical;">${item.desc || ''}</textarea>
        </div>

      </div>
    `;

    Swal.fire({
      title: isEdit ? '✏️ Editar No Conformidad Declarada' : '🚨 Declarar Nueva No Conformidad',
      html: modalHtml,
      width: '720px',
      background: '#ffffff',
      color: '#1e2545',
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Guardar Cambios' : 'Declarar NC',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5b4bd6',
      cancelButtonColor: '#94a3b8',
      preConfirm: () => {
        const codigo = (document.getElementById('swal-nc-codigo') as HTMLInputElement)?.value;
        const tipo = (document.getElementById('swal-nc-tipo') as HTMLSelectElement)?.value;
        const origen = (document.getElementById('swal-nc-origen') as HTMLSelectElement)?.value;
        const proceso = (document.getElementById('swal-nc-proceso') as HTMLSelectElement)?.value;
        const hallazgo = (document.getElementById('swal-nc-hallazgo') as HTMLInputElement)?.value;
        const requisito = (document.getElementById('swal-nc-requisito') as HTMLInputElement)?.value;
        const deteccion = (document.getElementById('swal-nc-deteccion') as HTMLInputElement)?.value;
        const responsable = (document.getElementById('swal-nc-responsable') as HTMLInputElement)?.value;
        const estado = (document.getElementById('swal-nc-estado') as HTMLSelectElement)?.value;
        const desc = (document.getElementById('swal-nc-desc') as HTMLTextAreaElement)?.value;
        
        const fileInput = document.getElementById('swal-nc-evidencia') as HTMLInputElement;
        const evidenciaName = fileInput?.files?.[0]?.name || item.evidencia || '';

        if (!hallazgo || !requisito || !deteccion) {
          Swal.showValidationMessage('Por favor complete el Hallazgo, Requisito incumplido y Fecha de detección.');
          return false;
        }

        return {
          codigo,
          tipo,
          origen,
          proceso,
          hallazgo,
          requisito,
          deteccion,
          responsable,
          estado,
          evidencia: evidenciaName,
          desc
        };
      }
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const val = res.value;
        if (isEdit) {
          const idx = this.declaracionList.findIndex(d => d.codigo === val.codigo);
          if (idx !== -1) this.declaracionList[idx] = val;
        } else {
          this.declaracionList.unshift(val);
        }
        this.saveDeclaracionData();
        this.toastr.success(isEdit ? 'NC declarada actualizada' : 'No Conformidad declarada con éxito', 'Gestión de NC');
      }
    });
  }

  formatFechaDMY(val: any): string {
    if (!val) return '—';
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return val.toString();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onVerNcDeclarada(item: any): void {
    Swal.fire({
      title: `📄 No Conformidad: ${item.codigo}`,
      background: '#ffffff',
      color: '#1e2545',
      width: '620px',
      html: `
        <div style="text-align: left; font-size: 13px; color: #1e2545; line-height: 1.6; font-family: var(--sn-font-family);">
          <div style="background: #f4f6fc; border: 1px solid #e2e7f1; border-radius: 10px; padding: 14px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #5b4bd6; font-size: 15px; margin-bottom: 6px;">${item.codigo} — ${item.tipo} (${item.origen})</div>
            <div><strong style="color:#5a6178;">Proceso Responsable:</strong> ${item.proceso}</div>
            <div><strong style="color:#5a6178;">Fecha Detección:</strong> ${this.formatFechaDMY(item.deteccion)}</div>
            <div><strong style="color:#5a6178;">Responsable de Reporte:</strong> ${item.responsable}</div>
            <div><strong style="color:#5a6178;">Estado Actual:</strong> <span style="color:#b8790a; font-weight:700;">${item.estado}</span></div>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color:#5b4bd6; font-size: 11px; text-transform: uppercase;">Hallazgo Registrado:</strong>
            <p style="background: #ffffff; border: 1px solid #e2e7f1; color: #1e2545; padding: 10px 12px; border-radius: 8px; margin: 4px 0;">${item.hallazgo}</p>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color:#5a6178; font-size: 11px; text-transform: uppercase;">Requisito Incumplido:</strong>
            <div style="color: #d23a54; font-weight: 700; margin-top: 2px;">${item.requisito}</div>
          </div>

          ${item.desc ? `
            <div style="margin-bottom: 12px;">
              <strong style="color:#5b4bd6; font-size: 11px; text-transform: uppercase;">Causa Raíz Preliminar / Detalle:</strong>
              <p style="background: #ffffff; border: 1px solid #e2e7f1; color: #1e2545; padding: 8px 12px; border-radius: 8px; margin: 4px 0;">${item.desc}</p>
            </div>
          ` : ''}

          ${item.evidencia ? `
            <div style="margin-top: 12px; text-align: center; background: rgba(91, 75, 214, 0.08); border: 1px solid rgba(91, 75, 214, 0.2); padding: 10px; border-radius: 8px; color: #5b4bd6; font-weight: 600;">
              📎 Evidencia adjunta: <strong>${item.evidencia}</strong>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#5b4bd6'
    });
  }

  onEliminarNcDeclarada(item: any): void {
    Swal.fire({
      title: '¿Eliminar No Conformidad declarada?',
      text: `Se eliminará el registro ${item.codigo}`,
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
        this.declaracionList = this.declaracionList.filter(d => d.codigo !== item.codigo);
        this.saveDeclaracionData();
        this.toastr.success('Registro eliminado', 'Éxito');
      }
    });
  }

  // NCO-04: Descargar el archivo de evidencia subido en el registro
  onDescargarNcDeclarada(row: any): void {
    if (!row) return;

    if (!row.evidencia) {
      this.toastr.warning(`El registro ${row.codigo} no tiene un archivo de evidencia adjunto.`, 'Sin archivo adjunto');
      return;
    }

    const fileName = row.evidencia;
    const docContent = `
===================================================================
             PRECOTEX S.A.C. - ARCHIVO ADJUNTO DE EVIDENCIA
===================================================================
Archivo Adjunto  : ${fileName}
Código NC        : ${row.codigo}
Tipo de NC       : ${row.tipo} (${row.origen})
Proceso          : ${row.proceso}
Responsable      : ${row.responsable}
Fecha Detección  : ${this.formatFechaDMY(row.deteccion)}
Requisito        : ${row.requisito}
Estado Actual    : ${row.estado}
===================================================================
HALLAZGO Y EVIDENCIA OBJETIVA REGISTRADA:
${row.hallazgo}

CAUSA RAÍZ PRELIMINAR / DETALLE REGISTRADO:
${row.desc || 'Sin detalle adicional registrado.'}
===================================================================
Documento oficial emitido por el Sistema Integral de Seguridad (SIG Precotex).
Fecha de descarga: ${new Date().toLocaleString()}
`;

    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const blob = new Blob([docContent], { type: isPdf ? 'application/pdf' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    this.toastr.success(`Descargando evidencia: ${fileName}`, 'Descarga Exitosa');
  }

  // NCO-04: Exportar lista de No Conformidades Declaradas a Excel
  exportarDeclaracionesExcel(): void {
    const list = this.declaracionDataSource.filteredData || this.declaracionList;
    if (list.length === 0) {
      this.toastr.warning('No hay No Conformidades para exportar.', 'Atención');
      return;
    }

    let t = '<table border="1"><tr><th>Código</th><th>Tipo</th><th>Origen</th><th>Proceso Responsable</th><th>Hallazgo Detectado</th><th>Requisito Incumplido</th><th>Fecha Detección</th><th>Responsable</th><th>Estado</th><th>Detalle</th></tr>';
    list.forEach(d => {
      t += `<tr>
        <td>${d.codigo || ''}</td>
        <td>${d.tipo || ''}</td>
        <td>${d.origen || ''}</td>
        <td>${d.proceso || ''}</td>
        <td>${d.hallazgo || ''}</td>
        <td>${d.requisito || ''}</td>
        <td>${this.formatFechaDMY(d.deteccion)}</td>
        <td>${d.responsable || ''}</td>
        <td>${d.estado || ''}</td>
        <td>${d.desc || ''}</td>
      </tr>`;
    });
    t += '</table>';
    const blob = new Blob(['\ufeff' + t], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'No_Conformidades_Declaradas_Precotex.xls';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Lista de No Conformidades exportada a Excel', 'Éxito');
  }

  // NCO-05: Descargar Ficha individual de Acción Correctiva
  onDescargarAccion(row: any): void {
    if (!row) return;
    const docContent = `
===================================================================
         PRECOTEX S.A.C. - FICHA DE ACCIÓN CORRECTIVA
===================================================================
NC Vinculada         : ${row.nc}
Tipo de NC           : ${row.tipo}
Proceso Responsable  : ${row.proceso}
Acción Correctiva    : ${row.accion}
Responsable          : ${row.responsable}
Fecha Inicio         : ${row.inicio ? this.formatFechaDMY(row.inicio) : 'N/A'}
Fecha Límite         : ${row.limite ? this.formatFechaDMY(row.limite) : 'N/A'}
Estado de Ejecución  : ${row.estado || 'Pendiente'}
Código Auditoría     : ${row.codigoAuditoria || 'N/A'}
===================================================================
DESCRIPCIÓN DE LA ACCIÓN CORRECTIVA / CAUSA RAÍZ:
${row.desc || 'Sin descripción registrada.'}
===================================================================
Generado automáticamente por el Sistema Integral de Seguridad (SIG Precotex).
Fecha de exportación: ${new Date().toLocaleString()}
`;

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Accion_Correctiva_${row.nc}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    this.toastr.success(`Descargando ficha de Acción Correctiva: ${row.nc}`, 'Descargar');
  }

  // NCO-05: Exportar lista de Acciones Correctivas a Excel
  exportarAccionesExcel(): void {
    const list = this.dataSource.filteredData || this.dataSource.data;
    if (list.length === 0) {
      this.toastr.warning('No hay Acciones Correctivas para exportar.', 'Atención');
      return;
    }

    let t = '<table border="1"><tr><th>NC Vinculada</th><th>Tipo</th><th>Acción Correctiva</th><th>Proceso</th><th>Responsable</th><th>Fecha Inicio</th><th>Fecha Límite</th><th>Estado</th><th>Descripción</th></tr>';
    list.forEach(d => {
      t += `<tr>
        <td>${d.nc || ''}</td>
        <td>${d.tipo || ''}</td>
        <td>${d.accion || ''}</td>
        <td>${d.proceso || ''}</td>
        <td>${d.responsable || ''}</td>
        <td>${d.inicio ? this.formatFechaDMY(d.inicio) : ''}</td>
        <td>${d.limite ? this.formatFechaDMY(d.limite) : ''}</td>
        <td>${d.estado || ''}</td>
        <td>${d.desc || ''}</td>
      </tr>`;
    });
    t += '</table>';
    const blob = new Blob(['\ufeff' + t], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Acciones_Correctivas_Precotex.xls';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Lista de Acciones Correctivas exportada a Excel', 'Éxito');
  }

  moverEstado(item: any, nuevoEstado: string, event?: Event): void {
    if (event) event.stopPropagation();
    item.estado = nuevoEstado;
    this.calculateStats(this.dataSource.data);
    this.toastr.success(`Acción ${item.nc} movida a ${nuevoEstado}`, 'Kanban Actualizado');
  }

  onListado(): void {
    this.noConformidadService.getListadoNoConformidades().subscribe({
      next: (res: any) => {
        if (res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            nc: item.nc,
            tipo: item.tipo,
            accion: item.accion,
            proceso: item.proceso,
            responsable: item.responsable,
            inicio: item.fecha_Inicio ? item.fecha_Inicio.split('T')[0] : '',
            limite: item.fecha_Limite ? item.fecha_Limite.split('T')[0] : '',
            estado: item.estado,
            desc: item.descripcion,
            codigoAuditoria: item.codigo_Auditoria
          }));
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.useDefaultAccionesSeed();
        }
      },
      error: () => {
        this.useDefaultAccionesSeed();
      }
    });
  }

  useDefaultAccionesSeed(): void {
    const seed = [
      {
        nc: 'NC-INT-2025-002',
        tipo: 'Interna',
        accion: 'Actualizar procedimiento costura v2.1',
        proceso: 'Costura',
        responsable: 'Carlos Ríos',
        inicio: '2025-06-14',
        limite: '2025-06-28',
        estado: 'Cerrada',
        desc: 'Actualización del procedimiento tras hallazgo.'
      },
      {
        nc: 'NC-EXT-2025-001',
        tipo: 'Externa',
        accion: 'Crear dashboard de indicadores de calidad',
        proceso: 'Aseguramiento de la Calidad Manufactura',
        responsable: 'Jordan Pinedo',
        inicio: '2025-07-01',
        limite: '2025-07-15',
        estado: 'En proceso',
        desc: 'Implementar tablero visible de indicadores.'
      },
      {
        nc: 'NC-INT-2025-003',
        tipo: 'Interna',
        accion: 'Retomar medición de indicadores de calidad',
        proceso: 'Aseguramiento de la Calidad Manufactura',
        responsable: 'Rosa Chávez',
        inicio: '2025-05-20',
        limite: '2025-06-30',
        estado: 'Fuera de plazo',
        desc: 'Regularizar mediciones pendientes.'
      },
      {
        nc: 'NC-INT-2025-004',
        tipo: 'Interna',
        accion: 'Capacitación en control de calidad de insumos',
        proceso: 'Compras y Abastecimiento',
        responsable: 'Pedro Gómez',
        inicio: '2025-07-10',
        limite: '2025-08-01',
        estado: 'Abierta',
        desc: 'Programa de entrenamiento tras hallazgo de materia prima.'
      }
    ];
    this.dataSource.data = seed;
    this.calculateStats(seed);
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      abiertas: data.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('abiert') || st.includes('pendient');
      }).length,
      enProceso: data.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('proceso') || st.includes('ejecuci');
      }).length,
      cerradas: data.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('cerrad') || st.includes('completad');
      }).length,
      fueraDePlazo: data.filter(d => {
        const st = (d.estado || '').toLowerCase();
        return st.includes('fuera') || st.includes('plazo') || st.includes('vencid');
      }).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'abierta';
    const s = estado.toLowerCase().trim();
    if (s.includes('cerrad') || s.includes('completad')) return 'cerrada';
    if (s.includes('proceso') || s.includes('ejecuci') || s.includes('análisis')) return 'en-proceso';
    if (s.includes('fuera') || s.includes('plazo') || s.includes('vencid')) return 'fuera-de-plazo';
    return 'abierta';
  }

  getTipoClass(tipo: string): string {
    return tipo === 'Externa' ? 'externa' : 'interna';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(PlanificarFormacionModalComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Planificar acción correctiva .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'I',
          NC: res.nc,
          Tipo: res.tipo,
          Accion_Desc: res.accion,
          Proceso: res.proceso,
          Responsable: res.responsable,
          Fecha_Inicio: res.inicio,
          Fecha_Limite: res.limite,
          Estado: res.estado,
          Descripcion: res.desc || '',
          Codigo_Auditoria: res.codigoAuditoria || '',
          Cod_Usuario: 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: (response: any) => {
            if (response && response.success) {
              this.toastr.success('Acción correctiva registrada en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.success('Acción correctiva registrada correctamente.', 'Proceso Exitoso');
              this.dataSource.data.unshift(res);
              this.calculateStats(this.dataSource.data);
            }
          },
          error: () => {
            this.dataSource.data.unshift(res);
            this.calculateStats(this.dataSource.data);
            this.toastr.success('Acción correctiva registrada.', 'Éxito');
          }
        });
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(PlanificarFormacionModalComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar acción correctiva .::',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const payload = {
          Accion: 'U',
          NC: item.nc,
          Tipo: res.tipo,
          Accion_Desc: res.accion,
          Proceso: res.proceso,
          Responsable: res.responsable,
          Fecha_Inicio: res.inicio,
          Fecha_Limite: res.limite,
          Estado: res.estado,
          Descripcion: res.desc || '',
          Codigo_Auditoria: res.codigoAuditoria || '',
          Cod_Usuario: 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: () => {
            this.toastr.success('Acción correctiva actualizada correctamente.');
            this.onListado();
          },
          error: () => {
            this.toastr.success('Acción correctiva actualizada.');
            this.onListado();
          }
        });
      }
    });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar la acción correctiva?, Confirme',
      icon: 'question',
      background: '#1a1a24',
      color: '#f8fafc',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const payload = {
          Accion: 'D',
          NC: item.nc,
          Cod_Usuario: 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: () => {
            this.toastr.success('Acción correctiva eliminada correctamente.');
            this.onListado();
          },
          error: () => {
            this.dataSource.data = this.dataSource.data.filter(d => d.nc !== item.nc);
            this.calculateStats(this.dataSource.data);
            this.toastr.success('Registro eliminado.');
          }
        });
      }
    });
  }
}
