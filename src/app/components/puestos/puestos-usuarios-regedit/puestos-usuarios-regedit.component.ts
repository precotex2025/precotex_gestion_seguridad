import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U'
  Datos: any;
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
      'Hilandería',
      'Tejeduría',
      'Tintorería',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Aseguramiento de Calidad Textil',
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
      'Capacitaciones y Desarrollo',
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
      'Mejora Continua',
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

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PuestosUsuariosRegeditComponent>,
    private procesosService: ProcesosService
  ) {}

  ngOnInit(): void {
    this.cargarKeyUsers();

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
      ctrol_puesto: ['', Validators.required],
      ctrol_proceso: ['', Validators.required],
      ctrol_usuario: [''],
      ctrol_email: ['', [Validators.required, Validators.email]],
      ctrol_password: ['Precotex2026!', Validators.required],
      ctrol_nivel: ['Operativo', Validators.required],
      ctrol_permisos: ['Lectura + descarga + modificar', Validators.required],
      ctrol_estado: [this.data.Accion === 'I' ? 'Pendiente de activación' : 'Activo', Validators.required],
      ctrol_enviar_credenciales: [false]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        ctrol_puesto: this.data.Datos.puesto,
        ctrol_proceso: this.data.Datos.proceso,
        ctrol_usuario: this.data.Datos.usuario || '',
        ctrol_email: this.data.Datos.email || (this.data.Datos.usuario ? (this.data.Datos.usuario.toLowerCase().replace(/\s+/g, '.') + '@precotexperu.com') : ''),
        ctrol_password: this.data.Datos.password || 'Precotex2026!',
        ctrol_nivel: this.data.Datos.nivel || 'Operativo',
        ctrol_permisos: this.data.Datos.permisos || 'Lectura + descarga + modificar',
        ctrol_estado: this.data.Datos.estado || 'Activo',
        ctrol_enviar_credenciales: false
      });
    }
  }

  cargarKeyUsers(): void {
    const defaultList = [
      { nombre: 'Cynthia Aldana', email: 'caldana@precotexperu.com', puesto: 'Coordinador de SSOMA', proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)', nivel: 'Jefatura' },
      { nombre: 'Luis Aldana', email: 'laldana@precotexperu.com', puesto: 'Jefe de Seguridad y Salud Ocupacional', proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)', nivel: 'Gerencial' },
      { nombre: 'Sayda Huaranga', email: 'shuaranga@precotexperu.com', puesto: 'Supervisor de SST', proceso: 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)', nivel: 'Jefatura' },
      { nombre: 'Elizabet Rivera', email: 'erivera@precotexperu.com', puesto: 'Jefatura de Calidad', proceso: 'Aseguramiento de Calidad Textil', nivel: 'Jefatura' },
      { nombre: 'Cesar Lingan', email: 'clingan@precotexperu.com', puesto: 'Analista de Auditoría Interna', proceso: 'Auditoría Interna', nivel: 'Operativo' },
      { nombre: 'Mary Guevara', email: 'mguevara@precotexperu.com', puesto: 'Coordinadora de Desarrollo y Capacitaciones', proceso: 'Capacitaciones y Desarrollo', nivel: 'Jefatura' },
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
    } catch (e) {}

    this.keyUsersList = defaultList;
  }

  onSeleccionarKeyUser(event: any): void {
    const selectedNom = event?.target?.value || '';
    if (!selectedNom) return;

    const matched = this.keyUsersList.find(u => u.nombre.toLowerCase() === selectedNom.toLowerCase() || (u.email && u.email.toLowerCase() === selectedNom.toLowerCase()));
    if (matched) {
      this.formulario.patchValue({
        ctrol_usuario: matched.nombre,
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

      this.toastr.info(`Key User "${matched.nombre}" vinculado. Correo autocompletado: ${matched.email}`, 'Key User Seleccionado', { timeOut: 2500 });
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor ingrese todos los campos obligatorios y un correo electrónico válido.', 'PUE-02: Formulario Incompleto', { timeOut: 3000 });
      return;
    }

    const val = this.formulario.value;
    this.dialogRef.close(val);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
