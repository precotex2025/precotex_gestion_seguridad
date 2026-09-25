import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
    const allMacros = Object.keys(this.PROCESOS_GROUPS);
    if (!this.searchProcesoTree || !this.searchProcesoTree.trim()) return allMacros;
    const q = this.searchProcesoTree.toLowerCase().trim();
    return allMacros.filter(macro => {
      if (macro.toLowerCase().includes(q)) return true;
      const procs = this.PROCESOS_GROUPS[macro] || [];
      return procs.some(p => p.toLowerCase().includes(q) || this.getAbreviaturaProceso(p).toLowerCase().includes(q));
    });
  }

  getFilteredProcesosByMacro(macro: string): string[] {
    const list = this.PROCESOS_GROUPS[macro] || [];
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
        } catch (e) {}
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

  PROCESOS_GROUPS: { [key: string]: string[] } = {};

  defaultDocs = [
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
    private headerTitleService: HeaderTitleService
  ) {}

  procesosMap: { [name: string]: string } = {};
  codeToProcessMap: { [code: string]: string } = {};

  // DOC-08: Identificación automática del proceso/área del usuario conectado
  getUserProcesoActual(): string {
    let proc = (localStorage.getItem('precotex:usuario:proceso') || '').trim();
    if (proc && proc.toLowerCase() !== 'general') return proc;

    const puesto = (localStorage.getItem('precotex:usuario:puesto') || '').trim();
    if (puesto) {
      if (puesto.toLowerCase().includes('costura')) return 'Costura';
      if (puesto.toLowerCase().includes('estampado')) return 'Estampado';
      if (puesto.toLowerCase().includes('ssoma')) return 'SSOMA';
      if (puesto.toLowerCase().includes('calidad')) return 'Calidad';
      if (puesto.toLowerCase().includes('sistemas')) return 'Sistemas';
      if (puesto.toLowerCase().includes('auditor')) return 'Auditoría Interna';
      if (puesto.toLowerCase().includes('patrimonial')) return 'Control Patrimonial';
    }

    const puestosRaw = localStorage.getItem('precotex_puestos_usuarios') || localStorage.getItem('precotex:puestos:listado');
    if (puestosRaw) {
      try {
        const userNom = (localStorage.getItem('precotex:usuario:nombre') || GlobalVariable.vusu || '').trim().toLowerCase();
        const pList = JSON.parse(puestosRaw);
        const matchP = pList.find((p: any) => 
          (p.usuario || '').toLowerCase().includes(userNom) || 
          (p.puesto || '').toLowerCase() === puesto.toLowerCase()
        );
        if (matchP && matchP.proceso) return matchP.proceso;
      } catch (e) {}
    }

    return '';
  }

  ngOnInit(): void {
    // Cargar permisos finos del usuario
    this.loadFinePermissions();

    this.loadDocs();
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.PROCESOS_GROUPS = groups;
      }
    });

    this.procesosService.getListadoProcesos('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          res.elements.forEach((p: any) => {
            const name = (p.proceso || p.nombre_Proceso || p.denominacion || '').trim();
            const code = (p.codigo_Proceso || p.codigoProceso || '').toString().trim();
            if (name && code) {
              this.procesosMap[name.toLowerCase()] = code;
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

    // Restaurar filtro guardado en LocalStorage Presets
    if (typeof localStorage !== 'undefined') {
      const savedFilter = localStorage.getItem('precotex:pref:docs_activeFilter');
      if (savedFilter) {
        this.activeFilter = savedFilter;
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
    return this.procesosMap[key] || '011';
  }

  getProcessNameByCode(code: any): string {
    if (!code) return 'Organización y Métodos';
    const strCode = code.toString().trim();
    return this.codeToProcessMap[strCode] || this.codeToProcessMap[strCode.padStart(3, '0')] || 'Organización y Métodos';
  }

  loadDocs() {
    this.documentosControladosService.getListadoDocumentosControlados('001', '', '', '').subscribe({
      next: (res: any) => {
        let rawList: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          rawList = res.elements.map((d: any) => {
            const procName = d.nombre_Proceso || d.proceso || (d.codigo_Proceso ? this.getProcessNameByCode(d.codigo_Proceso) : 'Organización y Métodos');
            const codDoc = d.codigo_Documento || d.codigo_Documentos_Controlados || d.codigo || 'DOC-' + (d.id || '001');
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
              procesos: d.procesos || (d.nombre_Proceso ? [d.nombre_Proceso] : [procName]),
              raw: d
            };
          });
        } else {
          rawList = [...this.defaultDocs];
        }

        const localCreatedRaw = localStorage.getItem('precotex_documentos_creados');
        if (localCreatedRaw) {
          try {
            const localCreated: any[] = JSON.parse(localCreatedRaw);
            localCreated.forEach(locDoc => {
              const codeClean = (locDoc.codigo || locDoc.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
              const nomClean = (locDoc.nombre || locDoc.denominacion || '').toString().trim().toLowerCase();
              const exists = rawList.some((r: any) => {
                const rCode = (r.codigo || r.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
                const rNom = (r.nombre || r.denominacion || '').toString().trim().toLowerCase();
                const cMatch = codeClean !== '' && rCode !== '' && rCode === codeClean;
                const nMatch = nomClean !== '' && rNom !== '' && rNom === nomClean;
                return cMatch || nMatch;
              });
              if (!exists) {
                rawList.unshift(locDoc);
              }
            });
          } catch (e) {}
        }

        if (this.docsList && this.docsList.length > 0) {
          this.docsList.forEach(curr => {
            const codeClean = (curr.codigo || curr.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
            const nomClean = (curr.nombre || curr.denominacion || '').toString().trim().toLowerCase();
            const exists = rawList.some((r: any) => {
              const rCode = (r.codigo || r.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
              const rNom = (r.nombre || r.denominacion || '').toString().trim().toLowerCase();
              const cMatch = codeClean !== '' && rCode !== '' && rCode === codeClean;
              const nMatch = nomClean !== '' && rNom !== '' && rNom === nomClean;
              return cMatch || nMatch;
            });
            if (!exists) {
              rawList.unshift(curr);
            }
          });
        }

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

        const vusuStr = (GlobalVariable.vusu || localStorage.getItem('vusu') || localStorage.getItem('precotex:usuario:nombre') || '').toLowerCase().trim();
        const rolVal = (localStorage.getItem('vCod_Rol') || GlobalVariable.vCod_Rol || '0').toString();
        const isUserAdmin = rolVal === '1' || vusuStr === 'admin' || vusuStr === 'superadmin' || vusuStr === 'administrador' || vusuStr.includes('admin');

        if (!isUserAdmin) {
          const userProceso = this.getUserProcesoActual();
          if (userProceso && userProceso.toLowerCase() !== 'general') {
            rawList = rawList.filter((d: any) => {
              const docP = (d.proceso || '').toLowerCase().trim();
              const uP = userProceso.toLowerCase().trim();
              const esMismoProceso = docP === uP || docP.includes(uP) || uP.includes(docP);
              
              const visList: string[] = d.procesosVisibles || [];
              const esPublico = visList.length === 0 || visList.includes('Todos los procesos') || visList.includes('__ALL__');
              const tienePermisoEspecifico = visList.some((p: string) => p.toLowerCase().trim() === uP);

              return esMismoProceso || esPublico || tienePermisoEspecifico;
            });
          }
        }

        this.docsList = rawList;
        this.aplicarReglaObsoletosPorVersion(this.docsList);
        this.restaurarHistorialVersiones(this.docsList);
        this.saveDocs();
      },
      error: () => {
        let rawList = [...this.defaultDocs];

        const localCreatedRaw = localStorage.getItem('precotex_documentos_creados');
        if (localCreatedRaw) {
          try {
            const localCreated: any[] = JSON.parse(localCreatedRaw);
            localCreated.forEach(locDoc => {
              const codeClean = (locDoc.codigo || locDoc.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
              const nomClean = (locDoc.nombre || locDoc.denominacion || '').toString().trim().toLowerCase();
              const exists = rawList.some((r: any) => {
                const rCode = (r.codigo || r.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
                const rNom = (r.nombre || r.denominacion || '').toString().trim().toLowerCase();
                const cMatch = codeClean !== '' && rCode !== '' && rCode === codeClean;
                const nMatch = nomClean !== '' && rNom !== '' && rNom === nomClean;
                return cMatch || nMatch;
              });
              if (!exists) {
                rawList.unshift(locDoc);
              }
            });
          } catch (e) {}
        }

        if (this.docsList && this.docsList.length > 0) {
          this.docsList.forEach(curr => {
            const codeClean = (curr.codigo || curr.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
            const nomClean = (curr.nombre || curr.denominacion || '').toString().trim().toLowerCase();
            const exists = rawList.some((r: any) => {
              const rCode = (r.codigo || r.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
              const rNom = (r.nombre || r.denominacion || '').toString().trim().toLowerCase();
              const cMatch = codeClean !== '' && rCode !== '' && rCode === codeClean;
              const nMatch = nomClean !== '' && rNom !== '' && rNom === nomClean;
              return cMatch || nMatch;
            });
            if (!exists) {
              rawList.unshift(curr);
            }
          });
        }

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

        const vusuStr = (GlobalVariable.vusu || localStorage.getItem('vusu') || localStorage.getItem('precotex:usuario:nombre') || '').toLowerCase().trim();
        const rolVal = (localStorage.getItem('vCod_Rol') || GlobalVariable.vCod_Rol || '0').toString();
        const isUserAdmin = rolVal === '1' || vusuStr === 'admin' || vusuStr === 'superadmin' || vusuStr === 'administrador' || vusuStr.includes('admin');

        if (!isUserAdmin) {
          const userProceso = this.getUserProcesoActual();
          if (userProceso && userProceso.toLowerCase() !== 'general') {
            rawList = rawList.filter((d: any) => {
              const docP = (d.proceso || '').toLowerCase().trim();
              const uP = userProceso.toLowerCase().trim();
              const esMismoProceso = docP === uP || docP.includes(uP) || uP.includes(docP);

              const visList: string[] = d.procesosVisibles || [];
              const esPublico = visList.length === 0 || visList.includes('Todos los procesos') || visList.includes('__ALL__');
              const tienePermisoEspecifico = visList.some((p: string) => p.toLowerCase().trim() === uP);

              return esMismoProceso || esPublico || tienePermisoEspecifico;
            });
          }
        }
        this.docsList = rawList;
        this.aplicarReglaObsoletosPorVersion(this.docsList);
        this.restaurarHistorialVersiones(this.docsList);
        this.saveDocs();
      }
    });
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
    } catch (e) {}
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
          const fullName = (p.usuario || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (!fullName || fullName === '—') return false;
          const parts = fullName.split(/\s+/);
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
    const processes = this.PROCESOS_GROUPS[group] || [];
    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      return processes.some(p => procs.includes(p) || d.proceso === p) || procs.includes('Todos los procesos');
    }).length;
  }

  getProcessCount(proc: string): number {
    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      return procs.includes(proc) || d.proceso === proc || procs.includes('Todos los procesos');
    }).length;
  }

  setFilter(filterValue: string) {
    this.activeFilter = filterValue;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('precotex:pref:docs_activeFilter', filterValue);
    }
    this.updateHeaderTitle();
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
        breadcrumb: `Documentación · ${macro}`
      });
      return;
    }

    if (this.activeFilter.startsWith('folder:')) {
      const parts = this.activeFilter.substring(7).split('|');
      const proc = parts[0];
      const folderType = parts[1] || '';
      this.headerTitleService.setTitle({
        title: folderType ? `${proc} — ${folderType}` : proc,
        breadcrumb: folderType ? `Documentación · ${proc} · ${folderType}` : `Documentación · ${proc}`
      });
      return;
    }

    // Proceso directo (ej: 'Auditoría Interna')
    this.headerTitleService.setTitle({
      title: this.activeFilter,
      breadcrumb: `Documentación · ${this.activeFilter}`
    });
  }

  getActiveFolderTitle(): string {
    if (!this.activeFilter || this.activeFilter === '__all__') return 'Todos los procesos';
    if (this.activeFilter.startsWith('macro:')) return this.activeFilter.substring(6);
    if (this.activeFilter.startsWith('folder:')) {
      const parts = this.activeFilter.substring(7).split('|');
      return parts[1] ? `${parts[0]} — ${parts[1]}` : parts[0];
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
    return this.docsList.filter(d => {
      const procs = this.getDocProcesosList(d);
      if (!procs.includes(procName) && d.proceso !== procName && !procs.includes('Todos los procesos')) return false;
      const t = (d.tipo || '').toLowerCase();
      const target = tipoName.toLowerCase();
      if (target === 'otros') {
        return !['procedimiento', 'instructivo', 'formato', 'politica', 'manual', 'perfil', 'descripci'].some(k => t.includes(k));
      }
      if (target.includes('descripci') || target.includes('puesto')) {
        return t.includes('perfil') || t.includes('puesto') || t.includes('descripci') || (!['procedimiento', 'instructivo', 'formato', 'politica', 'manual'].some(k => t.includes(k)));
      }
      return t.includes(target.substring(0, 4));
    }).length;
  }

  // DOC-03: Modificables solo por Administradores
  onEditarCarpetasAdmin(): void {
    if (!this.isUserAdmin) {
      this.toastr.warning('La edición de carpetas está restringida únicamente para Administradores.', 'Restricción DOC-03');
      return;
    }

    Swal.fire({
      title: '📁 Nombres de Carpetas por Proceso (DOC-03)',
      html: `
        <div style="text-align: left; font-size: 13px; color: #334155; line-height: 1.6;">
          <p>Los nombres de carpetas están estandarizados por proceso y son gestionados únicamente por el Administrador:</p>
          <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px;">
            <div>📂 <strong>Procedimientos</strong> (Direccionamiento automático de código PRO-)</div>
            <div>📂 <strong>Instructivos</strong> (Direccionamiento automático de código INS-)</div>
            <div>📂 <strong>Formatos</strong> (Direccionamiento automático de código FOR-)</div>
            <div>📂 <strong>Politica</strong> (Direccionamiento automático de código POL-)</div>
            <div>📂 <strong>Manual</strong> (Direccionamiento automático de código MAN-)</div>
            <div>📂 <strong>Descripción del Puesto</strong> (Para C&D / Otros para demás procesos)</div>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    });
  }

  get filteredDocs() {
    let list = this.docsList;
    if (this.activeFilter !== '__all__') {
      if (this.activeFilter.startsWith('macro:')) {
        const macro = this.activeFilter.substring(6);
        const processes = this.PROCESOS_GROUPS[macro] || [];
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          return processes.some(p => procs.includes(p) || d.proceso === p) || procs.includes('Todos los procesos');
        });
      } else if (this.activeFilter.startsWith('folder:')) {
        // Formato: folder:NombreProceso|TipoCarpeta
        const parts = this.activeFilter.substring(7).split('|');
        const proc = parts[0];
        const folderType = parts[1];
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          const matchesProc = procs.includes(proc) || d.proceso === proc || procs.includes('Todos los procesos');
          if (!matchesProc) return false;
          const t = (d.tipo || '').toLowerCase();
          const target = folderType.toLowerCase();
          if (target === 'otros') {
            return !['procedimiento', 'instructivo', 'formato', 'politica', 'manual', 'perfil', 'descripci'].some(k => t.includes(k));
          }
          if (target.includes('descripci') || target.includes('puesto')) {
            return t.includes('perfil') || t.includes('puesto') || t.includes('descripci') || (!['procedimiento', 'instructivo', 'formato', 'politica', 'manual'].some(k => t.includes(k)));
          }
          return t.includes(target.substring(0, 4));
        });
      } else {
        list = list.filter(d => {
          const procs = this.getDocProcesosList(d);
          return procs.includes(this.activeFilter) || d.proceso === this.activeFilter || procs.includes('Todos los procesos');
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
          this.documentosControladosService.postProcesoMnto(requestData).subscribe({ next: () => {}, error: () => {} });
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
            <strong>⚠️ Importante:</strong> Esta acción queda registrada como constancia de lectura obligatoria semestral (DOC-07). 
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
        this.registrarRevisionLectura(doc, 'Visto Bueno Semestral (DOC-07)');

        // Guardar en localStorage para persistencia
        this.guardarVistoBuenoLocal(doc);
        this.saveDocs();

        this.toastr.success(`Visto Bueno registrado por ${usuario}`, 'Lectura Confirmada (DOC-07)');

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

  // DOC-07: Reporte de Jefaturas - Solo Admin: quién leyó y quién NO leyó sus documentos
  onReporteVistoBueno(): void {
    const registros: any[] = (() => {
      try { return JSON.parse(localStorage.getItem('precotex_vistos_buenos') || '[]'); } catch { return []; }
    })();

    // Construir filas de documentos con y sin visto bueno
    const docsConVisto = this.docsList.filter(d => d.vistoBuenoInfo);
    const docsSinVisto = this.docsList.filter(d => !d.vistoBuenoInfo);

    const filasConVisto = docsConVisto.length > 0 ? docsConVisto.map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 10px; font-family: monospace; font-weight: 600; color: #2563eb;">${d.codigo}</td>
        <td style="padding: 6px 10px; color: #0f172a; font-weight: 600;">${d.nombre}</td>
        <td style="padding: 6px 10px; color: #475569;">${d.proceso || 'General'}</td>
        <td style="padding: 6px 10px; color: #15803d; font-weight: 700;">${d.vistoBuenoInfo.usuario}</td>
        <td style="padding: 6px 10px; color: #475569;">${d.vistoBuenoInfo.puesto}</td>
        <td style="padding: 6px 10px; font-family: monospace; color: #475569; font-size: 11px;">${d.vistoBuenoInfo.fecha}</td>
        <td style="padding: 6px 10px; text-align: center;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 10px; font-weight: 700; font-size: 10px;">✅ LEÍDO</span></td>
      </tr>
    `).join('') : `<tr><td colspan="7" style="padding: 14px; text-align: center; color: #64748b; font-style: italic;">Ningún documento tiene Visto Bueno registrado aún.</td></tr>`;

    const filasSinVisto = docsSinVisto.length > 0 ? docsSinVisto.map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: #fef2f2;">
        <td style="padding: 6px 10px; font-family: monospace; font-weight: 600; color: #dc2626;">${d.codigo}</td>
        <td style="padding: 6px 10px; color: #0f172a; font-weight: 600;">${d.nombre}</td>
        <td style="padding: 6px 10px; color: #475569;">${d.proceso || 'General'}</td>
        <td colspan="3" style="padding: 6px 10px; color: #dc2626; font-weight: 600; text-align: center;">— Pendiente de lectura —</td>
        <td style="padding: 6px 10px; text-align: center;"><span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 10px; font-weight: 700; font-size: 10px;">⏳ PENDIENTE</span></td>
      </tr>
    `).join('') : '';

    const reporteHtml = `
      <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #1e293b; max-height: 70vh; overflow-y: auto;">
        
        <!-- RESUMEN EJECUTIVO -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: 800; color: #15803d;">${docsConVisto.length}</div>
            <div style="font-size: 11px; color: #166534; font-weight: 600;">Documentos Leídos</div>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${docsSinVisto.length}</div>
            <div style="font-size: 11px; color: #991b1b; font-weight: 600;">Pendientes de Lectura</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: 800; color: #2563eb;">${this.docsList.length}</div>
            <div style="font-size: 11px; color: #1e40af; font-weight: 600;">Total Documentos</div>
          </div>
        </div>

        <!-- TABLA DE DOCUMENTOS LEÍDOS -->
        <h4 style="font-size: 13px; font-weight: 700; color: #15803d; margin: 0 0 8px 0;">
          ✅ Documentos con Visto Bueno Confirmado
        </h4>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #166534; color: #ffffff;">
                <th style="padding: 6px 10px; text-align: left;">Código</th>
                <th style="padding: 6px 10px; text-align: left;">Documento</th>
                <th style="padding: 6px 10px; text-align: left;">Proceso</th>
                <th style="padding: 6px 10px; text-align: left;">Jefe / Usuario</th>
                <th style="padding: 6px 10px; text-align: left;">Puesto</th>
                <th style="padding: 6px 10px; text-align: left;">Fecha</th>
                <th style="padding: 6px 10px; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>${filasConVisto}</tbody>
          </table>
        </div>

        <!-- TABLA DE DOCUMENTOS PENDIENTES -->
        ${docsSinVisto.length > 0 ? `
          <h4 style="font-size: 13px; font-weight: 700; color: #dc2626; margin: 0 0 8px 0;">
            ⏳ Documentos Pendientes de Lectura
          </h4>
          <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #fca5a5; margin-bottom: 10px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background: #991b1b; color: #ffffff;">
                  <th style="padding: 6px 10px; text-align: left;">Código</th>
                  <th style="padding: 6px 10px; text-align: left;">Documento</th>
                  <th style="padding: 6px 10px; text-align: left;">Proceso</th>
                  <th colspan="3" style="padding: 6px 10px; text-align: center;">Responsable</th>
                  <th style="padding: 6px 10px; text-align: center;">Estado</th>
                </tr>
              </thead>
              <tbody>${filasSinVisto}</tbody>
            </table>
          </div>
        ` : ''}

      </div>
    `;

    Swal.fire({
      title: '📊 Reporte de Lectura Semestral - Jefaturas (DOC-07)',
      html: reporteHtml,
      width: '900px',
      confirmButtonText: 'Cerrar Reporte',
      confirmButtonColor: '#2563eb'
    });
  }

  // Helper para registrar cada ingreso o revisión real de un usuario sobre el documento (DOC-09)
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
    this.registrarRevisionLectura(doc, 'Consulta de Histórico (DOC-09)');

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
      title: '📜 Histórico de Versiones y Revisiones (DOC-09)',
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

        if (isPdf) {
          // PDF: Fetch as Blob y mostrar inline
          fetch(docUrl)
            .then(res => res.blob())
            .then(blob => {
              const pdfBlob = new Blob([blob], { type: 'application/pdf' });
              const pdfUrl = URL.createObjectURL(pdfBlob);
              container.innerHTML = `
                <div style="width: 100%; height: 72vh; background: #0f172a; border-radius: 6px; overflow: hidden;">
                  <iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
              `;
            }).catch(() => {
              container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 40px;">Error al cargar el PDF. Use el botón "Descargar Archivo Original" para obtener el documento.</p>`;
            });
        } else if (isWord) {
          // Word DOCX: Fetch como ArrayBuffer y convertir a HTML con mammoth.js
          fetch(docUrl)
            .then(res => res.arrayBuffer())
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
    this.toastr.info(`Preparando descarga limpia: ${nombreLimpio}`, 'Descarga de Documento (DOC-05)');

    // 3. Descargar vía Blob de JavaScript para forzar que el navegador aplique el Nombre del Documento
    fetch(downloadUrl)
      .then(response => {
        if (!response.ok) throw new Error('Respuesta de red no OK');
        return response.blob();
      })
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
        // Fallback directo si ocurre alguna restricción de red
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = nombreLimpio;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
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
    let dialogRef = this.dialog.open(DocumentosControladosRegeditComponent, {
      width: '640px',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        Title: "Nuevo registro",
        Accion: "I",
        Datos: null,
        ActiveProcess: activeProc,
        InitialFile: initialFile,
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
        } catch (e) {}

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
        } catch (e) {}

        try {
          const locCreated = JSON.parse(localStorage.getItem('precotex_documentos_creados') || '[]');
          const idx = locCreated.findIndex((d: any) => (d.codigo || '').toLowerCase() === (res.codigo || '').toLowerCase());
          if (idx >= 0) {
            locCreated[idx] = res;
          } else {
            locCreated.unshift(res);
          }
          localStorage.setItem('precotex_documentos_creados', JSON.stringify(locCreated));
        } catch (e) {}

        if (mainIdx !== -1) {
          this.docsList[mainIdx] = res;
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
    } catch {}
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
        } catch {}

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
        } catch {}

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
          next: () => {},
          error: () => {}
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
    let dialogRef = this.dialog.open(DocumentosControladosLoteComponent, {
      width: '92vw',
      maxWidth: '1150px',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        ActiveProcess: activeProc,
        InitialFiles: initialFiles
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
    const fileName = doc.archivo || doc.codigo;
    if (fileName) {
      const url = this.documentosControladosService.getDownloadUrl(fileName);
      window.open(url, '_blank');
      this.toastr.success(`Descargando: ${fileName}`, 'Descargar');
    } else {
      this.toastr.warning('El registro no tiene un archivo adjunto.', 'Descargar');
    }
  }

  getAbreviaturaProceso(proceso: string): string {
    if (!proceso) return 'OYM';
    const name = proceso.trim().toLowerCase();
    
    // Mapeo explícito de procesos estándar de Precotex
    const map: { [key: string]: string } = {
      'organización y métodos': 'OYM',
      'organizacion y metodos': 'OYM',
      'control patrimonial': 'CTP',
      'auditoría interna': 'AIO',
      'auditoria interna': 'AIO',
      'sistemas': 'SIS',
      'mantenimiento': 'MNT',
      'calidad': 'CAL',
      'costura': 'COS',
      'acabados': 'ACA',
      'aseguramiento de la calidad': 'ADC',
      'consumos': 'CON',
      'corte': 'COR',
      'inspección': 'INS',
      'inspeccion': 'INS',
      'acabados textil': 'ACT',
      'aseguramiento de calidad textil': 'ADT',
      'estampado digital': 'ESD',
      'laboratorio de color': 'LDC',
      'lavandería': 'LAV',
      'lavanderia': 'LAV',
      'tejeduría': 'TEJ',
      'tejeduria': 'TEJ',
      'tintorería': 'TIN',
      'tintoreria': 'TIN',
      'administración y finanzas': 'AYF',
      'administracion y finanzas': 'AYF',
      'administración': 'ADM',
      'administracion': 'ADM',
      'contabilidad y costos': 'CYC',
      'finanzas': 'FIN',
      'tesorería': 'TES',
      'tesoreria': 'TES'
    };

    if (map[name]) return map[name];

    // Si no está en el mapa, generar una abreviatura de 3 letras basada en las primeras letras de las palabras
    const palabras = proceso.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(p => p && p !== 'Y' && p !== 'DE' && p !== 'LA' && p !== 'EL');
    if (palabras.length >= 3) {
      return (palabras[0][0] + palabras[1][0] + palabras[2][0]).substring(0, 3);
    } else if (palabras.length === 2) {
      return (palabras[0].substring(0, 2) + palabras[1][0]).substring(0, 3);
    } else if (palabras.length === 1) {
      return palabras[0].substring(0, 3);
    }
    return 'GEN';
  }
}
