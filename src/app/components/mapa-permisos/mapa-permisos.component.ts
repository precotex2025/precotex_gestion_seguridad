import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

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
    'Req. legal': { ger: ['Ver', 'Aprobar'], jef: ['Ver', 'Registrar'], ope: ['Ver'] },
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
    'Req. legal': ['Ver', 'Registrar', 'Editar', 'Aprobar'],
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
      ['Normas y certificaciones', 'Ver', 1, 1, 1],
      ['Normas y certificaciones', 'Crear', 1, 0, 0],
      ['Normas y certificaciones', 'Editar', 1, 0, 0],
      ['Normas y certificaciones', 'Eliminar', 1, 0, 0],
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
    'Req. legal': [
      ['Matriz legal', 'Ver', 1, 1, 1],
      ['Matriz legal', 'Crear / Editar', 1, 1, 0],
      ['Matriz legal', 'Aprobar', 1, 0, 0],
      ['Alertas', 'Ver', 1, 1, 1]
    ],
    'Ayuda': [
      ['Guías y FAQ', 'Ver', 1, 1, 1]
    ]
  };

  puestosList: any[] = [];
  selectedUserId: string = '';
  selectedModule: string = 'Organización';
  pmodsList = [
    { k: 'documentacion', l: 'DOCS' },
    { k: 'auditorias', l: 'AUDITORÍAS' },
    { k: 'noconf', l: 'NC' },
    { k: 'indicadores', l: 'INDICAD.' },
    { k: 'objetivos', l: 'OBJET.' },
    { k: 'riesgos', l: 'RIESGOS' },
    { k: 'mejora', l: 'MEJORA' },
    { k: 'legal', l: 'LEGAL' }
  ];

  opeDef: any = {
    documentacion: 'Ver',
    auditorias: 'Ver',
    noconf: 'Editar',
    indicadores: 'Editar',
    objetivos: 'Ver',
    riesgos: 'Editar',
    mejora: 'Editar',
    legal: 'Ver'
  };

  accObj: any = {};
  accFine: any = {};

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

  constructor(private toastr: ToastrService) { }


  ngOnInit(): void {
    this.loadPolicy();
    this.loadFineAcc();
    this.loadGeneralAcc();

    const localPuestos = localStorage.getItem('precotex_puestos_usuarios');
    if (localPuestos) {
      this.puestosList = JSON.parse(localPuestos);
    } else {
      this.puestosList = [
        { id: 'p-1', puesto: 'Gerente de Producción', usuario: 'Carlos Ríos', nivel: 'Gerencial', estado: 'Activo' },
        { id: 'p-2', puesto: 'Jefe de SSOMA', usuario: 'Ana Torres', nivel: 'Jefatura', estado: 'Activo' },
        { id: 'p-3', puesto: 'Asistente de Costura', usuario: '', nivel: 'Operativo', estado: 'Sin permisos config.' }
      ];
    }

    if (this.puestosList.length > 0) {
      this.selectedUserId = this.puestosList[0].id;
    }
  }

  loadGeneralAcc() {
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

  accDefault(nivel: string, mk: string): string {
    if (nivel === 'Gerencial' || nivel === 'Jefatura') {
      return 'Editar';
    }
    return this.opeDef[mk] || 'Ver';
  }

  accGet(uid: string, nivel: string, mk: string): string {
    if (this.accObj[uid] && this.accObj[uid][mk]) {
      return this.accObj[uid][mk];
    }
    return this.accDefault(nivel, mk);
  }

  setAcceso(uid: string, mk: string, val: string) {
    if (!this.accObj[uid]) {
      this.accObj[uid] = {};
    }
    this.accObj[uid][mk] = val;
    this.saveGeneralAcc();
    this.toastr.success('Acceso general actualizado.', '', { timeOut: 1500 });
  }

  accColor(v: string): string {
    if (v === 'Editar') return '#3ecf8e'; // green
    if (v === 'Ver') return '#5b8def'; // blue
    return 'rgba(148, 163, 184, 0.45)'; // faint / gray
  }


  loadPolicy() {
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
    if (!this.perms[mod]) {
      this.perms[mod] = { ger: [], jef: [], ope: [] };
    }
    if (!this.perms[mod][lvl]) {
      this.perms[mod][lvl] = [];
    }
    const idx = this.perms[mod][lvl].indexOf(act);
    if (idx >= 0) {
      this.perms[mod][lvl].splice(idx, 1);
    } else {
      this.perms[mod][lvl].push(act);
    }
    this.savePolicy();
    this.toastr.success('Política de nivel actualizada.', '', { timeOut: 1500 });
  }

  isPolActive(mod: string, lvl: string, act: string): boolean {
    return this.perms[mod] && this.perms[mod][lvl] && this.perms[mod][lvl].includes(act);
  }

  resetPolitica() {
    this.perms = JSON.parse(JSON.stringify(this.permsDefault));
    this.savePolicy();
    this.toastr.success('Políticas restablecidas.', '', { timeOut: 2000 });
  }

  // Override / Ajuste Fino
  loadFineAcc() {
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
    if (this.accFine[uid] && k in this.accFine[uid]) {
      return this.accFine[uid][k];
    }
    return def;
  }

  toggleFinoCheckbox(uid: string, mod: string, cont: string, acc: string, checked: boolean) {
    if (!this.accFine[uid]) {
      this.accFine[uid] = {};
    }
    this.accFine[uid][this.finoKey(mod, cont, acc)] = checked ? 1 : 0;
    this.saveFineAcc();
    this.toastr.success('Permiso específico actualizado.', '', { timeOut: 1500 });
  }

  resetFino() {
    const uid = this.selectedUserId;
    const mod = this.selectedModule;
    if (this.accFine[uid]) {
      Object.keys(this.accFine[uid]).forEach(k => {
        if (k.startsWith(mod + '||')) {
          delete this.accFine[uid][k];
        }
      });
      this.saveFineAcc();
      this.toastr.success('Acceso restablecido al nivel correspondiente.', '', { timeOut: 2000 });
    }
  }

  nivelIdx(n: string): number {
    if (n === 'Gerencial') return 0;
    if (n === 'Jefatura') return 1;
    return 2;
  }

  getSelectedUser() {
    return this.puestosList.find(u => u.id === this.selectedUserId) || this.puestosList[0];
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


