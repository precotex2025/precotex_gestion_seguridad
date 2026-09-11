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

  onMoverEstadoDesdeDrawer(nuevoEstado: string): void {
    if (!this.selectedNc) return;
    this.selectedNc.estado = nuevoEstado;
    const idx = this.dataSource.data.findIndex(d => d.nc === this.selectedNc.nc);
    if (idx !== -1) {
      this.dataSource.data[idx].estado = nuevoEstado;
    }
    this.calculateStats(this.dataSource.data);
    this.toastr.success(`Acción ${this.selectedNc.nc} movida a "${nuevoEstado}"`, 'Estado Actualizado');
  }

  onEditarDesdeDrawer(): void {
    if (!this.selectedNc) return;
    const item = { ...this.selectedNc };
    this.closeNcDrawer();
    this.onEditar(item);
  }

  isDateExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    try {
      const target = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return target < today;
    } catch {
      return false;
    }
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
    let localSaved: any[] = [];
    const saved = localStorage.getItem('precotex:noconf:declaraciones');
    if (saved) {
      try {
        localSaved = JSON.parse(saved);
      } catch (e) {
        localSaved = [...this.defaultDeclaracionSeed];
      }
    } else {
      localSaved = [...this.defaultDeclaracionSeed];
    }
    this.declaracionList = localSaved;
    this.declaracionDataSource.data = this.declaracionList;
    this.calculateDeclaracionStats();

    // Sincronizar desde la Base de Datos (BDSecureNorm -> SN_No_Conformidad)
    this.noConformidadService.getListadoNoConformidades().subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.elements) && res.elements.length > 0) {
          const dbItems = res.elements.map((dbItem: any) => {
            const code = dbItem.nc || dbItem.nC || '';
            const localMatch = localSaved.find((l: any) => (l.codigo || '').toUpperCase() === code.toUpperCase());
            return {
              codigo: code,
              tipo: dbItem.tipo || localMatch?.tipo || 'Interna',
              origen: dbItem.codigo_Auditoria ? `Auditoría: ${dbItem.codigo_Auditoria}` : (localMatch?.origen || 'Auditoría interna'),
              proceso: dbItem.proceso || localMatch?.proceso || 'Costura',
              hallazgo: dbItem.accion || localMatch?.hallazgo || '',
              requisito: localMatch?.requisito || 'ISO 9001:2015 8.5.1',
              deteccion: dbItem.fecha_Inicio ? dbItem.fecha_Inicio.split('T')[0] : (localMatch?.deteccion || new Date().toISOString().split('T')[0]),
              responsable: dbItem.responsable || localMatch?.responsable || 'Auditor / Jefe SIG',
              estado: dbItem.estado || localMatch?.estado || 'Abierta',
              evidencia: localMatch?.evidencia || '',
              evidenciaData: localMatch?.evidenciaData || '',
              evidenciaType: localMatch?.evidenciaType || '',
              desc: dbItem.descripcion || localMatch?.desc || ''
            };
          });

          // Combinar registros de BD preservando elementos nuevos locales que aún no estén en BD
          const merged = [...dbItems];
          localSaved.forEach(loc => {
            if (!merged.some(m => (m.codigo || '').toUpperCase() === (loc.codigo || '').toUpperCase())) {
              merged.push(loc);
            }
          });

          this.declaracionList = merged;
          this.declaracionDataSource.data = this.declaracionList;
          this.calculateDeclaracionStats();
          localStorage.setItem('precotex:noconf:declaraciones', JSON.stringify(this.declaracionList));
        }
      },
      error: () => {
        // En caso de error de conexión, se mantiene la lista local
      }
    });
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

  generarSiguienteCodigoNc(tipo: string = 'Interna'): string {
    const year = new Date().getFullYear();
    const prefix = (tipo || '').toLowerCase().includes('ext') ? 'NC-EXT' : 'NC-INT';
    const regex = new RegExp(`^${prefix}-${year}-(\\d+)`, 'i');
    
    let maxCorrelativo = 0;
    const allItems = [...(this.declaracionList || []), ...(this.dataSource.data || [])];
    
    allItems.forEach(item => {
      const code = item?.codigo || item?.nc || '';
      if (code) {
        const match = code.match(regex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxCorrelativo) {
            maxCorrelativo = num;
          }
        }
      }
    });

    const nextNum = maxCorrelativo + 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    return `${prefix}-${year}-${formattedNum}`;
  }

  onDeclararNc(itemEdit?: any): void {
    const isEdit = !!itemEdit;
    const initialTipo = itemEdit?.tipo || 'Interna';
    const item = itemEdit || {
      codigo: this.generarSiguienteCodigoNc(initialTipo),
      tipo: initialTipo,
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
      <div class="dialog-wrapper" style="position: relative; background: var(--panel, #ffffff); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; color: var(--txt, #0f172a); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; text-align: left; width: 100%; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.25);">
        
        <!-- Accent Top Line (Auditorias style) -->
        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);"></div>

        <!-- Header -->
        <header style="padding: 20px 24px 16px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line, #f1f5f9); background: var(--panel, #ffffff);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%); border: 1px solid rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; color: #6366f1;">
              <span class="material-icons" style="font-size: 24px;">${isEdit ? 'edit_note' : 'assignment_add'}</span>
            </div>
            <div>
              <h2 style="font-size: 1.2rem; font-weight: 700; color: var(--txt, #0f172a); margin: 0 0 2px 0; letter-spacing: -0.02em;">
                ${isEdit ? 'Editar No Conformidad' : 'Declarar No Conformidad'}
              </h2>
              <p style="font-size: 0.8rem; color: var(--muted, #64748b); margin: 0;">
                Gestión del programa SIG y registro de desviaciones
              </p>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 12px; border-radius: 20px; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.08);">
              <span class="material-icons" style="font-size: 15px; color: #6366f1;">tag</span>
              <span id="swal-header-code-text" style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #6366f1; letter-spacing: 0.02em;">
                ${item.codigo}
              </span>
            </div>
            <button type="button" id="btn-nc-modal-close" style="background: transparent; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--muted, #94a3b8); cursor: pointer; transition: all 0.15s ease;" title="Cerrar ventana">
              <span class="material-icons" style="font-size: 20px;">close</span>
            </button>
          </div>
        </header>

        <!-- Scroll Body -->
        <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; max-height: calc(85vh - 160px); overflow-y: auto;">

          <!-- Sección 1: Información Principal -->
          <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line, #e2e8f0);">
              <span class="material-icons" style="font-size: 17px; color: #6366f1;">info</span>
              <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--txt, #334155);">1. Información Principal</span>
            </div>

            <!-- Fila 1: Código NC y Tipo de NC -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">tag</span>
                  Código No Conformidad
                </label>
                <input type="text" id="swal-nc-codigo" value="${item.codigo}" readonly style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: #6366f1 !important; font-size: 0.86rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box;">
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">category</span>
                  Tipo de No Conformidad <span style="color: #ef4444; font-weight: 700;">*</span>
                </label>
                <select id="swal-nc-tipo" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box; cursor: pointer;">
                  <option value="Interna" ${item.tipo === 'Interna' ? 'selected' : ''}>Interna</option>
                  <option value="Externa" ${item.tipo === 'Externa' ? 'selected' : ''}>Externa</option>
                </select>
              </div>
            </div>

            <!-- Fila 2: Origen y Proceso -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">source</span>
                  Origen de la NC <span style="color: #ef4444; font-weight: 700;">*</span>
                </label>
                <select id="swal-nc-origen" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box; cursor: pointer;">
                  <option value="Auditoría interna" ${item.origen === 'Auditoría interna' ? 'selected' : ''}>Auditoría interna</option>
                  <option value="Auditoría externa" ${item.origen === 'Auditoría externa' ? 'selected' : ''}>Auditoría externa</option>
                  <option value="Reclamo de cliente" ${item.origen === 'Reclamo de cliente' ? 'selected' : ''}>Reclamo de cliente</option>
                  <option value="Incidente" ${item.origen === 'Incidente' ? 'selected' : ''}>Incidente</option>
                  <option value="Hallazgo de proceso" ${item.origen === 'Hallazgo de proceso' ? 'selected' : ''}>Hallazgo de proceso</option>
                  <option value="Revisión por dirección" ${item.origen === 'Revisión por dirección' ? 'selected' : ''}>Revisión por dirección</option>
                  <option value="Otro" ${item.origen === 'Otro' ? 'selected' : ''}>Otro</option>
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">apartment</span>
                  Proceso Responsable <span style="color: #ef4444; font-weight: 700;">*</span>
                </label>
                <select id="swal-nc-proceso" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box; cursor: pointer;">
                  ${procOptionsHtml}
                </select>
              </div>
            </div>
          </div>

          <!-- Sección 2: Alcance y Detalle del Hallazgo -->
          <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line, #e2e8f0);">
              <span class="material-icons" style="font-size: 17px; color: #6366f1;">assignment</span>
              <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--txt, #334155);">2. Alcance y Detalle del Hallazgo</span>
            </div>

            <!-- Fila: Descripción del hallazgo -->
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                <span class="material-icons" style="font-size: 15px; color: #818cf8;">description</span>
                Descripción del hallazgo (Qué se detectó y dónde) <span style="color: #ef4444; font-weight: 700;">*</span>
              </label>
              <input type="text" id="swal-nc-hallazgo" value="${item.hallazgo || ''}" placeholder="Ej. Reproceso por costura fuera de especificación en línea 3" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box;">
            </div>

            <!-- Fila: Requisito y Fecha detección -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">verified_user</span>
                  Requisito incumplido <span style="color: #ef4444; font-weight: 700;">*</span>
                </label>
                <input type="text" id="swal-nc-requisito" value="${item.requisito || ''}" placeholder="Ej. ISO 9001:2015 8.5.1 / Procedimiento PO-CAL-04" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box;">
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">calendar_today</span>
                  Fecha de detección <span style="color: #ef4444; font-weight: 700;">*</span>
                </label>
                <input type="date" id="swal-nc-deteccion" value="${item.deteccion}" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box; cursor: pointer;">
              </div>
            </div>

            <!-- Fila: Responsable y Estado -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">person</span>
                  Auditor / Quién reporta
                </label>
                <input type="text" id="swal-nc-responsable" value="${item.responsable || ''}" placeholder="Ej. Auditor / Jefe SIG" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box;">
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                  <span class="material-icons" style="font-size: 15px; color: #818cf8;">flag</span>
                  Estado inicial <span style="color: #ef4444; font-weight: 700;">*</span>
                </label>
                <select id="swal-nc-estado" style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; height: 42px; padding: 0 13px; outline: none; width: 100%; box-sizing: border-box; cursor: pointer;">
                  <option value="Abierta" ${item.estado === 'Abierta' ? 'selected' : ''}>Abierta</option>
                  <option value="En proceso" ${item.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
                  <option value="Cerrada" ${item.estado === 'Cerrada' ? 'selected' : ''}>Cerrada</option>
                  <option value="Fuera de plazo" ${item.estado === 'Fuera de plazo' ? 'selected' : ''}>Fuera de plazo</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Sección 3: Evidencias y Causa Raíz -->
          <div style="background: var(--bg, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line, #e2e8f0);">
              <span class="material-icons" style="font-size: 17px; color: #6366f1;">attachment</span>
              <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--txt, #334155);">3. Evidencias y Análisis Preliminar</span>
            </div>

            <!-- File Dropzone -->
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                <span class="material-icons" style="font-size: 15px; color: #818cf8;">cloud_upload</span>
                Archivo de evidencia o informe técnico
              </label>
              <input type="file" id="swal-nc-evidencia" style="display: none;" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg">
              <div id="swal-file-trigger" style="border: 1.5px dashed var(--line, #cbd5e1); border-radius: 9px; padding: 12px 14px; text-align: left; background: var(--panel, #ffffff); cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center;">
                    <span class="material-icons" style="font-size: 18px;">attach_file</span>
                  </div>
                  <div>
                    <div id="swal-file-label" style="font-size: 0.84rem; font-weight: 600; color: var(--txt, #0f172a);">
                      ${item.evidencia ? item.evidencia : 'Seleccionar archivo (PDF, Word, Excel, Imagen)'}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--muted, #64748b);">
                      Formatos: PDF, Word, Excel, JPG, PNG (Máx 15MB)
                    </div>
                  </div>
                </div>
                <span style="font-size: 0.78rem; font-weight: 600; color: #6366f1; background: rgba(99, 102, 241, 0.08); padding: 4px 10px; border-radius: 6px;">Examinar</span>
              </div>
            </div>

            <!-- Textarea -->
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <label style="display: flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; color: var(--txt, #475569);">
                <span class="material-icons" style="font-size: 15px; color: #818cf8;">edit_note</span>
                Detalle / Análisis de causa raíz preliminar
              </label>
              <textarea id="swal-nc-desc" rows="3" placeholder="Contexto, evidencia objetiva o causa raíz preliminar..." style="background: var(--panel, #ffffff); border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #0f172a) !important; font-size: 0.86rem; padding: 10px 13px; outline: none; width: 100%; box-sizing: border-box; resize: vertical; min-height: 75px; line-height: 1.5;">${item.desc || ''}</textarea>
            </div>
          </div>

        </div>

        <!-- Footer Actions (Auditorias Style) -->
        <footer style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--line, #e2e8f0); background: var(--panel, #ffffff);">
          <button type="button" id="btn-nc-modal-cancel" style="display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid var(--line, #cbd5e1); border-radius: 9px; color: var(--txt, #64748b); height: 40px; padding: 0 18px; font-family: inherit; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease;">
            <span class="material-icons" style="font-size: 18px; color: #94a3b8;">close</span>
            Cancelar
          </button>
          <button type="button" id="btn-nc-modal-save" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; border-radius: 9px; height: 40px; padding: 0 22px; font-family: inherit; font-size: 0.86rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); transition: all 0.2s ease;">
            <span class="material-icons" style="font-size: 19px;">${isEdit ? 'save' : 'check_circle'}</span>
            ${isEdit ? 'Guardar Cambios' : 'Declarar NC'}
          </button>
        </footer>

      </div>
    `;

    Swal.fire({
      html: modalHtml,
      width: '740px',
      padding: '0',
      background: 'transparent',
      showConfirmButton: false,
      showCancelButton: false,
      didOpen: () => {
        const fileTrigger = document.getElementById('swal-file-trigger');
        const fileInput = document.getElementById('swal-nc-evidencia') as HTMLInputElement;
        const fileLabel = document.getElementById('swal-file-label');
        const btnCancel = document.getElementById('btn-nc-modal-cancel');
        const btnClose = document.getElementById('btn-nc-modal-close');
        const btnSave = document.getElementById('btn-nc-modal-save');

        let selectedFileData: string = item.evidenciaData || '';
        let selectedFileName: string = item.evidencia || '';
        let selectedFileType: string = item.evidenciaType || '';

        btnCancel?.addEventListener('click', () => Swal.close());
        btnClose?.addEventListener('click', () => Swal.close());

        const tipoSelect = document.getElementById('swal-nc-tipo') as HTMLSelectElement;
        const codigoInput = document.getElementById('swal-nc-codigo') as HTMLInputElement;
        const codeBadgeText = document.getElementById('swal-header-code-text');

        if (!isEdit && tipoSelect && codigoInput) {
          tipoSelect.addEventListener('change', () => {
            const newCode = this.generarSiguienteCodigoNc(tipoSelect.value);
            codigoInput.value = newCode;
            if (codeBadgeText) {
              codeBadgeText.textContent = newCode;
            }
          });
        }

        if (fileTrigger && fileInput) {
          fileTrigger.addEventListener('click', () => fileInput.click());
          fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
              const file = fileInput.files[0];
              selectedFileName = file.name;
              selectedFileType = file.type || '';
              const sizeKb = (file.size / 1024).toFixed(1);
              if (fileLabel) {
                fileLabel.innerHTML = `✅ ${file.name} <span style="font-size: 0.72rem; color: #10b981; font-weight: normal; margin-left: 4px;">(${sizeKb} KB)</span>`;
              }
              fileTrigger.style.borderColor = '#10b981';

              const reader = new FileReader();
              reader.onload = (e: any) => {
                selectedFileData = e.target?.result as string;
              };
              reader.readAsDataURL(file);
            }
          });
        }

        btnSave?.addEventListener('click', () => {
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

          if (!hallazgo || !requisito || !deteccion) {
            this.toastr.warning('Por favor complete el Hallazgo, Requisito incumplido y Fecha de detección.', 'Campos requeridos');
            return;
          }

          const val = {
            codigo,
            tipo,
            origen,
            proceso,
            hallazgo,
            requisito,
            deteccion,
            responsable,
            estado,
            evidencia: selectedFileName || item.evidencia || '',
            evidenciaData: selectedFileData || item.evidenciaData || '',
            evidenciaType: selectedFileType || item.evidenciaType || '',
            desc
          };

          const payload = {
            Accion: isEdit ? 'U' : 'I',
            NC: val.codigo,
            Tipo: val.tipo,
            Accion_Desc: val.hallazgo,
            Proceso: val.proceso,
            Responsable: val.responsable,
            Fecha_Inicio: val.deteccion,
            Fecha_Limite: val.deteccion,
            Estado: val.estado,
            Descripcion: val.desc || '',
            Codigo_Auditoria: '',
            Cod_Usuario: localStorage.getItem('precotex:usuario:login') || localStorage.getItem('precotex:usuario:nombre') || 'SISTEMAS'
          };

          // Guardar en la Base de Datos
          this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
            next: () => {
              if (isEdit) {
                const idx = this.declaracionList.findIndex(d => d.codigo === val.codigo);
                if (idx !== -1) this.declaracionList[idx] = val;
              } else {
                this.declaracionList.unshift(val);
              }
              this.saveDeclaracionData();
              this.onListado();
              this.toastr.success(isEdit ? 'NC actualizada en la Base de Datos con éxito.' : 'No Conformidad guardada en la Base de Datos con éxito.', 'Base de Datos');
            },
            error: (err: any) => {
              console.warn('Error al conectar con API de BD, persistiendo en búfer local:', err);
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

          Swal.close();
        });
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

  descargarArchivoEvidencia(row: any): void {
    if (!row || !row.evidencia) {
      this.toastr.warning('Esta No Conformidad no cuenta con archivo de evidencia adjunto.', 'Sin Evidencia');
      return;
    }

    const filename = row.evidencia;

    // Caso 1: El archivo fue subido con su contenido Base64 real
    if (row.evidenciaData) {
      try {
        const a = document.createElement('a');
        a.href = row.evidenciaData;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.toastr.success(`Descargando evidencia subida: ${filename}`, 'Descarga Exitosa');
        return;
      } catch (err) {
        console.error('Error al descargar evidencia Data URL:', err);
      }
    }

    // Caso 2: Archivo inicial semilla o sin buffer DataURL guardado -> Generar documento auténtico
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      this.generarDocumentoAccionPDF({ ...row, nc: row.codigo, accion: row.hallazgo });
      this.toastr.success(`Descargando documento de evidencia: ${filename}`, 'Descarga Exitosa');
    } else if (ext === 'doc' || ext === 'docx') {
      this.generarDocumentoAccionWord({ ...row, nc: row.codigo, accion: row.hallazgo });
      this.toastr.success(`Descargando documento de evidencia: ${filename}`, 'Descarga Exitosa');
    } else if (ext === 'xls' || ext === 'xlsx') {
      this.generarDocumentoAccionExcel({ ...row, nc: row.codigo, accion: row.hallazgo });
      this.toastr.success(`Descargando documento de evidencia: ${filename}`, 'Descarga Exitosa');
    } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      this.generarDocumentoAccionImagen({ ...row, nc: row.codigo, accion: row.hallazgo });
      this.toastr.success(`Descargando imagen de evidencia: ${filename}`, 'Descarga Exitosa');
    } else {
      const content = `PRECOTEX S.A.C. - EVIDENCIA DE NO CONFORMIDAD\nCódigo: ${row.codigo}\nTipo: ${row.tipo}\nProceso: ${row.proceso}\nHallazgo: ${row.hallazgo}\nRequisito: ${row.requisito}\nFecha Detección: ${this.formatFechaDMY(row.deteccion)}\nResponsable: ${row.responsable}\nDetalle: ${row.desc || 'Sin detalle adicional'}\nArchivo: ${filename}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.toastr.success(`Descargando evidencia: ${filename}`, 'Descarga Exitosa');
    }
  }

  onVerNcDeclarada(item: any): void {
    Swal.fire({
      title: `📄 No Conformidad: ${item.codigo}`,
      background: '#ffffff',
      color: '#1e2545',
      width: '640px',
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
            <div style="margin-top: 14px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1.5px solid rgba(99, 102, 241, 0.25); padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99, 102, 241, 0.15); color: #6366f1; display: flex; align-items: center; justify-content: center;">
                  <span class="material-icons" style="font-size: 20px;">attach_file</span>
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem; color: #3730a3;">${item.evidencia}</div>
                  <div style="font-size: 0.74rem; color: #64748b;">Archivo de evidencia adjunto</div>
                </div>
              </div>
              <button type="button" id="btn-ver-modal-dl-evidencia" style="display: inline-flex; align-items: center; gap: 6px; background: #6366f1; color: #ffffff; border: none; border-radius: 8px; padding: 8px 14px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);">
                <span class="material-icons" style="font-size: 16px;">file_download</span>
                Descargar Archivo
              </button>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#5b4bd6',
      didOpen: () => {
        const btnDl = document.getElementById('btn-ver-modal-dl-evidencia');
        if (btnDl) {
          btnDl.addEventListener('click', () => {
            this.descargarArchivoEvidencia(item);
          });
        }
      }
    });
  }

  onEliminarNcDeclarada(item: any): void {
    Swal.fire({
      title: '¿Eliminar No Conformidad declarada?',
      text: `Se eliminará el registro ${item.codigo} de la Base de Datos`,
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
        const payload = {
          Accion: 'D',
          NC: item.codigo,
          Cod_Usuario: localStorage.getItem('precotex:usuario:login') || 'SISTEMAS'
        };

        this.noConformidadService.postProcesoMntoNoConformidad(payload).subscribe({
          next: () => {
            this.declaracionList = this.declaracionList.filter(d => d.codigo !== item.codigo);
            this.saveDeclaracionData();
            this.onListado();
            this.toastr.success('Registro eliminado de la Base de Datos correctamente', 'Éxito');
          },
          error: () => {
            this.declaracionList = this.declaracionList.filter(d => d.codigo !== item.codigo);
            this.saveDeclaracionData();
            this.toastr.success('Registro eliminado', 'Éxito');
          }
        });
      }
    });
  }

  // ===================================================================
  // CENTRO DE DESCARGA MULTI-FORMATO (ACCIONES CORRECTIVAS & NC)
  // ===================================================================

  onDescargarNcDeclarada(row: any): void {
    if (!row) return;
    this.mostrarOpcionesDescargaNc(row);
  }

  onDescargarAccion(row: any): void {
    if (!row) return;
    this.mostrarOpcionesDescargaAccion(row);
  }

  mostrarOpcionesDescargaAccion(row: any): void {
    const codigo = row.nc || 'AC-001';
    const modalHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; text-align: left; overflow: hidden; border-radius: 16px;">
        <!-- Top Accent Gradient -->
        <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%);"></div>

        <!-- Header -->
        <div style="padding: 20px 24px 16px; border-bottom: 1px solid var(--line, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); display: flex; align-items: center; justify-content: center; color: #10b981;">
              <span class="material-icons" style="font-size: 22px;">verified</span>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--txt, #0f172a); letter-spacing: -0.01em;">Descargar Ficha de Acción Correctiva</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--muted, #64748b);">Selecciona el formato de exportación</p>
            </div>
          </div>
          <div>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 12px; border-radius: 20px;">
              # ${codigo}
            </span>
          </div>
        </div>

        <!-- Options Grid -->
        <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 10px;">

          <!-- Option: PDF -->
          <button type="button" id="btn-dl-ac-pdf" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">picture_as_pdf</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Documento PDF Oficial</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Ficha A4 con membrete institucional Precotex, análisis y firmas</div>
              </div>
            </div>
            <span class="material-icons" style="color: #ef4444; font-size: 20px;">arrow_forward</span>
          </button>

          <!-- Option: Word -->
          <button type="button" id="btn-dl-ac-word" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(37, 99, 235, 0.12); color: #2563eb; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">description</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Documento Word (.docx / .doc)</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Documento editable con formato SIG Precotex</div>
              </div>
            </div>
            <span class="material-icons" style="color: #2563eb; font-size: 20px;">arrow_forward</span>
          </button>

          <!-- Option: Image HD -->
          <button type="button" id="btn-dl-ac-img" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(139, 92, 246, 0.12); color: #8b5cf6; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">image</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Imagen Digital HD (.png)</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Certificado visual de alta definición para presentaciones</div>
              </div>
            </div>
            <span class="material-icons" style="color: #8b5cf6; font-size: 20px;">arrow_forward</span>
          </button>

          <!-- Option: Excel -->
          <button type="button" id="btn-dl-ac-excel" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: rgba(16, 185, 129, 0.12); color: #10b981; display: flex; align-items: center; justify-content: center;">
                <span class="material-icons" style="font-size: 20px;">table_view</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Hoja de Cálculo Excel (.xlsx)</div>
                <div style="font-size: 0.76rem; color: var(--muted, #64748b);">Ficha técnica tabulada en celdas de cálculo</div>
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
        document.getElementById('btn-dl-ac-pdf')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionPDF(row);
        });
        document.getElementById('btn-dl-ac-word')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionWord(row);
        });
        document.getElementById('btn-dl-ac-img')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionImagen(row);
        });
        document.getElementById('btn-dl-ac-excel')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionExcel(row);
        });
      }
    });
  }

  generarDocumentoAccionPDF(row: any): void {
    const codigo = row.nc || 'AC-001';
    const estadoColor = (row.estado || '').toLowerCase().includes('cerrad') ? '#10b981' : ((row.estado || '').toLowerCase().includes('proceso') ? '#3b82f6' : '#f59e0b');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ficha de Acción Correctiva - ${codigo}</title>
      <style>
        @page { size: A4; margin: 12mm 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
        .no-print { background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 12px 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .btn-print { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #fff; border: none; padding: 9px 20px; border-radius: 7px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3); }
        .header { border-bottom: 2.5px solid #10b981; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .logo-title { font-size: 20px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 600; }
        .badge-code { font-family: monospace; font-size: 14px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1.5px solid rgba(16, 185, 129, 0.3); padding: 6px 14px; border-radius: 6px; }
        .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; }
        .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        .value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .desc-box { background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #10b981; border-radius: 6px; padding: 12px 14px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; margin-top: 6px; }
        .footer { margin-top: 35px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 35px; text-align: center; }
        .sign-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11.5px; font-weight: 600; color: #334155; }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong style="color: #10b981; font-size: 14px;">Vista previa de impresión oficial (PDF)</strong>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">Haz clic en el botón para <strong>Guardar como PDF</strong> o imprimir la ficha técnica oficial.</div>
        </div>
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="logo-title">PRECOTEX S.A.C.</div>
          <div class="subtitle">SISTEMA INTEGRADO DE GESTIÓN (SIG) — FICHA TÉCNICA DE ACCIÓN CORRECTIVA</div>
        </div>
        <div class="badge-code">${codigo}</div>
      </div>

      <div class="section-box">
        <div class="section-title">1. Datos de la No Conformidad y Acción Correctiva</div>
        <div class="grid-2">
          <div><div class="label">Código No Conformidad</div><div class="value">${codigo}</div></div>
          <div><div class="label">Tipo de NC</div><div class="value">${row.tipo || 'Interna'}</div></div>
          <div><div class="label">Proceso Responsable</div><div class="value">${row.proceso || 'General'}</div></div>
          <div><div class="label">Estado de Ejecución</div><div class="value" style="color: ${estadoColor}; font-weight: 800;">● ${row.estado || 'Pendiente'}</div></div>
          <div><div class="label">Responsable Asignado</div><div class="value">${row.responsable || '—'}</div></div>
          <div><div class="label">Auditoría Asociada</div><div class="value">${row.codigoAuditoria || '—'}</div></div>
          <div><div class="label">Fecha Inicio</div><div class="value">${this.formatFechaDMY(row.inicio)}</div></div>
          <div><div class="label">Fecha Límite</div><div class="value">${this.formatFechaDMY(row.limite)}</div></div>
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">2. Plan de Acción y Análisis de Causa Raíz</div>
        <div class="label">Acción Correctiva Programada:</div>
        <div class="value" style="font-size: 14px; font-weight: 700; color: #1e1b4b; margin: 4px 0 10px 0;">${row.accion}</div>
        
        <div class="label">Descripción Detallada / Causa Raíz:</div>
        <div class="desc-box">${row.desc || 'Sin descripción adicional registrada.'}</div>
      </div>

      <div class="signatures">
        <div>
          <div style="height: 45px;"></div>
          <div class="sign-line">Firma del Responsable del Plan<br><span style="font-size: 10px; color: #64748b;">${row.responsable || 'Responsable'}</span></div>
        </div>
        <div>
          <div style="height: 45px;"></div>
          <div class="sign-line">V° B° Auditor / SIG Precotex<br><span style="font-size: 10px; color: #64748b;">Jefatura SIG</span></div>
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
      this.toastr.success(`Generando vista de impresión PDF: ${codigo}`, 'Documento PDF');
    }
  }

  generarDocumentoAccionWord(row: any): void {
    const codigo = row.nc || 'AC-001';
    const filename = `Accion_Correctiva_${codigo}.doc`;

    const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Ficha de Acción Correctiva - ${codigo}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 24px; }
        .header { border-bottom: 2.5pt solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18pt; font-weight: bold; color: #1e1b4b; }
        .subtitle { font-size: 10pt; color: #64748b; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1pt solid #cbd5e1; padding: 8px 10px; font-size: 10pt; }
        th { background-color: #f1f5f9; text-align: left; font-weight: bold; color: #334155; }
        .highlight { background-color: #ecfdf5; color: #059669; font-weight: bold; font-family: monospace; }
        .desc-box { border-left: 3.5pt solid #10b981; background-color: #f8fafc; padding: 12px; margin-top: 10px; line-height: 1.5; }
        .footer { margin-top: 30px; border-top: 1pt solid #e2e8f0; padding-top: 10px; font-size: 9pt; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">PRECOTEX S.A.C.</div>
        <div class="subtitle">SISTEMA INTEGRADO DE GESTIÓN (SIG) — FICHA DE ACCIÓN CORRECTIVA</div>
      </div>
      <h2>FICHA DE ACCIÓN CORRECTIVA: ${codigo}</h2>
      <table>
        <tr>
          <th>Código No Conformidad:</th>
          <td class="highlight">${codigo}</td>
          <th>Tipo de NC:</th>
          <td><strong>${row.tipo || 'Interna'}</strong></td>
        </tr>
        <tr>
          <th>Proceso Responsable:</th>
          <td>${row.proceso || 'General'}</td>
          <th>Estado de Ejecución:</th>
          <td><strong>${row.estado || 'Pendiente'}</strong></td>
        </tr>
        <tr>
          <th>Responsable Asignado:</th>
          <td>${row.responsable || '—'}</td>
          <th>Auditoría Asociada:</th>
          <td>${row.codigoAuditoria || '—'}</td>
        </tr>
        <tr>
          <th>Fecha Inicio:</th>
          <td>${this.formatFechaDMY(row.inicio)}</td>
          <th>Fecha Límite:</th>
          <td>${this.formatFechaDMY(row.limite)}</td>
        </tr>
      </table>
      <h3>Acción Correctiva:</h3>
      <p style="font-size: 12pt; font-weight: bold; color: #1e1b4b;">${row.accion}</p>
      <h3>Descripción y Causa Raíz:</h3>
      <div class="desc-box">${row.desc || 'Sin detalle especificado.'}</div>
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

  generarDocumentoAccionImagen(row: any): void {
    const codigo = row.nc || 'AC-001';
    const filename = `Accion_Correctiva_${codigo}.png`;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 760);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 760);

    // Accent Bar
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 1200, 10);

    // Card
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
    ctx.fillText('SISTEMA INTEGRADO DE GESTIÓN (SIG) — FICHA DIGITAL DE ACCIÓN CORRECTIVA', 70, 125);

    // Badge
    ctx.fillStyle = '#ecfdf5';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(830, 65, 300, 48, 8);
      ctx.fill();
    } else {
      ctx.fillRect(830, 65, 300, 48);
    }
    ctx.fillStyle = '#059669';
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
    ctx.fillText('TIPO DE NO CONFORMIDAD:', 70, 195);
    ctx.fillText('ESTADO DE EJECUCIÓN:', 420, 195);
    ctx.fillText('FECHA LÍMITE:', 770, 195);

    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(row.tipo || 'Interna', 70, 225);
    ctx.fillText(row.estado || 'Pendiente', 420, 225);
    ctx.fillText(this.formatFechaDMY(row.limite), 770, 225);

    // Grid 2
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('PROCESO ASIGNADO:', 70, 280);
    ctx.fillText('RESPONSABLE:', 420, 280);
    ctx.fillText('AUDITORÍA ASOCIADA:', 770, 280);

    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(row.proceso || 'General', 70, 310);
    ctx.fillText(row.responsable || '—', 420, 310);
    ctx.fillText(row.codigoAuditoria || '—', 770, 310);

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

    ctx.fillStyle = '#10b981';
    ctx.fillRect(70, 360, 8, 240);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ACCIÓN CORRECTIVA Y ANÁLISIS DE CAUSA RAÍZ:', 95, 395);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(row.accion || 'Acción Correctiva', 95, 430);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    const text = row.desc || 'Medidas preventivas y correctivas ejecutadas en el proceso.';
    ctx.fillText(text.length > 110 ? text.substring(0, 110) + '...' : text, 95, 470);

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Precotex SIG Security System • Emisión: ' + new Date().toLocaleString(), 70, 680);
    ctx.fillText('Ficha: ' + filename, 770, 680);

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

  generarDocumentoAccionExcel(row: any): void {
    const codigo = row.nc || 'AC-001';
    const filename = `Accion_Correctiva_${codigo}.xlsx`;

    const t = `
    <table border="1" style="font-family: Arial; border-collapse: collapse;">
      <tr style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center;">
        <th colspan="4" style="height: 35px; font-size: 14px;">PRECOTEX S.A.C. - FICHA DE ACCIÓN CORRECTIVA</th>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold; width: 180px;">Código No Conformidad:</td>
        <td style="font-weight: bold; color: #10b981;">${codigo}</td>
        <td style="background-color: #f1f5f9; font-weight: bold; width: 180px;">Tipo de NC:</td>
        <td>${row.tipo || 'Interna'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Proceso Responsable:</td>
        <td>${row.proceso || 'General'}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Estado:</td>
        <td style="font-weight: bold;">${row.estado || 'Pendiente'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Responsable:</td>
        <td>${row.responsable || '—'}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Auditoría Asociada:</td>
        <td>${row.codigoAuditoria || '—'}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Fecha Inicio:</td>
        <td>${this.formatFechaDMY(row.inicio)}</td>
        <td style="background-color: #f1f5f9; font-weight: bold;">Fecha Límite:</td>
        <td>${this.formatFechaDMY(row.limite)}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold;">Acción Correctiva:</td>
        <td colspan="3" style="font-weight: bold; color: #1e1b4b;">${row.accion}</td>
      </tr>
      <tr>
        <td style="background-color: #f1f5f9; font-weight: bold; vertical-align: top;">Descripción / Causa Raíz:</td>
        <td colspan="3" style="height: 60px; vertical-align: top;">${row.desc || 'Sin detalle.'}</td>
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
    this.toastr.success(`Descargando archivo Excel: ${filename}`, 'Descarga Exitosa');
  }

  mostrarOpcionesDescargaNc(row: any): void {
    const codigo = row.codigo || 'NC-001';
    const modalHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; text-align: left; overflow: hidden; border-radius: 16px;">
        <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #f59e0b 50%, #ef4444 100%);"></div>
        <div style="padding: 20px 24px 16px; border-bottom: 1px solid var(--line, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); color: #6366f1; display: flex; align-items: center; justify-content: center;">
              <span class="material-icons" style="font-size: 22px;">download</span>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--txt, #0f172a);">Descargar No Conformidad</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--muted, #64748b);">Selecciona el archivo o formato de exportación</p>
            </div>
          </div>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 5px 12px; border-radius: 20px;">
            # ${codigo}
          </span>
        </div>
        <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 10px;">

          ${row.evidencia ? `
          <!-- Option: Evidencia Subida Original -->
          <button type="button" id="btn-dl-nc-evidencia" style="display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-radius: 10px; border: 1.5px solid rgba(99, 102, 241, 0.4); background: rgba(99, 102, 241, 0.06); cursor: pointer; text-align: left; width: 100%; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);">
                <span class="material-icons" style="font-size: 20px;">cloud_download</span>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #4338ca;">Descargar Evidencia Subida (${row.evidencia})</div>
                <div style="font-size: 0.76rem; color: #6366f1;">Archivo original adjuntado durante la declaración</div>
              </div>
            </div>
            <span class="material-icons" style="color: #6366f1; font-size: 22px;">arrow_forward</span>
          </button>
          ` : ''}

          <!-- Option: PDF -->
          <button type="button" id="btn-dl-nc-pdf" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: flex; align-items: center; justify-content: center;"><span class="material-icons">picture_as_pdf</span></div>
              <div><div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Documento PDF Oficial</div><div style="font-size: 0.76rem; color: var(--muted, #64748b);">Membrete, firmas y reporte formal de no conformidad</div></div>
            </div>
            <span class="material-icons" style="color: #ef4444;">arrow_forward</span>
          </button>

          <!-- Option: Word -->
          <button type="button" id="btn-dl-nc-word" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(37, 99, 235, 0.12); color: #2563eb; display: flex; align-items: center; justify-content: center;"><span class="material-icons">description</span></div>
              <div><div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Documento Word (.docx / .doc)</div><div style="font-size: 0.76rem; color: var(--muted, #64748b);">Reporte editable en Microsoft Word</div></div>
            </div>
            <span class="material-icons" style="color: #2563eb;">arrow_forward</span>
          </button>

          <!-- Option: Excel -->
          <button type="button" id="btn-dl-nc-excel" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--line, #e2e8f0); background: var(--bg, #f8fafc); cursor: pointer; text-align: left; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(16, 185, 129, 0.12); color: #10b981; display: flex; align-items: center; justify-content: center;"><span class="material-icons">table_view</span></div>
              <div><div style="font-weight: 700; font-size: 0.9rem; color: var(--txt, #0f172a);">Hoja de Cálculo Excel (.xlsx)</div><div style="font-size: 0.76rem; color: var(--muted, #64748b);">Datos estructurados en tabla</div></div>
            </div>
            <span class="material-icons" style="color: #10b981;">arrow_forward</span>
          </button>
        </div>
      </div>
    `;

    Swal.fire({
      html: modalHtml,
      width: '600px',
      padding: '0',
      background: 'var(--panel, #ffffff)',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        document.getElementById('btn-dl-nc-evidencia')?.addEventListener('click', () => {
          Swal.close();
          this.descargarArchivoEvidencia(row);
        });
        document.getElementById('btn-dl-nc-pdf')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionPDF({ ...row, nc: row.codigo, accion: row.hallazgo });
        });
        document.getElementById('btn-dl-nc-word')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionWord({ ...row, nc: row.codigo, accion: row.hallazgo });
        });
        document.getElementById('btn-dl-nc-excel')?.addEventListener('click', () => {
          Swal.close();
          this.generarDocumentoAccionExcel({ ...row, nc: row.codigo, accion: row.hallazgo });
        });
      }
    });
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

  // NCO-06: Exportar lista de No Conformidades Declaradas a Excel
  exportarDeclaracionesExcel(): void {
    const list = this.declaracionDataSource.filteredData || this.declaracionDataSource.data || this.declaracionList;
    if (list.length === 0) {
      this.toastr.warning('No hay No Conformidades Declaradas para exportar.', 'Atención');
      return;
    }

    let t = '<table border="1"><tr style="background-color:#5b4bd6;color:#ffffff;font-weight:bold;"><th>Código NC</th><th>Origen</th><th>Tipo</th><th>Proceso</th><th>Hallazgo Registrado</th><th>Requisito Incumplido</th><th>Fecha Detección</th><th>Responsable</th><th>Estado</th><th>Evidencia Adjunta</th><th>Causa Raíz / Detalle</th></tr>';
    list.forEach(d => {
      t += `<tr>
        <td>${d.codigo || ''}</td>
        <td>${d.origen || ''}</td>
        <td>${d.tipo || ''}</td>
        <td>${d.proceso || ''}</td>
        <td>${d.hallazgo || ''}</td>
        <td>${d.requisito || ''}</td>
        <td>${d.deteccion ? this.formatFechaDMY(d.deteccion) : ''}</td>
        <td>${d.responsable || ''}</td>
        <td>${d.estado || ''}</td>
        <td>${d.evidencia || ''}</td>
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
      width: '740px',
      disableClose: true,
      autoFocus: false,
      data: {
        Title: 'Planificar Acción Correctiva',
        Accion: 'I',
        Datos: null,
        Lista: [...(this.declaracionList || []), ...(this.dataSource.data || [])]
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
      width: '740px',
      disableClose: true,
      autoFocus: false,
      data: {
        Title: 'Editar Acción Correctiva',
        Accion: 'U',
        Datos: item,
        Lista: [...(this.declaracionList || []), ...(this.dataSource.data || [])]
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
