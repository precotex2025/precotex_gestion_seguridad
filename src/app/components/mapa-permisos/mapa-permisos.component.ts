import { Component, OnInit, HostListener } from '@angular/core';
import * as ExcelJS from 'exceljs';
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

  permsDefault: any = {
    'Inicio (Dashboard)': { ger: ['Ver', 'Exportar'], jef: ['Ver', 'Exportar'], ope: ['Ver'] },
    'Organización': { ger: ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Aprobar', 'Descargar'], jef: ['Ver', 'Descargar'], ope: ['Ver', 'Descargar'] },
    'Puestos': { ger: ['Ver', 'Editar', 'Usuarios'], jef: ['Ver', 'Editar', 'Usuarios'], ope: ['Ver'] },
    'Documentación': { ger: ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Aprobar', 'Exportar'], jef: ['Ver', 'Registrar', 'Editar', 'Exportar'], ope: ['Ver', 'Exportar'] },
    'Auditorías': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar', 'Exportar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar', 'Exportar'], ope: ['Ver'] },
    'No conformidades': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar'], ope: ['Ver', 'Registrar'] },
    'Indicadores': { ger: ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Exportar'], jef: ['Ver', 'Registrar', 'Editar', 'Eliminar', 'Exportar'], ope: ['Ver'] },
    'Objetivos': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar'], ope: ['Ver'] },
    'Riesgos': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar'], ope: ['Ver'] },
    'Portafolio de Mejora': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar'], ope: ['Ver'] },
    'Gestión Legal': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar'], ope: ['Ver'] },
    'Proveedores': { ger: ['Ver', 'Registrar', 'Editar', 'Aprobar', 'Exportar'], jef: ['Ver', 'Registrar', 'Editar', 'Aprobar', 'Exportar'], ope: ['Ver'] },
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
      ['Documentos', 'Aprobar', 1, 1, 0],
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
    noconf: 'Ver',
    indicadores: 'Ver',
    objetivos: 'Ver',
    riesgos: 'Ver',
    mejora: 'Ver',
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
      next: (puestoRes: any) => {
        const puestosDb = puestoRes?.elements || [];
        this.puestosService.getListadoUsuarios().subscribe({
          next: (userRes: any) => {
            const rawUsers = userRes?.elements || userRes?.data || (Array.isArray(userRes) ? userRes : []);
            this.buildColaboradoresList(puestosDb, rawUsers);
          },
          error: () => {
            this.buildColaboradoresList(puestosDb, []);
          }
        });
      },
      error: () => {
        this.puestosService.getListadoUsuarios().subscribe({
          next: (userRes: any) => {
            const rawUsers = userRes?.elements || userRes?.data || (Array.isArray(userRes) ? userRes : []);
            this.buildColaboradoresList([], rawUsers);
          },
          error: () => {
            this.buildColaboradoresList([], []);
          }
        });
      }
    });
  }

  normalizarNivel(val: any, puesto?: string): string {
    const str = (val || '').toString().trim().toLowerCase();
    const pStr = (puesto || '').toString().trim().toLowerCase();
    if (str === '001' || str === '1' || str.includes('geren') || pStr.includes('geren')) {
      return 'Gerencial';
    }
    if (str === '002' || str === '2' || str.includes('jef') || str.includes('mando') || pStr.includes('jefe') || pStr.includes('jefat') || pStr.includes('coordinad')) {
      return 'Jefatura';
    }
    return 'Operativo';
  }

  private buildColaboradoresList(puestosDb: any[], rawUsers: any[]): void {
    const deletedPuestosSet = new Set<string>();
    try {
      const rawEliminados = localStorage.getItem('precotex_puestos_eliminados');
      if (rawEliminados) {
        const listElim = JSON.parse(rawEliminados);
        if (Array.isArray(listElim)) {
          listElim.forEach((item: string) => deletedPuestosSet.add(item.toLowerCase().trim()));
        }
      }
    } catch (e) { }

    const isDeleted = (code: string, name: string, pCode: string): boolean => {
      if (code && deletedPuestosSet.has(code.toLowerCase().trim())) return true;
      if (name && deletedPuestosSet.has(name.toLowerCase().trim())) return true;
      if (pCode && deletedPuestosSet.has(pCode.toLowerCase().trim())) return true;
      return false;
    };

    const getItemKey = (item: any): string => {
      const uCode = (item.cod_Usuario || item.userCode || (item.email ? item.email.split('@')[0] : '') || '').toLowerCase().trim();
      if (uCode && uCode !== '—') return 'user:' + uCode;
      const pCode = (item.codigo_Puesto || item.id || '').toString().replace(/\D/g, '').trim();
      if (pCode) return 'puesto:' + pCode;
      const name = (item.usuario || item.nom_Usuario || item.puesto_Funciones || '').toLowerCase().trim();
      if (name && name !== '—') return 'name:' + name;
      return 'id:' + (item.id || Math.random());
    };

    const combinedMap = new Map<string, any>();

    // 1. Procesar usuarios individuales de SNUsuario
    if (Array.isArray(rawUsers) && rawUsers.length > 0) {
      rawUsers
        .filter((u: any) => {
          if (u.flg_Activo === -1 || u.flg_Activo === '-1') return false;
          const estado = (u.puesto_Caracteristicas || u.estado || '').toString().toLowerCase();
          if (estado === 'inactivo' || estado.includes('inactiv')) return false;
          const code = (u.cod_Usuario || u.userCode || (u.email ? u.email.split('@')[0] : '')).toLowerCase().trim();
          const name = (u.usuario || u.puesto_Funciones || u.nom_Usuario || '').toLowerCase().trim();
          const pCode = (u.codigo_Puesto || u.id || '').toString().replace(/\D/g, '').trim();
          if (isDeleted(code, name, pCode)) return false;
          return true;
        })
        .forEach((u: any) => {
          const uCode = (u.cod_Usuario || u.userCode || (u.email ? u.email.split('@')[0] : '')).toLowerCase().trim();
          const pCode = (u.codigo_Puesto || u.id || '').toString().replace(/\D/g, '').trim();
          const uNom = (u.nom_Usuario || u.usuario || '').toLowerCase().trim();

          const dbPuesto = puestosDb.find((p: any) => {
            const pUser = (p.cod_Usuario || '').toLowerCase().trim();
            const pCod = (p.codigo_Puesto || '').toString().replace(/\D/g, '').trim();
            const pFunc = (p.puesto_Funciones || '').toLowerCase().trim();
            return (uCode && pUser === uCode) || (pCode && pCod === pCode) || (uNom && pFunc && uNom === pFunc);
          });

          let puestoName = (dbPuesto?.denominacion || u.puesto || u.denominacion || '').trim();
          let userName = (dbPuesto?.puesto_Funciones || u.usuario || u.puesto_Funciones || u.nom_Usuario || '').trim();
          let procName = (dbPuesto?.puesto_Descripcion || u.proceso || u.puesto_Descripcion || u.proceso_Nombre || '').trim();

          if (puestoName.includes(',') && (!userName || !userName.includes(','))) {
            const temp = puestoName;
            puestoName = userName || 'General';
            userName = temp;
          }

          if (!puestoName || puestoName === 'Puesto General') {
            if (uCode === 'admin') puestoName = 'Administrador General';
            else puestoName = 'Puesto General';
          }

          if (!procName || procName === 'General') {
            if (uCode === 'admin') procName = 'Sistemas';
            else procName = 'General';
          }

          const rawNivelStr = (dbPuesto?.nivelRiesgo || dbPuesto?.codigo_Nivel_Riesgo || u.codigo_Nivel || u.nivelRiesgo || u.codigo_Nivel_Riesgo || u.nivel || u.nivel_Descripcion || '').toString().toLowerCase();
          const nivelClean = this.normalizarNivel(rawNivelStr, puestoName);

          const charVal = (u.puesto_Caracteristicas || u.estado || 'Activo').toString().trim();
          let emailVal = (u.email || '').trim();
          let estadoVal = charVal;
          if (charVal.includes('|')) {
            const parts = charVal.split('|');
            estadoVal = parts[0];
            if (!emailVal) emailVal = parts[1];
          } else if (charVal.includes('@')) {
            if (!emailVal) emailVal = charVal;
            estadoVal = 'Activo';
          }

          if (
            estadoVal.toLowerCase().includes('pendiente') ||
            estadoVal.toLowerCase().includes('activac') ||
            u.primer_Ingreso === true ||
            u.primer_Ingreso === 1 ||
            u.primer_Ingreso === '1' ||
            u.primer_Ingreso === 'True' ||
            u.flg_Activo === false ||
            u.flg_Activo === 0 ||
            u.flg_Activo === '0' ||
            u.flg_Activo === 'False'
          ) {
            estadoVal = 'Pendiente de activación';
          } else if (estadoVal.toLowerCase().includes('inactiv')) {
            estadoVal = 'Inactivo';
          } else {
            estadoVal = 'Activo';
          }

          const codPuesto = (dbPuesto?.codigo_Puesto || u.codigo_Puesto || u.id || '').toString().trim();
          const userItem = {
            id: u.id || (uCode ? ('usr-' + uCode) : (pCode ? ('p-' + pCode) : ('u-' + (u.id_Usuario || userName)))),
            codigo_Puesto: codPuesto,
            id_Usuario: u.id_Usuario,
            cod_Usuario: uCode,
            userCode: uCode,
            puesto: puestoName || 'Puesto General',
            proceso: procName || 'General',
            usuario: userName || '—',
            email: emailVal,
            nivel: nivelClean,
            estado: estadoVal
          };

          const key = getItemKey(userItem);
          combinedMap.set(key, userItem);
        });
    }

    // 2. Procesar puestos de SNPuesto que no estén todavía registrados
    if (Array.isArray(puestosDb) && puestosDb.length > 0) {
      puestosDb.forEach((p: any) => {
        const pCode = (p.codigo_Puesto || p.id || '').toString().trim();
        const pUser = (p.cod_Usuario || '').toLowerCase().trim();
        const pName = (p.puesto_Funciones || '').trim();
        const pPuesto = (p.denominacion || '').trim();

        if (isDeleted(pUser, pName, pCode)) return;

        let puestoName = pPuesto;
        let userName = pName;
        if (puestoName.includes(',') && (!userName || !userName.includes(','))) {
          const temp = puestoName;
          puestoName = userName || 'General';
          userName = temp;
        }

        const rawNivelStr = (p.nivelRiesgo || p.codigo_Nivel_Riesgo || '').toString().toLowerCase();
        const nivelClean = this.normalizarNivel(rawNivelStr, puestoName);

        const item: any = {
          id: p.id || (pUser ? ('usr-' + pUser) : (pCode ? ('p-' + pCode) : ('pue-' + puestoName))),
          codigo_Puesto: pCode,
          cod_Usuario: pUser,
          userCode: pUser,
          puesto: puestoName || 'Puesto General',
          proceso: (p.puesto_Descripcion || 'General').trim(),
          usuario: userName || '—',
          nivel: nivelClean,
          estado: p.puesto_Caracteristicas || 'Activo'
        };

        const key = getItemKey(item);
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });
    }

    // 3. Integrar puestos creados localmente si existen
    try {
      const localPuestos = localStorage.getItem('precotex_puestos_usuarios');
      if (localPuestos) {
        const localList = JSON.parse(localPuestos);
        if (Array.isArray(localList)) {
          localList.forEach((lp: any) => {
            const uCode = (lp.cod_Usuario || lp.userCode || '').toLowerCase().trim();
            const pCode = (lp.codigo_Puesto || lp.id || '').toString().trim();
            const uName = (lp.usuario || '').trim();
            if (isDeleted(uCode, uName, pCode)) return;

            const key = getItemKey(lp);
            if (!combinedMap.has(key)) {
              combinedMap.set(key, {
                ...lp,
                id: lp.id || (uCode ? ('usr-' + uCode) : (pCode ? ('p-' + pCode) : key))
              });
            }
          });
        }
      }
    } catch (e) { }

    this.puestosList = Array.from(combinedMap.values());
    if (this.puestosList.length > 0 && (!this.selectedUserId || !this.puestosList.find(p => p.id === this.selectedUserId))) {
      this.selectedUserId = this.puestosList[0].id;
    }
    this.reindexFineAccWithPuestos();
  }

  loadGeneralAcc() {
    this.permisosService.getPermisosUsuarioModulo('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          res.elements.forEach((row: any) => {
            const rawCode = (row.codigo_Puesto_Usuario || '').trim();
            const mod = (row.modulo_Clave || '').trim();
            if (rawCode && mod) {
              const cleanMod = mod.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              const lowerCode = rawCode.toLowerCase();
              const targets = Array.from(new Set([rawCode, lowerCode, 'usr-' + lowerCode].filter(Boolean)));
              targets.forEach(t => {
                if (!this.accObj[t]) {
                  this.accObj[t] = {};
                }
                this.accObj[t][mod] = row.nivel_Acceso;
                this.accObj[t][mod.toLowerCase()] = row.nivel_Acceso;
                this.accObj[t][cleanMod] = row.nivel_Acceso;
              });
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

  getFineLevelForModule(uid: string, mk: string, nivel: string): string | null {
    if (!this.accFine) return null;
    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid) || this.drawerUser;
    const puestoNombre = (item?.puesto || this.drawerUser?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || this.drawerUser?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || this.drawerUser?.cod_Usuario || "").trim().toLowerCase();

    const targets = Array.from(new Set([
      userCode,
      uid,
      this.drawerUser?.cod_Usuario?.trim().toLowerCase(),
      this.drawerUser?.id,
      puestoCode,
      puestoNombre
    ].filter(Boolean)));

    const cleanKey = mk.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    let hasActive = false;
    let hasEdit = false;

    for (const t of targets) {
      const tStr = (t || '').toString().trim();
      if (!tStr) continue;

      let userObj = this.accFine[tStr];
      if (!userObj) {
        const matchedKey = Object.keys(this.accFine).find(fk => fk.trim().toLowerCase() === tStr.toLowerCase());
        if (matchedKey) userObj = this.accFine[matchedKey];
      }

      if (userObj) {
        for (const [subKey, subVal] of Object.entries(userObj)) {
          const parts = subKey.split('||');
          const modPart = (parts[0] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          if (modPart === cleanKey || modPart.includes(cleanKey) || cleanKey.includes(modPart)) {
            if (subVal === 1 || subVal === true) {
              hasActive = true;
              const actionPart = (parts[2] || '').toLowerCase();
              if (['crear', 'editar', 'eliminar', 'aprobar', 'restaurar'].some(a => actionPart.includes(a))) {
                hasEdit = true;
              }
            }
          }
        }
      }
    }

    if (hasEdit) return 'Editar';
    if (hasActive) return 'Ver';
    return null;
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

    // Prioridad 1: Permiso explÃ­cito asignado al USUARIO individual (userCode o uid)
    const val = (userCode ? checkObj(this.accObj[userCode]) : null) ||
                checkObj(this.accObj[uid]) ||
                (puestoCode ? checkObj(this.accObj[puestoCode]) : null) ||
                (puestoNombre ? checkObj(this.accObj[puestoNombre]) : null);
    // Si tiene permisos finos especificos activos en este modulo, mandar segun el nivel fino
    const fineVal = this.getFineLevelForModule(userCode || uid, mk, nivel);
    if (fineVal) {
      if (val === 'Sin acceso' || !val) {
        return fineVal;
      }
    }

    if (val) return val;

    return this.accDefault(nivel, mk);
  }

  setAcceso(uid: string, mk: string, val: string, showToast: boolean = true) {
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

    // Prioridad del identificador: Si es un usuario específico (userCode / uid individual), guardar bajo su usuario
    // para que NO afecte ni colisione con otros colaboradores que comparten el mismo puesto.
    const targetUserId = userCode || (uid && !uid.startsWith('pue-') ? uid : '') || puestoCode || puestoNombre;

    // Guardar en memoria local:
    // Si tenemos usuario específico, guardar ÚNICAMENTE para ese usuario y sus aliases individuales.
    const localTargets = userCode 
      ? Array.from(new Set([userCode, uid, 'usr-' + userCode, targetUserId, targetUserId.toLowerCase()].filter(Boolean)))
      : Array.from(new Set([uid, puestoCode, puestoNombre, targetUserId, targetUserId.toLowerCase()].filter(Boolean)));

    localTargets.forEach(t => {
      if (!this.accObj[t]) {
        this.accObj[t] = {};
      }
      keysToSave.forEach(k => {
        this.accObj[t][k] = val;
      });
    });

    this.saveGeneralAcc();

    // Guardar en la base de datos bajo el identificador individual (ej. 'cvramirez', 'jpinedo', 'mcueva')
    keysToSave.forEach(modK => {
      this.permisosService.postGuardarUsuarioModulo({
        Codigo_Puesto_Usuario: targetUserId,
        Modulo_Clave: modK,
        Nivel_Acceso: val
      }).subscribe();
    });

    if (showToast) { this.toastr.success('Se guardó con éxito.', '', { timeOut: 1500 }); }
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

    // Guardar en la base de datos de forma persistente para cada módulo, nivel y acción
    Object.keys(this.appl).forEach(mod => {
      const allActions = this.appl[mod] || [];
      ['ger', 'jef', 'ope'].forEach(lvl => {
        allActions.forEach((act: string) => {
          const isAllowed = this.isPolActive(mod, lvl, act);
          this.permisosService.postGuardarPolitica({
            Modulo: mod,
            Nivel: lvl,
            Accion: act,
            Flg_Permitido: isAllowed
          }).subscribe();
        });
      });
    });

    this.toastr.success('Políticas restablecidas y sincronizadas con la base de datos.', '', { timeOut: 2500 });
  }

  // Override / Ajuste Fino
  loadFineAcc() {
    this.readLocalFineAcc();
    this.permisosService.getPermisosUsuarioDetalle('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          if (!this.accFine) this.accFine = {};
          res.elements.forEach((row: any) => {
            const rawUid = (row.codigo_Puesto_Usuario || '').trim();
            if (!rawUid) return;
            const key = this.finoKey(row.modulo, row.contenido, row.accion);
            const val = row.flg_Permitido ? 1 : 0;

            if (!this.accFine[rawUid]) {
              this.accFine[rawUid] = {};
            }
            this.accFine[rawUid][key] = val;

            const lowerUid = rawUid.toLowerCase();
            if (!this.accFine[lowerUid]) {
              this.accFine[lowerUid] = {};
            }
            this.accFine[lowerUid][key] = val;
          });
          this.reindexFineAccWithPuestos();
          this.saveFineAcc();
        } else {
          this.readLocalFineAcc();
        }
      },
      error: () => this.readLocalFineAcc()
    });
  }

  reindexFineAccWithPuestos() {
    if (!this.accFine || !this.puestosList || this.puestosList.length === 0) return;
    Object.keys(this.accFine).forEach(k => {
      const kLower = k.trim().toLowerCase();
      const matched = this.puestosList.find((p: any) =>
        (p.puesto && p.puesto.trim().toLowerCase() === kLower) ||
        (p.codigo_Puesto && p.codigo_Puesto.trim().toLowerCase() === kLower) ||
        (p.cod_Usuario && p.cod_Usuario.trim().toLowerCase() === kLower)
      );
      if (matched) {
        // IMPORTANTE: Si la clave original k es de un usuario individual (cod_Usuario o id de usuario),
        // NUNCA copiarla al puesto compartido, porque de lo contrario todos los demás colaboradores
        // con el mismo puesto heredarán los permisos finos de este usuario.
        const isUserKey = matched.cod_Usuario && matched.cod_Usuario.trim().toLowerCase() === kLower;
        const aliases = isUserKey
          ? [matched.cod_Usuario?.trim().toLowerCase(), matched.id].filter(Boolean)
          : [matched.puesto?.trim(), matched.codigo_Puesto?.trim(), matched.id].filter(Boolean);

        aliases.forEach((a: string) => {
          if (!this.accFine[a]) this.accFine[a] = {};
          Object.assign(this.accFine[a], this.accFine[k]);
        });
      }
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
    } else if (!this.accFine) {
      this.accFine = {};
    }
  }

  saveFineAcc() {
    localStorage.setItem('precotex:puestos:accesos_fino', JSON.stringify(this.accFine));
  }

  normalizeFinoKey(k: string): string {
    return (k || '').toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  }

  finoKey(mod: string, cont: string, acc: string): string {
    return (mod || '').trim() + '||' + (cont || '').trim() + '||' + (acc || '').trim();
  }

  finoGet(uid: string, level: string, mod: string, cont: string, acc: string, def: number): number {
    const k = this.finoKey(mod, cont, acc);
    if (!this.accFine) return def;

    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid) || this.drawerUser;
    const puestoNombre = (item?.puesto || this.drawerUser?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || this.drawerUser?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || this.drawerUser?.cod_Usuario || "").trim().toLowerCase();

    // Prioridad 1: Permiso fino específico del usuario individual (userCode, uid)
    // Prioridad 2: Permiso del código de puesto o puesto general
    const targets = Array.from(new Set([
      userCode,
      uid,
      this.drawerUser?.cod_Usuario?.trim().toLowerCase(),
      this.drawerUser?.id,
      puestoCode,
      puestoNombre
    ].filter(Boolean)));

    const cleanK = this.normalizeFinoKey(k);

    for (const t of targets) {
      const tStr = (t || '').toString().trim();
      if (!tStr) continue;

      let userObj = this.accFine[tStr];
      if (!userObj) {
        const matchedKey = Object.keys(this.accFine).find(fk => fk.trim().toLowerCase() === tStr.toLowerCase());
        if (matchedKey) userObj = this.accFine[matchedKey];
      }

      if (userObj) {
        if (k in userObj) {
          return (userObj[k] === 1 || userObj[k] === true) ? 1 : 0;
        }

        for (const [subKey, subVal] of Object.entries(userObj)) {
          if (this.normalizeFinoKey(subKey) === cleanK) {
            return (subVal === 1 || subVal === true) ? 1 : 0;
          }
        }
      }
    }
    return def;
  }

  toggleFinoCheckbox(uid: string, mod: string, cont: string, acc: string, checked: boolean) {
    const item = (this.puestosList || []).find(p => p.id === uid || p.codigo_Puesto === uid || p.cod_Usuario === uid || p.puesto === uid) || this.drawerUser;
    const puestoNombre = (item?.puesto || this.drawerUser?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || this.drawerUser?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || this.drawerUser?.cod_Usuario || "").trim().toLowerCase();
    const key = this.finoKey(mod, cont, acc);
    const val = checked ? 1 : 0;

    // Si es un colaborador específico, guardamos bajo su código de usuario/id
    // NUNCA asignar al puesto general para evitar conflictos entre colaboradores
    const targetUserId = userCode || (uid && !uid.startsWith('pue-') ? uid : '') || puestoCode || puestoNombre;

    const targets = userCode
      ? Array.from(new Set([userCode, uid, this.drawerUser?.id, this.drawerUser?.cod_Usuario?.trim().toLowerCase()].filter(Boolean)))
      : Array.from(new Set([uid, puestoCode, puestoNombre, this.drawerUser?.id].filter(Boolean)));

    targets.forEach(t => {
      if (!this.accFine[t]) {
        this.accFine[t] = {};
      }
      this.accFine[t][key] = val;
    });

    this.saveFineAcc();

    // Sincronizar automáticamente con el módulo padre en la matriz general para CUALQUIER usuario
    const cleanMod = this.normalizeFinoKey(mod);
    const isEditAction = ['crear', 'editar', 'eliminar', 'aprobar', 'restaurar'].some(a => acc.toLowerCase().includes(a));

    if (checked) {
      const currentLevel = this.accGet(uid, item?.nivel || 'ope', cleanMod);
      const newLevel = (isEditAction || currentLevel === 'Editar') ? 'Editar' : 'Ver';
      if (currentLevel !== newLevel) {
        this.setAcceso(uid, cleanMod, newLevel, false);
      }
    } else {
      // Si se desmarcó, evaluar si al usuario aún le quedan permisos activos en este módulo
      const remainingLevel = this.getFineLevelForModule(uid, cleanMod, item?.nivel || 'ope');
      if (!remainingLevel) {
        const currentLevel = this.accGet(uid, item?.nivel || 'ope', cleanMod);
        if (currentLevel !== 'Sin acceso') {
          this.setAcceso(uid, cleanMod, 'Sin acceso', false);
        }
      } else {
        const currentLevel = this.accGet(uid, item?.nivel || 'ope', cleanMod);
        if (currentLevel !== remainingLevel) {
          this.setAcceso(uid, cleanMod, remainingLevel, false);
        }
      }
    }

    // Guardar en la base de datos bajo el identificador individual
    this.permisosService.postGuardarUsuarioDetalle({
      Codigo_Puesto_Usuario: targetUserId,
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
    const puestoNombre = (item?.puesto || this.drawerUser?.puesto || this.getSelectedPuestoName(uid) || "").trim();
    const puestoCode = (item?.codigo_Puesto || this.drawerUser?.codigo_Puesto || "").trim();
    const userCode = (item?.cod_Usuario || this.drawerUser?.cod_Usuario || "").trim().toLowerCase();
    const mod = this.selectedModule;

    const targets = userCode
      ? Array.from(new Set([userCode, uid, this.drawerUser?.id, this.drawerUser?.cod_Usuario?.trim().toLowerCase()].filter(Boolean)))
      : Array.from(new Set([uid, puestoCode, puestoNombre, this.drawerUser?.id].filter(Boolean)));

    const cleanMod = this.normalizeFinoKey(mod);

    targets.forEach(t => {
      if (this.accFine && this.accFine[t]) {
        Object.keys(this.accFine[t]).forEach(k => {
          if (k.startsWith(mod + "||") || this.normalizeFinoKey(k).startsWith(cleanMod + "||")) {
            delete this.accFine[t][k];
          }
        });
      }
    });

    this.saveFineAcc();
    // Restablecer también el módulo general a su valor por defecto de rol
    const defVal = this.accDefault(item?.nivel || 'ope', cleanMod);
    this.setAcceso(uid, cleanMod, defVal, false);
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

    isExporting: boolean = false;
  mostrarModalExportar: boolean = false;
  exportOption: 'colaborador' | 'general' | 'auditoria' = 'colaborador';
  exportTargetUserId: string = '';

  
  @HostListener('document:keydown.escape')
  onDocumentKeydownEscape(): void {
    if (this.mostrarModalExportar) {
      this.cerrarModalExportar();
    }
  }

  abrirModalExportar(targetUser?: any): void {
    if (targetUser && targetUser.id) {
      this.exportTargetUserId = targetUser.id;
      this.exportOption = 'colaborador';
    } else if (this.drawerUser && this.drawerUser.id) {
      this.exportTargetUserId = this.drawerUser.id;
      this.exportOption = 'colaborador';
    } else if (this.selectedUserId) {
      this.exportTargetUserId = this.selectedUserId;
      this.exportOption = 'colaborador';
    } else if (this.puestosList && this.puestosList.length > 0) {
      this.exportTargetUserId = this.puestosList[0].id;
      this.exportOption = 'colaborador';
    }
    this.mostrarModalExportar = true;
  }

  cerrarModalExportar(): void {
    this.mostrarModalExportar = false;
  }

  async confirmarExportarExcel(): Promise<void> {
    await this.exportarExcelPermisos(this.exportOption, this.exportTargetUserId);
    this.cerrarModalExportar();
  }

  async exportarExcelPermisos(tipoExportacion: 'colaborador' | 'general' | 'auditoria' = 'colaborador', targetUserId?: string): Promise<void> {
    if (this.isExporting) return;
    this.isExporting = true;
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'PRECOTEX S.A.C. - Sistema de Gestión de Seguridad';
      wb.created = new Date();

      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };

      // =============================================================
      // HOJA 1: POLÍTICA POR NIVEL (Imágenes 2 y 3)
      // =============================================================
      const ws1 = wb.addWorksheet('Política por nivel', { views: [{ showGridLines: true }] });
      ws1.columns = [
        { width: 26 }, // A: Módulo
        { width: 22 }, // B: Acción
        { width: 18 }, // C: Gerencial
        { width: 18 }, // D: Jefatura
        { width: 18 }  // E: Operativo
      ];

      // Fila 1: Título Principal
      ws1.mergeCells('A1:E1');
      const title1 = ws1.getCell('A1');
      title1.value = 'POLÍTICA DE ACCESOS POR NIVEL — PORTAL SIG PRECOTEX (formato ejemplar de exportación)';
      title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34459D' } };
      title1.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      title1.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(1).height = 30;

      // Fila 2: Subtítulo Explicativo
      ws1.mergeCells('A2:E2');
      const sub1 = ws1.getCell('A2');
      sub1.value = 'Sí = acción permitida para ese nivel · — = no permitida. Las acciones varían según el módulo (tal como en el sistema).';
      sub1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4859AD' } };
      sub1.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FFFFFFFF' } };
      sub1.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(2).height = 22;

      // Fila 3: Encabezados de Columna
      const headers1 = [
        { col: 'A', text: 'Módulo', fill: 'FF192150' },
        { col: 'B', text: 'Acción', fill: 'FF192150' },
        { col: 'C', text: 'Gerencial', fill: 'FF008B74' },
        { col: 'D', text: 'Jefatura', fill: 'FF1E73BE' },
        { col: 'E', text: 'Operativo', fill: 'FFB86200' }
      ];
      ws1.getRow(3).height = 26;
      headers1.forEach(h => {
        const c = ws1.getCell(`${h.col}3`);
        c.value = h.text;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.fill } };
        c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = thinBorder as ExcelJS.Borders;
      });

      // Filas de datos de la Hoja 1
      let r1 = 4;
      const modKeys1 = this.getModulesKeys();
      modKeys1.forEach(mod => {
        const actions = this.appl[mod] || [];
        if (actions.length === 0) return;
        const startRow = r1;
        const endRow = r1 + actions.length - 1;

        actions.forEach((act: string) => {
          const row = ws1.getRow(r1);
          row.height = 21;

          // Columna B: Acción
          const cellB = row.getCell(2);
          cellB.value = act;
          cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          cellB.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
          cellB.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          cellB.border = thinBorder as ExcelJS.Borders;

          // Columnas C, D, E: Gerencial, Jefatura, Operativo
          (['ger', 'jef', 'ope'] as const).forEach((lvl, lIdx) => {
            const colNum = 3 + lIdx;
            const cell = row.getCell(colNum);
            const isAllowed = this.isPolActive(mod, lvl, act);
            cell.value = isAllowed ? 'Sí' : '—';
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = thinBorder as ExcelJS.Borders;

            if (isAllowed) {
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF057A55' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBFBF2' } };
            } else {
              cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
            }
          });

          r1++;
        });

        // Combinar celdas verticales de la Columna A (Módulo)
        if (endRow >= startRow) {
          if (endRow > startRow) {
            ws1.mergeCells(`A${startRow}:A${endRow}`);
          }
          const modCell = ws1.getCell(`A${startRow}`);
          modCell.value = mod === 'Ayuda' ? 'Centro de ayuda' : mod;
          modCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FA' } };
          modCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1A237E' } };
          modCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let mr = startRow; mr <= endRow; mr++) {
            ws1.getCell(`A${mr}`).border = thinBorder as ExcelJS.Borders;
          }
        }
      });

      // =============================================================
      // HOJA 2: ACCESOS POR USUARIO (Imagen 4)
      // =============================================================
      const ws2 = wb.addWorksheet('Accesos por usuario', { views: [{ showGridLines: true }] });
      ws2.columns = [
        { width: 34 }, // A: Puesto
        { width: 36 }, // B: Colaborador / Usuario
        { width: 15 }, // C: Nivel
        { width: 14 }, // D: Organizacion
        { width: 14 }, // E: Documentacion
        { width: 14 }, // F: Auditorias
        { width: 12 }, // G: NC
        { width: 14 }, // H: Indicadores
        { width: 14 }, // I: Objetivos
        { width: 14 }, // J: Riesgos
        { width: 14 }, // K: Mejora
        { width: 14 }, // L: Legal
        { width: 14 }  // M: Proveedores
      ];

      // Fila 1: Título
      ws2.mergeCells('A1:M1');
      const title2 = ws2.getCell('A1');
      title2.value = 'MATRIZ GENERAL DE ACCESOS POR USUARIO — PORTAL SIG PRECOTEX (formato ejemplar de exportación)';
      title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      title2.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      title2.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.getRow(1).height = 30;

      // Fila 2: Subtítulo
      ws2.mergeCells('A2:M2');
      const sub2 = ws2.getCell('A2');
      sub2.value = 'Nivel de acceso a cada módulo por colaborador: Ver = Lectura · Editar = Edición/Gestión · Sin acceso = Módulo bloqueado/oculto.';
      sub2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      sub2.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FFFFFFFF' } };
      sub2.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.getRow(2).height = 22;

      // Fila 3: Encabezados de Columna
      const headers2 = [
        'PUESTO', 'COLABORADOR / USUARIO', 'NIVEL',
        'ORGANIZ.', 'DOCS', 'AUDITORÍAS', 'NC', 'INDICAD.', 'OBJET.', 'RIESGOS', 'MEJORA', 'LEGAL', 'PROVEED.'
      ];
      ws2.getRow(3).height = 26;
      headers2.forEach((hText, hIdx) => {
        const colLetter = String.fromCharCode(65 + hIdx);
        const c = ws2.getCell(`${colLetter}3`);
        c.value = hText;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF192150' } };
        c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
        c.alignment = { vertical: 'middle', horizontal: hIdx <= 1 ? 'left' : 'center', indent: hIdx <= 1 ? 1 : 0 };
        c.border = thinBorder as ExcelJS.Borders;
      });

      // Filas de datos de la Hoja 2
      let r2 = 4;
      const pList = this.puestosList && this.puestosList.length > 0 ? this.puestosList : [];
      pList.forEach(u => {
        const row = ws2.getRow(r2);
        row.height = 21;

        // Col A: Puesto
        const cPuesto = row.getCell(1);
        cPuesto.value = u.puesto || 'Puesto General';
        cPuesto.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
        cPuesto.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cPuesto.border = thinBorder as ExcelJS.Borders;

        // Col B: Colaborador / Usuario
        const cUser = row.getCell(2);
        cUser.value = (u.usuario || '—') + (u.cod_Usuario ? ` (@${u.cod_Usuario})` : '');
        cUser.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
        cUser.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cUser.border = thinBorder as ExcelJS.Borders;

        // Col C: Nivel
        const cNivel = row.getCell(3);
        cNivel.value = u.nivel || 'Operativo';
        let nivelColor = 'FFD97706';
        if ((u.nivel || '').toLowerCase().includes('geren')) nivelColor = 'FF059669';
        else if ((u.nivel || '').toLowerCase().includes('jef')) nivelColor = 'FF2563EB';
        cNivel.font = { name: 'Calibri', size: 9, bold: true, color: { argb: nivelColor } };
        cNivel.alignment = { vertical: 'middle', horizontal: 'center' };
        cNivel.border = thinBorder as ExcelJS.Borders;

        // Col D..M: 10 Módulos
        this.pmodsList.forEach((pm, pmIdx) => {
          const cell = row.getCell(4 + pmIdx);
          const val = this.accGet(u.id, u.nivel, pm.k);
          cell.value = val;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = thinBorder as ExcelJS.Borders;

          if (val === 'Editar') {
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF057A55' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBFBF2' } };
          } else if (val === 'Ver') {
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1D4ED8' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
          } else {
            cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          }
        });

        r2++;
      });

      // =============================================================
      // HOJA 3: SEGÚN LA OPCIÓN ELEGIDA (Imagen 5 / Auditoría)
      // =============================================================
      let nombreArchivo = 'Matriz_Permisos_Precotex';

      if (tipoExportacion === 'colaborador') {
        const ws3 = wb.addWorksheet('Ajuste fino por usuario', { views: [{ showGridLines: true }] });
        ws3.columns = [
          { width: 26 }, // A: Módulo
          { width: 36 }, // B: Carpeta / sección
          { width: 24 }, // C: Acción
          { width: 30 }  // D: Operativo (ejemplo) / Estado
        ];

        // Determinar usuario objetivo para el detalle fino
        const targetUser = (this.puestosList || []).find(p => p.id === targetUserId) ||
                           this.drawerUser || 
                           (this.selectedUserId ? this.puestosList.find(p => p.id === this.selectedUserId) : null) || 
                           this.puestosList.find(p => (p.usuario || '').toLowerCase().includes('cueva')) || 
                           this.puestosList[0] || { id: 'u-1', usuario: 'CUEVA TAMAYO, MICHAEL JOVER', nivel: 'Operativo', puesto: 'ASISTENTE DE COSTURA' };

        // Fila 1: Título
        ws3.mergeCells('A1:D1');
        const title3 = ws3.getCell('A1');
        title3.value = `AJUSTE FINO POR USUARIO — ${targetUser.usuario || targetUser.puesto} (${targetUser.nivel})`;
        title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
        title3.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
        title3.alignment = { vertical: 'middle', horizontal: 'center' };
        ws3.getRow(1).height = 30;

        // Fila 2: Subtítulo
        ws3.mergeCells('A2:D2');
        const sub3 = ws3.getCell('A2');
        sub3.value = 'Detalle por módulo, carpeta y acción (Permitido / Sin acceso). Es el override individual sobre la política del nivel.';
        sub3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC68D07' } };
        sub3.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FFFFFFFF' } };
        sub3.alignment = { vertical: 'middle', horizontal: 'center' };
        ws3.getRow(2).height = 22;

        // Fila 3: Encabezados
        const headers3 = [
          { col: 'A', text: 'Módulo' },
          { col: 'B', text: 'Carpeta / sección' },
          { col: 'C', text: 'Acción' },
          { col: 'D', text: `${targetUser.nivel} (${(targetUser.usuario || 'ejemplo').split(' ')[0]})` }
        ];
        ws3.getRow(3).height = 26;
        headers3.forEach(h => {
          const c = ws3.getCell(`${h.col}3`);
          c.value = h.text;
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF192150' } };
          c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          c.alignment = { vertical: 'middle', horizontal: 'center' };
          c.border = thinBorder as ExcelJS.Borders;
        });

        // Filas de datos de la Hoja 3
        let r3 = 4;
        const treeKeys = Object.keys(this.permTree);
        treeKeys.forEach(modName => {
          const treeItems = this.permTree[modName] || [];
          if (treeItems.length === 0) return;

          const startModRow = r3;

          // Agrupar por Carpeta / sección
          const folderMap = new Map<string, Array<{ acc: string, g: number, j: number, o: number }>>();
          treeItems.forEach((item: any) => {
            const [folder, acc, g, j, o] = item;
            if (!folderMap.has(folder)) folderMap.set(folder, []);
            folderMap.get(folder)!.push({ acc, g, j, o });
          });

          folderMap.forEach((actions, folderName) => {
            const startFolderRow = r3;

            actions.forEach(item => {
              const row = ws3.getRow(r3);
              row.height = 21;

              // Col C: Acción
              const cellC = row.getCell(3);
              cellC.value = item.acc;
              cellC.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
              cellC.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              cellC.border = thinBorder as ExcelJS.Borders;

              // Col D: Estado para targetUser
              const cellD = row.getCell(4);
              const defVal = [item.g, item.j, item.o][this.nivelIdx(targetUser.nivel)];
              const isAllowed = this.finoGet(targetUser.id, targetUser.nivel, modName, folderName, item.acc, defVal) === 1;

              cellD.value = isAllowed ? 'Permitido' : 'Sin acceso';
              cellD.alignment = { vertical: 'middle', horizontal: 'center' };
              cellD.border = thinBorder as ExcelJS.Borders;

              if (isAllowed) {
                cellD.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF057A55' } };
                cellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBFBF2' } };
              } else {
                cellD.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF94A3B8' } };
                cellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
              }

              r3++;
            });

            const endFolderRow = r3 - 1;
            if (endFolderRow >= startFolderRow) {
              if (endFolderRow > startFolderRow) {
                ws3.mergeCells(`B${startFolderRow}:B${endFolderRow}`);
              }
              const folderCell = ws3.getCell(`B${startFolderRow}`);
              folderCell.value = folderName;
              folderCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };
              folderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
              for (let fr = startFolderRow; fr <= endFolderRow; fr++) {
                ws3.getCell(`B${fr}`).border = thinBorder as ExcelJS.Borders;
              }
            }
          });

          const endModRow = r3 - 1;
          if (endModRow >= startModRow) {
            if (endModRow > startModRow) {
              ws3.mergeCells(`A${startModRow}:A${endModRow}`);
            }
            const mCell = ws3.getCell(`A${startModRow}`);
            mCell.value = modName;
            mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FA' } };
            mCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1A237E' } };
            mCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            for (let mr = startModRow; mr <= endModRow; mr++) {
              ws3.getCell(`A${mr}`).border = thinBorder as ExcelJS.Borders;
            }
          }
        });

        const safeName = (targetUser.usuario || targetUser.puesto || 'Colaborador').replace(/[^a-zA-Z0-9]/g, '_');
        nombreArchivo = `Ficha_Permisos_${safeName}_${new Date().toISOString().slice(0, 10)}`;
      } 
      else if (tipoExportacion === 'auditoria') {
        const ws3 = wb.addWorksheet('Ajuste fino por usuario', { views: [{ showGridLines: true }] });
        ws3.columns = [
          { width: 34 }, // A: Colaborador
          { width: 28 }, // B: Puesto
          { width: 14 }, // C: Nivel
          { width: 20 }, // D: Módulo
          { width: 32 }, // E: Carpeta / Sección
          { width: 20 }, // F: Acción
          { width: 20 }, // G: Política Base
          { width: 22 }  // H: Ajuste Especial
        ];

        // Fila 1: Título
        ws3.mergeCells('A1:H1');
        const title3 = ws3.getCell('A1');
        title3.value = 'CONSOLIDADO DE EXCEPCIONES Y AJUSTES ESPECIALES — PORTAL SIG PRECOTEX';
        title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
        title3.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
        title3.alignment = { vertical: 'middle', horizontal: 'center' };
        ws3.getRow(1).height = 30;

        // Fila 2: Subtítulo
        ws3.mergeCells('A2:H2');
        const sub3 = ws3.getCell('A2');
        sub3.value = 'Listado de usuarios con overrides y configuraciones personalizadas que difieren de la política estándar de su nivel.';
        sub3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
        sub3.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FFFFFFFF' } };
        sub3.alignment = { vertical: 'middle', horizontal: 'center' };
        ws3.getRow(2).height = 22;

        // Fila 3: Encabezados
        const headers3 = [
          'COLABORADOR / USUARIO', 'PUESTO', 'NIVEL', 'MÓDULO', 'CARPETA / SECCIÓN', 'ACCIÓN', 'POLÍTICA BASE', 'AJUSTE ESPECIAL'
        ];
        ws3.getRow(3).height = 26;
        headers3.forEach((hText, hIdx) => {
          const colLetter = String.fromCharCode(65 + hIdx);
          const c = ws3.getCell(`${colLetter}3`);
          c.value = hText;
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF192150' } };
          c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
          c.alignment = { vertical: 'middle', horizontal: 'center' };
          c.border = thinBorder as ExcelJS.Borders;
        });

        // Buscar excepciones en todos los colaboradores
        let r3 = 4;
        let totalExcepciones = 0;
        const treeKeys = Object.keys(this.permTree);

        (this.puestosList || []).forEach(u => {
          treeKeys.forEach(modName => {
            const treeItems = this.permTree[modName] || [];
            treeItems.forEach((item: any) => {
              const [folder, acc, g, j, o] = item;
              const defVal = [g, j, o][this.nivelIdx(u.nivel)];
              const currentVal = this.finoGet(u.id, u.nivel, modName, folder, acc, defVal);

              if (currentVal !== defVal) {
                totalExcepciones++;
                const row = ws3.getRow(r3);
                row.height = 21;

                row.getCell(1).value = u.usuario || u.puesto || 'Usuario';
                row.getCell(2).value = u.puesto || '—';
                row.getCell(3).value = u.nivel || 'Operativo';
                row.getCell(4).value = modName;
                row.getCell(5).value = folder;
                row.getCell(6).value = acc;
                row.getCell(7).value = defVal === 1 ? 'Permitido (Nivel)' : 'Sin acceso (Nivel)';
                
                const cAjuste = row.getCell(8);
                cAjuste.value = currentVal === 1 ? 'Permitido (Especial)' : 'Bloqueado (Especial)';
                cAjuste.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: currentVal === 1 ? 'FF057A55' : 'FFDC2626' } };
                cAjuste.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: currentVal === 1 ? 'FFEBFBF2' : 'FFFEF2F2' } };

                for (let cIdx = 1; cIdx <= 8; cIdx++) {
                  const cell = row.getCell(cIdx);
                  cell.border = thinBorder as ExcelJS.Borders;
                  if (cIdx !== 8) {
                    cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF1E293B' } };
                    cell.alignment = { vertical: 'middle', horizontal: cIdx <= 2 ? 'left' : 'center', indent: cIdx <= 2 ? 1 : 0 };
                  } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                  }
                }

                r3++;
              }
            });
          });
        });

        if (totalExcepciones === 0) {
          ws3.mergeCells(`A${r3}:H${r3}`);
          const emptyCell = ws3.getCell(`A${r3}`);
          emptyCell.value = '✓ No se registran excepciones individuales. Todos los colaboradores mantienen la política estándar configurada para su nivel.';
          emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBFBF2' } };
          emptyCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF057A55' } };
          emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
          for (let c = 1; c <= 8; c++) ws3.getRow(r3).getCell(c).border = thinBorder as ExcelJS.Borders;
          ws3.getRow(r3).height = 28;
        }

        nombreArchivo = `Reporte_Auditoria_Permisos_${new Date().toISOString().slice(0, 10)}`;
      } else {
        // Matriz General (2 Hojas)
        nombreArchivo = `Matriz_General_Permisos_${new Date().toISOString().slice(0, 10)}`;
      }

      // =============================================================
      // GENERAR BUFFER Y DESCARGAR ARCHIVO
      // =============================================================
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombreArchivo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const msjHojas = tipoExportacion === 'general' ? '2 hojas' : '3 hojas';
      this.toastr.success(`Libro Excel de permisos (${msjHojas}) generado exitosamente.`, 'Descarga Exitosa');
    } catch (error) {
      console.error('Error al exportar matriz a Excel:', error);
      this.toastr.error('Ocurrió un error al generar el archivo Excel de permisos.', 'Error Exportación');
    } finally {
      this.isExporting = false;
    }
  }


}
