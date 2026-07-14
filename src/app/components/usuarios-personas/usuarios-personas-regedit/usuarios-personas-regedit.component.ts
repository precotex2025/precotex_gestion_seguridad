import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

import { OrganizacionService } from '../../../services/organizacion.service';
import { SedesService } from '../../../services/sedes.service';
import { PuestosService } from '../../../services/puestos.service';
import { MaeTabService } from '../../../services/mae-tab.service';

interface data {
  Title       : string;
  Accion      : string;
  Datos       : any   ;
}

interface combo {
  codigo : string;
  descripcion : string;
}

interface PermissionItem {
  id: string;
  nombre: string;
  seleccion: string;
  colorRojo?: boolean;
}

interface PermissionSection {
  titulo: string;
  columnas: string[];
  esDocumentos?: boolean;
  items: PermissionItem[];
}

@Component({
  selector: 'app-usuarios-personas-regedit',
  standalone: false,
  templateUrl: './usuarios-personas-regedit.component.html',
  styleUrl: './usuarios-personas-regedit.component.css'
})
export class UsuariosPersonasRegeditComponent implements OnInit {
  formulario!: FormGroup;
  lstOrganizacion: combo[] = [];
  lstSedes: combo[] = [];
  lstPuestos: combo[] = [];
  lstNivelRiesgo: combo[] = [];

  activeTab: 'datos' | 'permisos' = 'datos';

  lstSeccionesPermisos: PermissionSection[] = [
    {
      titulo: 'RIESGOS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'riesgo_eval', nombre: 'Evaluación de Riesgos', seleccion: 'ninguno' },
        { id: 'riesgo_plan', nombre: 'Planes de Tratamiento', seleccion: 'ninguno' },
        { id: 'riesgo_bibl', nombre: 'Biblioteca de Controles', seleccion: 'ninguno' },
        { id: 'riesgo_puesto', nombre: 'Riesgos por Puestos de Trabajo', seleccion: 'ninguno' },
        { id: 'riesgo_conf', nombre: 'Configuración de Riesgos', seleccion: 'ninguno' },
        { id: 'riesgo_metod', nombre: 'Metodología de la Evaluación', seleccion: 'ninguno' },
        { id: 'riesgo_seg', nombre: 'Planes de Seguimiento', seleccion: 'ninguno' },
        { id: 'riesgo_oport', nombre: 'Gestión de Oportunidades', seleccion: 'ninguno' },
        { id: 'riesgo_mis', nombre: 'Mis Riesgos', seleccion: 'ninguno' },
        { id: 'riesgo_visor', nombre: 'Visor de Riesgos Propuestos', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'CANAL DE DENUNCIAS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'denun_prev', nombre: 'Previsualización del Canal de Denuncias', seleccion: 'ninguno', colorRojo: true },
        { id: 'denun_gest', nombre: 'Gestión de Denuncias', seleccion: 'ninguno', colorRojo: true },
        { id: 'denun_inv', nombre: 'Gestión de Investigaciones', seleccion: 'ninguno', colorRojo: true },
        { id: 'denun_log', nombre: 'Acceso Log de Denuncias', seleccion: 'ninguno', colorRojo: true },
        { id: 'denun_est', nombre: 'Estadísticas', seleccion: 'ninguno', colorRojo: true },
        { id: 'denun_conf', nombre: 'Configuración del Canal Denuncias', seleccion: 'ninguno', colorRojo: true }
      ]
    },
    {
      titulo: 'AYUDA',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'ayuda_ver', nombre: 'Control de Versiones', seleccion: 'ninguno' },
        { id: 'ayuda_esp', nombre: 'Espacio Consumido', seleccion: 'ninguno' },
        { id: 'ayuda_vis', nombre: 'Visor de Permisos por Puesto', seleccion: 'ninguno' },
        { id: 'ayuda_idi', nombre: 'Idioma de la Aplicación', seleccion: 'ninguno' },
        { id: 'ayuda_vid', nombre: 'VideoTutoriales', seleccion: 'ninguno' },
        { id: 'ayuda_api', nombre: 'Permiso API Sofidya', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'NO CONFORMIDADES',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'noconf_nc', nombre: 'No Conformidades', seleccion: 'ninguno' },
        { id: 'noconf_acc', nombre: 'Acciones Correctivas', seleccion: 'ninguno' },
        { id: 'noconf_conf', nombre: 'Configuración No Conformidades', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'DOCUMENTOS',
      columnas: ['Acceso únicamente documentos asignados', 'Administración / Edición'],
      esDocumentos: true,
      items: [
        { id: 'doc_ctrl', nombre: 'Documentos Controlados', seleccion: 'asignados' },
        { id: 'doc_noctrl', nombre: 'Documentos No Controlados', seleccion: 'asignados' },
        { id: 'doc_pend', nombre: 'Registros Pendientes', seleccion: 'asignados' },
        { id: 'doc_conf', nombre: 'Configuración y Administración Global de toda la Biblioteca Documental', seleccion: 'asignados' },
        { id: 'doc_elim', nombre: 'Eliminar registros cargados', seleccion: 'asignados' },
        { id: 'doc_back', nombre: 'Servicio de Backup Documental', seleccion: 'asignados' }
      ]
    },
    {
      titulo: 'OBJETIVOS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'obj_alta', nombre: 'Alta Objetivos', seleccion: 'ninguno' },
        { id: 'obj_gest', nombre: 'Gestión Objetivos', seleccion: 'ninguno' },
        { id: 'obj_pend', nombre: 'Mediciones Pendientes', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'COMUNICACIONES',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'com_int', nombre: 'Comunicaciones Internas', seleccion: 'ninguno' },
        { id: 'com_inf', nombre: 'Informes de Cumplimiento', seleccion: 'ninguno' },
        { id: 'com_enc', nombre: 'Encuestas Públicas', seleccion: 'ninguno' },
        { id: 'com_cuest', nombre: 'Biblioteca de Cuestionarios', seleccion: 'ninguno' },
        { id: 'com_preg', nombre: 'Biblioteca de Preguntas', seleccion: 'ninguno' },
        { id: 'com_conf', nombre: 'Configuración Encuestas', seleccion: 'ninguno' },
        { id: 'com_sis', nombre: 'Comunicaciones del Sistema', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'INDICADORES',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'ind_alta', nombre: 'Alta de Indicadores', seleccion: 'ninguno' },
        { id: 'ind_gest', nombre: 'Gestión de Indicadores', seleccion: 'ninguno' },
        { id: 'ind_pend', nombre: 'Mediciones Pendientes', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'AUDITORÍAS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'aud_plan', nombre: 'Planificación de Auditorías', seleccion: 'ninguno' },
        { id: 'aud_conf', nombre: 'Configuración de Auditorías', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'PROVEEDORES',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'prov_gest', nombre: 'Gestión', seleccion: 'ninguno' },
        { id: 'prov_eval', nombre: 'Evaluaciones Puntuales', seleccion: 'ninguno' },
        { id: 'prov_conf', nombre: 'Configuración', seleccion: 'ninguno' },
        { id: 'prov_sofi', nombre: 'Gestión Sofidya Analytics', seleccion: 'ninguno' },
        { id: 'prov_comp', nombre: 'Gestión de Compras / Licitaciones', seleccion: 'ninguno' },
        { id: 'prov_fact', nombre: 'Gestión de Facturas', seleccion: 'ninguno' },
        { id: 'prov_cont', nombre: 'Gestión de Contratos', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'PERSONAS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'pers_puestos', nombre: 'Puestos', seleccion: 'ninguno' },
        { id: 'pers_usuarios', nombre: 'Usuarios/Personas', seleccion: 'ninguno' },
        { id: 'pers_acciones', nombre: 'Acciones Formativas', seleccion: 'ninguno' },
        { id: 'pers_conf', nombre: 'Configuración Puestos', seleccion: 'ninguno' },
        { id: 'pers_log', nombre: 'Log de Accesos / Mapa de Permisos', seleccion: 'ninguno' },
        { id: 'pers_admin', nombre: 'Otorgar permisos de administradores', seleccion: 'ninguno' },
        { id: 'pers_doc', nombre: 'Documentación Personas', seleccion: 'ninguno' },
        { id: 'pers_misdoc', nombre: 'Mis Documentos', seleccion: 'ninguno' },
        { id: 'pers_eval', nombre: 'Evaluaciones Puntuales', seleccion: 'ninguno' },
        { id: 'pers_sofi', nombre: 'Sofidya Analytics', seleccion: 'ninguno' },
        { id: 'pers_cursos', nombre: 'Gestión de Cursos Campus Virtual', seleccion: 'ninguno' },
        { id: 'pers_analytics', nombre: 'Analytics', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'CLIENTES',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'cli_gest', nombre: 'Gestión de Clientes', seleccion: 'ninguno' },
        { id: 'cli_eval', nombre: 'Evaluaciones Puntuales', seleccion: 'ninguno' },
        { id: 'cli_conf', nombre: 'Configuración de Clientes', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'EQUIPAMIENTOS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'eq_equip', nombre: 'Equipamientos', seleccion: 'ninguno' },
        { id: 'eq_calib', nombre: 'Gestión de Calibraciones', seleccion: 'ninguno' },
        { id: 'eq_mant', nombre: 'Gestión de Mantenimientos', seleccion: 'ninguno' },
        { id: 'eq_conf', nombre: 'Configuración', seleccion: 'ninguno' },
        { id: 'eq_med', nombre: 'Administración Medidas de Seguridad', seleccion: 'ninguno' },
        { id: 'eq_manuales', nombre: 'Administración Manuales de Uso', seleccion: 'ninguno' },
        { id: 'eq_admin_calib', nombre: 'Administración Calibraciones', seleccion: 'ninguno' },
        { id: 'eq_admin_mant', nombre: 'Administración Mantenimientos', seleccion: 'ninguno' },
        { id: 'eq_admin_val', nombre: 'Administración Valoraciones', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'INFINITY',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'inf_gest_form', nombre: 'Gestión de Formularios', seleccion: 'ninguno' },
        { id: 'inf_val_form', nombre: 'Validación de Formularios', seleccion: 'ninguno' },
        { id: 'inf_sup_val', nombre: 'Supervisión Estado Validaciones', seleccion: 'ninguno' },
        { id: 'inf_formularios', nombre: 'Formularios', seleccion: 'lectura' },
        { id: 'inf_inv', nombre: 'Inventarios Infinity', seleccion: 'ninguno' }
      ]
    },
    {
      titulo: 'PROYECTOS',
      columnas: ['Ninguno', 'Edición', 'Lectura'],
      items: [
        { id: 'proy_gest', nombre: 'Gestión de Proyectos', seleccion: 'ninguno' },
        { id: 'proy_hitos', nombre: 'Gestión de Hitos', seleccion: 'ninguno' },
        { id: 'proy_tareas', nombre: 'Gestión de Tareas', seleccion: 'ninguno' }
      ]
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private matSnackBar: MatSnackBar,
    private SpinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private serviceOrganizacion: OrganizacionService,
    private serviceSede: SedesService,
    private servicePuesto: PuestosService,
    private serviceMaeTab: MaeTabService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<UsuariosPersonasRegeditComponent>
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_codigo: [''],
      ctrol_nombre: ['', Validators.required],
      ctrol_apellidos: ['', Validators.required],
      ctrol_email: ['', [Validators.required, Validators.email]],
      ctrol_telefono: [''],
      ctrol_organizacion: ['', Validators.required],
      ctrol_sede: ['', Validators.required],
      ctrol_puesto: ['', Validators.required],
      ctrol_nivel: ['', Validators.required],
      ctrol_activo: [true],
      ctrol_es_admin: [false]
    });

    this.formulario.get('ctrol_codigo')?.disable();

    this.onComboOrganizacion();
    this.onComboPuestos();
    this.onComboNivelRiesgo();

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.onLoadInfo();
    } else if (this.data.Datos && this.data.Datos.codigo_Organizacion) {
      // Si se pre-seleccionó organización desde el filtro principal
      this.formulario.get('ctrol_organizacion')?.setValue(this.data.Datos.codigo_Organizacion);
      this.onComboSedes(this.data.Datos.codigo_Organizacion);
    }
  }

  onComboOrganizacion() {
    this.lstOrganizacion = [];
    this.serviceOrganizacion.getComboOrganizacion().subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstOrganizacion = response.elements;
        }
      },
      error: (err) => console.error('Error loading organizaciones', err)
    });
  }

  onComboSedes(sCodOrganizacion: string) {
    this.lstSedes = [];
    if (!sCodOrganizacion) return;

    this.SpinnerService.show();
    this.serviceSede.getComboSedes(sCodOrganizacion).subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstSedes = response.elements;
        }
        this.SpinnerService.hide();
      },
      error: (err) => {
        console.error('Error loading sedes', err);
        this.SpinnerService.hide();
      }
    });
  }

  onComboPuestos() {
    this.lstPuestos = [];
    this.servicePuesto.getListadoPuesto('', '', '').subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstPuestos = response.elements.map((el: any) => ({
            codigo: el.codigo_Puesto,
            descripcion: el.denominacion
          }));
        }
      },
      error: (err) => console.error('Error loading puestos', err)
    });
  }

  onComboNivelRiesgo() {
    this.lstNivelRiesgo = [];
    this.serviceMaeTab.getListaMaeTab('TIPO_NIVEL_RIESGO').subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstNivelRiesgo = response.elements;
        }
      },
      error: (err) => console.error('Error loading nivel de riesgo', err)
    });
  }

  onChangeOrga(event: any) {
    const valor = event.value;
    this.formulario.get('ctrol_sede')?.setValue('');
    this.onComboSedes(valor);
  }

  onLoadInfo() {
    const d = this.data.Datos;
    this.formulario.get('ctrol_codigo')?.setValue(d.codigo_Persona || '');
    this.formulario.get('ctrol_nombre')?.setValue(d.nombre || '');
    this.formulario.get('ctrol_apellidos')?.setValue(d.apellidos || '');
    this.formulario.get('ctrol_email')?.setValue(d.email || '');
    this.formulario.get('ctrol_telefono')?.setValue(d.telefono || '');
    this.formulario.get('ctrol_organizacion')?.setValue(d.codigo_Organizacion || '');
    this.formulario.get('ctrol_puesto')?.setValue(d.codigo_Puesto || '');
    this.formulario.get('ctrol_nivel')?.setValue(d.codigo_Nivel_Riesgo || d.nivelRiesgo || '');
    this.formulario.get('ctrol_activo')?.setValue(d.flg_Activo === 'True' || d.flg_Activo === '1');
    this.formulario.get('ctrol_es_admin')?.setValue(d.es_admin === 'Sí' || d.es_admin === 'True');

    if (d.codigo_Organizacion) {
      this.serviceSede.getComboSedes(d.codigo_Organizacion).subscribe({
        next: (response: any) => {
          if (response.success && response.totalElements > 0) {
            this.lstSedes = response.elements;
            this.formulario.get('ctrol_sede')?.setValue(d.codigo_Sede || '');
          }
        }
      });
    }

    if (d.permisos) {
      // Si el registro ya posee permisos configurados, cargarlos
      this.lstSeccionesPermisos.forEach(seccion => {
        seccion.items.forEach(item => {
          if (d.permisos[item.id]) {
            item.seleccion = d.permisos[item.id];
          }
        });
      });
    }
  }

  marcarTodosSeccion(seccion: PermissionSection, valor: string) {
    seccion.items.forEach(item => {
      item.seleccion = valor;
    });
  }

  marcarTodosGlobal(valor: string) {
    this.lstSeccionesPermisos.forEach(seccion => {
      // Excluir sección Documentos que tiene columnas diferentes
      if (!seccion.esDocumentos) {
        seccion.items.forEach(item => {
          item.seleccion = valor;
        });
      }
    });
  }

  onSave() {
    if (this.formulario.invalid) {
      this.matSnackBar.open("¡Complete los campos obligatorios (*)!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 2000,
      });
      return;
    }

    const sTitle = this.data.Accion === 'I' ? 'Registrar' : 'Actualizar';
    Swal.fire({
      title: `¿Desea ${sTitle.toLowerCase()} el usuario/persona?, Confirme`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.SpinnerService.show();
        setTimeout(() => {
          const formVal = this.formulario.getRawValue();

          // Encontrar descripciones de combos
          const org = this.lstOrganizacion.find(o => o.codigo === formVal.ctrol_organizacion);
          const sd = this.lstSedes.find(s => s.codigo === formVal.ctrol_sede);
          const pst = this.lstPuestos.find(p => p.codigo === formVal.ctrol_puesto);

          // Construir mapa de permisos para persistir
          const permisosMap: { [key: string]: string } = {};
          this.lstSeccionesPermisos.forEach(sec => {
            sec.items.forEach(it => {
              permisosMap[it.id] = it.seleccion;
            });
          });

          const personaResult = {
            codigo_Persona: formVal.ctrol_codigo || `P00${Math.floor(Math.random() * 900) + 100}`,
            nombre: formVal.ctrol_nombre,
            apellidos: formVal.ctrol_apellidos,
            nombreCompleto: `${formVal.ctrol_nombre} ${formVal.ctrol_apellidos}`,
            email: formVal.ctrol_email,
            telefono: formVal.ctrol_telefono,
            codigo_Organizacion: formVal.ctrol_organizacion,
            organizacion: org ? org.descripcion : '',
            codigo_Sede: formVal.ctrol_sede,
            sede: sd ? sd.descripcion : '',
            codigo_Puesto: formVal.ctrol_puesto,
            puesto: pst ? pst.descripcion : '',
            codigo_Nivel_Riesgo: formVal.ctrol_nivel,
            nivelRiesgo: formVal.ctrol_nivel,
            flg_Activo: formVal.ctrol_activo ? 'True' : 'False',
            es_admin: formVal.ctrol_es_admin ? 'Sí' : 'No',
            permisos: permisosMap,
            proxima: this.data.Datos?.proxima || 'Pendiente',
            estado_evaluacion: this.data.Datos?.estado_evaluacion || 'True',
            proxima_evaluacion_plan: this.data.Datos?.proxima_evaluacion_plan || 'Pendiente'
          };

          this.SpinnerService.hide();
          this.toastr.success(`Usuario/Persona ${this.data.Accion === 'I' ? 'registrada' : 'actualizada'} correctamente`, '', { timeOut: 2500 });
          this.dialogRef.close(personaResult);
        }, 800);
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}
