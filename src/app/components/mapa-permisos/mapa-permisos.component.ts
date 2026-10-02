import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PermisosService } from '../../services/permisos.service';
import { PuestosService } from '../../services/puestos.service';

@Component({
  selector: 'app-mapa-permisos',
  standalone: false,
  templateUrl: './mapa-permisos.component.html',
  styleUrls: ['./mapa-permisos.component.css']
})
export class MapaPermisosComponent implements OnInit {

  permsDefault = {
    'Inicio (Dashboard)': { ger: ['Ver'], jef: ['Ver'], ope: ['Ver'] },
    'Organización': { ger: ['Ver', 'Editar', 'Aprobar'], jef: ['Ver'], ope: ['Ver'] },
    'Puestos': { ger: ['Ver', 'Usuarios'], jef: ['Ver', 'Usuarios'], ope: ['Ver'] },
    'Documentación': { ger: ['Ver', 'Aprobar', 'Exportar'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver', 'Exportar'] },
    'Auditorías': { ger: ['Ver', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver'] },
    'No conformidades': { ger: ['Ver', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver', 'Registrar'] },
    'Indicadores': { ger: ['Ver'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver', 'Registrar'] },
    'Objetivos': { ger: ['Ver', 'Editar', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver', 'Registrar'] },
    'Riesgos': { ger: ['Ver', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver', 'Registrar'] },
    'Portafolio de Mejora': { ger: ['Ver'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver', 'Registrar'] },
    'Gestión Legal': { ger: ['Ver', 'Aprobar'], jef: ['Ver', 'Registrar'], ope: ['Ver'] },
    'Proveedores': { ger: ['Ver', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar'], ope: ['Ver'] },
    'Ayuda': { ger: ['Ver'], jef: ['Ver'], ope: ['Ver'] }
  };

  perms: any = {};

  appl: any = {
    'Inicio (Dashboard)': ['Ver', 'Exportar'],
    'Organización': ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Aprobar', 'Descargar'],
    'Puestos': ['Ver', 'Editar', 'Usuarios'],
    'Documentación': ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Aprobar', 'Exportar'],
    'Auditorías': ['Ver', 'Registrar', 'Editar', 'Aprobar', 'Exportar'],
    'No conformidades': ['Ver', 'Registrar', 'Editar', 'Aprobar'],
    'Indicadores': ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Exportar'],
    'Objetivos': ['Ver', 'Registrar', 'Editar', 'Aprobar'],
    'Riesgos': ['Ver', 'Registrar', 'Editar', 'Aprobar'],
    'Portafolio de Mejora': ['Ver', 'Registrar', 'Editar', 'Aprobar'],
    'Gestión Legal': ['Ver', 'Registrar', 'Editar', 'Aprobar'],
    'Proveedores': ['Ver', 'Registrar', 'Editar', 'Aprobar', 'Exportar'],
    'Ayuda': ['Ver']
  };

  permTree: any = {
    'Inicio (Dashboard)': [
      ['Tablero general', 'Ver', 1, 1, 1],
      ['Tablero general', 'Exportar', 1, 1, 0],
      ['Accesos directos', 'Ver', 1, 1, 1]
    ],
    'Organización': [
      ['Política del SIG', 'Ver', 1, 1, 1],
      ['Política del SIG', 'Editar', 1, 0, 0],
      ['Política del SIG', 'Aprobar', 1, 0, 0],
      ['Gestión de Normas y certificaciones', 'Ver', 1, 1, 1],
      ['Gestión de Normas y certificaciones', 'Crear', 1, 0, 0],
      ['Gestión de Normas y certificaciones', 'Editar', 1, 0, 0],
      ['Gestión de Normas y certificaciones', 'Eliminar', 1, 0, 0],
      ['Certificados (archivo)', 'Descargar', 1, 1, 1],
      ['Estructura (sedes)', 'Ver', 1, 1, 1],
      ['Estructura (sedes)', 'Crear / Editar', 1, 0, 0]
    ],
    'Puestos': [
      ['Puestos y usuarios', 'Ver', 1, 1, 1],
      ['Puestos y usuarios', 'Crear usuario', 1, 1, 0],
      ['Puestos y usuarios', 'Editar', 1, 1, 0],
      ['Puestos y usuarios', 'Eliminar', 1, 0, 0],
      ['Permisos por módulo', 'Ver', 1, 1, 0],
      ['Permisos por módulo', 'Asignar / Editar', 1, 1, 0],
      ['Auditoría de cambios', 'Ver', 1, 1, 0]
    ],
    'Documentación': [
      ['Documentos', 'Ver', 1, 1, 1],
      ['Documentos', 'Crear', 1, 1, 0],
      ['Documentos', 'Editar', 1, 1, 0],
      ['Documentos', 'Eliminar / Obsoletar', 1, 0, 0],
      ['Documentos', 'Aprobar', 1, 0, 0],
      ['Documentos', 'Descargar', 1, 1, 1],
      ['Historial de versiones', 'Ver', 1, 1, 1],
      ['Historial de versiones', 'Restaurar versión', 1, 0, 0]
    ],
    'Auditorías': [
      ['Planificación', 'Ver', 1, 1, 1],
      ['Planificación', 'Crear / Planificar', 1, 1, 0],
      ['Planificación', 'Editar', 1, 1, 0],
      ['Hallazgos', 'Registrar', 1, 1, 0],
      ['Hallazgos', 'Ver', 1, 1, 1],
      ['Cierre de auditoría', 'Aprobar', 1, 0, 0],
      ['Programa anual', 'Ver', 1, 1, 1],
      ['Programa anual', 'Exportar', 1, 1, 0]
    ],
    'No conformidades': [
      ['Declaración de NC', 'Registrar', 1, 1, 1],
      ['Declaración de NC', 'Ver', 1, 1, 1],
      ['Acciones correctivas', 'Registrar', 1, 1, 1],
      ['Acciones correctivas', 'Editar', 1, 1, 1],
      ['Acciones correctivas', 'Ver', 1, 1, 1],
      ['Cierre de NC', 'Aprobar', 1, 1, 0]
    ],
    'Indicadores': [
      ['Alta de indicadores', 'Ver', 1, 1, 1],
      ['Alta de indicadores', 'Crear', 1, 1, 0],
      ['Alta de indicadores', 'Editar', 1, 1, 0],
      ['Alta de indicadores', 'Eliminar', 1, 0, 0],
      ['Medición', 'Registrar medición', 0, 1, 1],
      ['Medición', 'Ver', 1, 1, 1],
      ['Medición', 'Exportar', 1, 1, 0]
    ],
    'Objetivos': [
      ['Planificación', 'Ver', 1, 1, 1],
      ['Planificación', 'Crear / Editar', 1, 1, 0],
      ['Planificación', 'Aprobar', 1, 0, 0],
      ['Medición', 'Registrar medición', 0, 1, 1],
      ['Medición', 'Ver', 1, 1, 1]
    ],
    'Riesgos': [
      ['Declaración de riesgo', 'Ver', 1, 1, 1],
      ['Declaración de riesgo', 'Registrar', 1, 1, 1],
      ['Declaración de riesgo', 'Editar', 1, 1, 1],
      ['Control / estado', 'Aprobar', 1, 1, 0]
    ],
    'Portafolio de Mejora': [
      ['Iniciativas', 'Ver', 1, 1, 1],
      ['Iniciativas', 'Registrar', 1, 1, 1],
      ['Iniciativas', 'Editar', 1, 1, 1],
      ['Cierre', 'Aprobar', 1, 1, 0]
    ],
    'Gestión Legal': [
      ['Matriz legal', 'Ver', 1, 1, 1],
      ['Matriz legal', 'Crear / Editar', 1, 1, 0],
      ['Matriz legal', 'Aprobar', 1, 0, 0],
      ['Alertas', 'Ver', 1, 1, 1]
    ],
    'Proveedores': [
      ['Catálogo de proveedores', 'Ver', 1, 1, 1],
      ['Catálogo de proveedores', 'Registrar', 1, 1, 0],
      ['Catálogo de proveedores', 'Editar', 1, 1, 0],
      ['Homologación y contratos', 'Ver', 1, 1, 1],
      ['Homologación y contratos', 'Aprobar', 1, 0, 0],
      ['Evaluación de desempeño', 'Registrar', 1, 1, 0],
      ['Evaluación de desempeño', 'Ver', 1, 1, 1]
    ],
    'Ayuda': [
      ['Guías y FAQ', 'Ver', 1, 1, 1]
    ]
  };

  puestosList: any[] = [];
  selectedUserId: string = '';
  selectedModule: string = 'Organización';
  pmodsList = [
    { k: 'organizacion', l: 'ORGANIZ.' },
    { k: 'documentacion', l: 'DOCS' },
    { k: 'auditorias', l: 'AUDITORÍAS' },
    { k: 'noconf', l: 'NC' },
    { k: 'indicadores', l: 'INDICAD.' },
    { k: 'objetivos', l: 'OBJET.' },
    { k: 'riesgos', l: 'RIESGOS' },
    { k: 'mejora', l: 'MEJORA' },
    { k: 'legal', l: 'LEGAL' },
    { k: 'proveedores', l: 'PROVEED.' }
  ];

  opeDef: any = {
    organizacion: 'Ver',
    documentacion: 'Ver',
    auditorias: 'Ver',
    noconf: 'Editar',
    indicadores: 'Editar',
    objetivos: 'Ver',
    riesgos: 'Editar',
    mejora: 'Editar',
    legal: 'Ver',
    proveedores: 'Ver'
  };

  accObj: any = {};
  accFine: any = {};
  // Búsqueda y Paginación (Sección 2 y Sección 3)
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 8;
  currentPageColab: number = 1;
  pageSizeColab: number = 5;

  get filteredPuestosList(): any[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.puestosList || [];
    }
    const term = this.searchTerm.trim().toLowerCase();
    return (this.puestosList || []).filter(u => {
      const p = (u.puesto || '').toLowerCase();
      const nom = (u.usuario || '').toLowerCase();
      const usr = (u.cod_Usuario || '').toLowerCase();
      const niv = (u.nivel || '').toLowerCase();
      return p.includes(term) || nom.includes(term) || usr.includes(term) || niv.includes(term);
    });
  }

  get paginatedPuestosList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPuestosList.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPuestosList.length / this.pageSize) || 1;
  }

  get pagesArray(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      arr.push(i);
    }
    return arr;
  }

  get paginationInfo(): string {
    const total = this.filteredPuestosList.length;
    if (total === 0) return '0 colaboradores';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);
    return `Mostrando ${start} - ${end} de ${total} colaboradores`;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  get paginatedColabList(): any[] {
    const start = (this.currentPageColab - 1) * this.pageSizeColab;
    return this.filteredPuestosList.slice(start, start + this.pageSizeColab);
  }

  get totalPagesColab(): number {
    return Math.ceil(this.filteredPuestosList.length / this.pageSizeColab) || 1;
  }

  get pagesArrayColab(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPagesColab; i++) {
      arr.push(i);
    }
    return arr;
  }

  get paginationColabInfo(): string {
    const total = this.filteredPuestosList.length;
    if (total === 0) return '0 colaboradores';
    const start = (this.currentPageColab - 1) * this.pageSizeColab + 1;
    const end = Math.min(this.currentPageColab * this.pageSizeColab, total);
    return `Mostrando ${start} - ${end} de ${total} colaboradores`;
  }

  goToPageColab(page: number): void {
    if (page >= 1 && page <= this.totalPagesColab) {
      this.currentPageColab = page;
    }
  }

  prevPageColab(): void {
    if (this.currentPageColab > 1) {
      this.currentPageColab--;
    }
  }

  nextPageColab(): void {
    if (this.currentPageColab < this.totalPagesColab) {
      this.currentPageColab++;
    }
  }

  onSearchChange(val: string): void {
    this.searchTerm = val || '';
    this.currentPage = 1;
    this.currentPageColab = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.currentPageColab = 1;
  }


  // Slide-over Drawer & Hover Highlighting States
  drawerOpen: boolean = false;
  drawerUser: any = null;
  hoveredRow: string = '';
  hoveredCol: string = '';
  mostrarBanner: boolean = false;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  openDrawer(user: any): void {
    this.drawerUser = user;
    this.selectedUserId = user.id;
    this.drawerOpen = true;

    // Desplazamiento automático suave hacia la sección de ajuste en la parte inferior
    setTimeout(() => {
      const el = document.getElementById('panel-ajuste-abajo');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.drawerUser = null;
  }

  setHoveredCell(row: string, col: string): void {
    this.hoveredRow = row;
    this.hoveredCol = col;
  }

  initials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  clearHoveredCell(): void {
    this.hoveredRow = '';
    this.hoveredCol = '';
  }

  actColors: any = {
    'Ver': '#5b8def',
    'Registrar': '#3ecf8e',
    'Editar': '#f0b429',
    'Eliminar': '#f0576b',
    'Aprobar': '#a99bff',
    'Exportar': '#6f7590',
    'Usuarios': '#a99bff',
    'Descargar': '#6f7590',
    'Crear': '#3ecf8e',
    'Crear usuario': '#a99bff',
    'Crear / Editar': '#f0b429',
    'Crear / Planificar': '#3ecf8e',
    'Restaurar versión': '#a99bff',
    'Asignar / Editar': '#f0b429',
    'Eliminar / Obsoletar': '#f0576b'
  };

  constructor(
    private toastr: ToastrService,
    private permisosService: PermisosService,
    private puestosService: PuestosService
  ) { }


  ngOnInit(): void {
    this.loadPolicy();
    this.loadFineAcc();
    this.loadGeneralAcc();
    this.loadPuestos();
  }

  loadPuestos() {
    this.puestosService.getListadoPuesto('001', '', '').subscribe({
      next: (res: any) => {
        let dbList: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          dbList = res.elements.map((p: any) => ({
            id: p.denominacion ? p.denominacion.trim() : p.codigo_Puesto,
            codigo_Puesto: p.codigo_Puesto,
            puesto: p.denominacion ? p.denominacion.trim() : '',
            usuario: p.puesto_Funciones || '—',
            nivel: p.nivelRiesgo || p.codigo_Nivel_Riesgo || 'Operativo',
            estado: p.puesto_Caracteristicas || 'Activo'
          }));
        }

        const localPuestos = localStorage.getItem('precotex_puestos_usuarios');
        const localList = localPuestos ? JSON.parse(localPuestos) : [];

        const combinedMap = new Map<string, any>();
        for (const item of [...dbList, ...localList]) {
          const key = item.puesto || item.denominacion || item.id || item.codigo_Puesto;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, { ...item, id: key });
          }
        }

        this.puestosList = Array.from(combinedMap.values());
        if (this.puestosList.length > 0 && !this.selectedUserId) {
          this.selectedUserId = this.puestosList[0].id;
        }
      },
      error: () => {
        const localPuestos = localStorage.getItem('precotex_puestos_usuarios');
        this.puestosList = localPuestos ? JSON.parse(localPuestos) : [
          { id: 'p-1', puesto: 'Gerente de Producción', usuario: 'Carlos Ríos', nivel: 'Gerencial', estado: 'Activo' },
          { id: 'p-2', puesto: 'Jefe de SSOMA', usuario: 'Ana Torres', nivel: 'Jefatura', estado: 'Activo' },
          { id: 'p-3', puesto: 'Asistente de Costura', usuario: '', nivel: 'Operativo', estado: 'Sin permisos config.' }
        ];
        if (this.puestosList.length > 0 && !this.selectedUserId) {
          this.selectedUserId = this.puestosList[0].id;
        }
      }
    });
  }

  loadGeneralAcc() {
    this.permisosService.getPermisosUsuarioModulo('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          res.elements.forEach((row: any) => {
            const rawCode = (row.codigo_Puesto_Usuario || '').trim();
            const mod = (row.modulo_Clave || '').trim();
            if (rawCode && mod) {
              if (!this.accObj[rawCode]) {
                this.accObj[rawCode] = {};
              }
              this.accObj[rawCode][mod] = row.nivel_Acceso;
              this.accObj[rawCode][mod.toLowerCase()] = row.nivel_Acceso;
            }
          });
          this.saveGeneralAcc();
        } else {
          this.readLocalGeneralAcc();
        }
      },
      error: () => this.readLocalGeneralAcc()
    });
  }

  private readLocalGeneralAcc() {
    const local = localStorage.getItem('precotex:puestos:accesos');
    if (local) {
      try {
        this.accObj = JSON.parse(local);
      } catch (e) {
        this.accObj = {};
      }
    } else {
      this.accObj = {};
    }
  }

  saveGeneralAcc() {
    localStorage.setItem('precotex:puestos:accesos', JSON.stringify(this.accObj));
  }

  getSelectedPuestoName(uid: string): string {
    const item = this.puestosList.find(p => p.id === uid || p.codigo_Puesto === uid || p.puesto === uid);
    if (item && item.puesto) {
      return item.puesto.trim();
    }
    return uid;
  }

  accDefault(nivel: string, mk: string): string {
    const cleanNivel = (nivel || '').trim().toLowerCase();
    if (cleanNivel.includes('geren') || cleanNivel.includes('jefa')) {
      return 'Editar';
    }
    const cleanKey = mk.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return this.opeDef[mk] || this.opeDef[cleanKey] || 'Ver';
  }

  accGet(uid: string, nivel: string, mk: string): string {
    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid);
    const puestoNombre = (item?.puesto || this.getSelectedPuestoName(uid) || '').trim();
    const puestoCode = (item?.codigo_Puesto || '').trim();
    const userCode = (item?.cod_Usuario || '').trim().toLowerCase();
    const cleanKey = mk.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const checkObj = (obj: any): string | null => {
      if (!obj) return null;
      if (obj[mk]) return obj[mk];
      if (obj[cleanKey]) return obj[cleanKey];
      for (const k of Object.keys(obj)) {
        if (k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === cleanKey) {
          return obj[k];
        }
      }
      return null;
    };

    const val = (puestoCode ? checkObj(this.accObj[puestoCode]) : null) ||
                (userCode ? checkObj(this.accObj[userCode]) : null) ||
                checkObj(this.accObj[uid]) ||
                (puestoNombre ? checkObj(this.accObj[puestoNombre]) : null);
    if (val) return val;

    return this.accDefault(nivel, mk);
  }

  setAcceso(uid: string, mk: string, val: string) {
    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid);
    const puestoNombre = (item?.puesto || this.getSelectedPuestoName(uid) || '').trim();
    const puestoCode = (item?.codigo_Puesto || '').trim();
    const userCode = (item?.cod_Usuario || '').trim().toLowerCase();

    // Normalizar y obtener variantes con y sin tildes para asegurar guardado completo
    const cleanKey = mk.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const moduleVariants: { [k: string]: string[] } = {
      'organizacion': ['organizacion', 'organización'],
      'documentacion': ['documentacion', 'documentación'],
      'auditorias': ['auditorias', 'auditorías'],
      'noconf': ['noconf'],
      'indicadores': ['indicadores'],
      'objetivos': ['objetivos'],
      'riesgos': ['riesgos'],
      'mejora': ['mejora'],
      'legal': ['legal'],
      'proveedores': ['proveedores']
    };
    const keysToSave = moduleVariants[cleanKey] || [mk, cleanKey];

    const targets = Array.from(new Set([uid, puestoNombre, puestoCode, userCode].filter(Boolean)));
    targets.forEach(t => {
      if (!this.accObj[t]) {
        this.accObj[t] = {};
      }
      keysToSave.forEach(k => {
        this.accObj[t][k] = val;
      });
    });

    this.saveGeneralAcc();

    // Guardar en la base de datos para todas las variantes clave
    const identifier = puestoNombre || puestoCode || uid;
    keysToSave.forEach(modK => {
      this.permisosService.postGuardarUsuarioModulo({
        Codigo_Puesto_Usuario: identifier,
        Modulo_Clave: modK,
        Nivel_Acceso: val
      }).subscribe();
    });

    this.toastr.success('Se guardó con éxito.', '', { timeOut: 1500 });
  }

  accColor(v: string): string {
    if (v === 'Editar') return '#3ecf8e'; // green
    if (v === 'Ver') return '#5b8def'; // blue
    return 'rgba(148, 163, 184, 0.45)'; // faint / gray
  }


  normLvl(l: string): string {
    if (!l) return 'ger';
    const lower = l.toLowerCase();
    if (lower.startsWith('ger')) return 'ger';
    if (lower.startsWith('jef')) return 'jef';
    if (lower.startsWith('ope')) return 'ope';
    return lower;
  }

  loadPolicy() {
    this.permisosService.getPoliticas().subscribe({
      next: (res: any) => {
        const loadedPerms: any = JSON.parse(JSON.stringify(this.permsDefault));

        if (res && res.success && res.elements && res.elements.length > 0) {
          res.elements.forEach((row: any) => {
            const m = row.modulo;
            const lKey = this.normLvl(row.nivel);
            const a = row.accion;

            if (!loadedPerms[m]) {
              loadedPerms[m] = { ger: [], jef: [], ope: [] };
            }
            if (!loadedPerms[m][lKey]) {
              loadedPerms[m][lKey] = [];
            }

            const idx = loadedPerms[m][lKey].indexOf(a);
            if (row.flg_Permitido) {
              if (idx < 0) {
                loadedPerms[m][lKey].push(a);
              }
            } else {
              if (idx >= 0) {
                loadedPerms[m][lKey].splice(idx, 1);
              }
            }
          });
        }
        this.perms = loadedPerms;
        this.savePolicy();
      },
      error: () => this.readLocalPolicy()
    });
  }

  private readLocalPolicy() {
    const local = localStorage.getItem('precotex:permisos_politica');
    if (local) {
      try {
        this.perms = JSON.parse(local);
      } catch (e) {
        this.perms = JSON.parse(JSON.stringify(this.permsDefault));
      }
    } else {
      this.perms = JSON.parse(JSON.stringify(this.permsDefault));
    }
  }

  savePolicy() {
    localStorage.setItem('precotex:permisos_politica', JSON.stringify(this.perms));
  }

  togglePol(mod: string, lvl: string, act: string) {
    const lKey = this.normLvl(lvl);
    if (!this.perms[mod]) {
      this.perms[mod] = { ger: [], jef: [], ope: [] };
    }
    if (!this.perms[mod][lKey]) {
      this.perms[mod][lKey] = [];
    }
    const idx = this.perms[mod][lKey].indexOf(act);
    if (idx >= 0) {
      this.perms[mod][lKey].splice(idx, 1);
    } else {
      this.perms[mod][lKey].push(act);
    }
    this.savePolicy();

    const isAllowed = this.isPolActive(mod, lKey, act);
    this.permisosService.postGuardarPolitica({
      Modulo: mod,
      Nivel: lKey,
      Accion: act,
      Flg_Permitido: isAllowed
    }).subscribe({
      next: () => this.toastr.success('Política de nivel guardada en la BD.', '', { timeOut: 1500 }),
      error: () => this.toastr.success('Política de nivel actualizada.', '', { timeOut: 1500 })
    });
  }

  isPolActive(mod: string, lvl: string, act: string): boolean {
    const lKey = this.normLvl(lvl);
    return this.perms[mod] && this.perms[mod][lKey] && this.perms[mod][lKey].includes(act);
  }

  resetPolitica() {
    this.perms = JSON.parse(JSON.stringify(this.permsDefault));
    this.savePolicy();
    this.toastr.success('Políticas restablecidas.', '', { timeOut: 2000 });
  }

  // Override / Ajuste Fino
  loadFineAcc() {
    this.permisosService.getPermisosUsuarioDetalle('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          res.elements.forEach((row: any) => {
            const uid = row.codigo_Puesto_Usuario;
            if (!this.accFine[uid]) {
              this.accFine[uid] = {};
            }
            const key = this.finoKey(row.modulo, row.contenido, row.accion);
            this.accFine[uid][key] = row.flg_Permitido ? 1 : 0;
          });
          this.saveFineAcc();
        } else {
          this.readLocalFineAcc();
        }
      },
      error: () => this.readLocalFineAcc()
    });
  }

  private readLocalFineAcc() {
    const local = localStorage.getItem('precotex:puestos:accesos_fino');
    if (local) {
      try {
        this.accFine = JSON.parse(local);
      } catch (e) {
        this.accFine = {};
      }
    } else {
      this.accFine = {};
    }
  }

  saveFineAcc() {
    localStorage.setItem('precotex:puestos:accesos_fino', JSON.stringify(this.accFine));
  }

  finoKey(mod: string, cont: string, acc: string): string {
    return mod + '||' + cont + '||' + acc;
  }

  finoGet(uid: string, level: string, mod: string, cont: string, acc: string, def: number): number {
    const k = this.finoKey(mod, cont, acc);
    if (!this.accFine) return def;

    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid) || this.drawerUser;
    const puestoNombre = (item?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || "").trim().toLowerCase();

    const targets = Array.from(new Set([uid, puestoNombre, puestoCode, userCode].filter(Boolean)));
    for (const t of targets) {
      if (this.accFine[t] && k in this.accFine[t]) {
        return this.accFine[t][k];
      }
    }
    return def;
  }

  toggleFinoCheckbox(uid: string, mod: string, cont: string, acc: string, checked: boolean) {
    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid) || this.drawerUser;
    const puestoNombre = (item?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || "").trim().toLowerCase();
    const key = this.finoKey(mod, cont, acc);
    const val = checked ? 1 : 0;

    const targets = Array.from(new Set([uid, puestoNombre, puestoCode, userCode].filter(Boolean)));
    targets.forEach(t => {
      if (!this.accFine[t]) {
        this.accFine[t] = {};
      }
      this.accFine[t][key] = val;
    });

    this.saveFineAcc();

    this.permisosService.postGuardarUsuarioDetalle({
      Codigo_Puesto_Usuario: puestoNombre,
      Modulo: mod,
      Contenido: cont,
      Accion: acc,
      Flg_Permitido: checked
    }).subscribe({
      next: () => this.toastr.success("Permiso específico guardado en la BD.", "", { timeOut: 1500 }),
      error: () => this.toastr.success("Permiso específico actualizado.", "", { timeOut: 1500 })
    });
  }

  resetFino() {
    const uid = this.selectedUserId;
    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid) || this.drawerUser;
    const puestoNombre = (item?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || "").trim().toLowerCase();
    const mod = this.selectedModule;

    const targets = Array.from(new Set([uid, puestoNombre, puestoCode, userCode].filter(Boolean)));
    targets.forEach(t => {
      if (this.accFine && this.accFine[t]) {
        Object.keys(this.accFine[t]).forEach(k => {
          if (k.startsWith(mod + "||")) {
            delete this.accFine[t][k];
          }
        });
      }
    });

    this.saveFineAcc();
    this.toastr.success("Acceso restablecido al nivel correspondiente.", "", { timeOut: 2000 });
  }

  nivelIdx(n: string): number {
    const clean = (n || "").trim().toLowerCase();
    if (clean.includes("geren")) return 0;
    if (clean.includes("jefa") || clean.includes("admin")) return 1;
    return 2;
  }

  getSelectedUser() {
    if (this.drawerUser) return this.drawerUser;
    return this.puestosList.find(u => u.id === this.selectedUserId || u.puesto === this.selectedUserId) || this.puestosList[0];
  }

  getModulesKeys() {
    return Object.keys(this.appl);
  }

  getGroupedTreeForSelectedModule() {
    const tree = this.permTree[this.selectedModule] || [];
    const groups: { name: string, items: any[] }[] = [];
    let currentGroup: { name: string, items: any[] } | null = null;
    for (const item of tree) {
      const [cont, acc, g, j, o] = item;
      if (!currentGroup || currentGroup.name !== cont) {
        currentGroup = { name: cont, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push({ acc, g, j, o });
    }
    return groups;
  }

  getChipColor(a: string) {
    return this.actColors[a] || '#8b90a8';
  }
}


