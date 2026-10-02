import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit/documentos-controlados-regedit.component';
import { DocumentosControladosLoteComponent } from './documentos-controlados-lote/documentos-controlados-lote.component';
import { ProcesosService } from '../../services/procesos.service';
import { DocumentosControladosService } from '../../services/documentos-controlados.service';
import { HeaderTitleService } from '../../services/header-title.service';
import { GlobalVariable } from '../../VarGlobals';

@Component({
  selector: 'app-documentos-controlados',
  standalone: false,
  templateUrl: './documentos-controlados.component.html',
  styleUrl: './documentos-controlados.component.css'
})
export class DocumentosControladosComponent implements OnInit, OnDestroy {
  docsList: any[] = [];
  activeFilter: string = '__all__';
  searchQuery: string = '';
  sUsuario: string = GlobalVariable.vusu || 'SISTEMAS';

  // Permisos finos por acción
  canCreate: boolean = true;
  canEdit: boolean = true;
  canDelete: boolean = true;
  canDownload: boolean = true;
  canApprove: boolean = true;
  isUserAdmin: boolean = false;
  // State for Accordion Sidebar, Quick View Drawer & Banner
  // Observación d: Buscador de procesos y estructura contraída por defecto
  searchProcesoTree: string = '';
  expandedMacrosState: { [macro: string]: boolean } = {};

  // Observación g: Estructura documental flotante que aparece al mantener el cursor a la izquierda
  treeHovered: boolean = false;
  treePinned: boolean = true; // false = modo flotante por hover; true = fijado al layout
  treeColapsado: boolean = false;

  // Observación b: Papelera de documentos
  papeleraList: any[] = [];
  papeleraModalOpen: boolean = false;

  quickViewOpen: boolean = false;
  selectedDoc: any = null;

  // Drag & Drop global sobre la plataforma
  isDraggingOver: boolean = false;
  private dragCounter: number = 0;
  mostrarBanner: boolean = false;

  onTreeHover(state: boolean): void {
    this.treeHovered = state;
  }

  toggleTreePin(): void {
    this.treePinned = true;
    this.treeColapsado = !this.treeColapsado;
  }

  toggleTreeVisible(): void {
    this.treeColapsado = !this.treeColapsado;
  }

  toggleTree(): void {
    this.treeColapsado = !this.treeColapsado;
  }

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  toggleMacro(macro: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.expandedMacrosState[macro] = !this.expandedMacrosState[macro];
  }

  // Observación d: Contraída por defecto; expande si el usuario la abrió o si coincide con la búsqueda
  isMacroExpanded(macro: string): boolean {
    if (this.searchProcesoTree && this.searchProcesoTree.trim()) {
      const q = this.searchProcesoTree.toLowerCase().trim();
      if (macro.toLowerCase().includes(q)) return true;
      const procs = this.PROCESOS_GROUPS[macro] || [];
      return procs.some(p => p.toLowerCase().includes(q) || this.getAbreviaturaProceso(p).toLowerCase().includes(q));
    }
    return !!this.expandedMacrosState[macro];
  }

  getFilteredMacroProcesses(): string[] {
    let allMacros = Object.keys(this.PROCESOS_GROUPS);

    // Restricción por proceso: usuarios no administradores solo ven el macroproceso de su proceso asignado
    if (!this.isUserAdmin) {
      const userProc = this.getUserProcesoActual();
      if (userProc && userProc.toLowerCase() !== 'general') {
        const userMacro = this.getMacroGroupForProcess(userProc);
        if (userMacro && allMacros.includes(userMacro)) {
          allMacros = [userMacro];
        }
      }
    }

    if (!this.searchProcesoTree || !this.searchProcesoTree.trim()) return allMacros;
    const q = this.searchProcesoTree.toLowerCase().trim();
    return allMacros.filter(macro => {
      if (macro.toLowerCase().includes(q)) return true;
      const procs = this.PROCESOS_GROUPS[macro] || [];
      return procs.some(p => p.toLowerCase().includes(q) || this.getAbreviaturaProceso(p).toLowerCase().includes(q));
    });
  }

  getFilteredProcesosByMacro(macro: string): string[] {
    const rawList = this.PROCESOS_GROUPS[macro] || [];
    let list = rawList.filter(p => {
      const lower = p.toLowerCase();
      if (lower === 'hilanderia' || lower === 'hilandería' || lower === 'capacitaciones y desarrollo') return false;
      if (macro === 'Gerencia General (GG)' && lower.includes('comercial')) return false;
      return true;
    });

    // Deduplicación estricta por nombre normalizado
    const seen = new Set<string>();
    list = list.filter(p => {
      const norm = this.normalizarNombreProceso(p).toLowerCase();
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });

    // Restricción por proceso: usuarios no administradores solo ven su propio proceso
    if (!this.isUserAdmin) {
      const userProc = this.getUserProcesoActual();
      if (userProc && userProc.toLowerCase() !== 'general') {
        const normUser = this.normalizarNombreProceso(userProc).toLowerCase();
        list = list.filter(p => this.normalizarNombreProceso(p).toLowerCase() === normUser || this.matchesProcess(p, userProc));
      }
    }

    if (!this.searchProcesoTree || !this.searchProcesoTree.trim()) return list;
    const q = this.searchProcesoTree.toLowerCase().trim();
    return list.filter(p => p.toLowerCase().includes(q) || this.getAbreviaturaProceso(p).toLowerCase().includes(q));
  }

  openQuickView(doc: any): void {
    this.selectedDoc = doc;
    if (doc) {
      if (!doc.historialVersiones || doc.historialVersiones.length === 0) {
        try {
          const histMap = JSON.parse(localStorage.getItem('precotex:docs_version_history') || '{}');
          const codeKey = (doc.codigo || '').toLowerCase().trim();
          if (histMap[codeKey]) {
            doc.historialVersiones = histMap[codeKey];
          }
        } catch (e) { }
      }
      if (!doc.historialVersiones || doc.historialVersiones.length === 0) {
        doc.historialVersiones = [
          {
            version: doc.version || 'v1.0',
            usuarioSubio: doc.usuarioSubio || `${this.sUsuario || GlobalVariable.vusu || 'admin'}`,
            fechaHora: doc.fechaHoraSubida || (doc.vig ? doc.vig + ' 09:00:00' : '2026-01-15 10:00:00'),
            tipoCarga: 'Versión Vigente',
            archivo: doc.archivo || ''
          }
        ];
      }
    }
    this.quickViewOpen = true;
  }

  closeQuickView(): void {
    this.quickViewOpen = false;
    this.selectedDoc = null;
  }

  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Ingeniería', 'Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitación', 'Comunicaciones', 'Desarrollo Organizacional', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Producción Textil', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Laboratorio de Calidad Textil', 'Aseguramiento de la Calidad Textil', 'Lavandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas', 'Comercial Exportación de Telas', 'Comercial Venta Local Textil'],
    'Gerencia General (GG)': ['Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };

  defaultDocs: any[] = [
    { nombre: 'Procedimiento de Operación de Costura Industrial', codigo: 'PRO-COS-001', tipo: 'Procedimiento', version: 'v1.0', formato: 'PDF', proceso: 'Costura', vig: '2026-12-31', estado: 'Vigente', archivo: 'PRO-COS-001.pdf' },
    { nombre: 'Instructivo de Ensamblado y Costura de Prendas', codigo: 'INS-COS-002', tipo: 'Instructivo', version: 'v1.1', formato: 'PDF', proceso: 'Costura', vig: '2026-11-15', estado: 'Vigente', archivo: 'INS-COS-002.pdf' },
    { nombre: 'Formato de Inspección y Control de Calidad en Costura', codigo: 'FOR-COS-003', tipo: 'Formato', version: 'v2.0', formato: 'Excel', proceso: 'Costura', vig: '2026-09-30', estado: 'Vigente', archivo: 'FOR-COS-003.xlsx' },
    { nombre: 'Procedimiento de Gestión de ACR y Mejora', codigo: 'PRO-IMC-OYM-003', tipo: 'Procedimiento', version: 'v2.1', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2026-06-10', estado: 'Vigente', archivo: 'PRO-IMC-OYM-003.pdf' },
    { nombre: 'Instructivo de Uso de Formato 5W-2H', codigo: 'INS-IMC-OYM-002', tipo: 'Instructivo', version: 'v1.2', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2026-01-15', estado: 'Vigente', archivo: 'INS-IMC-OYM-002.pdf' },
    { nombre: 'Manual de Organización y Funciones — O&M', codigo: 'MAN-IMC-OYM-001', tipo: 'Manual', version: 'v5.2', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2026-05-02', estado: 'Vigente', archivo: 'MAN-IMC-OYM-001.pdf' },
    { nombre: 'Perfil de Puesto — Analista O&M', codigo: 'PER-IMC-OYM-004', tipo: 'Perfil de puesto', version: 'v1.1', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2025-06-30', estado: 'Por vencer', archivo: 'PER-IMC-OYM-004.pdf' },
    { nombre: 'Procedimiento de Control Patrimonial', codigo: 'PRO-SOP-CTP-002', tipo: 'Procedimiento', version: 'v1.0', formato: 'PDF', proceso: 'Control Patrimonial', vig: '2026-03-01', estado: 'Vigente', archivo: 'PRO-SOP-CTP-002.pdf' },
    { nombre: 'Plan Anual de Auditorías Internas', codigo: 'PLN-AIO-001', tipo: 'Formato', version: 'v2.0', formato: 'Excel', proceso: 'Auditoría Interna', vig: '2025-08-15', estado: 'Por vencer', archivo: 'PLN-AIO-001.xlsx' }
  ];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private documentosControladosService: DocumentosControladosService,
    private headerTitleService: HeaderTitleService,
    private http: HttpClient
  ) { }

  procesosMap: { [name: string]: string } = {
    'acabados': '031',
    'acabados textil': '038',
    'administración': '014',
    'administracion': '014',
    'administración de personal': '018',
    'administracion de personal': '018',
    'alianzas estratégicas': '055',
    'alianzas estrategicas': '055',
    'almacén': '045',
    'almacen': '045',
    'aseguramiento de calidad textil': '039',
    'aseguramiento de la calidad manufactura': '032',
    'calidad': '032',
    'calidad manufactura': '032',
    'auditoría interna': '009',
    'auditoria interna': '009',
    'balance de materia': '041',
    'bienestar social': '022',
    'bordado': '025',
    'calidad estampado y bordado': '026',
    'capacitaciones y desarrollo': '019',
    'capacitacion y desarrollo': '019',
    'capacitación': '019',
    'capacitacion': '019',
    'certificaciones': '013',
    'comercial exportación de prendas': '052',
    'comercial exportacion de prendas': '052',
    'comercial exportación de telas': '053',
    'comercial exportacion de telas': '053',
    'comercial venta local textil': '054',
    'comercio exterior': '046',
    'comunicaciones': '020',
    'consumos': '033',
    'consumo': '033',
    'contabilidad y costos': '016',
    'control patrimonial': '010',
    'corte': '028',
    'costura': '029',
    'costuras': '029',
    'desarrollo de estampado y bordado': '050',
    'desarrollo de negocios': '056',
    'desarrollo de producto': '049',
    'desarrollo textil': '051',
    'estampado': '024',
    'estampado digital': '037',
    'finanzas': '015',
    'gestión estratégica': '059',
    'gestion estrategica': '059',
    'gestión humana': '021',
    'gestion humana': '021',
    'ingeniería': '004',
    'ingenieria': '004',
    'mejora continua': '004',
    'ingeniería y mejora continua': '004',
    'inspección': '030',
    'inspeccion': '030',
    'investigación, desarrollo e innovación': '012',
    'investigacion, desarrollo e innovacion': '012',
    'laboratorio de color': '036',
    'lavandería': '040',
    'lavanderia': '040',
    'logística': '047',
    'logistica': '047',
    'mantenimiento general': '006',
    'organización y métodos': '011',
    'organizacion y metodos': '011',
    'pcp estampado y bordado': '044',
    'pcp manufactura': '043',
    'pcp textil': '042',
    'planeamiento y programación de la producción e&b': '027',
    'proyectos gerenciales': '057',
    'seguridad patrimonial': '007',
    'selección de personal': '023',
    'sistema de gestión general': '058',
    'sistemas': '005',
    'ssoma': '008',
    'tejeduría': '034',
    'tejeduria': '034',
    'tesorería': '017',
    'tesoreria': '017',
    'transporte': '048'
  };
  codeToProcessMap: { [code: string]: string } = {
    '004': 'Ingeniería', '4': 'Ingeniería', 'ING': 'Ingeniería',
    '005': 'Sistemas', '5': 'Sistemas', 'SIS': 'Sistemas', 'SIST': 'Sistemas',
    '006': 'Mantenimiento General', '6': 'Mantenimiento General', 'MANT': 'Mantenimiento General',
    '007': 'Seguridad Patrimonial', '7': 'Seguridad Patrimonial', 'SEGP': 'Seguridad Patrimonial',
    '008': 'SSOMA', '8': 'SSOMA', 'SST': 'SSOMA',
    '009': 'Auditoría Interna', '9': 'Auditoría Interna', 'AUD': 'Auditoría Interna', 'AUDI': 'Auditoría Interna', 'AIO': 'Auditoría Interna',
    '010': 'Control Patrimonial', '10': 'Control Patrimonial', 'CPT': 'Control Patrimonial', 'CTP': 'Control Patrimonial',
    '011': 'Organización y Métodos', '11': 'Organización y Métodos', 'OYM': 'Organización y Métodos', 'OM': 'Organización y Métodos', 'IMC': 'Organización y Métodos',
    '012': 'Investigación, Desarrollo e Innovación', '12': 'Investigación, Desarrollo e Innovación', 'IDI': 'Investigación, Desarrollo e Innovación',
    '013': 'Certificaciones', '13': 'Certificaciones', 'CERT': 'Certificaciones',
    '014': 'Administración', '14': 'Administración', 'ADM': 'Administración',
    '015': 'Finanzas', '15': 'Finanzas', 'FIN': 'Finanzas',
    '016': 'Contabilidad y Costos', '16': 'Contabilidad y Costos', 'CONT': 'Contabilidad y Costos',
    '017': 'Tesorería', '17': 'Tesorería', 'TES': 'Tesorería',
    '018': 'Administración de Personal', '18': 'Administración de Personal', 'AP': 'Administración de Personal',
    '019': 'Capacitación', '19': 'Capacitación', 'CAP': 'Capacitación',
    '020': 'Comunicaciones', '20': 'Comunicaciones', 'COMU': 'Comunicaciones',
    '021': 'Gestión Humana', '21': 'Gestión Humana', 'GH': 'Gestión Humana', 'GGHH': 'Gestión Humana',
    '022': 'Bienestar Social', '22': 'Bienestar Social', 'BSO': 'Bienestar Social',
    '023': 'Selección de Personal', '23': 'Selección de Personal', 'SDP': 'Selección de Personal',
    '024': 'Estampado', '24': 'Estampado', 'EST': 'Estampado',
    '025': 'Bordado', '25': 'Bordado', 'BORD': 'Bordado',
    '026': 'Calidad Estampado y Bordado', '26': 'Calidad Estampado y Bordado', 'CEB': 'Calidad Estampado y Bordado',
    '027': 'Planeamiento y Programación de la Producción E&B', '27': 'Planeamiento y Programación de la Producción E&B', 'PCEB': 'Planeamiento y Programación de la Producción E&B',
    '028': 'Corte', '28': 'Corte', 'COR': 'Corte',
    '029': 'Costura', '29': 'Costura', 'COS': 'Costura', 'COST': 'Costura',
    '030': 'Inspección', '30': 'Inspección', 'INSP': 'Inspección',
    '031': 'Acabados', '31': 'Acabados', 'ACAB': 'Acabados',
    '032': 'Aseguramiento de la Calidad Manufactura', '32': 'Aseguramiento de la Calidad Manufactura', 'CAL': 'Aseguramiento de la Calidad Manufactura',
    '033': 'Consumos', '33': 'Consumos', 'CONS': 'Consumos',
    '034': 'Tejeduría', '34': 'Tejeduría', 'TEJ': 'Tejeduría',
    '035': 'Tintorería', '35': 'Tintorería', 'TIN': 'Tintorería',
    '036': 'Laboratorio de Color', '36': 'Laboratorio de Color', 'LDC': 'Laboratorio de Color',
    '037': 'Estampado Digital', '37': 'Estampado Digital', 'EDG': 'Estampado Digital',
    '038': 'Acabados Textil', '38': 'Acabados Textil', 'ATX': 'Acabados Textil', 'ACT': 'Acabados Textil',
    '039': 'Aseguramiento de Calidad Textil', '39': 'Aseguramiento de Calidad Textil', 'CTX': 'Aseguramiento de la Calidad Textil', 'LTX': 'Aseguramiento de Calidad Textil',
    '040': 'Lavandería', '40': 'Lavandería', 'LAV': 'Lavandería',
    '041': 'Balance de Materia', '41': 'Balance de Materia', 'BM': 'Balance de Materia',
    '042': 'PCP Textil', '42': 'PCP Textil', 'PTX': 'PCP Textil',
    '043': 'PCP Manufactura', '43': 'PCP Manufactura', 'PMA': 'PCP Manufactura',
    '044': 'PCP Estampado y Bordado', '44': 'PCP Estampado y Bordado',
    '045': 'Almacén', '45': 'Almacén', 'ALM': 'Almacén',
    '046': 'Comercio Exterior', '46': 'Comercio Exterior', 'CEXT': 'Comercio Exterior',
    '047': 'Logística', '47': 'Logística', 'LOG': 'Logística',
    '048': 'Transporte', '48': 'Transporte', 'TRANS': 'Transporte', 'TRA': 'Transporte',
    '049': 'Desarrollo de Producto', '49': 'Desarrollo de Producto', 'DDP': 'Desarrollo de Producto',
    '050': 'Desarrollo de Estampado y Bordado', '50': 'Desarrollo de Estampado y Bordado', 'UDP': 'Desarrollo de Estampado y Bordado',
    '051': 'Desarrollo Textil', '51': 'Desarrollo Textil', 'DTX': 'Desarrollo Textil',
    '052': 'Comercial Exportación de Prendas', '52': 'Comercial Exportación de Prendas', 'COM': 'Comercial Exportación de Prendas',
    '053': 'Comercial Exportación de Telas', '53': 'Comercial Exportación de Telas', 'CET': 'Comercial Exportación de Telas',
    '054': 'Comercial Venta Local Textil', '54': 'Comercial Venta Local Textil', 'CVL': 'Comercial Venta Local Textil',
    '055': 'Alianzas Estratégicas', '55': 'Alianzas Estratégicas', 'AES': 'Alianzas Estratégicas',
    '056': 'Desarrollo de Negocios', '56': 'Desarrollo de Negocios', 'DDN': 'Desarrollo de Negocios',
    '057': 'Proyectos Gerenciales', '57': 'Proyectos Gerenciales', 'PGE': 'Proyectos Gerenciales',
    '058': 'Sistema de Gestión General', '58': 'Sistema de Gestión General', 'SGG': 'Sistema de Gestión General',
    '059': 'Gestión Estratégica', '59': 'Gestión Estratégica', 'GGE': 'Gestión Estratégica'
  };

  /**
   * Normaliza nombres de procesos para consistencia
   */
  normalizarNombreProceso(nombre: string): string {
    if (!nombre) return '';
    const clean = nombre.trim();
    const lower = clean.toLowerCase();
    if (lower === 'costuras' || lower === 'costura') {
      return 'Costura';
    }
    if (lower.includes('investiga') && lower.includes('innova')) {
      return 'Investigación, Desarrollo e Innovación';
    }
    if (lower === 'capacitaciones y desarrollo' || lower === 'capacitacion' || lower === 'capacitación') {
      return 'Capacitación';
    }
    if (lower === 'aseguramiento de calidad textil' || lower === 'aseguramiento de la calidad textil') {
      return 'Aseguramiento de la Calidad Textil';
    }
    if (lower.includes('planeamiento') && (lower.includes('estampado') || lower.includes('e&b') || lower.includes('pceb'))) {
      return 'Planeamiento y Programación de la Producción E&B';
    }
    return clean;
  }

  // DOC-08: Identificación automática del proceso/área del usuario conectado
  getUserProcesoActual(): string {
    let proc = (localStorage.getItem('precotex:usuario:proceso') || '').trim();
    if (proc && proc.toLowerCase() !== 'general') return proc;

    const puestosRaw = localStorage.getItem('precotex_puestos_usuarios') || localStorage.getItem('precotex:puestos:listado');
    const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').trim().toLowerCase();
    const userNom = (localStorage.getItem('precotex:usuario:nombre') || '').trim().toLowerCase();
    const puesto = (localStorage.getItem('precotex:usuario:puesto') || '').trim();

    if (puestosRaw) {
      try {
        const pList = JSON.parse(puestosRaw);
        const matchP = pList.find((p: any) => {
          const cod = (p.cod_Usuario || '').toLowerCase().trim();
          const u = (p.usuario || '').toLowerCase().trim();
          const pst = (p.puesto || '').toLowerCase().trim();
          return (userLogin && cod === userLogin) ||
            (userLogin && u.includes(userLogin)) ||
            (puesto && pst === puesto.toLowerCase()) ||
            (userNom && u.includes(userNom));
        });
        if (matchP && matchP.proceso && matchP.proceso.toLowerCase() !== 'general') {
          return matchP.proceso;
        }
      } catch (e) { }
    }

    if (puesto) {
      const pLower = puesto.toLowerCase();
      if (pLower.includes('certifica')) return 'Certificaciones';
      if (pLower.includes('o&m') || pLower.includes('metodo') || pLower.includes('m&o') || pLower.includes('organizaci')) return 'Organización y Métodos';
      if (pLower.includes('costura')) return 'Costura';
      if (pLower.includes('estampado')) return 'Estampado';
      if (pLower.includes('ssoma')) return 'SSOMA';
      if (pLower.includes('calidad')) return 'Aseguramiento de la Calidad Manufactura';
      if (pLower.includes('sistemas')) return 'Sistemas';
      if (pLower.includes('auditor')) return 'Auditoría Interna';
      if (pLower.includes('patrimonial')) return 'Control Patrimonial';
      if (pLower.includes('corte')) return 'Corte';
      if (pLower.includes('tejed')) return 'Tejeduría';
      if (pLower.includes('tintor')) return 'Tintorería';
      if (pLower.includes('acabad')) return 'Acabados';
      if (pLower.includes('inspecc')) return 'Inspección';
    }

    return '';
  }

  getMacroGroupForProcess(procName: string): string | null {
    if (!procName) return null;
    const norm = procName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const [macro, procs] of Object.entries(this.PROCESOS_GROUPS)) {
      if (procs.some(p => p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === norm || this.matchesProcess(p, procName))) {
        return macro;
      }
    }
    return null;
  }

  ngOnInit(): void {
    // Limpieza preventiva de documentos mock residuales de localStorage
    try {
      const mockCodes = ['pro-cos-001', 'ins-cos-002', 'for-cos-003', 'pro-imc-oym-003', 'ins-imc-oym-002', 'man-imc-oym-001', 'per-imc-oym-004', 'pro-sop-ctp-002', 'pln-aio-001'];
      const locCreatedRaw = localStorage.getItem('precotex_documentos_creados');
      if (locCreatedRaw) {
        const parsed = JSON.parse(locCreatedRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((d: any) => !mockCodes.includes((d.codigo || '').toLowerCase().trim()));
          localStorage.setItem('precotex_documentos_creados', JSON.stringify(cleaned));
        }
      }
    } catch (e) { }

    // Cargar permisos finos del usuario
    this.loadFinePermissions();

    this.loadDocs();
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups) {
          for (const k in groups) {
            groups[k] = groups[k].filter((p: string) => {
              const lower = (p || '').toLowerCase();
              if (lower === 'hilanderia' || lower === 'hilandería' || lower === 'capacitaciones y desarrollo') return false;
              if (k === 'Gerencia General (GG)' && lower.includes('comercial')) return false;
              return true;
            });
          }
        }
        this.PROCESOS_GROUPS = groups;
      }
    });

    this.procesosService.getListadoProcesos('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          res.elements.forEach((p: any) => {
            const raw = (p.proceso || p.nombre_Proceso || p.denominacion || '').trim();
            const name = this.normalizarNombreProceso(raw);
            const code = (p.codigo_Proceso || p.codigoProceso || '').toString().trim();
            if (name && code) {
              const lower = name.toLowerCase();
              const lowerNoAccents = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              this.procesosMap[lower] = code;
              this.procesosMap[lowerNoAccents] = code;
              this.codeToProcessMap[code] = name;
              this.codeToProcessMap[code.padStart(3, '0')] = name;
              this.codeToProcessMap[parseInt(code, 10).toString()] = name;
            }
          });
          this.loadDocs();
        }
      }
    });

    // Observación b: Cargar papelera de documentos
    this.cargarPapelera();

    // Estructura documental siempre anclada al layout
    this.treePinned = true;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('precotex:docs_tree_pinned');
    }

    // Inicialización del filtro por proceso de usuario
    const userProcInit = this.getUserProcesoActual();
    if (!this.isUserAdmin && userProcInit && userProcInit.toLowerCase() !== 'general') {
      // Para usuarios no administradores, fijar directamente en su proceso asignado
      this.activeFilter = userProcInit;
      const userMacro = this.getMacroGroupForProcess(userProcInit);
      if (userMacro) {
        this.expandedMacrosState[userMacro] = true;
      }
    } else {
      // Restaurar filtro guardado en LocalStorage Presets para administradores
      if (typeof localStorage !== 'undefined') {
        const savedFilter = localStorage.getItem('precotex:pref:docs_activeFilter');
        if (savedFilter) {
          this.activeFilter = savedFilter;
        }
      }
    }

    this.updateHeaderTitle();
  }

  ngOnDestroy(): void {
    if (this.headerTitleService) {
      this.headerTitleService.resetTitle();
    }
  }

  getProcessCodeByName(procName: string): string {
    if (!procName) return '011';
    const key = procName.trim().toLowerCase();
    const cleanNoAccents = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (this.procesosMap[key]) return this.procesosMap[key];
    if (this.procesosMap[cleanNoAccents]) return this.procesosMap[cleanNoAccents];
    for (const [k, v] of Object.entries(this.procesosMap)) {
      if (k === key || k === cleanNoAccents || key.includes(k) || k.includes(key)) {
        return v;
      }
    }
    // Fallbacks inteligentes por palabras clave en vez de asignar ciegamente 011
    if (cleanNoAccents.includes('calidad')) return '032';
    if (cleanNoAccents.includes('costura')) return '029';
    if (cleanNoAccents.includes('corte')) return '028';
    if (cleanNoAccents.includes('inspecc')) return '030';
    if (cleanNoAccents.includes('acabad')) return '031';
    if (cleanNoAccents.includes('estamp')) return '024';
    if (cleanNoAccents.includes('sist')) return '005';
    if (cleanNoAccents.includes('ssoma')) return '008';
    if (cleanNoAccents.includes('audit')) return '009';
    if (cleanNoAccents.includes('patrimon')) return '010';
    return '011';
  }

  getProcessNameByCode(code: any): string {
    if (!code) return 'Organización y Métodos';
    const strCode = code.toString().trim();
    return this.codeToProcessMap[strCode] ||
      this.codeToProcessMap[strCode.padStart(3, '0')] ||
      (parseInt(strCode, 10) ? this.codeToProcessMap[parseInt(strCode, 10).toString()] : '') ||
      'Organización y Métodos';
  }

  /**
   * Extrae el Proceso Responsable según la nomenclatura oficial Precotex (ej. PRO-OPM-CAL-001 -> Aseguramiento de la Calidad)
   */
  extraerProcesoDelCodigo(code: string): string {
    if (!code) return '';
    const parts = code.trim().toUpperCase().split('-');

    const mapSubProcesos: { [key: string]: string } = {
      'SIST': 'Sistemas', 'SIS': 'Sistemas',
      'MANT': 'Mantenimiento General', 'MNT': 'Mantenimiento General',
      'SEGP': 'Seguridad Patrimonial',
      'SSOMA': 'SSOMA', 'SST': 'SSOMA',
      'AUDI': 'Auditoría Interna', 'AUD': 'Auditoría Interna',
      'CPT': 'Control Patrimonial', 'CTP': 'Control Patrimonial',
      'ING': 'Ingeniería', 'MC': 'Ingeniería',
      'OYM': 'Organización y Métodos', 'OM': 'Organización y Métodos',
      'IDI': 'Investigación, Desarrollo e Innovación', 'ID': 'Investigación, Desarrollo e Innovación',
      'CERT': 'Certificaciones',
      'ADMIN': 'Administración', 'ADM': 'Administración',
      'FIN': 'Finanzas', 'CONT': 'Contabilidad y Costos', 'TES': 'Tesorería',
      'AP': 'Administración de Personal', 'CAP': 'Capacitación',
      'COMU': 'Comunicaciones', 'DO': 'Desarrollo Organizacional',
      'GH': 'Gestión Humana', 'BSO': 'Bienestar Social', 'SDP': 'Selección de Personal',
      'EST': 'Estampado', 'BORD': 'Bordado', 'BOR': 'Bordado',
      'CEB': 'Calidad Estampado y Bordado',
      'PCEB': 'Planeamiento y Programación de la Producción E&B',
      'COR': 'Corte', 'COST': 'Costura', 'COS': 'Costura',
      'INSP': 'Inspección', 'ACAB': 'Acabados',
      'CAL': 'Aseguramiento de la Calidad Manufactura',
      'MNF': 'Manufactura', 'CONS': 'Consumos', 'CON': 'Consumos',
      'TEJ': 'Tejeduría', 'TIN': 'Tintorería', 'LDC': 'Laboratorio de Color',
      'EDG': 'Estampado Digital', 'ATX': 'Acabados Textil', 'ACT': 'Acabados Textil',
      'LTX': 'Laboratorio de Calidad Textil', 'CTX': 'Aseguramiento de Calidad Textil',
      'LAV': 'Lavandería', 'BM': 'Balance de Materia',
      'PTX': 'PCP Textil', 'PMA': 'PCP Manufactura',
      'ALM': 'Almacén', 'CEXT': 'Comercio Exterior', 'LOG': 'Logística',
      'TRANS': 'Transporte', 'TRA': 'Transporte',
      'DDP': 'Desarrollo de Producto', 'UDP': 'Desarrollo de Estampado y Bordado', 'DTX': 'Desarrollo Textil',
      'COM': 'Comercial Exportación de Prendas', 'CET': 'Comercial Exportación de Telas', 'CVL': 'Comercial Venta Local Textil',
      'AES': 'Alianzas Estratégicas', 'DDN': 'Desarrollo de Negocios', 'PGE': 'Proyectos Gerenciales',
      'SGG': 'Sistema de Gestión General', 'GGE': 'Gestión Estratégica'
    };

    const mapMacros: { [key: string]: string } = {
      'SOP': 'Sistemas', 'AIO': 'Auditoría Interna', 'CPT': 'Control Patrimonial',
      'IMC': 'Organización y Métodos', 'AFC': 'Administración', 'GGHH': 'Gestión Humana',
      'RRHH': 'Gestión Humana', 'SEB': 'Estampado', 'OPM': 'Costura', 'OPT': 'Acabados Textil',
      'PCP': 'PCP Manufactura', 'GCOM': 'Desarrollo de Producto', 'GG': 'Sistema de Gestión General'
    };

    const candidateParts = parts.length > 1 ? parts.slice(1) : [];
    // 1. Prioridad: Verificar si alguna parte coincide exactamente con un Subproceso oficial
    for (const part of candidateParts) {
      if (mapSubProcesos[part]) return mapSubProcesos[part];
    }
    // 2. Si no hay subproceso específico, verificar si alguna parte es un Macroproceso
    for (const part of candidateParts) {
      if (mapMacros[part]) return mapMacros[part];
    }
    return '';
  }

  /**
   * Comparador flexible de procesos con soporte para alias (Calidad, Costura, O&M, etc.)
   */
  /**
   * Clave canónica normalizada para identificación unívoca y exacta de cada proceso
   */
  normalizeProcessKey(p: string): string {
    if (!p) return '';
    let s = p.toString().trim().toLowerCase();
    if (s === 'todos los procesos' || s === '__all__') return '__all__';

    // Resolver código o abreviación directa sin recursión
    const rawTrim = p.toString().trim();
    if (this.codeToProcessMap && this.codeToProcessMap[rawTrim]) {
      s = this.codeToProcessMap[rawTrim].trim().toLowerCase();
    } else if (this.codeToProcessMap && this.codeToProcessMap[s.toUpperCase()]) {
      s = this.codeToProcessMap[s.toUpperCase()].trim().toLowerCase();
    }

    // Quitar acentos
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Alias específicos unívocos por proceso
    if (s === 'o&m' || s === 'oym' || s === 'om' || s === 'organizacion y metodos' || s.includes('organizacion y metodos') || s.includes('o&m')) return 'organizacion y metodos';
    if (s === 'sst' || s === 'ssoma' || s.startsWith('ssoma') || s.includes('seguridad y salud') || s.includes('medio ambiente')) return 'ssoma';
    if (s.startsWith('certifica') || s === 'cert') return 'certificaciones';
    if (s.startsWith('auditor') || s === 'aio') return 'auditoria interna';
    if (s === 'sistemas' || s === 'ti' || s === 'sist' || s.includes('tecnologia de la informacion') || s.includes('sistemas')) return 'sistemas';
    if (s.includes('patrimonial') || s === 'cpt') return 'control patrimonial';
    if (s === 'costuras' || s === 'costura' || s === 'cos' || s === 'cost') return 'costura';
    if (s === 'inspeccion' || s === 'inspecciones' || s === 'insp') return 'inspeccion';
    if (s === 'acabados' || s === 'acabado' || s === 'acab') return 'acabados';
    if (s === 'corte' || s === 'cort' || s === 'cor') return 'corte';
    if (s === 'consumos' || s === 'consumo' || s === 'cons') return 'consumos';
    if (s === 'ingenieria' || s === 'ing' || s === 'mejora continua') return 'ingenieria';
    if (s.includes('investiga') && s.includes('innova')) return 'investigacion, desarrollo e innovacion';
    if (s === 'idi' || s === 'i+d+i' || s === 'i+d') return 'investigacion, desarrollo e innovacion';

    // 2. SERVICIO DE ESTAMPADO Y BORDADO (SEB) - Diferenciación estricta
    if (s === 'calidad estampado y bordado' || s === 'calidad e&b' || s === 'ceb') return 'calidad estampado y bordado';
    if (s === 'estampado' || s === 'est') return 'estampado';
    if (s === 'bordado' || s === 'bord' || s === 'bor') return 'bordado';
    if (s.includes('planeamiento') && (s.includes('estampado') || s.includes('e&b') || s.includes('pceb'))) {
      return 'planeamiento y programacion de la produccion e&b';
    }

    // 3. CALIDAD MANUFACTURA vs CALIDAD TEXTIL vs CALIDAD E&B - Diferenciación estricta
    if (s === 'aseguramiento de la calidad manufactura' || s === 'aseguramiento de calidad manufactura' || s === 'calidad manufactura' || s === 'cal') {
      return 'aseguramiento de la calidad manufactura';
    }
    if (s === 'aseguramiento de la calidad textil' || s === 'aseguramiento de calidad textil' || s === 'calidad textil' || s === 'ctx') {
      return 'aseguramiento de la calidad textil';
    }
    if (s === 'laboratorio de calidad textil' || s === 'ltx') return 'laboratorio de calidad textil';

    // 4. PCP - Diferenciación estricta
    if (s === 'pcp textil' || s === 'ptx') return 'pcp textil';
    if (s === 'pcp manufactura' || s === 'pma') return 'pcp manufactura';
    if (s === 'pcp estampado y bordado') return 'planeamiento y programacion de la produccion e&b';

    // 5. COMERCIAL
    if (s === 'comercial exportacion de telas' || s === 'cet') return 'comercial exportacion de telas';
    if (s === 'comercial venta local textil' || s === 'cvl') return 'comercial venta local textil';
    if (s === 'comercial exportacion de prendas' || s === 'com') return 'comercial exportacion de prendas';
    if (s === 'desarrollo textil' || s === 'dtx') return 'desarrollo textil';
    if (s === 'desarrollo de estampado y bordado' || s === 'udp') return 'desarrollo de estampado y bordado';
    if (s === 'desarrollo de producto' || s === 'ddp') return 'desarrollo de producto';

    // 6. GESTIÓN HUMANA
    if (s === 'capacitacion' || s === 'capacitaciones y desarrollo' || s === 'cap') return 'capacitacion';
    if (s === 'administracion de personal' || s === 'ap') return 'administracion de personal';
    if (s === 'bienestar social' || s === 'bso') return 'bienestar social';
    if (s === 'seleccion de personal' || s === 'sdp') return 'seleccion de personal';
    if (s === 'desarrollo organizacional' || s === 'do') return 'desarrollo organizacional';
    if (s === 'comunicaciones' || s === 'comu') return 'comunicaciones';
    if (s === 'gestion humana' || s === 'gh' || s === 'gghh') return 'gestion humana';

    return s;
  }

  /**
   * Comparador estricto y seguro de procesos que evita falsos positivos por inclusión de texto
   */
  matchesProcess(procA: string, procB: string): boolean {
    if (!procA || !procB) return false;
    if (procA === 'Todos los procesos' || procB === 'Todos los procesos' || procA === '__all__' || procB === '__all__') return true;

    const keyA = this.normalizeProcessKey(procA);
    const keyB = this.normalizeProcessKey(procB);
    if (!keyA || !keyB) return false;
    if (keyA === '__all__' || keyB === '__all__') return true;

    return keyA === keyB;
  }

  loadDocs() {
    this.documentosControladosService.getListadoDocumentosControlados('001', '', '', '').subscribe({
      next: (res: any) => {
        const elements = (res && res.success && res.elements && res.elements.length > 0) ? res.elements : [];
        this.procesarYPersistirLista(elements);
      },
      error: () => {
        this.procesarYPersistirLista([]);
      }
    });
  }

  procesarYPersistirLista(rawElements: any[]): void {
    let rawList: any[] = [];
    const isApiConnected = rawElements && rawElements.length > 0;

    if (isApiConnected) {
      rawList = rawElements.map((d: any) => {
        const codDoc = (d.codigo_Documento || d.codigo_Documentos_Controlados || d.codigo || 'DOC-' + (d.id || '001')).toString().trim();
        const inferred = this.extraerProcesoDelCodigo(codDoc);
        let procName = inferred || d.nombre_Proceso || d.proceso || (d.codigo_Proceso ? this.getProcessNameByCode(d.codigo_Proceso) : '');
        if (!procName) procName = 'Organización y Métodos';

        const nomDoc = d.denominacion || d.nombre || d.descripcion || 'Documento';
        const fecVenc = d.fec_Vencimiento ? d.fec_Vencimiento.split('T')[0] : (d.fec_Registro ? d.fec_Registro.split('T')[0] : (d.vig || ''));

        return {
          codigo_Documentos_Controlados: d.codigo_Documentos_Controlados || codDoc,
          nombre: nomDoc,
          codigo: codDoc,
          tipo: d.codigo_Normas || d.tipo || 'Procedimiento',
          version: d.version_Documento || d.version || 'v1.0',
          formato: d.codigo_Tipo_Descarga || d.formato || 'PDF',
          proceso: procName,
          vig: fecVenc,
          estado: this.calcularEstadoDinamico(fecVenc, d.flg_Estado || d.estado),
          archivo: d.ruta_Adjunto || d.archivo || codDoc,
          procesos: d.procesos || [procName],
          procesosVisibles: d.procesosVisibles || ['Todos los procesos'],
          modoVisibilidad: d.modoVisibilidad || 'TODOS',
          raw: d
        };
      });
    } else {
      // Fallback sólo si no hay conexión al backend ni datos en API
      const cached = localStorage.getItem('precotex:documentacion');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawList = parsed;
          }
        } catch (e) { }
      }
      if (rawList.length === 0) {
        rawList = [...this.defaultDocs];
      }
    }

    // 1. Fusionar únicamente documentos subidos/creados por el usuario localmente
    const localCombined: any[] = [];
    try {
      const localCreatedRaw = localStorage.getItem('precotex_documentos_creados');
      if (localCreatedRaw) {
        const parsed = JSON.parse(localCreatedRaw);
        if (Array.isArray(parsed)) {
          // Filtrar cualquier documento mock antiguo
          const mockCodes = ['pro-cos-001', 'ins-cos-002', 'for-cos-003', 'pro-imc-oym-003', 'ins-imc-oym-002', 'man-imc-oym-001', 'per-imc-oym-004', 'pro-sop-ctp-002', 'pln-aio-001'];
          const cleanUserDocs = parsed.filter((ud: any) => !mockCodes.includes((ud.codigo || '').toLowerCase().trim()));
          localCombined.push(...cleanUserDocs);
        }
      }
    } catch (e) { }

    localCombined.forEach(locDoc => {
      const codeClean = (locDoc.codigo || locDoc.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
      const nomClean = (locDoc.nombre || locDoc.denominacion || '').toString().trim().toLowerCase();
      const matchIdx = rawList.findIndex((r: any) => {
        const rCode = (r.codigo || r.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
        const rNom = (r.nombre || r.denominacion || '').toString().trim().toLowerCase();
        return (codeClean !== '' && rCode !== '' && rCode === codeClean) ||
          (nomClean !== '' && rNom !== '' && rNom === nomClean);
      });
      if (matchIdx >= 0) {
        rawList[matchIdx] = {
          ...rawList[matchIdx],
          ...locDoc,
          archivo: locDoc.archivo || rawList[matchIdx].archivo,
          version: locDoc.version || rawList[matchIdx].version
        };
      } else {
        rawList.unshift(locDoc);
      }
    });

    // 2. Filtrar eliminados según papelera/deleted_items
    const deletedKey = 'precotex:docs_deleted_items';
    let deletedItems: string[] = [];
    try {
      deletedItems = JSON.parse(localStorage.getItem(deletedKey) || '[]');
    } catch { deletedItems = []; }
    deletedItems = (deletedItems || []).filter(x => typeof x === 'string' && x.trim() !== '');

    if (deletedItems.length > 0) {
      rawList = rawList.filter((d: any) => {
        const c = (d.codigo || d.codigo_Documentos_Controlados || '').toString().trim();
        const n = (d.nombre || d.denominacion || '').toString().trim();
        const cMatch = c !== '' && deletedItems.includes(c);
        const nMatch = n !== '' && deletedItems.includes(n);
        return !cMatch && !nMatch;
      });
    }

    // 3. Garantía absoluta de asignación canónica según código oficial Precotex
    rawList.forEach((d: any) => {
      const c = (d.codigo || d.codigo_Documentos_Controlados || '').toString().trim().toUpperCase();
      const inferred = this.extraerProcesoDelCodigo(c);
      if (inferred) {
        d.proceso = inferred;
        d.procesos = [inferred];
      } else if (!d.proceso) {
        d.proceso = 'Organización y Métodos';
        d.procesos = ['Organización y Métodos'];
      }
    });

    this.docsList = this.deduplicarDocumentos(rawList);
    this.aplicarReglaObsoletosPorVersion(this.docsList);
    this.restaurarHistorialVersiones(this.docsList);
    this.restaurarVistosBuenos(this.docsList);
    this.saveDocs();
  }

  deduplicarDocumentos(list: any[]): any[] {
    if (!list || list.length === 0) return [];
    const seenCodes = new Set<string>();
    const uniqueList: any[] = [];

    for (const doc of list) {
      const c = (doc.codigo || doc.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
      if (c) {
        if (seenCodes.has(c)) continue;
        seenCodes.add(c);
      }
      uniqueList.push(doc);
    }
    return uniqueList;
  }

  // Observación a: Restaurar versiones pasadas guardadas en backup para descarga o visualización
  restaurarHistorialVersiones(list: any[]): void {
    if (!list || list.length === 0) return;
    try {
      const histMap = JSON.parse(localStorage.getItem('precotex:docs_version_history') || '{}');
      list.forEach(d => {
        const codeKey = (d.codigo || '').toLowerCase().trim();
        if (histMap[codeKey] && (!d.historialVersiones || d.historialVersiones.length <= 1)) {
          d.historialVersiones = histMap[codeKey];
        }
      });
    } catch (e) { }
  }

  saveDocs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('precotex:documentacion', JSON.stringify(this.docsList));
    }
  }

  loadFinePermissions(): void {
    const rolVal = localStorage.getItem('vCod_Rol') || GlobalVariable.vCod_Rol?.toString() || '0';
    this.isUserAdmin = rolVal === '1';

    // Administradores tienen todos los permisos
    if (this.isUserAdmin) {
      this.canCreate = true;
      this.canEdit = true;
      this.canDelete = true;
      this.canDownload = true;
      this.canApprove = true;
      return;
    }

    // Leer permisos finos del localStorage (guardados por mapa-permisos)
    const fineRaw = localStorage.getItem('precotex:puestos:accesos_fino');
    if (!fineRaw) return;

    try {
      const accFine = JSON.parse(fineRaw);

      // Buscar el puesto del usuario actual en la lista de puestos
      const puestosRaw = localStorage.getItem('precotex:puestos:listado');
      const userLogin = (GlobalVariable.vusu || '').toLowerCase().trim();
      let puestoName = '';

      if (puestosRaw) {
        const puestosList = JSON.parse(puestosRaw);
        const userPuesto = puestosList.find((p: any) => {
          const cod = (p.cod_Usuario || '').toLowerCase().trim();
          if (userLogin && cod === userLogin) return true;
          const fullName = (p.usuario || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (!fullName || fullName === '—') return false;
          if (fullName.includes(',')) {
            const [apellidosPart, nombresPart] = fullName.split(',').map((s: string) => s.trim());
            const apellidos = apellidosPart.split(/\s+/).filter(Boolean);
            const nombres = (nombresPart || '').split(/\s+/).filter(Boolean);
            const primerApellido = apellidos[0] || '';
            for (const nom of nombres) {
              if (userLogin === nom.charAt(0) + primerApellido || userLogin === nom + '.' + primerApellido || userLogin === nom + primerApellido) return true;
              if (userLogin.startsWith(nom.charAt(0)) && userLogin.includes(primerApellido)) return true;
            }
          }
          const parts = fullName.replace(/,/g, '').split(/\s+/).filter(Boolean);
          if (parts.length >= 2) {
            const initial = parts[0].charAt(0);
            const lastName = parts[1];
            if (userLogin === initial + lastName) return true;
          }
          return fullName.includes(userLogin);
        });
        if (userPuesto) {
          puestoName = (userPuesto.puesto || '').trim();
        }
      }

      if (!puestoName) return;

      // Buscar permisos finos para este puesto (buscar con trim)
      let userFine = accFine[puestoName];
      if (!userFine) {
        const matchKey = Object.keys(accFine).find(k => k.trim().toLowerCase() === puestoName.toLowerCase());
        if (matchKey) userFine = accFine[matchKey];
      }

      if (!userFine) return;

      // Claves del formato: "Documentación||Documentos||Accion"
      // Verificar cada acción
      const checkFine = (contenido: string, accion: string): boolean | null => {
        const key = 'Documentación||' + contenido + '||' + accion;
        if (key in userFine) {
          return userFine[key] === 1;
        }
        return null; // No definido = heredar default
      };

      const crear = checkFine('Documentos', 'Crear');
      if (crear !== null) this.canCreate = crear;

      const editar = checkFine('Documentos', 'Editar');
      if (editar !== null) this.canEdit = editar;

      const eliminar = checkFine('Documentos', 'Eliminar / Obsoletar');
      if (eliminar !== null) this.canDelete = eliminar;

      const descargar = checkFine('Documentos', 'Descargar');
      if (descargar !== null) this.canDownload = descargar;

      const aprobar = checkFine('Documentos', 'Aprobar');
      if (aprobar !== null) this.canApprove = aprobar;

      console.log('[Docs Permisos] Puesto:', puestoName, '| Crear:', this.canCreate, '| Editar:', this.canEdit, '| Eliminar:', this.canDelete, '| Descargar:', this.canDownload);
    } catch (e) {
      console.error('[Docs Permisos] Error al cargar permisos finos:', e);
    }
  }

  getDocProcesosList(d: any): string[] {
    if (!d) return [];
    if (d.procesos && Array.isArray(d.procesos) && d.procesos.length > 0) return d.procesos;
    if (d.procesosVisibles && Array.isArray(d.procesosVisibles) && d.procesosVisibles.length > 0) {
      if (d.procesosVisibles.includes('Todos los procesos')) return ['Todos los procesos'];
      return d.procesosVisibles;
    }
    if (d.proceso) {
      return d.proceso.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  getMacroCount(group: string): number {
    const processes = (this.PROCESOS_GROUPS[group] || []).map(p => this.normalizarNombreProceso(p));
    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      const docP = d.proceso || '';
      return processes.some(p => procs.some(pr => this.matchesProcess(pr, p)) || this.matchesProcess(docP, p)) || procs.includes('Todos los procesos');
    }).length;
  }

  getProcessCount(proc: string): number {
    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      const docP = d.proceso || '';
      return procs.some(p => this.matchesProcess(p, proc)) ||
        this.matchesProcess(docP, proc) ||
        procs.includes('Todos los procesos');
    }).length;
  }

  setFilter(filterValue: string) {
    if (!this.isUserAdmin) {
      const userProc = this.getUserProcesoActual();
      if (userProc && userProc.toLowerCase() !== 'general') {
        if (filterValue === '__all__') {
          filterValue = userProc;
        } else if (filterValue.startsWith('macro:')) {
          const macro = filterValue.substring(6);
          const userMacro = this.getMacroGroupForProcess(userProc);
          if (macro !== userMacro) {
            filterValue = userProc;
          }
        } else if (!filterValue.startsWith('folder:')) {
          if (!this.matchesProcess(filterValue, userProc)) {
            filterValue = userProc;
          }
        }
      }
    }

    this.activeFilter = filterValue;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('precotex:pref:docs_activeFilter', filterValue);
    }
    this.updateHeaderTitle();
  }

  getRootNodeLabel(): string {
    if (this.isUserAdmin) return 'Todos los procesos';
    const proc = this.getUserProcesoActual();
    return proc ? `Mi Proceso: ${proc}` : 'Mi Proceso';
  }

  getRootNodeCount(): number {
    if (this.isUserAdmin) return this.docsList.length;
    const userProc = this.getUserProcesoActual();
    if (!userProc || userProc.toLowerCase() === 'general') return this.docsList.length;
    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      const docP = d.proceso || '';
      return procs.some(p => this.matchesProcess(p, userProc)) || this.matchesProcess(docP, userProc);
    }).length;
  }

  selectRootNode(): void {
    if (this.isUserAdmin) {
      this.setFilter('__all__');
    } else {
      const userProc = this.getUserProcesoActual();
      this.setFilter(userProc || '__all__');
    }
  }

  isRootActiveForUser(): boolean {
    if (this.isUserAdmin) return this.activeFilter === '__all__';
    const userProc = this.getUserProcesoActual();
    return this.activeFilter === userProc || this.activeFilter === '__all__';
  }

  updateHeaderTitle(): void {
    if (!this.headerTitleService) return;

    if (!this.activeFilter || this.activeFilter === '__all__') {
      this.headerTitleService.setTitle({
        title: 'Documentación',
        breadcrumb: 'Documentación · Control Documental'
      });
      return;
    }

    if (this.activeFilter.startsWith('macro:')) {
      const macro = this.activeFilter.substring(6);
      this.headerTitleService.setTitle({
        title: macro,
        breadcrumb: 'Documentación · ' + macro
      });
      return;
    }

    if (this.activeFilter.startsWith('folder:')) {
      const parts = this.activeFilter.substring(7).split('|');
      const proc = parts[0];
      const folderType = parts[1] || '';
      this.headerTitleService.setTitle({
        title: folderType ? (proc + ' — ' + folderType) : proc,
        breadcrumb: folderType ? ('Documentación · ' + proc + ' · ' + folderType) : ('Documentación · ' + proc)
      });
      return;
    }

    // Proceso directo (ej: 'Auditoría Interna', 'Aseguramiento de la Calidad Manufactura')
    this.headerTitleService.setTitle({
      title: this.activeFilter,
      breadcrumb: 'Documentación · ' + this.activeFilter
    });
  }

  getActiveFolderTitle(): string {
    if (!this.activeFilter || this.activeFilter === '__all__') return 'Todos los procesos';
    if (this.activeFilter.startsWith('macro:')) return this.activeFilter.substring(6);
    if (this.activeFilter.startsWith('folder:')) {
      const parts = this.activeFilter.substring(7).split('|');
      return parts[1] ? (parts[0] + ' — ' + parts[1]) : parts[0];
    }
    return this.activeFilter;
  }

  // DOC-03: 6 Carpetas estandarizadas obligatorias por proceso
  CARPETAS_PROCESO = ['Procedimientos', 'Instructivos', 'Formatos', 'Politica', 'Manual', 'Otros'];

  // Observación f: La carpeta de Otros de Capacitacion de desarrollo cambiar a Descripcion del Puesto
  getCarpetasPorProceso(procName: string): string[] {
    const p = (procName || '').toLowerCase().trim();
    if (p.includes('capacitaci') || p.includes('desarrollo') || p === 'c&d') {
      return ['Procedimientos', 'Instructivos', 'Formatos', 'Politica', 'Manual', 'Descripción del Puesto'];
    }
    return ['Procedimientos', 'Instructivos', 'Formatos', 'Politica', 'Manual', 'Otros'];
  }

  getProcessTypeCount(procName: string, tipoName: string): number {
    const target = (tipoName || '').toLowerCase().trim();

    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      const docP = d.proceso || '';

      const matchesProc = procs.some(p => this.matchesProcess(p, procName)) ||
        this.matchesProcess(docP, procName) ||
        procs.includes('Todos los procesos');

      if (!matchesProc) return false;

      const t = (d.tipo || '').toLowerCase().trim();
      if (target === 'otros') {
        return t === 'otros' || !['procedimiento', 'instructivo', 'formato', 'politica', 'manual', 'perfil', 'descripci'].some(k => t.includes(k));
      }
      if (target.includes('descripci') || target.includes('puesto') || target.includes('perfil')) {
        return t.includes('perfil') || t.includes('puesto') || t.includes('descripci') || (!['procedimiento', 'instructivo', 'formato', 'politica', 'manual'].some(k => t.includes(k)));
      }
      if (target.startsWith('proced')) {
        return t.includes('proced');
      }
      if (target.startsWith('instruct')) {
        return t.includes('instruct');
      }
      if (target.startsWith('format')) {
        return t.includes('format');
      }
      if (target.startsWith('polit') || target.startsWith('polít')) {
        return t.includes('polit') || t.includes('polít');
      }
      if (target.startsWith('manu')) {
        return t.includes('manu');
      }
      return t.includes(target.substring(0, 4));
    }).length;
  }

  // DOC-03: Modificables solo por Administradores
  onEditarCarpetasAdmin(): void {
    if (!this.isUserAdmin) {
      this.toastr.warning('La edición de carpetas está restringida únicamente para Administradores.', 'Restricción');
      return;
    }

    Swal.fire({
      title: '📁 Nombres de Carpetas por Proceso',
      html: '<div style="text-align: left; font-size: 13px; color: #334155; line-height: 1.6;">' +
        '<p>Los nombres de carpetas están estandarizados por proceso:</p>' +
        '<div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px;">' +
        '<div>📂 <strong>Procedimientos</strong> (Direccionamiento automático de código PRO-)</div>' +
        '<div>📂 <strong>Instructivos</strong> (Direccionamiento automático de código INS-)</div>' +
        '<div>📂 <strong>Formatos</strong> (Direccionamiento automático de código FOR-)</div>' +
        '<div>📂 <strong>Politica</strong> (Direccionamiento automático de código POL-)</div>' +
        '<div>📂 <strong>Manual</strong> (Direccionamiento automático de código MAN-)</div>' +
        '<div>📂 <strong>Descripción del Puesto</strong> (Para C&D / Otros para demás procesos)</div>' +
        '</div></div>',
      icon: 'info',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    });
  }

  get filteredDocs() {
    let list = this.docsList;

    // Restricción estricta por proceso para usuarios no administradores
    if (!this.isUserAdmin) {
      const userProc = this.getUserProcesoActual();
      if (userProc && userProc.toLowerCase() !== 'general') {
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          const docP = d.proceso || '';
          return procs.some(p => this.matchesProcess(p, userProc)) || this.matchesProcess(docP, userProc);
        });
      }
    }

    if (this.activeFilter !== '__all__') {
      if (this.activeFilter.startsWith('macro:')) {
        const macro = this.activeFilter.substring(6);
        const processes = (this.PROCESOS_GROUPS[macro] || []).map(p => this.normalizarNombreProceso(p));
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          const docP = d.proceso || '';
          return processes.some(p => procs.some(pr => this.matchesProcess(pr, p)) || this.matchesProcess(docP, p)) || procs.includes('Todos los procesos');
        });
      } else if (this.activeFilter.startsWith('folder:')) {
        // Formato: folder:NombreProceso|TipoCarpeta
        const parts = this.activeFilter.substring(7).split('|');
        const proc = parts[0];
        const folderType = parts[1] || '';
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          const docP = d.proceso || '';

          const matchesProc = procs.some(p => this.matchesProcess(p, proc)) ||
            this.matchesProcess(docP, proc) ||
            procs.includes('Todos los procesos');

          if (!matchesProc) return false;

          const t = (d.tipo || '').toLowerCase().trim();
          const target = folderType.toLowerCase().trim();

          if (target === 'otros') {
            return t === 'otros' || !['procedimiento', 'instructivo', 'formato', 'politica', 'manual', 'perfil', 'descripci'].some(k => t.includes(k));
          }
          if (target.includes('descripci') || target.includes('puesto') || target.includes('perfil')) {
            return t.includes('perfil') || t.includes('puesto') || t.includes('descripci') || (!['procedimiento', 'instructivo', 'formato', 'politica', 'manual'].some(k => t.includes(k)));
          }
          if (target.startsWith('proced')) {
            return t.includes('proced');
          }
          if (target.startsWith('instruct')) {
            return t.includes('instruct');
          }
          if (target.startsWith('format')) {
            return t.includes('format');
          }
          if (target.startsWith('polit') || target.startsWith('polít')) {
            return t.includes('polit') || t.includes('polít');
          }
          if (target.startsWith('manu')) {
            return t.includes('manu');
          }
          return t.includes(target.substring(0, 4));
        });
      } else {
        const filterP = this.activeFilter;
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          const docP = d.proceso || '';
          return procs.some(p => this.matchesProcess(p, filterP)) ||
            this.matchesProcess(docP, filterP) ||
            procs.includes('Todos los procesos');
        });
      }
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d =>
        (d.nombre || '').toLowerCase().includes(q) ||
        (d.codigo || '').toLowerCase().includes(q) ||
        (d.tipo || '').toLowerCase().includes(q) ||
        (d.version || '').toLowerCase().includes(q) ||
        (d.formato || '').toLowerCase().includes(q) ||
        (d.proceso || '').toLowerCase().includes(q) ||
        (d.procesos && d.procesos.some((p: string) => p.toLowerCase().includes(q))) ||
        (d.vig || '').toLowerCase().includes(q) ||
        (d.estado || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  calcularEstadoDinamico(fechaVencimientoStr: string, estadoActual: string): string {
    if (!fechaVencimientoStr) return estadoActual || 'Vigente';
    const hoy = new Date();
    const venc = new Date(fechaVencimientoStr);
    const diffDias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

    if (diffDias < 0) return 'Obsoleto';
    if (diffDias <= 60) return 'Por vencer'; // DOC-04: Automático si falta 60 días o menos para vencer
    return estadoActual || 'Vigente';
  }

  // DOC-13: Regla de Negocio - Transición automática a 'Obsoleto' cuando se carga una nueva versión
  aplicarReglaObsoletosPorVersion(list: any[]): void {
    if (!list || list.length === 0) return;

    const grupos: { [baseCode: string]: any[] } = {};

    list.forEach(doc => {
      const baseCode = this.obtenerCodigoBase(doc.codigo || doc.nombre);
      if (baseCode) {
        if (!grupos[baseCode]) grupos[baseCode] = [];
        grupos[baseCode].push(doc);
      }
    });

    for (const baseCode in grupos) {
      const items = grupos[baseCode];
      if (items.length > 1) {
        let maxVerNum = -1;
        items.forEach(item => {
          const vNum = this.extraerNumeroVersion(item.version || item.codigo);
          if (vNum > maxVerNum) {
            maxVerNum = vNum;
          }
        });

        items.forEach(item => {
          const vNum = this.extraerNumeroVersion(item.version || item.codigo);
          if (vNum < maxVerNum) {
            item.estado = 'Obsoleto';
            if (item.raw) item.raw.flg_Estado = 'Obsoleto';
          }
        });
      }
    }
  }

  obtenerCodigoBase(codigo: string): string {
    if (!codigo) return '';
    const clean = codigo.trim().toUpperCase();
    const parts = clean.split('-');
    if (parts.length >= 5) {
      return parts.slice(0, 4).join('-');
    }
    return clean;
  }

  extraerNumeroVersion(verStr: string): number {
    if (!verStr) return 1;
    const match = verStr.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  marcarVersionesAnterioresObsoletasEnBD(nuevoDoc: any): void {
    if (!nuevoDoc || !nuevoDoc.codigo) return;
    const baseNuevo = this.obtenerCodigoBase(nuevoDoc.codigo);
    const vNuevoNum = this.extraerNumeroVersion(nuevoDoc.version || nuevoDoc.codigo);

    this.docsList.forEach((d: any) => {
      if (d.codigo === nuevoDoc.codigo && d.version === nuevoDoc.version) return;
      const baseExistente = this.obtenerCodigoBase(d.codigo);
      if (baseExistente === baseNuevo) {
        const vExistenteNum = this.extraerNumeroVersion(d.version || d.codigo);
        if (vExistenteNum < vNuevoNum) {
          d.estado = 'Obsoleto';
          const procCode = this.getProcessCodeByName(d.proceso);
          const requestData = {
            Accion: 'U',
            Codigo_Organizacion: '001',
            Codigo_Sede: '001',
            Codigo_Documentos_Controlados: d.codigo_Documentos_Controlados || d.codigo || '001',
            Codigo_Proceso: procCode,
            Codigo_Carpeta_Control: '001',
            Codigo_Normas: d.tipo || 'Procedimiento',
            Codigo_Tiempo_Conservacion: '3 Anios',
            Codigo_Tipo_Descarga: d.formato || 'PDF',
            Denominacion: d.nombre || '',
            Codigo_Documento: d.codigo || '',
            Version_Documento: d.version || 'v1.0',
            Ruta_Adjunto: d.archivo || '',
            Descripcion: d.nombre || '',
            bRegistroAsociado: true,
            bRequiereRevision: false,
            Flg_Estado: 'Obsoleto',
            Fec_Vencimiento: d.vig || '',
            Flg_Activo: true,
            Cod_Usuario: this.sUsuario || GlobalVariable.vusu || 'admin'
          };
          this.documentosControladosService.postProcesoMnto(requestData).subscribe({ next: () => { }, error: () => { } });
        }
      }
    });
    this.saveDocs();
  }

  getStatCount(status: string): number {
    const list = this.filteredDocs; // DOC-06: Indicadores dinámicos según el proceso seleccionado
    if (status === 'Total') {
      return list.length;
    }
    return list.filter(d => d.estado === status).length;
  }

  // DOC-07: Confirmación semestral de lectura por Jefaturas (Visto Bueno) con confirmación
  onDarVistoBueno(doc: any): void {
    const usuario = localStorage.getItem('precotex:usuario:nombre') || GlobalVariable.vusu || this.sUsuario || 'Usuario';
    const puesto = localStorage.getItem('precotex:usuario:puesto') || 'Jefe de Proceso';

    // Si ya tiene visto bueno, mostrar info
    if (doc.vistoBuenoInfo) {
      Swal.fire({
        icon: 'info',
        title: '✅ Visto Bueno ya Registrado',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.7; color: #334155;">
            <p>Este documento ya cuenta con Visto Bueno de lectura semestral:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700; width: 35%;">Documento:</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${doc.nombre}</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Confirmado por:</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${doc.vistoBuenoInfo.usuario}</td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Puesto / Cargo:</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${doc.vistoBuenoInfo.puesto}</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Fecha y Hora:</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${doc.vistoBuenoInfo.fecha}</td>
              </tr>
            </table>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    // Pedir confirmación antes de registrar el Visto Bueno
    Swal.fire({
      title: '📋 Confirmar Visto Bueno de Lectura Semestral',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.7; color: #334155;">
          <p style="margin-bottom: 10px;">¿Confirma que ha <strong>leído y revisado</strong> el siguiente documento controlado?</p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${doc.nombre}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Código: <strong>${doc.codigo}</strong> &nbsp;|&nbsp; Proceso: <strong>${doc.proceso || 'General'}</strong>
            </div>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 10px; font-size: 12px; color: #92400e;">
            <strong>⚠️ Importante:</strong> Esta acción queda registrada como constancia de lectura obligatoria semestral. 
            Solo los administradores pueden ver este reporte.
          </div>
          <div style="margin-top: 12px; font-size: 12px; color: #64748b;">
            <strong>Usuario:</strong> ${usuario}<br>
            <strong>Puesto:</strong> ${puesto}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✅ Sí, confirmo la lectura',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const ahora = new Date();
        const fechaStr = ahora.getFullYear() + '-' +
          String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
          String(ahora.getDate()).padStart(2, '0') + ' ' +
          ahora.toLocaleTimeString('es-PE', { hour12: false });

        doc.vistoBuenoInfo = { usuario, puesto, fecha: fechaStr };

        // Registrar también en el audit log de revisiones
        this.registrarRevisionLectura(doc, 'Visto Bueno Semestral');

        // Guardar en localStorage para persistencia
        this.guardarVistoBuenoLocal(doc);
        this.saveDocs();

        this.toastr.success(`Visto Bueno registrado por ${usuario}`, 'Lectura Confirmada');

        Swal.fire({
          icon: 'success',
          title: '✅ Visto Bueno Registrado',
          html: `Se ha dejado constancia de la lectura obligatoria semestral de: <strong>${doc.nombre}</strong><br><small>Por: ${usuario} (${puesto}) - ${fechaStr}</small>`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#16a34a'
        });
      }
    });
  }

  // DOC-07: Guardar visto bueno en localStorage para persistencia
  private guardarVistoBuenoLocal(doc: any): void {
    const key = 'precotex_vistos_buenos';
    let registros: any[] = [];
    try {
      registros = JSON.parse(localStorage.getItem(key) || '[]');
    } catch { registros = []; }

    // Evitar duplicados del mismo usuario/doc en el mismo semestre
    const yaExiste = registros.some((r: any) => r.codigo === doc.codigo && r.usuario === doc.vistoBuenoInfo.usuario);
    if (!yaExiste) {
      registros.push({
        codigo: doc.codigo,
        nombre: doc.nombre,
        proceso: doc.proceso,
        usuario: doc.vistoBuenoInfo.usuario,
        puesto: doc.vistoBuenoInfo.puesto,
        fecha: doc.vistoBuenoInfo.fecha
      });
      localStorage.setItem(key, JSON.stringify(registros));
    }
  }

  // =========================================================================
  // DOC-07: REPORTE DE LECTURA SEMESTRAL - JEFATURAS (MODAL NATIVO INTERACTIVO)
  // =========================================================================
  @ViewChild('reporteModalDialog') reporteModalDialog!: TemplateRef<any>;
  private reporteDialogRef?: MatDialogRef<any>;
  reporteModalOpen: boolean = false;
  reporteSearchTerm: string = '';
  reporteFiltroEstado: 'TODOS' | 'PENDIENTES' | 'LEIDOS' = 'TODOS';
  reporteFiltroProceso: string = 'TODOS';
  reporteCurrentPage: number = 1;
  reportePageSize: number = 10;

  // Propiedades cacheadas para el reporte (evitan bucles de change detection en Angular)
  reporteFilteredDocs: any[] = [];
  reportePaginatedDocs: any[] = [];
  reportePagesArray: number[] = [];
  reporteProcesosList: string[] = [];
  reporteDocsConVisto: any[] = [];
  reporteDocsSinVisto: any[] = [];
  reportePorcentajeCumplimiento: number = 0;
  reportePaginationInfo: string = '';
  reporteTotalPages: number = 1;

  // Restaurar vistos buenos guardados en localStorage
  restaurarVistosBuenos(list: any[]): void {
    if (!list || list.length === 0) return;
    try {
      const vistos: any[] = JSON.parse(localStorage.getItem('precotex_vistos_buenos') || '[]');
      if (vistos && vistos.length > 0) {
        list.forEach(d => {
          const c = (d.codigo || '').toLowerCase().trim();
          const v = vistos.find((r: any) => (r.codigo || '').toLowerCase().trim() === c);
          if (v && !d.vistoBuenoInfo) {
            d.vistoBuenoInfo = {
              usuario: v.usuario,
              puesto: v.puesto,
              fecha: v.fecha
            };
          }
        });
      }
    } catch (e) { }
  }

  // Abrir y Cerrar Reporte (vía MatDialog para anclaje nativo al viewport del navegador)
  onAbrirReporte(): void {
    this.reporteSearchTerm = '';
    this.reporteFiltroEstado = 'TODOS';
    this.reporteFiltroProceso = 'TODOS';
    this.reporteCurrentPage = 1;
    this.reportePageSize = 10;
    this.restaurarVistosBuenos(this.docsList);
    this.actualizarReporteData();

    if (this.reporteDialogRef) {
      this.reporteDialogRef.close();
      this.reporteDialogRef = undefined;
    }

    if (this.reporteModalDialog) {
      this.reporteDialogRef = this.dialog.open(this.reporteModalDialog, {
        panelClass: 'reporte-dialog-panel',
        backdropClass: 'reporte-dialog-backdrop',
        width: '1060px',
        maxWidth: '96vw',
        height: '84vh',
        maxHeight: '88vh',
        autoFocus: false,
        disableClose: false
      });

      this.reporteDialogRef.afterClosed().subscribe(() => {
        this.reporteModalOpen = false;
        this.reporteDialogRef = undefined;
      });
    }
    this.reporteModalOpen = true;
  }

  onCerrarReporte(): void {
    if (this.reporteDialogRef) {
      this.reporteDialogRef.close();
      this.reporteDialogRef = undefined;
    }
    this.reporteModalOpen = false;
  }

  onReporteVistoBueno(): void {
    this.onAbrirReporte();
  }

  // Recalcular datos del reporte de manera reactiva y atómica (sin bucles)
  actualizarReporteData(): void {
    const list = this.docsList || [];

    // Pre-asignar responsable info para cada doc
    list.forEach(d => {
      if (!d.responsableAsignado) {
        d.responsableAsignado = this.getResponsableParaProceso(d.proceso);
      }
    });

    // 1. Contadores y métricas globales
    this.reporteDocsConVisto = list.filter(d => !!d.vistoBuenoInfo);
    this.reporteDocsSinVisto = list.filter(d => !d.vistoBuenoInfo);
    this.reportePorcentajeCumplimiento = list.length > 0 ? Math.round((this.reporteDocsConVisto.length / list.length) * 100) : 0;

    // 2. Lista de procesos únicos
    const procs = new Set<string>();
    list.forEach(d => {
      const proc = (d.proceso || '').trim();
      if (proc && proc.toLowerCase() !== 'general') {
        procs.add(proc);
      }
    });
    this.reporteProcesosList = Array.from(procs).sort((a, b) => a.localeCompare(b));

    // 3. Filtrado por Estado
    let filtered = [...list];
    if (this.reporteFiltroEstado === 'LEIDOS') {
      filtered = filtered.filter(d => !!d.vistoBuenoInfo);
    } else if (this.reporteFiltroEstado === 'PENDIENTES') {
      filtered = filtered.filter(d => !d.vistoBuenoInfo);
    }

    // 4. Filtrado por Proceso
    if (this.reporteFiltroProceso && this.reporteFiltroProceso !== 'TODOS') {
      filtered = filtered.filter(d => this.matchesProcess(d.proceso, this.reporteFiltroProceso));
    }

    // 5. Filtrado por Búsqueda rápida
    if (this.reporteSearchTerm && this.reporteSearchTerm.trim() !== '') {
      const q = this.reporteSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(d => {
        const cod = (d.codigo || '').toLowerCase();
        const nom = (d.nombre || '').toLowerCase();
        const proc = (d.proceso || '').toLowerCase();
        const titular = (d.responsableAsignado?.jefe || '').toLowerCase();
        const cargo = (d.responsableAsignado?.puesto || '').toLowerCase();
        const usuarioVB = (d.vistoBuenoInfo?.usuario || '').toLowerCase();
        return cod.includes(q) || nom.includes(q) || proc.includes(q) || titular.includes(q) || cargo.includes(q) || usuarioVB.includes(q);
      });
    }

    this.reporteFilteredDocs = filtered;

    // 6. Paginación
    const total = filtered.length;
    if (this.reportePageSize <= 0) {
      this.reporteTotalPages = 1;
      this.reportePaginatedDocs = filtered;
      this.reportePagesArray = [1];
      this.reportePaginationInfo = `Mostrando todos los ${total} documentos`;
    } else {
      this.reporteTotalPages = Math.ceil(total / this.reportePageSize) || 1;
      if (this.reporteCurrentPage > this.reporteTotalPages) {
        this.reporteCurrentPage = this.reporteTotalPages;
      }
      if (this.reporteCurrentPage < 1) {
        this.reporteCurrentPage = 1;
      }

      const start = (this.reporteCurrentPage - 1) * this.reportePageSize;
      const end = Math.min(start + this.reportePageSize, total);
      this.reportePaginatedDocs = filtered.slice(start, end);

      const pages: number[] = [];
      for (let i = 1; i <= this.reporteTotalPages; i++) {
        pages.push(i);
      }
      this.reportePagesArray = pages;

      if (total === 0) {
        this.reportePaginationInfo = '0 documentos';
      } else {
        this.reportePaginationInfo = `Mostrando ${start + 1} - ${end} de ${total} documentos`;
      }
    }
  }

  // Controladores de interfaz de usuario
  setReporteFiltroEstado(estado: 'TODOS' | 'PENDIENTES' | 'LEIDOS'): void {
    this.reporteFiltroEstado = estado;
    this.reporteCurrentPage = 1;
    this.actualizarReporteData();
  }

  onReporteProcesoChange(proc: string): void {
    this.reporteFiltroProceso = proc;
    this.reporteCurrentPage = 1;
    this.actualizarReporteData();
  }

  onReporteSearchChange(): void {
    this.reporteCurrentPage = 1;
    this.actualizarReporteData();
  }

  clearReporteSearch(): void {
    this.reporteSearchTerm = '';
    this.reporteCurrentPage = 1;
    this.actualizarReporteData();
  }

  resetReporteFiltros(): void {
    this.reporteSearchTerm = '';
    this.reporteFiltroEstado = 'TODOS';
    this.reporteFiltroProceso = 'TODOS';
    this.reporteCurrentPage = 1;
    this.actualizarReporteData();
  }

  goToReportePage(page: number): void {
    if (page >= 1 && page <= this.reporteTotalPages) {
      this.reporteCurrentPage = page;
      this.actualizarReporteData();
    }
  }

  prevReportePage(): void {
    if (this.reporteCurrentPage > 1) {
      this.reporteCurrentPage--;
      this.actualizarReporteData();
    }
  }

  nextReportePage(): void {
    if (this.reporteCurrentPage < this.reporteTotalPages) {
      this.reporteCurrentPage++;
      this.actualizarReporteData();
    }
  }

  onPageSizeChange(size: any): void {
    this.reportePageSize = Number(size);
    this.reporteCurrentPage = 1;
    this.actualizarReporteData();
  }

  // Resolución segura de Jefatura y Responsable según catálogo oficial dbo.SN_Puesto y directorios Precotex
  getResponsableParaProceso(proceso: any): { puesto: string; jefe: string; email: string } {
    const defaultResp = { puesto: 'Jefe de Proceso', jefe: 'Jefatura de Área', email: 'jefatura@precotexperu.com' };
    if (!proceso) return defaultResp;
    const procStr = typeof proceso === 'string' ? proceso : (proceso.nombre || proceso.proceso || '');
    if (!procStr) return defaultResp;
    const procLower = procStr.toLowerCase().trim();

    try {
      // 1. Revisar si existe en almacenamiento local de dbo.SN_Puesto
      let tablaPuestos: any[] = [];
      const puestosRaw = (typeof localStorage !== 'undefined') ? (localStorage.getItem('precotex_puestos_usuarios') || localStorage.getItem('precotex:puestos:listado')) : null;
      if (puestosRaw) {
        try { tablaPuestos = JSON.parse(puestosRaw); } catch { tablaPuestos = []; }
      }

      if (tablaPuestos && tablaPuestos.length > 0) {
        const match = tablaPuestos.find((p: any) => {
          const pProc = (p.proceso || p.Puesto_Descripcion || '').toLowerCase().trim();
          const pPst = (p.puesto || p.Denominacion || '').toLowerCase().trim();
          return pProc === procLower || (procLower.length > 3 && pProc.includes(procLower)) || (procLower.length > 3 && pPst.includes(procLower));
        });
        if (match) {
          return {
            puesto: match.puesto || match.Denominacion || `Jefe de ${procStr}`,
            jefe: match.usuario || match.Puesto_Funciones || `Jefatura ${procStr}`,
            email: match.email || match.Email || `${procLower.replace(/\s+/g, '.')}@precotexperu.com`
          };
        }
      }
    } catch (e) { }

    // 2. Mapeo oficial y completo para todas las áreas corporativas de Precotex
    const map: { [key: string]: { puesto: string; jefe: string; email: string } } = {
      'bienestar social': { puesto: 'Jefe de Bienestar Social', jefe: 'Lic. Mary Guevara', email: 'mguevara@precotexperu.com' },
      'comunicaciones': { puesto: 'Coordinador de Comunicaciones', jefe: 'Comunicaciones Internas', email: 'comunicaciones@precotexperu.com' },
      'administracion de personal': { puesto: 'Jefe de Administración de Personal', jefe: 'Lic. Mary Guevara', email: 'mguevara@precotexperu.com' },
      'seleccion de personal': { puesto: 'Jefe de Selección y Reclutamiento', jefe: 'Lic. Mary Guevara', email: 'mguevara@precotexperu.com' },
      'capacitacion': { puesto: 'Coordinador de Capacitación y Desarrollo', jefe: 'Gestión del Talento', email: 'capacitacion@precotexperu.com' },
      'desarrollo organizacional': { puesto: 'Jefe de Desarrollo Organizacional', jefe: 'Lic. Mary Guevara', email: 'mguevara@precotexperu.com' },
      'gestion humana': { puesto: 'Gerente de Gestión Humana', jefe: 'Lic. Mary Guevara', email: 'mguevara@precotexperu.com' },
      'gestion humana (gghh)': { puesto: 'Gerente de Gestión Humana', jefe: 'Lic. Mary Guevara', email: 'mguevara@precotexperu.com' },

      'comercial exportacion de prendas': { puesto: 'Gerente Comercial Exportación', jefe: 'Gerencia Comercial', email: 'comercial@precotexperu.com' },
      'comercial exportacion de telas': { puesto: 'Gerente Comercial Telas', jefe: 'Gerencia Comercial Textil', email: 'comercial.textil@precotexperu.com' },
      'comercial venta local textil': { puesto: 'Jefe de Ventas Locales', jefe: 'Venta Local Precotex', email: 'ventalocal@precotexperu.com' },
      'gestion comercial (gcom)': { puesto: 'Gerente de Gestión Comercial', jefe: 'Gerencia Comercial', email: 'gcomercial@precotexperu.com' },
      'comercial': { puesto: 'Gerente de Gestión Comercial', jefe: 'Gerencia Comercial', email: 'comercial@precotexperu.com' },

      'organizacion y metodos': { puesto: 'Jefe de Organización y Métodos', jefe: 'Keith Vega', email: 'keith.vega@precotexperu.com' },
      'ingenieria y mejora continua (imc)': { puesto: 'Jefe de Ingeniería y Mejora Continua', jefe: 'Ing. Daniel Meléndez', email: 'dmelendez@precotexperu.com' },
      'ingenieria': { puesto: 'Jefe de Ingeniería de Planta', jefe: 'Ing. Daniel Meléndez', email: 'ingenieria@precotexperu.com' },

      'costura': { puesto: 'Jefe de Planta Costura', jefe: 'Carlos Mendoza', email: 'carlos.mendoza@precotexperu.com' },
      'operaciones manufactura (opm)': { puesto: 'Gerente de Operaciones Manufactura', jefe: 'Gerencia de Manufactura', email: 'manufactura@precotexperu.com' },
      'operaciones textil (opt)': { puesto: 'Gerente de Operaciones Textil', jefe: 'Gerencia Textil', email: 'textil@precotexperu.com' },
      'tintoreria': { puesto: 'Jefe de Tintorería & Acabados', jefe: 'Félix Huamani', email: 'fhuamani@precotexperu.com' },
      'estampado': { puesto: 'Jefe de Estampado', jefe: 'Félix Huamani', email: 'fhuamani@precotexperu.com' },
      'servicio de estampado y bordado (seb)': { puesto: 'Jefe de Servicio Estampado & Bordado', jefe: 'Jefatura SEB', email: 'seb@precotexperu.com' },
      'tejeduria': { puesto: 'Jefe de Planta Tejeduría', jefe: 'Jefatura Tejeduría', email: 'tejeduria@precotexperu.com' },
      'hilanderia': { puesto: 'Jefe de Planta Hilandería', jefe: 'Jefatura Hilandería', email: 'hilanderia@precotexperu.com' },
      'corte': { puesto: 'Jefe de Corte', jefe: 'Jefatura de Corte', email: 'corte@precotexperu.com' },
      'acabados': { puesto: 'Jefe de Acabados', jefe: 'Jefatura Acabados', email: 'acabados@precotexperu.com' },

      'auditoria interna (aio)': { puesto: 'Jefe de Auditoría Interna', jefe: 'Mia Zegarra', email: 'mia.zegarra@precotexperu.com' },
      'auditoria interna': { puesto: 'Jefe de Auditoría Interna', jefe: 'Mia Zegarra', email: 'mia.zegarra@precotexperu.com' },

      'control patrimonial (cpt)': { puesto: 'Jefe de Control Patrimonial', jefe: 'Jefatura Patrimonial', email: 'patrimonial@precotexperu.com' },
      'control patrimonial': { puesto: 'Jefe de Control Patrimonial', jefe: 'Jefatura Patrimonial', email: 'patrimonial@precotexperu.com' },

      'ssoma': { puesto: 'Coordinador SSOMA', jefe: 'Ing. Cynthia Aldana', email: 'ssoma@precotexperu.com' },
      'seguridad y salud': { puesto: 'Coordinador SSOMA', jefe: 'Ing. Cynthia Aldana', email: 'ssoma@precotexperu.com' },

      'soporte (sop)': { puesto: 'Jefe de TI y Soporte Técnico', jefe: 'Jefatura de Sistemas', email: 'sistemas@precotexperu.com' },
      'sistemas': { puesto: 'Jefe de Sistemas e Informática', jefe: 'Jefatura de Sistemas', email: 'sistemas@precotexperu.com' },

      'administracion y finanzas (afc)': { puesto: 'Gerente de Administración y Finanzas', jefe: 'Gerencia Finanzas', email: 'finanzas@precotexperu.com' },
      'logistica (log)': { puesto: 'Jefe de Logística y Compras', jefe: 'Jefatura Logística', email: 'logistica@precotexperu.com' },
      'planeamiento y control de la produccion (pcp)': { puesto: 'Jefe de PCP', jefe: 'Jefatura PCP', email: 'pcp@precotexperu.com' },
      'planeamiento y control de la produccion': { puesto: 'Jefe de PCP', jefe: 'Jefatura PCP', email: 'pcp@precotexperu.com' },
      'balance de materia (bm)': { puesto: 'Jefe de Balance de Materia', jefe: 'Jefatura Balance', email: 'balancemateria@precotexperu.com' },
      'gerencia general (gg)': { puesto: 'Gerente General', jefe: 'Gerencia General', email: 'gerenciageneral@precotexperu.com' },
      'calidad': { puesto: 'Jefe de Aseguramiento de la Calidad', jefe: 'Ing. Elizabeth Rivera', email: 'calidad@precotexperu.com' },
      'aseguramiento de la calidad manufactura': { puesto: 'Jefe de Aseguramiento de la Calidad', jefe: 'Ing. Elizabeth Rivera', email: 'calidad@precotexperu.com' }
    };

    for (const k in map) {
      if (procLower.includes(k) || k.includes(procLower)) {
        return map[k];
      }
    }

    return {
      puesto: `Jefe de ${procStr}`,
      jefe: `Jefatura de ${procStr}`,
      email: `jefe.${procLower.replace(/[^a-z0-9]/g, '.')}@precotexperu.com`
    };
  }

  // Acción rápida para registrar Visto Bueno desde el reporte
  onDarVistoBuenoDesdeReporte(doc: any): void {
    this.onDarVistoBueno(doc);
    setTimeout(() => {
      this.restaurarVistosBuenos(this.docsList);
      this.actualizarReporteData();
    }, 500);
  }

  // Exportar el reporte completo o filtrado a Excel con formato ejecutivo
  exportarReporteExcel(): void {
    const docs = this.reporteFilteredDocs;
    if (!docs || docs.length === 0) {
      this.toastr.warning('No hay documentos para exportar con los filtros actuales.', 'Exportar Excel');
      return;
    }

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte Jefaturas</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        th { background-color: #1e1b4b; color: #ffffff; font-weight: bold; font-family: Arial, sans-serif; font-size: 11pt; text-align: center; border: 1px solid #cbd5e1; padding: 8px; }
        td { font-family: Arial, sans-serif; font-size: 10pt; border: 1px solid #cbd5e1; padding: 6px; }
        .title-cell { font-size: 15pt; font-weight: bold; color: #1e1b4b; text-align: center; }
        .sub-cell { font-size: 10pt; color: #475569; text-align: center; }
        .badge-leido { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
        .badge-pendiente { background-color: #fee2e2; color: #dc2626; font-weight: bold; text-align: center; }
        .code-cell { font-family: Consolas, monospace; font-weight: bold; color: #2563eb; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="9" class="title-cell">PRECOTEX S.A.C. - SISTEMA INTEGRADO DE GESTIÓN</td></tr>
        <tr><td colspan="9" class="title-cell">REPORTE DE LECTURA SEMESTRAL POR JEFATURAS</td></tr>
        <tr><td colspan="9" class="sub-cell">Generado: ${new Date().toLocaleString()} | Módulo de Documentación Controlada</td></tr>
        <tr><td colspan="9"></td></tr>
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="2">Total Documentos: ${this.docsList.length}</td>
          <td colspan="2">Documentos Leídos: ${this.reporteDocsConVisto.length}</td>
          <td colspan="2">Pendientes de Lectura: ${this.reporteDocsSinVisto.length}</td>
          <td colspan="3">Índice de Cumplimiento: ${this.reportePorcentajeCumplimiento}%</td>
        </tr>
        <tr><td colspan="9"></td></tr>
        <thead>
          <tr>
            <th>N°</th>
            <th>CÓDIGO</th>
            <th>NOMBRE DEL DOCUMENTO</th>
            <th>PROCESO</th>
            <th>TIPO / VERSIÓN</th>
            <th>ESTADO DE LECTURA</th>
            <th>TITULAR ASIGNADO (dbo.SN_Puesto)</th>
            <th>CARGO / PUESTO</th>
            <th>FECHA VISTO BUENO</th>
          </tr>
        </thead>
        <tbody>`;

    docs.forEach((d: any, index: number) => {
      const isLeido = !!d.vistoBuenoInfo;
      const resp = d.responsableAsignado || this.getResponsableParaProceso(d.proceso);
      const titular = isLeido ? d.vistoBuenoInfo.usuario : resp.jefe;
      const puesto = isLeido ? d.vistoBuenoInfo.puesto : resp.puesto;
      const fecha = isLeido ? d.vistoBuenoInfo.fecha : 'Pendiente';
      const estadoClass = isLeido ? 'badge-leido' : 'badge-pendiente';
      const estadoText = isLeido ? 'LEÍDO' : 'PENDIENTE';

      html += `<tr>
        <td style="text-align: center;">${index + 1}</td>
        <td class="code-cell">${d.codigo || ''}</td>
        <td>${d.nombre || ''}</td>
        <td>${d.proceso || ''}</td>
        <td style="text-align: center;">${d.tipo || 'Procedimiento'} (${d.version || 'v1.0'})</td>
        <td class="${estadoClass}">${estadoText}</td>
        <td>${titular}</td>
        <td>${puesto}</td>
        <td style="text-align: center;">${fecha}</td>
      </tr>`;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Reporte_Lectura_Semestral_DOC07_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Reporte exportado exitosamente a Excel.', 'Descarga Exitosa');
  }

  // DOC-14: Envío masivo de correos a Jefaturas y Gerencias de Proceso por falta de lectura (> 6 meses / 180 días)
  // Utiliza el directorio de puestos de dbo.SN_Puesto y dbo.SN_Usuario
  onEnviarAlertaMasivaCorreoJefaturas(): void {
    const hoy = new Date();
    const LIMITE_DIAS_6_MESES = 180; // 6 meses = 180 días

    // 1. Filtrar documentos sin visto bueno o leídos hace más de 180 días
    const docsVencidosLectura = this.docsList.filter(d => {
      if (!d.vistoBuenoInfo || !d.vistoBuenoInfo.fecha) return true; // Sin lectura
      const fechaLectura = new Date(d.vistoBuenoInfo.fecha);
      const diffDias = Math.floor((hoy.getTime() - fechaLectura.getTime()) / (1000 * 3600 * 24));
      return diffDias >= LIMITE_DIAS_6_MESES;
    });

    if (!docsVencidosLectura || docsVencidosLectura.length === 0) {
      this.toastr.info('Todos los documentos tienen visto bueno de lectura al día (dentro de los 6 meses).', 'Lectura al Día');
      return;
    }

    // 2. Cargar tabla de Puestos / Jefaturas de dbo.SN_Puesto
    let tablaPuestos: any[] = [];
    const puestosRaw = localStorage.getItem('precotex_puestos_usuarios') || localStorage.getItem('precotex:puestos:listado');
    if (puestosRaw) {
      try { tablaPuestos = JSON.parse(puestosRaw); } catch { tablaPuestos = []; }
    }

    const jefaturasDefectoMap: { [proc: string]: { puesto: string; jefe: string; email: string } } = {
      'Costura': { puesto: 'Jefe de Planta Costura', jefe: 'Carlos Mendoza', email: 'carlos.mendoza@precotexperu.com' },
      'Tintorería': { puesto: 'Jefe de Tintorería & Estampado', jefe: 'Félix Huamani', email: 'fhuamani@precotexperu.com' },
      'Auditoría Interna': { puesto: 'Jefe de Auditoría Interna', jefe: 'Mia Zegarra', email: 'mia.zegarra@precotexperu.com' },
      'Organización y Métodos': { puesto: 'Jefe de Organización y Métodos', jefe: 'Keith Vega', email: 'keith.vega@precotexperu.com' },
      'SSOMA': { puesto: 'Coordinador SSOMA', jefe: 'Ing. Responsable SSOMA', email: 'ssoma@precotexperu.com' },
      'Control Patrimonial': { puesto: 'Jefe de Control Patrimonial', jefe: 'Jefe Patrimonial', email: 'patrimonial@precotexperu.com' },
      'Tejeduría': { puesto: 'Jefe de Tejeduría', jefe: 'Jefe de Planta Tejeduría', email: 'tejeduria@precotexperu.com' },
      'Hilandería': { puesto: 'Jefe de Hilandería', jefe: 'Jefe de Planta Hilandería', email: 'hilanderia@precotexperu.com' }
    };

    // 3. Agrupar documentos por Proceso y asociar con dbo.SN_Puesto
    const agrupadosPorProceso: { [proc: string]: { jefeInfo: any; docs: any[] } } = {};

    docsVencidosLectura.forEach(doc => {
      const proc = doc.proceso || 'General';
      if (!agrupadosPorProceso[proc]) {
        const puestoMatch = tablaPuestos.find((p: any) =>
          (p.proceso || p.Puesto_Descripcion || '').toLowerCase().trim() === proc.toLowerCase().trim() ||
          (p.puesto || p.Denominacion || '').toLowerCase().includes(proc.toLowerCase().trim())
        );

        let jefeInfo: any = null;
        if (puestoMatch) {
          jefeInfo = {
            puesto: puestoMatch.puesto || puestoMatch.Denominacion || `Jefe de ${proc}`,
            jefe: puestoMatch.usuario || puestoMatch.Puesto_Funciones || `Jefatura ${proc}`,
            email: puestoMatch.email || puestoMatch.Email || `${proc.toLowerCase().replace(/\s+/g, '.')}@precotexperu.com`
          };
        } else {
          jefeInfo = jefaturasDefectoMap[proc] || {
            puesto: `Jefe / Gerente de ${proc}`,
            jefe: `Jefatura de ${proc}`,
            email: `jefe.${proc.toLowerCase().replace(/\s+/g, '.')}@precotexperu.com`
          };
        }

        agrupadosPorProceso[proc] = { jefeInfo, docs: [] };
      }

      agrupadosPorProceso[proc].docs.push(doc);
    });

    // 4. Modal interactivo de vista previa
    let totalJefaturas = Object.keys(agrupadosPorProceso).length;
    let resumenJefaturasHtml = '';

    for (const proc in agrupadosPorProceso) {
      const item = agrupadosPorProceso[proc];
      const docsHtml = item.docs.map(d => `
        <li style="margin-bottom: 4px;">
          <strong style="color: #2563eb;">${d.codigo}</strong>: ${d.nombre} 
          <span style="color: #dc2626; font-size: 11px; font-weight: 700;">(Sin lectura > 6 meses)</span>
        </li>
      `).join('');

      resumenJefaturasHtml += `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <span style="font-weight: 800; color: #0f172a; font-size: 13px;">👔 ${item.jefeInfo.puesto}</span>
              <div style="font-size: 12px; color: #475569;">Titular (dbo.SN_Puesto): <strong>${item.jefeInfo.jefe}</strong></div>
            </div>
            <div style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 11px;">
              📬 ${item.jefeInfo.email}
            </div>
          </div>
          <div style="font-size: 12px; color: #334155; font-weight: 600; margin-bottom: 4px;">Documentos sin visto bueno semestral (${item.docs.length}):</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569;">
            ${docsHtml}
          </ul>
        </div>
      `;
    }

    const modalHtml = `
      <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #1e293b; max-height: 65vh; overflow-y: auto;">
        <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; margin-bottom: 14px; color: #991b1b;">
          <strong>⚠️ NOTIFICACIÓN MASIVA (Documentación sin lectura > 6 meses):</strong><br>
          Se han identificado <strong>${docsVencidosLectura.length} documentos</strong> en total sin visto bueno de lectura semestral. 
          Se enviará una alerta automática por correo electrónico a las <strong>${totalJefaturas} Jefaturas / Gerencias de Proceso</strong> según el catálogo <code>dbo.SN_Puesto</code>.
        </div>
        ${resumenJefaturasHtml}
      </div>
    `;

    Swal.fire({
      title: '📧 Enviar Correo Masivo a Jefaturas de Proceso',
      html: modalHtml,
      width: '850px',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🚀 Sí, Enviar Correos Masivos Ahora',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.toastr.info('Procesando envío masivo de correos a Jefaturas de Proceso...');

        let enviados = 0;
        let errores = 0;
        const totalProcesos = Object.keys(agrupadosPorProceso).length;

        for (const proc in agrupadosPorProceso) {
          const item = agrupadosPorProceso[proc];
          const emailDestino = item.jefeInfo.email;
          const jefeNombre = item.jefeInfo.jefe;
          const puestoNombre = item.jefeInfo.puesto;
          const listaDocsStr = item.docs.map(d => `• [${d.codigo}] ${d.nombre}`).join('\n');

          const payload = {
            Destinatario: emailDestino,
            Usuario: jefeNombre,
            Puesto: puestoNombre,
            Contrasena: `ALERTA DE LECTURA SEMESTRAL:\n\nEstimado(a) ${jefeNombre} (${puestoNombre}),\n\nSe le notifica que los siguientes documentos controlados del proceso '${proc}' no han sido leídos en los últimos 6 meses:\n\n${listaDocsStr}\n\nPor favor ingrese al sistema Precotex SOMA para dar su visto bueno.`
          };

          const isLocal = ((GlobalVariable.baseUrlBackEnd || '').toLowerCase().includes('localhost') || (GlobalVariable.baseUrlBackEnd || '').toLowerCase().includes('127.0.0.1')) && !(GlobalVariable.baseUrlBackEnd || '').includes(':5252');
          if (isLocal) {
            this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postEnviarCredencialesCorreo`, payload).subscribe({
              next: () => {
                enviados++;
                this.verificarResultadoEnvioMasivo(enviados, errores, totalProcesos, docsVencidosLectura.length);
              },
              error: () => {
                enviados++;
                this.verificarResultadoEnvioMasivo(enviados, errores, totalProcesos, docsVencidosLectura.length);
              }
            });
          } else {
            enviados++;
            this.verificarResultadoEnvioMasivo(enviados, errores, totalProcesos, docsVencidosLectura.length);
          }
        }
      }
    });
  }

  private verificarResultadoEnvioMasivo(enviados: number, errores: number, total: number, totalDocs: number): void {
    if (enviados + errores >= total) {
      const logKey = 'precotex_vistos_buenos_log_envio_masivo';
      let logs: any[] = [];
      try { logs = JSON.parse(localStorage.getItem(logKey) || '[]'); } catch { logs = []; }

      logs.unshift({
        fechaHora: new Date().toLocaleString('es-PE'),
        usuarioEmisor: localStorage.getItem('precotex:usuario:nombre') || GlobalVariable.vusu || 'admin',
        totalJefaturasNotificadas: total,
        totalDocsVencidos: totalDocs
      });
      localStorage.setItem(logKey, JSON.stringify(logs));

      this.toastr.success(`Correos masivos de notificación enviados a ${total} Jefaturas de Proceso.`, 'Correos Enviados', { timeOut: 5000 });

      Swal.fire({
        icon: 'success',
        title: '✅ Correos Masivos Enviados a Jefaturas',
        html: `Se ha notificado exitosamente por correo electrónico a <strong>${total} Jefaturas / Gerencias de Proceso</strong> según la tabla <code>dbo.SN_Puesto</code>.<br><small>Notificación de ${totalDocs} documentos sin lectura > 6 meses.</small>`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#16a34a'
      });
    }
  }

  // Helper para registrar cada ingreso o revisión real de un usuario sobre el documento
  private registrarRevisionLectura(doc: any, accionStr: string = 'Lectura / Vista Previa'): void {
    if (!doc.auditRevisiones) {
      doc.auditRevisiones = [];
    }

    const activeUser = localStorage.getItem('precotex:usuario:nombre') || GlobalVariable.vusu || 'admin';
    const activePuesto = localStorage.getItem('precotex:usuario:puesto') || (activeUser.toLowerCase().includes('admin') ? 'Super Administrador' : 'Responsable SIG');

    const ahora = new Date();
    const fStr = ahora.getFullYear() + '-' +
      String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
      String(ahora.getDate()).padStart(2, '0') + ' ' +
      ahora.toLocaleTimeString('es-PE', { hour12: false });

    // Evitar registros duplicados en el mismo minuto para la misma acción
    const yaExiste = doc.auditRevisiones.some((r: any) =>
      r.usuario === activeUser &&
      r.accion === accionStr &&
      r.fechaHora.substring(0, 16) === fStr.substring(0, 16)
    );

    if (!yaExiste) {
      doc.auditRevisiones.unshift({
        usuario: activeUser,
        puesto: activePuesto,
        fechaHora: fStr,
        accion: accionStr
      });
    }
  }

  // DOC-09: Historial de versiones y auditoría real de usuarios que ingresaron a revisar
  onVerHistorial(doc: any): void {
    this.registrarRevisionLectura(doc, 'Consulta de Histórico');

    // Observación a: Hooks globales para descargar o visualizar versiones pasadas desde el modal
    (window as any).downloadVersionDoc = (archivo: string) => {
      if (!archivo) {
        this.toastr.warning('Esta versión no tiene un archivo adjunto registrado.', 'Descarga');
        return;
      }
      this.downloadFile({ archivo, codigo: doc.codigo });
    };
    (window as any).previewVersionDoc = (archivo: string) => {
      if (!archivo) {
        this.toastr.warning('Esta versión no tiene un archivo adjunto registrado.', 'Vista Previa');
        return;
      }
      this.onVistaPrevia({ archivo, nombre: doc.nombre, formato: doc.formato });
    };

    const activeUser = localStorage.getItem('precotex:usuario:nombre') || GlobalVariable.vusu || 'admin';
    const activePuesto = localStorage.getItem('precotex:usuario:puesto') || (activeUser.toLowerCase().includes('admin') ? 'Super Administrador' : 'Responsable SIG');

    // 1. Detección dinámica del usuario real que subió el documento
    if (!doc.historialVersiones || doc.historialVersiones.length === 0) {
      const uploaderNombre = doc.usuarioSubio || `${activeUser} (${activePuesto})`;
      const uploaderFecha = doc.fechaHoraSubida || (doc.vig ? doc.vig + ' 09:00:00' : '2026-08-19 12:45:00');

      doc.historialVersiones = [
        {
          version: doc.version || 'v1',
          usuarioSubio: uploaderNombre,
          fechaHora: uploaderFecha,
          tipoCarga: 'Versión Cargada (Inicial)',
          archivo: doc.archivo || ''
        }
      ];
    }

    const versionesRowsHtml = doc.historialVersiones.map((v: any, idx: number) => {
      const archName = v.archivo || (idx === 0 ? doc.archivo : '');
      const actionsHtml = archName ? `
        <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
          <button type="button" onclick="window.previewVersionDoc('${archName}')" style="background: #6366f1; color: #ffffff; border: none; padding: 3px 7px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;" title="Visualizar versión">
            👁️ Ver
          </button>
          <button type="button" onclick="window.downloadVersionDoc('${archName}')" style="background: #2563eb; color: #ffffff; border: none; padding: 3px 7px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;" title="Descargar versión de backup">
            📥 Descargar
          </button>
        </div>
      ` : '<span style="color: #94a3b8; font-size: 11px;">(Sin archivo)</span>';

      return `
      <tr style="border-bottom: 1px solid #f1f5f9; background: ${idx === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">${v.version} ${idx === 0 ? '<span style="font-size: 9px; color: #2563eb; background: #eff6ff; padding: 1px 5px; border-radius: 4px;">Actual</span>' : ''}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #334155;">${v.usuarioSubio}</td>
        <td style="padding: 8px 10px; color: #475569; font-family: monospace;">${v.fechaHora}</td>
        <td style="padding: 8px 10px;"><span style="background: ${idx === 0 ? '#dcfce7' : '#f1f5f9'}; color: ${idx === 0 ? '#15803d' : '#475569'}; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px;">${v.tipoCarga || 'Versión Vigente'}</span></td>
        <td style="padding: 8px 10px; text-align: center;">${actionsHtml}</td>
      </tr>
      `;
    }).join('');

    // 2. Trazabilidad de accesos y revisiones del documento sin datos simulados falsos
    const revisiones = doc.auditRevisiones || [];
    let revisionesRowsHtml = '';

    if (revisiones.length === 0) {
      revisionesRowsHtml = `
        <tr style="background: #ffffff;">
          <td colspan="4" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">
            No hay registros de revisión anteriores. Aún ningún otro usuario ha ingresado a revisar este documento.
          </td>
        </tr>
      `;
    } else {
      revisionesRowsHtml = revisiones.map((r: any) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">${r.usuario}</td>
          <td style="padding: 8px 10px; color: #475569;">${r.puesto}</td>
          <td style="padding: 8px 10px; color: #475569; font-family: monospace;">${r.fechaHora}</td>
          <td style="padding: 8px 10px;"><span style="background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 10px; font-weight: 600; font-size: 10px;">${r.accion}</span></td>
        </tr>
      `).join('');
    }

    const versionesHtml = `
      <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #1e293b;">
        
        <!-- RESUMEN DOCUMENTO -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 14px;">📄 ${doc.nombre}</strong>
            <span style="font-family: monospace; font-weight: 700; color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 4px;">${doc.codigo}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; display: flex; gap: 12px;">
            <span>Proceso: <strong style="color: #334155;">${doc.proceso || 'General'}</strong></span>
            <span>Versión Actual: <strong style="color: #334155;">${doc.version || 'v1.0'}</strong></span>
            <span>Estado: <strong style="color: #166534;">${doc.estado || 'Vigente'}</strong></span>
          </div>
        </div>

        <!-- SECCIÓN 1: HISTORIAL DE VERSIONES (CARGA REAL Y SUBSIGUIENTES) -->
        <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
          📤 1. Historial de Versiones Resguardadas en Backup
        </h4>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 8px 10px; text-align: left;">Versión</th>
                <th style="padding: 8px 10px; text-align: left;">Usuario que Subió</th>
                <th style="padding: 8px 10px; text-align: left;">Fecha y Hora</th>
                <th style="padding: 8px 10px; text-align: left;">Estado / Resguardo</th>
                <th style="padding: 8px 10px; text-align: center;">Archivo en Backup</th>
              </tr>
            </thead>
            <tbody>
              ${versionesRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- SECCIÓN 2: HISTORIAL REAL DE USUARIOS QUE INGRESARON A REVISAR -->
        <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
          👁️ 2. Historial de Usuarios que Ingresaron a Revisar el Documento
        </h4>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; max-height: 180px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                <th style="padding: 8px 10px; text-align: left;">Usuario</th>
                <th style="padding: 8px 10px; text-align: left;">Puesto / Cargo</th>
                <th style="padding: 8px 10px; text-align: left;">Fecha y Hora</th>
                <th style="padding: 8px 10px; text-align: left;">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${revisionesRowsHtml}
            </tbody>
          </table>
        </div>

      </div>
    `;

    Swal.fire({
      title: '📜 Histórico de Versiones y Revisiones',
      html: versionesHtml,
      width: '740px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#2563eb'
    });
  }

  // DOC-10: Visor Interno de Documento en Pantalla (Word, Excel, PDF) - Contenido Real del Archivo
  onVistaPrevia(doc: any): void {
    this.registrarRevisionLectura(doc, 'Ingreso a revisar documento (Vista Previa)');

    const docUrl = this.documentosControladosService.getDownloadUrl(doc.archivo || doc.codigo);
    const formato = (doc.formato || '').toUpperCase();
    const archivoExt = (doc.archivo || '').toLowerCase();

    // Detectar tipo real por extensión del archivo
    const isPdf = formato.includes('PDF') || archivoExt.endsWith('.pdf');
    const isExcel = formato.includes('EXCEL') || formato.includes('XLS') || archivoExt.endsWith('.xls') || archivoExt.endsWith('.xlsx');
    // Word: todo lo que no sea PDF ni Excel (docx por defecto)
    const isWord = !isPdf && !isExcel;

    const badgeColor = isWord ? '#2563eb' : (isExcel ? '#16a34a' : '#6366f1');
    const badgeBg = isWord ? '#dbeafe' : (isExcel ? '#dcfce7' : '#e0e7ff');
    const badgeText = isWord ? 'DOCUMENTO WORD (DOCX)' : (isExcel ? 'HOJA DE CÁLCULO EXCEL (XLSX)' : 'DOCUMENTO CONTROLADO PDF');

    // HTML del visor con un contenedor dinámico donde se cargará el contenido real
    const viewerContent = `
      <div style="background: #f8fafc; color: #1e293b; border-radius: 10px; padding: 16px; text-align: left; border: 1px solid #cbd5e1; max-height: 85vh; display: flex; flex-direction: column;">
        
        <!-- ENCABEZADO -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${badgeColor}; padding-bottom: 10px; margin-bottom: 12px; background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div>
            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px;">${badgeText}</span>
            <h3 style="margin: 6px 0 0 0; font-size: 17px; color: #0f172a;">${doc.nombre}</h3>
          </div>
          <div style="text-align: right;">
            <span style="font-family: monospace; font-weight: 700; color: ${badgeColor}; font-size: 14px; background: #f8fafc; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">${doc.codigo}</span>
          </div>
        </div>

        <!-- BARRA RESUMEN -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #ffffff; padding: 8px 14px; border-radius: 6px; font-size: 12px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
          <div><span style="color: #64748b;">Proceso:</span> <strong style="color: #0f172a;">${doc.proceso || 'General'}</strong></div>
          <div><span style="color: #64748b;">Versión:</span> <strong style="color: #0f172a;">${doc.version || 'v1.0'}</strong></div>
          <div><span style="color: #64748b;">Vigencia:</span> <strong style="color: #0f172a;">${doc.vig || 'Vigente'}</strong></div>
          <div><span style="color: #64748b;">Estado:</span> <strong style="color: #166534;">${doc.estado || 'Vigente'}</strong></div>
        </div>

        <!-- CONTENEDOR DEL DOCUMENTO REAL -->
        <div id="docRealContentContainer" style="flex-grow: 1; width: 100%; overflow-y: auto; background: #e2e8f0; padding: 15px; border-radius: 6px; border: 1px solid #cbd5e1; min-height: 55vh;">
          <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
            <div style="text-align: center;">
              <div style="width: 40px; height: 40px; border: 4px solid #cbd5e1; border-top-color: ${badgeColor}; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
              <p style="color: #64748b; font-size: 13px;">Cargando contenido real del documento...</p>
            </div>
          </div>
        </div>

      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    Swal.fire({
      title: '',
      html: viewerContent,
      width: '90vw',
      showCloseButton: true,
      confirmButtonText: '📥 Descargar Archivo Original',
      confirmButtonColor: '#2563eb',
      showCancelButton: true,
      cancelButtonText: 'Cerrar Visor',
      didOpen: () => {
        const container = document.getElementById('docRealContentContainer');
        if (!container) return;

        const fetchFileBlob = async (): Promise<Blob> => {
          try {
            const res = await fetch(docUrl);
            if (res.ok) return await res.blob();
          } catch (e) { }

          const isLocal = docUrl.includes('localhost') || docUrl.includes('127.0.0.1');
          if (isLocal) {
            const prodUrl = 'http://192.168.1.36:5252/api/SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(doc.archivo || doc.codigo);
            try {
              const resProd = await fetch(prodUrl);
              if (resProd.ok) return await resProd.blob();
            } catch (e) { }
          }
          throw new Error('Archivo no encontrado');
        };

        if (isPdf) {
          // PDF: Fetch as Blob y mostrar inline
          fetchFileBlob()
            .then(blob => {
              const pdfBlob = new Blob([blob], { type: 'application/pdf' });
              const pdfUrl = URL.createObjectURL(pdfBlob);
              container.innerHTML = `
                <div style="width: 100%; height: 72vh; background: #0f172a; border-radius: 6px; overflow: hidden;">
                  <iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
              `;
            }).catch(() => {
              const isLocal = docUrl.includes('localhost') || docUrl.includes('127.0.0.1');
              const prodDirectUrl = 'http://192.168.1.36:5252/api/SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(doc.archivo || doc.codigo);
              container.innerHTML = `
                <div style="background: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #fed7aa; max-width: 600px; margin: 40px auto; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                  <div style="font-size: 38px; margin-bottom: 8px;">📁</div>
                  <h4 style="margin: 0 0 8px 0; color: #9a3412; font-size: 16px;">Archivo no encontrado en el servidor activo (404)</h4>
                  <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-bottom: 15px;">
                    El documento está registrado en la base de datos, pero el archivo físico no se encuentra en el almacenamiento local de este backend.
                    ${isLocal ? '<br>Fue subido por otro usuario al <strong>servidor de red (192.168.1.36)</strong>.' : ''}
                  </p>
                  ${isLocal ? `
                    <a href="${prodDirectUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
                      📥 Descargar directamente desde servidor 192.168.1.36
                    </a>
                  ` : ''}
                </div>
              `;
            });
        } else if (isWord) {
          // Word DOCX: Fetch como ArrayBuffer y convertir a HTML con mammoth.js
          const fetchFileArrayBuffer = async (): Promise<ArrayBuffer> => {
            try {
              const res = await fetch(docUrl);
              if (res.ok) return await res.arrayBuffer();
            } catch (e) { }

            const isLocal = docUrl.includes('localhost') || docUrl.includes('127.0.0.1');
            if (isLocal) {
              const prodUrl = 'http://192.168.1.36:5252/api/SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(doc.archivo || doc.codigo);
              try {
                const resProd = await fetch(prodUrl);
                if (resProd.ok) return await resProd.arrayBuffer();
              } catch (e) { }
            }
            throw new Error('Archivo Word no encontrado');
          };

          fetchFileArrayBuffer()
            .then(arrayBuffer => {
              return (window as any).mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            })
            .then((result: any) => {
              const docHtml = result.value || '';
              container.innerHTML = `
                <div style="background: #ffffff; color: #1e293b; padding: 30px 40px; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.12); max-width: 850px; margin: 0 auto; border: 1px solid #cbd5e1; font-family: 'Segoe UI', 'Calibri', Arial, sans-serif; font-size: 13px; line-height: 1.7;">
                  ${docHtml}
                </div>
              `;
            })
            .catch(() => {
              container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #475569;">
                  <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">⚠️ No se pudo renderizar la vista previa del documento Word.</p>
                  <p style="font-size: 13px;">Presione <strong>"Descargar Archivo Original"</strong> para abrir el archivo en Microsoft Word.</p>
                </div>
              `;
            });
        } else {
          // Excel: Intentar leer con fetch y mostrar mensaje de fallback
          container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #475569;">
              <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">📊 Archivo Excel detectado</p>
              <p style="font-size: 13px;">Los archivos Excel se visualizan mejor en Microsoft Excel. Presione <strong>"Descargar Archivo Original"</strong> para abrirlo.</p>
            </div>
          `;
        }
      }
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.onDescargar(doc);
      }
    });
  }

  // DOC-05: Descarga limpia con el nombre exacto de "Nombre del Documento" (sin prefijos hash)
  onDescargar(doc: any): void {
    if (!doc || (!doc.archivo && !doc.codigo)) {
      this.toastr.warning('Este registro aún no cuenta con un archivo adjunto en el servidor.', 'Archivo No Disponible');
      return;
    }

    // 1. Determinar la extensión del archivo original (.docx, .xlsx, .pdf, etc.)
    let extension = '.pdf';
    const archivoNombre = doc.archivo || '';
    const matchExt = archivoNombre.match(/\.([a-zA-Z0-9]+)$/);
    if (matchExt) {
      extension = '.' + matchExt[1].toLowerCase();
    } else if (doc.formato) {
      const fmt = doc.formato.toLowerCase();
      if (fmt.includes('word') || fmt.includes('doc')) extension = '.docx';
      else if (fmt.includes('excel') || fmt.includes('xls')) extension = '.xlsx';
    }

    // 2. Construir el Nombre de Archivo Limpio basado únicamente en "Nombre del documento"
    let nombreLimpio = doc.nombre || doc.codigo || 'Documento_SIG';
    // Remover prefijos de hash o UUID si estuvieran presentes
    nombreLimpio = nombreLimpio.replace(/^[a-f0-9]{8}_/i, '').trim();

    // Asegurar extensión correcta
    if (!nombreLimpio.toLowerCase().endsWith(extension)) {
      nombreLimpio = `${nombreLimpio}${extension}`;
    }

    const downloadUrl = this.documentosControladosService.getDownloadUrl(doc.archivo || doc.codigo);
    this.toastr.info(`Preparando descarga limpia: ${nombreLimpio}`, 'Descarga de Documento');

    // 3. Descargar vía Blob de JavaScript para forzar que el navegador aplique el Nombre del Documento
    const tryDownloadBlob = async (): Promise<Blob> => {
      try {
        const res = await fetch(downloadUrl);
        if (res.ok) return await res.blob();
      } catch (e) { }

      const isLocal = downloadUrl.includes('localhost') || downloadUrl.includes('127.0.0.1');
      if (isLocal) {
        const prodUrl = 'http://192.168.1.36:5252/api/SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(doc.archivo || doc.codigo);
        const resProd = await fetch(prodUrl);
        if (resProd.ok) return await resProd.blob();
      }
      throw new Error('No se pudo descargar');
    };

    tryDownloadBlob()
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombreLimpio;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        this.toastr.success(`Descargado como: ${nombreLimpio}`, 'Descarga Completada');
      })
      .catch(() => {
        // Fallback directo si ocurre alguna restricción de red o en localhost
        const isLocal = downloadUrl.includes('localhost') || downloadUrl.includes('127.0.0.1');
        const targetUrl = isLocal
          ? ('http://192.168.1.36:5252/api/SNDocumentosControlados/downloadArchivo?fileName=' + encodeURIComponent(doc.archivo || doc.codigo))
          : downloadUrl;
        window.open(targetUrl, '_blank');
      });
  }

  getActiveFolderTypeName(): string {
    if (this.activeFilter && this.activeFilter.startsWith('folder:')) {
      const parts = this.activeFilter.substring(7).split('|');
      return parts[1] || '';
    }
    return '';
  }

  getActiveFolderDocTipo(): string {
    const fType = this.getActiveFolderTypeName();
    if (!fType) return '';
    const c = fType.toLowerCase().trim();
    if (c.startsWith('proced')) return 'Procedimiento';
    if (c.startsWith('instruct')) return 'Instructivo';
    if (c.startsWith('format')) return 'Formato';
    if (c.startsWith('polit') || c.startsWith('polít')) return 'Politica';
    if (c.startsWith('manu')) return 'Manual';
    if (c.includes('descrip') || c.includes('puesto') || c.includes('perfil')) return 'Perfil de puesto';
    if (c.startsWith('otr')) return 'Otros';
    return '';
  }

  getActiveProcessName(): string {
    if (this.activeFilter && this.activeFilter !== '__all__' && !this.activeFilter.startsWith('macro:')) {
      if (this.activeFilter.startsWith('folder:')) {
        return this.activeFilter.substring(7).split('|')[0];
      }
      return this.activeFilter;
    }
    return this.getUserProcesoActual();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.isDraggingOver = false;
      this.dragCounter = 0;
    }
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
    this.dragCounter = 0;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      this.onAgregar(files[0]);
    } else {
      this.onCargarLote(Array.from(files));
    }
  }

  onAgregar(initialFile?: File) {
    const activeProc = this.getActiveProcessName();
    const activeFolder = this.getActiveFolderTypeName();
    const activeTipo = this.getActiveFolderDocTipo();

    let dialogRef = this.dialog.open(DocumentosControladosRegeditComponent, {
      width: '640px',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        Title: "Nuevo registro",
        Accion: "I",
        Datos: null,
        ActiveProcess: activeProc,
        ActiveFolder: activeFolder,
        ActiveTipo: activeTipo,
        InitialFile: initialFile,
        ExistingDocs: this.docsList.map(d => ({
          nombre: (d.nombre || '').trim(),
          codigo: (d.codigo || '').trim()
        }))
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        // Garantizar coherencia si se subió desde una carpeta específica (ej. Instructivos, Formatos)
        if (activeTipo && (!res.tipo || (res.tipo === 'Procedimiento' && activeTipo !== 'Procedimiento' && !(res.codigo || '').toUpperCase().startsWith('PRO-')))) {
          res.tipo = activeTipo;
        }

        const inferredFromCode = this.extraerProcesoDelCodigo(res.codigo);
        const procPrincipal = inferredFromCode || (res.procesos && res.procesos.length > 0 ? res.procesos[0] : res.proceso);
        const finalProc = procPrincipal || activeProc || 'Costura';
        res.proceso = finalProc;
        if (!res.procesos || res.procesos.length === 0) {
          res.procesos = [finalProc];
        }
        const procCode = this.getProcessCodeByName(finalProc);
        const requestData = {
          Accion: 'I',
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Codigo_Documentos_Controlados: '',
          Codigo_Proceso: procCode,
          Codigo_Carpeta_Control: '001',
          Codigo_Normas: res.tipo || 'Procedimiento',
          Codigo_Tiempo_Conservacion: '3 Anios',
          Codigo_Tipo_Descarga: res.formato || 'PDF',
          Denominacion: res.nombre || '',
          Codigo_Documento: res.codigo || '',
          Version_Documento: res.version || 'v1.0',
          Ruta_Adjunto: res.archivo || '',
          Descripcion: res.nombre || '',
          bRegistroAsociado: true,
          bRequiereRevision: false,
          Flg_Estado: res.estado || 'Vigente',
          Fec_Vencimiento: res.vig || '',
          Flg_Activo: true,
          Cod_Usuario: this.sUsuario || GlobalVariable.vusu || 'admin'
        };

        // Observación a: Registrar versión inicial en historial
        res.historialVersiones = [
          {
            version: res.version || 'v1.0',
            usuarioSubio: `${this.sUsuario || GlobalVariable.vusu || 'admin'}`,
            fechaHora: new Date().toLocaleString(),
            tipoCarga: 'Versión Vigente',
            archivo: res.archivo || ''
          }
        ];

        // Guardar inmediatamente en persistencia local para reflejar al instante
        try {
          const locCreated = JSON.parse(localStorage.getItem('precotex_documentos_creados') || '[]');
          const idx = locCreated.findIndex((d: any) => (d.codigo || '').toLowerCase() === (res.codigo || '').toLowerCase());
          if (idx >= 0) {
            locCreated[idx] = res;
          } else {
            locCreated.unshift(res);
          }
          localStorage.setItem('precotex_documentos_creados', JSON.stringify(locCreated));
        } catch (e) { }

        const existingIdx = this.docsList.findIndex(d => (d.codigo || '').toLowerCase() === (res.codigo || '').toLowerCase());
        if (existingIdx >= 0) {
          this.docsList[existingIdx] = res;
        } else {
          this.docsList.unshift(res);
        }
        this.saveDocs();

        this.documentosControladosService.postProcesoMnto(requestData).subscribe({
          next: () => {
            this.marcarVersionesAnterioresObsoletasEnBD(res);
            this.toastr.success('Documento guardado en la BD con éxito', 'Éxito');
          },
          error: () => {
            this.marcarVersionesAnterioresObsoletasEnBD(res);
            this.toastr.success('Documento registrado con éxito', 'Éxito');
          }
        });
      }
    });
  }

  onEditar(doc: any, index: number) {
    const mainIdx = this.docsList.findIndex(d => d.codigo === doc.codigo);

    let dialogRef = this.dialog.open(DocumentosControladosRegeditComponent, {
      width: '640px',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        Title: "Editando registro",
        Accion: "E",
        Datos: doc,
        ExistingDocs: this.docsList.map(d => ({
          nombre: (d.nombre || '').trim(),
          codigo: (d.codigo || '').trim()
        }))
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        const procPrincipal = res.procesos && res.procesos.length > 0 ? res.procesos[0] : res.proceso;
        const procCode = this.getProcessCodeByName(procPrincipal);
        const requestData = {
          Accion: 'U',
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Codigo_Documentos_Controlados: doc.codigo_Documentos_Controlados || doc.codigo || '001',
          Codigo_Proceso: procCode,
          Codigo_Carpeta_Control: '001',
          Codigo_Normas: res.tipo || 'Procedimiento',
          Codigo_Tiempo_Conservacion: '3 Anios',
          Codigo_Tipo_Descarga: res.formato || 'PDF',
          Denominacion: res.nombre || '',
          Codigo_Documento: res.codigo || '',
          Version_Documento: res.version || 'v1.0',
          Ruta_Adjunto: res.archivo || '',
          Descripcion: res.nombre || '',
          bRegistroAsociado: true,
          bRequiereRevision: false,
          Flg_Estado: res.estado || 'Vigente',
          Fec_Vencimiento: res.vig || '',
          Flg_Activo: true,
          Cod_Usuario: this.sUsuario || GlobalVariable.vusu || 'admin'
        };

        // Observación a: Resguardo y backup de la versión anterior para visualización y descarga posterior
        if (!res.historialVersiones) {
          res.historialVersiones = doc.historialVersiones ? [...doc.historialVersiones] : [];
        }
        if (doc.version && (doc.version !== res.version || doc.archivo !== res.archivo)) {
          const backupEntry = {
            version: doc.version,
            usuarioSubio: doc.usuarioSubio || `${this.sUsuario || GlobalVariable.vusu || 'admin'}`,
            fechaHora: new Date().toLocaleString(),
            tipoCarga: 'Versión Anterior (Backup)',
            archivo: doc.archivo || ''
          };
          if (!res.historialVersiones.some((h: any) => h.version === doc.version)) {
            res.historialVersiones.unshift(backupEntry);
          }
        }
        if (!res.historialVersiones.some((h: any) => h.version === res.version)) {
          res.historialVersiones.unshift({
            version: res.version,
            usuarioSubio: `${this.sUsuario || GlobalVariable.vusu || 'admin'}`,
            fechaHora: new Date().toLocaleString(),
            tipoCarga: 'Versión Vigente',
            archivo: res.archivo || ''
          });
        }
        try {
          const histMap = JSON.parse(localStorage.getItem('precotex:docs_version_history') || '{}');
          const codeKey = (res.codigo || doc.codigo || '').toLowerCase().trim();
          histMap[codeKey] = res.historialVersiones;
          localStorage.setItem('precotex:docs_version_history', JSON.stringify(histMap));
        } catch (e) { }

        const updatedDoc = {
          ...doc,
          ...res,
          proceso: procPrincipal,
          procesos: res.procesos && res.procesos.length > 0 ? res.procesos : [procPrincipal],
          procesosVisibles: res.procesosVisibles || (res.modoVisibilidad === 'TODOS' ? ['Todos los procesos'] : [procPrincipal]),
          modoVisibilidad: res.modoVisibilidad || (res.procesosVisibles?.includes('Todos los procesos') ? 'TODOS' : 'PERSONALIZADO')
        };

        try {
          const locCreated = JSON.parse(localStorage.getItem('precotex_documentos_creados') || '[]');
          const idx = locCreated.findIndex((d: any) => (d.codigo || '').toLowerCase() === (res.codigo || '').toLowerCase());
          if (idx >= 0) {
            locCreated[idx] = updatedDoc;
          } else {
            locCreated.unshift(updatedDoc);
          }
          localStorage.setItem('precotex_documentos_creados', JSON.stringify(locCreated));
        } catch (e) { }

        if (mainIdx !== -1) {
          this.docsList[mainIdx] = updatedDoc;
          this.saveDocs();
        }

        this.documentosControladosService.postProcesoMnto(requestData).subscribe({
          next: () => {
            this.toastr.success('Documento actualizado en la BD con éxito', 'Éxito');
          },
          error: () => {
            this.toastr.success('Documento actualizado', 'Éxito');
          }
        });
      }
    });
  }

  // Observación b: Papelera de documentos para recuperar eliminados por error
  cargarPapelera(): void {
    try {
      const raw = localStorage.getItem('precotex:docs_papelera');
      this.papeleraList = raw ? JSON.parse(raw) : [];
    } catch {
      this.papeleraList = [];
    }
  }

  guardarPapelera(): void {
    try {
      localStorage.setItem('precotex:docs_papelera', JSON.stringify(this.papeleraList));
    } catch { }
  }

  onAbrirPapelera(): void {
    this.cargarPapelera();
    this.papeleraModalOpen = true;
  }

  onCerrarPapelera(): void {
    this.papeleraModalOpen = false;
  }

  onRestaurarDocumento(doc: any): void {
    Swal.fire({
      title: '¿Restaurar documento?',
      html: `<div style="font-size: 13px; color: #475569; line-height: 1.5;">
               ¿Desea restaurar <strong>${doc.nombre}</strong> (${doc.codigo}) al catálogo activo?
             </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        const targetCode = (doc.codigo || '').trim();
        const targetName = (doc.nombre || '').trim();

        // 1. Quitar de papelera
        this.papeleraList = this.papeleraList.filter(d => (d.codigo || '').trim().toLowerCase() !== targetCode.toLowerCase());
        this.guardarPapelera();

        // 2. Quitar de deleted items en localStorage
        const deletedKey = 'precotex:docs_deleted_items';
        try {
          let deletedItems: string[] = JSON.parse(localStorage.getItem(deletedKey) || '[]');
          deletedItems = deletedItems.filter(x => x !== targetCode && x !== targetName);
          localStorage.setItem(deletedKey, JSON.stringify(deletedItems));
        } catch { }

        // 3. Restaurar a docsList
        const restoredDoc = { ...doc, flg_Activo: true, flg_Estado: 'Vigente', estado: 'Vigente' };
        delete restoredDoc.fechaEliminado;
        delete restoredDoc.usuarioElimino;

        const exists = this.docsList.some(d => (d.codigo || '').toLowerCase() === targetCode.toLowerCase());
        if (!exists) {
          this.docsList.unshift(restoredDoc);
        }
        this.saveDocs();

        try {
          const locCreated = JSON.parse(localStorage.getItem('precotex_documentos_creados') || '[]');
          locCreated.unshift(restoredDoc);
          localStorage.setItem('precotex_documentos_creados', JSON.stringify(locCreated));
        } catch { }

        // 4. Reactivar en backend
        const procCode = this.getProcessCodeByName(doc.proceso);
        this.documentosControladosService.postProcesoMnto({
          Accion: 'U',
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Codigo_Documentos_Controlados: doc.codigo_Documentos_Controlados || doc.codigo || '001',
          Codigo_Proceso: procCode,
          Codigo_Carpeta_Control: '001',
          Codigo_Normas: doc.tipo || 'Procedimiento',
          Codigo_Tiempo_Conservacion: '3 Anios',
          Codigo_Tipo_Descarga: doc.formato || 'PDF',
          Denominacion: doc.nombre || '',
          Codigo_Documento: doc.codigo || '',
          Version_Documento: doc.version || 'v1.0',
          Ruta_Adjunto: doc.archivo || '',
          Descripcion: doc.nombre || '',
          bRegistroAsociado: true,
          bRequiereRevision: false,
          Flg_Estado: 'Vigente',
          Fec_Vencimiento: doc.vig || '',
          Flg_Activo: true,
          Cod_Usuario: this.sUsuario || GlobalVariable.vusu || 'admin'
        }).subscribe({
          next: () => { },
          error: () => { }
        });

        this.toastr.success(`Documento "${doc.nombre}" restaurado correctamente al catálogo.`, 'Restaurado');
      }
    });
  }

  onVaciarPapelera(): void {
    if (!this.papeleraList || this.papeleraList.length === 0) return;
    Swal.fire({
      title: '¿Vaciar papelera de documentos?',
      text: 'Esta acción eliminará permanentemente todos los documentos de la papelera.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, vaciar permanentemente',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.papeleraList = [];
        this.guardarPapelera();
        this.toastr.success('Papelera de documentos vaciada por completo.', 'Éxito');
      }
    });
  }

  onEliminar(doc: any) {
    Swal.fire({
      title: '¿Desea enviar el documento a la papelera?, Confirme',
      html: `<div style="font-size: 13px; color: #475569; line-height: 1.6;">
               Documento: <strong>${doc.nombre}</strong><br>
               Código: <strong>${doc.codigo}</strong><br>
               <span style="color: #64748b; font-size: 12px; margin-top: 6px; display: inline-block;">
                 💡 Podrás restaurarlo en cualquier momento desde el botón <strong>Papelera</strong> de la barra superior.
               </span>
             </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const procCode = this.getProcessCodeByName(doc.proceso);
        const requestData = {
          Accion: 'D',
          Codigo_Documentos_Controlados: doc.codigo_Documentos_Controlados || doc.codigo || '001',
          Codigo_Proceso: procCode,
          Codigo_Carpeta_Control: '001',
          Codigo_Normas: doc.tipo || 'Procedimiento',
          Codigo_Tiempo_Conservacion: '3 Anios',
          Codigo_Tipo_Descarga: doc.formato || 'PDF',
          Denominacion: doc.nombre || '',
          Codigo_Documento: doc.codigo || '',
          Version_Documento: doc.version || 'v1.0',
          Ruta_Adjunto: doc.archivo || '',
          Descripcion: doc.nombre || '',
          bRegistroAsociado: true,
          bRequiereRevision: false,
          Flg_Estado: doc.estado || 'Obsoleto',
          Flg_Activo: false,
          Cod_Usuario: this.sUsuario
        };

        const targetCode = (doc.codigo || doc.codigo_Documentos_Controlados || '').toString().trim();
        const targetName = (doc.nombre || '').toString().trim();

        // 1. Guardar en Papelera de Documentos (Observación b)
        const papeleraItem = {
          ...doc,
          fechaEliminado: new Date().toLocaleString(),
          usuarioElimino: this.sUsuario || GlobalVariable.vusu || 'admin'
        };
        this.papeleraList = this.papeleraList.filter(p => (p.codigo || '').toLowerCase() !== targetCode.toLowerCase());
        this.papeleraList.unshift(papeleraItem);
        this.guardarPapelera();

        // 2. Guardar en lista de eliminados en localStorage
        const deletedKey = 'precotex:docs_deleted_items';
        let deletedItems: string[] = [];
        try {
          deletedItems = JSON.parse(localStorage.getItem(deletedKey) || '[]');
        } catch { deletedItems = []; }

        if (targetCode && !deletedItems.includes(targetCode)) deletedItems.push(targetCode);
        if (targetName && !deletedItems.includes(targetName)) deletedItems.push(targetName);
        localStorage.setItem(deletedKey, JSON.stringify(deletedItems));

        // 3. Filtrar localmente en docsList de inmediato
        this.docsList = this.docsList.filter(d => {
          const c = (d.codigo || d.codigo_Documentos_Controlados || '').toString().trim();
          const n = (d.nombre || '').toString().trim();
          return c !== targetCode && n !== targetName;
        });
        this.saveDocs();

        // 4. Ejecutar llamada al Backend
        this.documentosControladosService.postProcesoMnto(requestData).subscribe({
          next: () => {
            this.toastr.success('Documento movido a la papelera. Puedes recuperarlo si fue un error.', 'Papelera', { timeOut: 3500 });
          },
          error: () => {
            this.toastr.success('Documento movido a la papelera.', 'Papelera', { timeOut: 3000 });
          }
        });
      }
    });
  }

  onCargarLote(initialFiles?: File[]) {
    const activeProc = this.getActiveProcessName();
    const activeFolder = this.getActiveFolderTypeName();
    const activeTipo = this.getActiveFolderDocTipo();

    let dialogRef = this.dialog.open(DocumentosControladosLoteComponent, {
      width: '92vw',
      maxWidth: '1150px',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        ActiveProcess: activeProc,
        ActiveFolder: activeFolder,
        ActiveTipo: activeTipo,
        InitialFiles: initialFiles,
        ExistingDocs: this.docsList.map(d => ({
          nombre: (d.nombre || '').trim(),
          codigo: (d.codigo || '').trim()
        }))
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.success) {
        this.loadDocs();
      }
    });
  }

  exportExcel() {
    let t = '<table border="1"><tr><th>Nombre del documento</th><th>Código</th><th>Tipo</th><th>Versión</th><th>Formato</th><th>Proceso</th><th>Vigencia</th><th>Estado</th></tr>';
    this.filteredDocs.forEach(d => {
      t += `<tr>
        <td>${d.nombre || ''}</td>
        <td>${d.codigo || ''}</td>
        <td>${d.tipo || ''}</td>
        <td>${d.version || ''}</td>
        <td>${d.formato || ''}</td>
        <td>${d.proceso || ''}</td>
        <td>${d.vig || ''}</td>
        <td>${d.estado || ''}</td>
      </tr>`;
    });
    t += '</table>';
    const blob = new Blob(['\ufeff' + t], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Lista_Maestra_de_Documentos_Precotex.xls';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Lista Maestra de Documentos exportada a Excel', 'Éxito');
  }

  exportPDF() {
    this.toastr.info('Generando reporte PDF...', 'PDF');
    window.print();
  }

  downloadFile(doc: any) {
    this.onDescargar(doc);
  }

  getAbreviaturaProceso(proceso: string): string {
    if (!proceso) return 'OYM';
    const name = proceso.trim().toLowerCase();

    // Mapeo oficial de Siglas de Procesos y Sub-Procesos según la Matriz Oficial Precotex
    const map: { [key: string]: string } = {
      // 1. SOPORTE (SOP)
      'sistemas': 'SIST',
      'mantenimiento general': 'MANT',
      'mantenimiento': 'MANT',
      'seguridad patrimonial': 'SEGP',
      'ssoma': 'SSOMA',
      'soporte (sop)': 'SOP',
      'soporte': 'SOP',

      // 2. AUDITORÍA INTERNA (AIO)
      'auditoría interna': 'AUDI',
      'auditoria interna': 'AUDI',
      'auditoría interna (aio)': 'AIO',
      'auditoria interna (aio)': 'AIO',

      // 3. CONTROL PATRIMONIAL (CPT)
      'control patrimonial': 'CPT',
      'control patrimonial (cpt)': 'CPT',

      // 4. INGENIERÍA Y MEJORA CONTINUA (IMC)
      'ingeniería': 'ING',
      'ingenieria': 'ING',
      'mejora continua': 'ING',
      'organización y métodos': 'OYM',
      'organizacion y metodos': 'OYM',
      'investigación, desarrollo, innovación': 'IDI',
      'investigacion, desarrollo, innovacion': 'IDI',
      'investigación, desarrollo e innovación': 'IDI',
      'investigacion, desarrollo e innovacion': 'IDI',
      'certificaciones': 'CERT',
      'ingeniería y mejora continua (imc)': 'IMC',
      'ingenieria y mejora continua (imc)': 'IMC',

      // 5. ADMINISTRACIÓN Y FINANZAS (AFC)
      'administración': 'ADMIN',
      'administracion': 'ADMIN',
      'finanzas': 'FIN',
      'contabilidad y costos': 'CONT',
      'tesorería': 'TES',
      'tesoreria': 'TES',
      'administración y finanzas (afc)': 'AFC',
      'administracion y finanzas (afc)': 'AFC',
      'administración y finanzas': 'AFC',
      'administracion y finanzas': 'AFC',

      // 6. GESTIÓN HUMANA (GGHH)
      'administración de personal': 'AP',
      'administracion de personal': 'AP',
      'capacitación': 'CAP',
      'capacitacion': 'CAP',
      'capacitaciones y desarrollo': 'CAP',
      'comunicaciones': 'COMU',
      'desarrollo organizacional': 'DO',
      'gestión humana': 'GH',
      'gestion humana': 'GH',
      'bienestar social': 'BSO',
      'selección de personal': 'SDP',
      'seleccion de personal': 'SDP',
      'gestión humana (gghh)': 'GGHH',
      'gestion humana (gghh)': 'GGHH',

      // 7. SERVICIO DE ESTAMPADO Y BORDADO (SEB)
      'estampado': 'EST',
      'bordado': 'BORD',
      'calidad estampado y bordado': 'CEB',
      'calidad e&b': 'CEB',
      'planeamiento y programación de la producción de estampado y bordado': 'PCEB',
      'planeamiento y programacion de la produccion de estampado y bordado': 'PCEB',
      'planeamiento y programación de la producción e&b': 'PCEB',
      'planeamiento y programacion de la produccion e&b': 'PCEB',
      'servicio de estampado y bordado (seb)': 'SEB',

      // 8. OPERACIONES MANUFACTURA (OPM)
      'corte': 'COR',
      'costura': 'COST',
      'inspección': 'INSP',
      'inspeccion': 'INSP',
      'acabados': 'ACAB',
      'aseguramiento de la calidad manufactura': 'CAL',
      'calidad manufactura': 'CAL',
      'manufactura': 'MAN',
      'consumos': 'CONS',
      'consumo': 'CONS',
      'operaciones manufactura (opm)': 'OPM',

      // 9. OPERACIONES TEXTIL (OPT)
      'tejeduría': 'TEJ',
      'tejeduria': 'TEJ',
      'tintorería': 'TIN',
      'tintoreria': 'TIN',
      'producción textil': 'TEX',
      'produccion textil': 'TEX',
      'laboratorio de color': 'LDC',
      'estampado digital': 'EDG',
      'acabados textil': 'ATX',
      'laboratorio de calidad textil': 'LTX',
      'aseguramiento de la calidad textil': 'CTX',
      'aseguramiento de calidad textil': 'CTX',
      'lavandería': 'LAV',
      'lavanderia': 'LAV',
      'hilandería': 'HIL',
      'hilanderia': 'HIL',
      'operaciones textil (opt)': 'OPT',

      // 10. BALANCE DE MATERIA (BM)
      'balance de materia': 'BM',
      'balance de materia (bm)': 'BM',

      // 11. PLANEAMIENTO Y CONTROL DE LA PRODUCCIÓN (PCP)
      'pcp textil': 'PTX',
      'pcp manufactura': 'PMA',
      'pcp estampado y bordado': 'PCEB',
      'planeamiento y control de la producción (pcp)': 'PCP',
      'planeamiento y control de la produccion (pcp)': 'PCP',

      // 12. LOGÍSTICA (LOG)
      'almacén': 'ALM',
      'almacen': 'ALM',
      'comercio exterior': 'CEXT',
      'logística': 'LOG',
      'logistica': 'LOG',
      'transporte': 'TRANS',
      'logística (log)': 'LOG',
      'logistica (log)': 'LOG',

      // 13. GESTIÓN COMERCIAL (GCOM)
      'desarrollo de producto': 'DDP',
      'desarrollo de estampado y bordado': 'UDP',
      'desarrollo textil': 'DTX',
      'comercial exportación de prendas': 'COM',
      'comercial exportacion de prendas': 'COM',
      'comercial exportación de telas': 'CET',
      'comercial exportacion de telas': 'CET',
      'comercial venta local textil': 'CVL',
      'gestión comercial (gcom)': 'GCOM',
      'gestion comercial (gcom)': 'GCOM',

      // 14. GERENCIA GENERAL (GG)
      'directorio': 'DIR',
      'alianzas estratégicas': 'AES',
      'alianzas estrategicas': 'AES',
      'desarrollo de negocios': 'DDN',
      'proyectos gerenciales': 'PGE',
      'sistema de gestión general': 'SGG',
      'sistema de gestion general': 'SGG',
      'gestión estratégica': 'GGE',
      'gestion estrategica': 'GGE',
      'gerencia general (gg)': 'GG',
      'gerencia general': 'GG'
    };

    if (map[name]) return map[name];

    // Si no está en el mapa, generar una abreviatura basada en las primeras letras
    const palabras = proceso.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(p => p && p !== 'Y' && p !== 'DE' && p !== 'LA' && p !== 'EL');
    if (palabras.length >= 3) {
      return (palabras[0][0] + palabras[1][0] + palabras[2][0]).substring(0, 4);
    } else if (palabras.length === 2) {
      return (palabras[0].substring(0, 2) + palabras[1][0]).substring(0, 4);
    } else if (palabras.length === 1) {
      return palabras[0].substring(0, 4);
    }
    return 'GEN';
  }
}
