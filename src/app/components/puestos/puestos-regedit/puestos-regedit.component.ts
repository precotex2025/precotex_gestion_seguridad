import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { OrganizacionService } from '../../../services/organizacion.service';
import { SedesService } from '../../../services/sedes.service';
import { MaeTabService } from '../../../services/mae-tab.service';
import Swal from 'sweetalert2';
import { PuestosService } from '../../../services/puestos.service';
import { ProcesosService } from '../../../services/procesos.service';

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
  selector: 'app-puestos-regedit',
  standalone: false,
  templateUrl: './puestos-regedit.component.html',
  styleUrl: './puestos-regedit.component.css'
})
export class PuestosRegeditComponent implements OnInit {
  lstOrganizacion : combo []=[];
  lstSedes        : combo []=[];
  lstNivelRiesgo  : combo []=[];
  formulario!     : FormGroup; 
  activeTab       : 'datos' | 'procesos' | 'permisos' | 'documentos' = 'datos';
  lstProcesosPuesto: any[] = [];

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

  marcarTodosSeccion(seccion: any, valor: string) {
    seccion.items.forEach((item: any) => {
      item.seleccion = valor;
    });
  }

  constructor(
    private formBuilder         : FormBuilder           ,     
    private matSnackBar         : MatSnackBar           ,
    private SpinnerService      : NgxSpinnerService     ,
    private toastr              : ToastrService         ,
    private serviceOrganizacion : OrganizacionService   ,
    private serviceSede         : SedesService          ,
    private serviceMaeTab       : MaeTabService         ,
    private servicePuesto       : PuestosService        ,
    private serviceProceso      : ProcesosService       ,
    @Inject(MAT_DIALOG_DATA) public data: data          ,
    public dialogRef: MatDialogRef<PuestosRegeditComponent>,
  ){}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
        ctrol_codigo: [''],
        ctrol_organizacion: [''],
        ctrol_sede: [''],
        ctrol_denominacion:[''],
        ctrol_nivel: [''],
        ctrol_requiereValidacion: [false],
        ctrol_descripcion:[''],
        ctrol_funciones:[''],
        ctrol_requisitos:[''],
        ctrol_otros:[''],
        ctrol_caracteristicasVisibles:[false]
    });   
    
    this.onComboOrganizacion();
    this.onCombo('TIPO_NIVEL_RIESGO');

    if (this.data.Datos && this.data.Datos.codigo_Organizacion) {
      const orgaCod = this.data.Datos.codigo_Organizacion;
      this.formulario.get('ctrol_organizacion')?.setValue(orgaCod);
      this.onComboSedes(orgaCod);
      this.onListarProcesos(orgaCod);
    }

    if(this.data.Accion === 'U'){
      this.onLoadInfo();
    }
  }

  onLoadInfo(){
    this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Puesto!);
    this.formulario.get('ctrol_organizacion')?.setValue(this.data.Datos.codigo_Organizacion!);
    this.formulario.get('ctrol_sede')?.setValue(this.data.Datos.codigo_Sede!);
    this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.denominacion!);
    this.formulario.get('ctrol_nivel')?.setValue(this.data.Datos.codigo_Nivel_Riesgo!.trim());
    this.formulario.get('ctrol_requiereValidacion')?.setValue(this.data.Datos.validacion_Periodica!);

    this.formulario.get('ctrol_descripcion')?.setValue(this.data.Datos.puesto_Descripcion!);
    this.formulario.get('ctrol_funciones')?.setValue(this.data.Datos.puesto_Funciones!);
    this.formulario.get('ctrol_requisitos')?.setValue(this.data.Datos.puesto_Requisitos!);
    this.formulario.get('ctrol_otros')?.setValue(this.data.Datos.puesto_Caracteristicas!);
    this.formulario.get('ctrol_caracteristicasVisibles')?.setValue(this.data.Datos.caracteristicas_Visible!);
    
    if (this.data.Datos.codigo_Organizacion) {
      this.onListarProcesos(this.data.Datos.codigo_Organizacion);
    }
  }

  onComboOrganizacion(){
    this.lstOrganizacion = [];

    this.SpinnerService.show();
    this.serviceOrganizacion.getComboOrganizacion().subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
            this.lstOrganizacion = response.elements;
            this.SpinnerService.hide();
            
            if (!this.formulario.get('ctrol_organizacion')?.value) {
              const defaultOrga = this.lstOrganizacion[0].codigo;
              this.formulario.get('ctrol_organizacion')?.setValue(defaultOrga);
              this.onComboSedes(defaultOrga);
              this.onListarProcesos(defaultOrga);
            }
          }
          else{
            this.lstOrganizacion = [];       
            this.SpinnerService.hide();
          };
        }else{
          this.lstOrganizacion = [];
        }
      },  
      error: (error) => {
        this.SpinnerService.hide();
        console.log(error.error.message, 'Cerrar', {
        timeOut: 2500,
         });
      }          
    });     
  }

  onComboSedes(sCodOrganizacion:string){
    this.lstSedes = [];

    this.SpinnerService.show();
    this.serviceSede.getComboSedes(sCodOrganizacion).subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
            this.lstSedes = response.elements;
            this.SpinnerService.hide();
          }
          else{
            this.lstSedes = [];       
            this.SpinnerService.hide();
          };
        }else{
          this.lstSedes = [];
        }
      },  
      error: (error) => {
        this.SpinnerService.hide();
        console.log(error.error.message, 'Cerrar', {
        timeOut: 2500,
         });
      }          
    });        
  }

  onCombo(sTipo: string){

    this.lstNivelRiesgo = [];

    this.SpinnerService.show();
    this.serviceMaeTab.getListaMaeTab(sTipo).subscribe({
      next: (response: any)=> {
         console.log('marca1000', response);
        if(response.success){
          if (response.totalElements > 0){
            this.lstNivelRiesgo = response.elements;

            this.SpinnerService.hide();
          }
          else{
            this.lstNivelRiesgo = [];       
            this.SpinnerService.hide();
          };
        }else{
          this.lstNivelRiesgo = [];
        }
      },  
      error: (error) => {
        this.SpinnerService.hide();
        console.log(error.error.message, 'Cerrar', {
        timeOut: 2500,
         });
      }          
    });    

  }    

onChangeOrga(event: any){
  console.log('entro');
  const valor = event.value;
  this.onComboSedes(valor);
  this.onListarProcesos(valor);
}  

onSedeChange(sedeCodigo: string) {
  this.formulario.get('ctrol_sede')?.setValue(sedeCodigo);
}

getSelectedSedeName(): string {
  const code = this.formulario.get('ctrol_sede')?.value;
  const sede = this.lstSedes.find(s => s.codigo === code);
  return sede ? sede.descripcion : 'Sede No Seleccionada';
}

onListarProcesos(sOrga: string) {
  if (!sOrga) {
    this.setDefaultMockProcesos();
    return;
  }
  this.SpinnerService.show();
  this.serviceProceso.getListadoProcesos(sOrga, '0').subscribe({
    next: (response: any) => {
      if (response.success && response.totalElements > 0) {
        this.lstProcesosPuesto = response.elements.map((el: any, index: number) => ({
          id: el.codigo_Proceso || index + 1,
          denominacion: el.proceso,
          tipo: el.codigo_Tipo_Proceso === '01' ? 'Estratégico' : el.codigo_Tipo_Proceso === '02' ? 'Operativo' : 'Apoyo',
          seleccion: 'sin'
        }));
      } else {
        this.setDefaultMockProcesos();
      }
      this.SpinnerService.hide();
    },
    error: () => {
      this.setDefaultMockProcesos();
      this.SpinnerService.hide();
    }
  });
}

setDefaultMockProcesos() {
  this.lstProcesosPuesto = [
    { id: 1, denominacion: 'Gestión de Seguridad y Salud en el Trabajo', tipo: 'Estratégico', seleccion: 'sin' },
    { id: 2, denominacion: 'Identificación de Peligros y Evaluación de Riesgos (IPERC)', tipo: 'Operativo', seleccion: 'sin' },
    { id: 3, denominacion: 'Respuesta ante Emergencias y Simulacros', tipo: 'Operativo', seleccion: 'sin' },
    { id: 4, denominacion: 'Investigación de Incidentes y Accidentes de Trabajo', tipo: 'Apoyo', seleccion: 'sin' },
    { id: 5, denominacion: 'Capacitación y Entrenamiento de Personal', tipo: 'Apoyo', seleccion: 'sin' }
  ];
}

setAllProcesosSeleccion(value: string) {
  this.lstProcesosPuesto.forEach(proc => {
    proc.seleccion = value;
  });
}

onGuardarYContinuar() {
  if (this.activeTab === 'datos') {
    const sDenominacion = String(this.formulario.get('ctrol_denominacion')?.value)||'';
    const sSede = String(this.formulario.get('ctrol_sede')?.value)||'';
    const sNivel = String(this.formulario.get('ctrol_nivel')?.value)||'';
    
    if (!sDenominacion || sDenominacion.trim() === '') {
      this.toastr.warning('Ingrese la Denominación del Puesto (*)', 'Validación');
      return;
    }
    if (!sNivel || sNivel.trim() === '') {
      this.toastr.warning('Seleccione el Nivel de Riesgo (*)', 'Validación');
      return;
    }
    if (!sSede || sSede.trim() === '') {
      this.toastr.warning('Seleccione al menos una Sede (*)', 'Validación');
      return;
    }
    
    this.activeTab = 'procesos';
    this.toastr.success('Datos básicos cumplimentados temporalmente.', 'Éxito');
  } else if (this.activeTab === 'procesos') {
    this.activeTab = 'permisos';
  } else if (this.activeTab === 'permisos') {
    this.activeTab = 'documentos';
  } else if (this.activeTab === 'documentos') {
    this.onSave();
  }
}

onSave(){

  const sTitle = this.data.Accion === 'I'? 'Registrar': 'Actualizar'; 
  const sOrganizacion   = String(this.formulario.get('ctrol_organizacion')?.value)||'';    
  const sSede   = String(this.formulario.get('ctrol_sede')?.value)||'';    
  const sDenominacion   = String(this.formulario.get('ctrol_denominacion')?.value)||'';   
  const sNivelRiesgo   = String(this.formulario.get('ctrol_nivel')?.value)||'';     
  const bRequiereValidacion   = this.formulario.get('ctrol_requiereValidacion')?.value;   
  const sDescripcion   = String(this.formulario.get('ctrol_descripcion')?.value)||'';   
  const sFunciones   = String(this.formulario.get('ctrol_funciones')?.value)||'';   
  const sRequisitos   = String(this.formulario.get('ctrol_requisitos')?.value)||'';   
  const sOtros   = String(this.formulario.get('ctrol_otros')?.value)||'';   
  const bCaracteristicasVisibles   = this.formulario.get('ctrol_caracteristicasVisibles')?.value; 
  
  if (!sOrganizacion || sOrganizacion.trim() === ''){
    this.matSnackBar.open("¡Seleccione Organización...!", 'Cerrar', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 1500,
    });
    return;
  }    

  if (!sSede || sSede.trim() === ''){
    this.matSnackBar.open("¡Seleccione Sede...!", 'Cerrar', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 1500,
    });
    return;
  }     

  if (!sDenominacion || sDenominacion.trim() === ''){
    this.matSnackBar.open("Ingrese Denominación...!", 'Cerrar', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 1500,
    });
    return;
  }       

  if (this.data.Accion === "I"){

      Swal.fire({
        title: '¿Desea ' + sTitle + ' el puesto?, Confirme',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      }).then((result) => {    

        if (result.isConfirmed) {

          let data: any = {
            "codigo_Puesto" : "",
            "codigo_Organizacion" : sOrganizacion ,
            "codigo_Sede"         : sSede         ,
            "denominacion"        : sDenominacion ,
            "codigo_Nivel_Riesgo" : sNivelRiesgo  ,
            "validacion_Periodica": bRequiereValidacion,
            "puesto_Descripcion"  : sDescripcion  ,
            "puesto_Funciones"    : sFunciones    ,
            "puesto_Requisitos"   : sRequisitos   ,  
            "puesto_Caracteristicas" : sOtros     ,
            "caracteristicas_Visible": bCaracteristicasVisibles,
            "flg_Activo"          : '1'           ,
            "cod_Usuario"         : "SISTEMAS"    ,
            "accion": this.data.Accion,           
          };        
        
        this.SpinnerService.show();
        this.servicePuesto.postProcesoMntoPuesto(data).subscribe({
            next: (response: any)=> {
              if(response.success){
                if (response.codeResult == 200){
                  this.toastr.success(response.message, '', {
                    timeOut: 2500,
                  });
                  this.dialogRef.close();

                }else if(response.codeResult == 201){
                  this.toastr.info(response.message, '', {
                    timeOut: 2500,
                  });
                }
                this.SpinnerService.hide();
              }else{
                this.toastr.error(response.message, 'Cerrar', {
                  timeOut: 2500,
                });
                this.SpinnerService.hide();
              }
            },
            error: (error) => {
              const mensaje =
                error?.error?.message ||
                error?.error?.title ||
                "Ocurrió un error en el servidor";
              
              this.toastr.error(mensaje, 'Cerrar', {
              timeOut: 2500,
              });
              this.SpinnerService.hide();
            }
          });                  


        }

      });
  } else {

        //Obtiene el codigo de puesto
        const sCodigoPuesto = this.formulario.get('ctrol_codigo')?.value!;

        Swal.fire({
          title: '¿Desea ' + sTitle + ' el puesto?, Confirme',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí',
          cancelButtonText: 'No'
        }).then((result) => {   
      
            if (result.isConfirmed) {

                let data: any = {
                  "codigo_Puesto"       : sCodigoPuesto,
                  "codigo_Organizacion" : sOrganizacion ,
                  "codigo_Sede"         : sSede         ,
                  "denominacion"        : sDenominacion ,
                  "codigo_Nivel_Riesgo" : sNivelRiesgo  ,
                  "validacion_Periodica": bRequiereValidacion,
                  "puesto_Descripcion"  : sDescripcion  ,
                  "puesto_Funciones"    : sFunciones    ,
                  "puesto_Requisitos"   : sRequisitos   ,  
                  "puesto_Caracteristicas" : sOtros     ,
                  "caracteristicas_Visible": bCaracteristicasVisibles,
                  "flg_Activo"          : '1'           ,
                  "cod_Usuario"         : "SISTEMAS"    ,
                  "accion": this.data.Accion,           
                };
                
                this.SpinnerService.show();
                this.servicePuesto.postProcesoMntoPuesto(data).subscribe({
                    next: (response: any)=> {
                      if(response.success){
                        if (response.codeResult == 200){
                          this.toastr.success(response.message, '', {
                            timeOut: 2500,
                          });
                          this.dialogRef.close();

                        }else if(response.codeResult == 201){
                          this.toastr.info(response.message, '', {
                            timeOut: 2500,
                          });
                        }
                        this.SpinnerService.hide();
                      }else{
                        this.toastr.error(response.message, 'Cerrar', {
                          timeOut: 2500,
                        });
                        this.SpinnerService.hide();
                      }
                    },
                    error: (error) => {
                      const mensaje =
                        error?.error?.message ||
                        error?.error?.title ||
                        "Ocurrió un error en el servidor";
                      
                      this.toastr.error(mensaje, 'Cerrar', {
                      timeOut: 2500,
                      });
                      this.SpinnerService.hide();
                    }
                  });                     

            }

        });    
  }


}

onClose(){
  this.dialogRef.close();
}

}
