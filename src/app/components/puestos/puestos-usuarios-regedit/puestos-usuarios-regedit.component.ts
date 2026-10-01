import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { PuestosService } from '../../../services/puestos.service';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U'
  Datos: any;
  UsuariosExistentes?: any[];
}

@Component({
  selector: 'app-puestos-usuarios-regedit',
  standalone: false,
  templateUrl: './puestos-usuarios-regedit.component.html',
  styleUrls: ['./puestos-usuarios-regedit.component.css']
})
export class PuestosUsuariosRegeditComponent implements OnInit {
  formulario!: FormGroup;
  keyUsersList: any[] = [];
  usuariosRegistradosMap: Map<string, string> = new Map<string, string>();
  usuarioDuplicado: boolean = false;
  usuarioDuplicadoNombreColaborador: string = '';
  sugerenciaUsuarioUnico: string = '';
  ultimoTrabajadorSeleccionado: any = null;

  procesosGroups: { [key: string]: string[] } = {
    'Gerencia General (GG)': [
      'Sistema de Gestión General',
      'Gestión Estratégica',
      'Proyectos Gerenciales',
      'Desarrollo de Negocios',
      'Alianzas Estratégicas',
      'Comercial Exportación de Telas',
      'Comercial Venta Local Textil'
    ],
    'Gestión Comercial (GCOM)': [
      'Desarrollo de Producto',
      'Desarrollo de Estampado y Bordado',
      'Desarrollo Textil',
      'Comercial Exportación de Prendas'
    ],
    'Planeamiento y Control de la Producción (PCP)': [
      'PCP Textil',
      'PCP Manufactura',
      'PCP Estampado y Bordado'
    ],
    'Logística (LOG)': [
      'Almacén',
      'Comercio Exterior',
      'Logística',
      'Transporte'
    ],
    'Balance de Materia (BM)': [
      'Balance de Materia'
    ],
    'Operaciones Textil (OPT)': [
      'Tejeduría',
      'Tintorería',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Aseguramiento de la Calidad Textil',
      'Lavandería'
    ],
    'Operaciones Manufactura (OPM)': [
      'Corte',
      'Costura',
      'Inspección',
      'Acabados',
      'Aseguramiento de la Calidad Manufactura',
      'Consumos'
    ],
    'Servicio de Estampado y Bordado (SEB)': [
      'Estampado',
      'Bordado',
      'Calidad Estampado y Bordado',
      'Planeamiento y Programación de la Producción E&B'
    ],
    'Gestión Humana (GGHH)': [
      'Gestión Humana',
      'Administración de Personal',
      'Capacitación',
      'Comunicaciones',
      'Bienestar Social',
      'Selección de Personal'
    ],
    'Administración y Finanzas (AFC)': [
      'Administración',
      'Finanzas',
      'Contabilidad y Costos',
      'Tesorería'
    ],
    'Ingeniería y Mejora Continua (IMC)': [
      'Organización y Métodos',
      'Ingeniería',
      'Investigación, Desarrollo e Innovación',
      'Certificaciones'
    ],
    'Control Patrimonial (CPT)': [
      'Control Patrimonial'
    ],
    'Auditoría Interna (AIO)': [
      'Auditoría Interna'
    ],
    'Soporte (SOP)': [
      'Tecnologías de la Información (Sistemas)',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Seguridad Patrimonial',
      'Mantenimiento e Infraestructura'
    ]
  };

  trabajadoresList: any[] = [];
  lstNivelJerarquico: any[] = [
    { codigo: '001', descripcion: 'Gerencial' },
    { codigo: '002', descripcion: 'Jefatura' },
    { codigo: '003', descripcion: 'Operativo' }
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PuestosUsuariosRegeditComponent>,
    private procesosService: ProcesosService,
    private puestosService: PuestosService
  ) { }

  ngOnInit(): void {
    if (this.data && this.data.Accion === 'I') {
      try {
        localStorage.removeItem('precotex_cuentas_usuarios');
        localStorage.removeItem('precotex_puestos_usuarios');
        localStorage.removeItem('precotex_puestos_eliminados');
      } catch (e) { }
    }

    this.cargarKeyUsers();
    this.cargarUsuariosExistentes();
    this.cargarTrabajadoresSpring();
    // this.cargarHistorialUsuario(); // Comentado por petición del usuario
    this.cargarNivelJerarquico();

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = { ...this.procesosGroups, ...groups };
        }
      },
      error: () => {
        // Mantiene la lista por defecto
      }
    });

    this.formulario = this.fb.group({
      ctrol_colaborador: ['', Validators.required],
      ctrol_puesto: ['', Validators.required],
      ctrol_proceso: ['', Validators.required],
      ctrol_usuario: ['', Validators.required],
      ctrol_email: ['', [Validators.required, Validators.email]],
      ctrol_password: ['', Validators.required],
      ctrol_nivel: ['Operativo', Validators.required],
      ctrol_permisos: ['Lectura + descarga + modificar', Validators.required],
      ctrol_estado: [this.data.Accion === 'I' ? 'Pendiente de activación' : 'Activo', Validators.required],
      ctrol_enviar_credenciales: [true] // PUE-02: Envío automático marcado por defecto
    });

    // Validación reactiva de duplicidad en tiempo real al escribir en ctrol_usuario
    this.formulario.get('ctrol_usuario')?.valueChanges.subscribe(val => {
      this.validarUsuarioDuplicado(val);
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      const email = this.data.Datos.email || (this.data.Datos.raw?.puesto_Caracteristicas && this.data.Datos.raw.puesto_Caracteristicas.includes('|') ? this.data.Datos.raw.puesto_Caracteristicas.split('|')[1] : '');
      const loginAcceso = (this.data.Datos.userCode || (this.data.Datos.usuario && !this.data.Datos.usuario.includes(' ') && this.data.Datos.usuario.length <= 25))
        ? (this.data.Datos.userCode || this.data.Datos.usuario)
        : (email ? email.split('@')[0] : '');
      const colaboradorNombre = (this.data.Datos.usuario && this.data.Datos.usuario !== '—')
        ? this.data.Datos.usuario
        : '';
      const puestoCargo = this.data.Datos.puesto || '';

      this.formulario.patchValue({
        ctrol_colaborador: colaboradorNombre,
        ctrol_puesto: puestoCargo,
        ctrol_proceso: this.data.Datos.proceso,
        ctrol_usuario: loginAcceso || (email ? email.split('@')[0] : (colaboradorNombre ? colaboradorNombre.toLowerCase().replace(/,/g, '').split(/\s+/).slice(0, 2).join('.') : '')),
        ctrol_email: email || (loginAcceso ? (loginAcceso.toLowerCase().replace(/\s+/g, '.') + '@precotexperu.com') : ''),
        ctrol_password: this.data.Datos.password || 'Precotex2026!',
        ctrol_nivel: (this.data.Datos.nivel || 'Operativo').toString().toLowerCase().includes('mando') ? 'Jefatura' : (this.data.Datos.nivel || 'Operativo'),
        ctrol_permisos: this.data.Datos.permisos || 'Lectura + descarga + modificar',
        ctrol_estado: this.data.Datos.estado || 'Activo',
        ctrol_enviar_credenciales: false
      });
    }
  }

  cargarUsuariosExistentes(): void {
    this.usuariosRegistradosMap.clear();

    // 1. Cargar desde la lista de puestos existentes enviados al modal
    if (this.data.UsuariosExistentes && Array.isArray(this.data.UsuariosExistentes)) {
      this.data.UsuariosExistentes.forEach((p: any) => {
        const nom = p.usuario || p.nom_Usuario || p.puesto || 'Puesto existente';
        const usr = (p.usuario && p.usuario !== '—' && !p.usuario.includes(' ')
          ? p.usuario
          : (p.email ? p.email.split('@')[0] : (p.usuario || ''))).toLowerCase().trim();
        if (usr) {
          this.usuariosRegistradosMap.set(usr, nom);
        }
      });
    }

    // 2. Cargar desde cuentas registradas localmente
    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      if (rawCuentas) {
        const cuentas = JSON.parse(rawCuentas);
        cuentas.forEach((c: any) => {
          const usr = (c.cod_Usuario || '').toLowerCase().trim();
          const nom = c.nom_Usuario || c.puesto || 'Usuario del sistema';
          if (usr) {
            this.usuariosRegistradosMap.set(usr, nom);
          }
        });
      }
    } catch (e) { }
  }

  validarUsuarioDuplicado(val: string): void {
    const clean = (val || '').trim().toLowerCase();
    if (!clean) {
      this.usuarioDuplicado = false;
      this.usuarioDuplicadoNombreColaborador = '';
      this.sugerenciaUsuarioUnico = '';
      return;
    }

    // En edición, permitir el mismo usuario asignado previamente a este registro
    const currentEditingUser = (this.data.Accion === 'U' && this.data.Datos)
      ? (this.data.Datos.usuario && !this.data.Datos.usuario.includes(' ')
        ? this.data.Datos.usuario
        : (this.data.Datos.email ? this.data.Datos.email.split('@')[0] : (this.data.Datos.usuario || ''))).toLowerCase().trim()
      : '';

    if (currentEditingUser && clean === currentEditingUser) {
      this.usuarioDuplicado = false;
      this.usuarioDuplicadoNombreColaborador = '';
      this.sugerenciaUsuarioUnico = '';
      return;
    }

    if (this.usuariosRegistradosMap.has(clean)) {
      this.usuarioDuplicado = true;
      this.usuarioDuplicadoNombreColaborador = this.usuariosRegistradosMap.get(clean) || 'otro colaborador';

      // Generar sugerencia de usuario único usando la ficha o contador
      const ficha = (this.ultimoTrabajadorSeleccionado?.codigo || '').toLowerCase().trim();
      if (ficha && !clean.includes(ficha)) {
        this.sugerenciaUsuarioUnico = `${clean}.${ficha}`;
      } else {
        let counter = 2;
        while (this.usuariosRegistradosMap.has(`${clean}${counter}`)) {
          counter++;
        }
        this.sugerenciaUsuarioUnico = `${clean}${counter}`;
      }
    } else {
      this.usuarioDuplicado = false;
      this.usuarioDuplicadoNombreColaborador = '';
      this.sugerenciaUsuarioUnico = '';
    }
  }

  aplicarSugerenciaUsuario(): void {
    if (this.sugerenciaUsuarioUnico) {
      this.formulario.patchValue({ ctrol_usuario: this.sugerenciaUsuarioUnico });
      this.validarUsuarioDuplicado(this.sugerenciaUsuarioUnico);
      this.toastr.info(`Sugerencia "${this.sugerenciaUsuarioUnico}" aplicada.`, 'Usuario Único Generado', { timeOut: 2500 });
    }
  }

  cargarKeyUsers(): void {
    const defaultList = [
      { nombre: 'Cynthia Aldana', email: 'caldana@precotexperu.com', puesto: 'Coordinador de SSOMA', proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)', nivel: 'Jefatura' },
      { nombre: 'Luis Aldana', email: 'laldana@precotexperu.com', puesto: 'Jefe de Seguridad y Salud Ocupacional', proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)', nivel: 'Gerencial' },
      { nombre: 'Sayda Huaranga', email: 'shuaranga@precotexperu.com', puesto: 'Supervisor de SST', proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)', nivel: 'Jefatura' },
      { nombre: 'Elizabet Rivera', email: 'erivera@precotexperu.com', puesto: 'Jefatura de Calidad', proceso: 'Aseguramiento de la Calidad Textil', nivel: 'Jefatura' },
      { nombre: 'Cesar Lingan', email: 'clingan@precotexperu.com', puesto: 'Analista de Auditoría Interna', proceso: 'Auditoría Interna', nivel: 'Operativo' },
      { nombre: 'Mary Guevara', email: 'mguevara@precotexperu.com', puesto: 'Coordinadora de Desarrollo y Capacitaciones', proceso: 'Capacitación', nivel: 'Jefatura' },
      { nombre: 'Alfredo Toro', email: 'atoro@precotexperu.com', puesto: 'Analista de Sistemas', proceso: 'Tecnologías de la Información (Sistemas)', nivel: 'Operativo' },
      { nombre: 'Francisco Huamani', email: 'fhuamani@precotexperu.com', puesto: 'Analista SIG', proceso: 'Sistema de Gestión General', nivel: 'Operativo' },
      { nombre: 'Max Soria', email: 'msoria@precotexperu.com', puesto: 'Analista de Sistemas', proceso: 'Tecnologías de la Información (Sistemas)', nivel: 'Operativo' },
      { nombre: 'Karem Flores', email: 'kflores@precotexperu.com', puesto: 'Gerente de Comercial', proceso: 'Comercial Exportación de Prendas', nivel: 'Gerencial' },
      { nombre: 'Mia Zegarra', email: 'mzegarra@precotexperu.com', puesto: 'Analista de Auditoría Interna', proceso: 'Auditoría Interna', nivel: 'Operativo' },
      { nombre: 'Keith Vega', email: 'kvega@precotexperu.com', puesto: 'Asistente de Auditoría Interna', proceso: 'Auditoría Interna', nivel: 'Operativo' }
    ];

    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      if (rawCuentas) {
        const cuentas = JSON.parse(rawCuentas);
        cuentas.forEach((c: any) => {
          const nom = c.nom_Usuario || c.cod_Usuario || '';
          if (nom && !defaultList.some(d => d.nombre.toLowerCase() === nom.toLowerCase())) {
            defaultList.push({
              nombre: nom,
              email: c.email || `${nom.toLowerCase().replace(/\s+/g, '.')}@precotexperu.com`,
              puesto: c.puesto || '',
              proceso: '',
              nivel: c.cod_Rol === '1' ? 'Gerencial' : 'Operativo'
            });
          }
        });
      }
    } catch (e) { }

    this.keyUsersList = defaultList;
  }

  cargandoTrabajadores: boolean = false;
  mostrarDropdownTrabajadores: boolean = false;
  trabajadoresFiltrados: any[] = [];
  indiceSeleccionadoTrabajador: number = -1;

  // Carga de trabajadores desde Spring ERP (192.168.1.86) o directorio local
  cargarTrabajadoresSpring(): void {
    this.cargandoTrabajadores = true;
    this.puestosService.getTrabajadoresSpring().subscribe({
      next: (res: any) => {
        this.cargandoTrabajadores = false;
        const rawList = res?.elements || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          this.trabajadoresList = rawList.map((t: any) => ({
            codigo: t.codigo || t.Codigo || t.personaAnt || '',
            nombre: t.nombreCompleto || t.NombreCompleto || t.nombre || '',
            correo: t.correo || t.Correo || t.correoInterno || '',
            cargo: t.cargo || t.Cargo || t.descripcionLocal || '',
            tipo: t.tipo || t.Tipo || 'E'
          }));
          this.filtrarTrabajadores();
        } else if (this.trabajadoresList.length === 0) {
          this.trabajadoresList = this.keyUsersList.map(d => ({
            codigo: d.email ? d.email.split('@')[0] : '',
            nombre: d.nombre,
            correo: d.email,
            cargo: d.puesto,
            tipo: 'E'
          }));
          this.filtrarTrabajadores();
        }
      },
      error: () => {
        this.cargandoTrabajadores = false;
        if (this.trabajadoresList.length === 0) {
          this.trabajadoresList = this.keyUsersList.map(d => ({
            codigo: d.email ? d.email.split('@')[0] : '',
            nombre: d.nombre,
            correo: d.email,
            cargo: d.puesto,
            tipo: 'E'
          }));
          this.filtrarTrabajadores();
        }
      }
    });
  }

  // Carga e integración del Stored Procedure UP_MuestraHistorialUsuario
  cargarHistorialUsuario(): void {
    this.puestosService.getHistorialUsuario().subscribe({
      next: (res: any) => {
        const raw = res?.elements || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(raw) && raw.length > 0) {
          raw.forEach((h: any) => {
            const nom = (h.nom_Usuario || h.usuario || '').trim();
            const cod = (h.cod_Usuario || h.userCode || '').trim();
            const cargo = (h.puesto || '').trim();
            if (nom && !this.trabajadoresList.some(t => t.nombre.toLowerCase() === nom.toLowerCase())) {
              this.trabajadoresList.push({
                codigo: cod,
                nombre: nom,
                correo: h.email || (cod ? `${cod}@precotexperu.com` : ''),
                cargo: cargo,
                tipo: 'E'
              });
            }
          });
          this.filtrarTrabajadores();
        }
      },
      error: () => { }
    });
  }

  // Carga de niveles jerárquicos desde el Stored Procedure SN_Nivel_Jerarquico_Listado
  cargarNivelJerarquico(): void {
    this.puestosService.getListadoNivelJerarquico().subscribe({
      next: (res: any) => {
        const rawList = res?.elements || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const listMapeada = rawList.map((n: any) => {
            let desc = (n.descripcion || n.Descripcion || n.descripcion_Nivel || '').trim();
            if (desc.toLowerCase().includes('mando')) desc = 'Jefatura';
            return {
              codigo: (n.codigo || n.Codigo || n.codigo_Nivel || '').toString(),
              descripcion: desc
            };
          });
          const unicos: any[] = [];
          listMapeada.forEach((item: any) => {
            if (item.descripcion && !unicos.some(u => u.descripcion.toLowerCase() === item.descripcion.toLowerCase())) {
              unicos.push(item);
            }
          });
          if (unicos.length > 0) {
            this.lstNivelJerarquico = unicos;
          }
        }
      },
      error: () => { }
    });
  }

  // Filtrado reactivo al teclear
  filtrarTrabajadores(query: string = ''): void {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.trabajadoresFiltrados = this.trabajadoresList.slice(0, 45);
      return;
    }

    this.trabajadoresFiltrados = this.trabajadoresList.filter((t: any) => {
      const nombre = (t.nombre || '').toLowerCase();
      const codigo = (t.codigo || '').toLowerCase();
      const cargo = (t.cargo || '').toLowerCase();
      const correo = (t.correo || '').toLowerCase();
      return nombre.includes(q) || codigo.includes(q) || cargo.includes(q) || correo.includes(q);
    }).slice(0, 45);
  }

  onInputTrabajador(event: any): void {
    const val = event?.target?.value || '';
    this.mostrarDropdownTrabajadores = true;
    this.indiceSeleccionadoTrabajador = -1;
    this.filtrarTrabajadores(val);
  }

  onFocusTrabajador(): void {
    this.mostrarDropdownTrabajadores = true;
    const currentVal = this.formulario.get('ctrol_colaborador')?.value || '';
    this.filtrarTrabajadores(currentVal);
  }

  onBlurTrabajador(): void {
    setTimeout(() => {
      this.mostrarDropdownTrabajadores = false;
    }, 250);
  }

  toggleDropdownTrabajadores(): void {
    this.mostrarDropdownTrabajadores = !this.mostrarDropdownTrabajadores;
    if (this.mostrarDropdownTrabajadores) {
      const currentVal = this.formulario.get('ctrol_colaborador')?.value || '';
      this.filtrarTrabajadores(currentVal);
    }
  }

  onKeydownTrabajador(event: KeyboardEvent): void {
    if (!this.mostrarDropdownTrabajadores) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.mostrarDropdownTrabajadores = true;
        this.filtrarTrabajadores(this.formulario.get('ctrol_colaborador')?.value || '');
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.indiceSeleccionadoTrabajador = Math.min(
        this.indiceSeleccionadoTrabajador + 1,
        this.trabajadoresFiltrados.length - 1
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.indiceSeleccionadoTrabajador = Math.max(this.indiceSeleccionadoTrabajador - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.indiceSeleccionadoTrabajador >= 0 && this.trabajadoresFiltrados[this.indiceSeleccionadoTrabajador]) {
        this.seleccionarTrabajadorItem(this.trabajadoresFiltrados[this.indiceSeleccionadoTrabajador]);
      }
    } else if (event.key === 'Escape') {
      this.mostrarDropdownTrabajadores = false;
    }
  }

  // Selección de trabajador: autocompleta usuario, email, calcula nivel jerárquico y maneja homónimos
  seleccionarTrabajadorItem(matched: any): void {
    if (!matched) return;
    this.ultimoTrabajadorSeleccionado = matched;

    // Calcular usuario base
    let emailPrefix = matched.correo ? matched.correo.split('@')[0].trim().toLowerCase() : '';
    let userAccess = emailPrefix;
    if (!userAccess) {
      const cleanName = (matched.nombre || '').toLowerCase().replace(/,/g, '').trim();
      const parts = cleanName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        userAccess = `${parts[0]}.${parts[1]}`;
      } else {
        userAccess = cleanName;
      }
    }
    userAccess = userAccess.toLowerCase().trim();

    // 1. Detectar si en la empresa hay HOMÓNIMOS (personas con el mismo nombre y apellido)
    const homonimos = this.trabajadoresList.filter((t: any) =>
      (t.nombre || '').toLowerCase().trim() === (matched.nombre || '').toLowerCase().trim()
    );

    const ficha = (matched.codigo || '').toLowerCase().trim();

    if (homonimos.length > 1 && ficha) {
      // Homónimos confirmados en la base de datos de trabajadores: adjuntar ficha para asegurar unicidad
      userAccess = `${userAccess}.${ficha}`;
      this.toastr.info(
        `Se detectaron ${homonimos.length} colaboradores con el mismo nombre y apellido. Se generó el usuario de acceso único con su ficha: "${userAccess}".`,
        'Homónimo Detectado',
        { timeOut: 4500 }
      );
    } else {
      // 2. Si no es homónimo directo en Spring pero el usuario de acceso ya está registrado por otra persona
      const currentEditingUser = (this.data.Accion === 'U' && this.data.Datos)
        ? (this.data.Datos.usuario || '').toLowerCase().trim()
        : '';

      if (userAccess !== currentEditingUser && this.usuariosRegistradosMap.has(userAccess)) {
        const userAccessConFicha = ficha ? `${userAccess}.${ficha}` : `${userAccess}2`;
        this.toastr.warning(
          `El usuario "${userAccess}" ya está en uso por otro colaborador. Se generó "${userAccessConFicha}" para evitar conflicto.`,
          'Usuario Duplicado Prevenido',
          { timeOut: 4500 }
        );
        userAccess = userAccessConFicha;
      }
    }

    // Determinar Nivel Jerárquico automáticamente según el cargo en Spring ERP
    let nivelCalculado = 'Operativo';
    const cargoUpper = (matched.cargo || '').toUpperCase();
    if (cargoUpper.includes('GERENTE') || cargoUpper.includes('DIRECTOR')) {
      nivelCalculado = 'Gerencial';
    } else if (cargoUpper.includes('JEFE') || cargoUpper.includes('SUPERVISOR') || cargoUpper.includes('COORDINADOR')) {
      nivelCalculado = 'Jefatura';
    }

    this.formulario.patchValue({
      ctrol_colaborador: matched.nombre,
      ctrol_puesto: matched.cargo || this.formulario.get('ctrol_puesto')?.value || '',
      ctrol_usuario: userAccess,
      ctrol_email: matched.correo || (userAccess ? `${userAccess}@precotexperu.com` : ''),
      ctrol_nivel: nivelCalculado
    });

    this.validarUsuarioDuplicado(userAccess);
    this.mostrarDropdownTrabajadores = false;
  }

  // Método legacy por compatibilidad
  onSeleccionarTrabajador(event: any): void {
    const val = (event?.target?.value || '').trim();
    if (!val) return;

    const matched = this.trabajadoresList.find((t: any) =>
      t.nombre.toLowerCase() === val.toLowerCase() ||
      t.codigo.toLowerCase() === val.toLowerCase() ||
      (t.correo && t.correo.toLowerCase() === val.toLowerCase())
    );

    if (matched) {
      this.seleccionarTrabajadorItem(matched);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'TR';
    const clean = name.replace(/,/g, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  onSeleccionarKeyUser(event: any): void {
    const selectedNom = event?.target?.value || '';
    if (!selectedNom) return;

    const matched = this.keyUsersList.find((u: any) => u.nombre.toLowerCase() === selectedNom.toLowerCase() || (u.email && u.email.toLowerCase() === selectedNom.toLowerCase()));
    if (matched) {
      this.formulario.patchValue({
        ctrol_colaborador: matched.nombre,
        ctrol_usuario: matched.email ? matched.email.split('@')[0] : matched.nombre,
        ctrol_email: matched.email
      });

      if (matched.puesto && !this.formulario.get('ctrol_puesto')?.value) {
        this.formulario.patchValue({ ctrol_puesto: matched.puesto });
      }
      if (matched.proceso && !this.formulario.get('ctrol_proceso')?.value) {
        this.formulario.patchValue({ ctrol_proceso: matched.proceso });
      }
      if (matched.nivel && !this.formulario.get('ctrol_nivel')?.value) {
        this.formulario.patchValue({ ctrol_nivel: matched.nivel });
      }

      this.validarUsuarioDuplicado(matched.nombre);
    }
  }

  mostrarPassword = false;

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  sugerirClave(): void {
    this.formulario.patchValue({ ctrol_password: 'Precotex2026!' });
    this.toastr.info('Contraseña sugerida "Precotex2026!" aplicada.', 'Clave Generada', { timeOut: 2000 });
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar() {
    if (!this.formulario.get('ctrol_password')?.value) {
      this.formulario.patchValue({ ctrol_password: 'Precotex2026!' });
    }

    // Validar restricción de usuario de acceso duplicado
    const userVal = (this.formulario.get('ctrol_usuario')?.value || '').trim();
    this.validarUsuarioDuplicado(userVal);

    if (this.usuarioDuplicado) {
      this.toastr.error(
        `El usuario de acceso "${userVal}" ya está asignado a ${this.usuarioDuplicadoNombreColaborador}. Por favor use un usuario diferente o aplique la sugerencia.`,
        'Restricción: Usuario Duplicado',
        { timeOut: 5000 }
      );
      return;
    }

    if (this.formulario.invalid) {
      this.toastr.warning('Por favor ingrese todos los campos obligatorios y un correo electrónico válido.', 'Formulario Incompleto', { timeOut: 3000 });
      return;
    }

    const val = this.formulario.getRawValue();
    if (this.data.Accion === 'I') {
      val.ctrol_estado = 'Pendiente de activación';
    }

    const colabNombre = (val.ctrol_colaborador || '').toLowerCase().trim();
    let matchedTrabajador: any = null;
    if (this.ultimoTrabajadorSeleccionado &&
      (this.ultimoTrabajadorSeleccionado.nombre || '').toLowerCase().trim() === colabNombre) {
      matchedTrabajador = this.ultimoTrabajadorSeleccionado;
    } else {
      matchedTrabajador = this.trabajadoresList.find((t: any) =>
        (t.nombre && t.nombre.toLowerCase().trim() === colabNombre) ||
        (t.codigo && t.codigo.toLowerCase().trim() === (val.ctrol_usuario || '').toLowerCase().trim()) ||
        (t.correo && val.ctrol_email && t.correo.toLowerCase().trim() === val.ctrol_email.toLowerCase().trim())
      ) || this.ultimoTrabajadorSeleccionado;
    }

    // El tipo ('E'/'O') y código de planilla provienen exclusivamente de UP_MuestraDatosTrabajador
    val.tip_trabajador = (matchedTrabajador?.tipo || this.data.Datos?.tip_Trabajador || 'E').trim();
    val.cod_trabajador = (matchedTrabajador?.codigo || this.data.Datos?.cod_Trabajador || '').trim();

    this.dialogRef.close(val);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
