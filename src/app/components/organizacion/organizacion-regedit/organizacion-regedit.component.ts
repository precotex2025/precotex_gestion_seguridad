import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { SedesService } from '../../../services/sedes.service';
import { ProcesosService } from '../../../services/procesos.service';
import { GlobalVariable } from '../../../VarGlobals';
interface data {
  Title       : string;
  Accion      : string;
  Datos       : any   ;
}

@Component({
  selector: 'app-organizacion-regedit',
  standalone: false,
  templateUrl: './organizacion-regedit.component.html',
  styleUrl: './organizacion-regedit.component.css'
})
export class OrganizacionRegeditComponent implements OnInit {

  formulario!: FormGroup;
  sUsuario: string = GlobalVariable.vusu;

  procesosList: any[] = [];
  procesosAgrupados: { [key: string]: any[] } = {};
  checkedProcesoCodes: Set<string> = new Set();

  private TIPO_PROCESO_LABELS: { [key: string]: string } = {
    'SP': 'Soporte (SOP)',
    'AI': 'Auditoría Interna (AIO)',
    'CP': 'Control Patrimonial (CPT)',
    'IM': 'Ingeniería y Mejora Continua (IMC)',
    'AF': 'Administración y Finanzas (AFC)',
    'GH': 'Gestión Humana (GGHH)',
    'SE': 'Servicio de Estampado y Bordado (SEB)',
    'OM': 'Operaciones Manufactura (OPM)',
    'OT': 'Operaciones Textil (OPT)',
    'BM': 'Balance de Materia (BM)',
    'PC': 'Planeamiento y Control de la Producción (PCP)',
    'LO': 'Logística (LOG)',
    'GC': 'Gestión Comercial (GCOM)',
    'GG': 'Gerencia General (GG)'
  };

  constructor(
    private formBuilder       : FormBuilder           ,     
    private matSnackBar       : MatSnackBar           ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
    private sedesService      : SedesService          ,
    private procesosService   : ProcesosService       ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<OrganizacionRegeditComponent>,
  ) {

  }

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
        ctrol_nombre: ['', Validators.required],
        ctrol_direccion: ['', Validators.required],
        ctrol_estado: ['', Validators.required],
    });

    this.onCargarProcesos();

    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }    
  }

  DEFAULT_PROCESOS: any[] = [
    { codigo_Proceso: '005', codigo_Tipo_Proceso: 'SP', proceso: 'Sistemas' },
    { codigo_Proceso: '006', codigo_Tipo_Proceso: 'SP', proceso: 'Mantenimiento General' },
    { codigo_Proceso: '007', codigo_Tipo_Proceso: 'SP', proceso: 'Seguridad Patrimonial' },
    { codigo_Proceso: '008', codigo_Tipo_Proceso: 'SP', proceso: 'SSOMA' },
    { codigo_Proceso: '009', codigo_Tipo_Proceso: 'AI', proceso: 'Auditoría Interna' },
    { codigo_Proceso: '010', codigo_Tipo_Proceso: 'CP', proceso: 'Control Patrimonial' },
    { codigo_Proceso: '011', codigo_Tipo_Proceso: 'IM', proceso: 'Organización y Métodos' },
    { codigo_Proceso: '012', codigo_Tipo_Proceso: 'IM', proceso: 'Investigación, Desarrollo e Innovación' },
    { codigo_Proceso: '013', codigo_Tipo_Proceso: 'IM', proceso: 'Certificaciones' },
    { codigo_Proceso: '014', codigo_Tipo_Proceso: 'AF', proceso: 'Administración' },
    { codigo_Proceso: '015', codigo_Tipo_Proceso: 'AF', proceso: 'Finanzas' },
    { codigo_Proceso: '016', codigo_Tipo_Proceso: 'AF', proceso: 'Contabilidad y Costos' },
    { codigo_Proceso: '017', codigo_Tipo_Proceso: 'AF', proceso: 'Tesorería' },
    { codigo_Proceso: '018', codigo_Tipo_Proceso: 'GH', proceso: 'Administración de Personal' },
    { codigo_Proceso: '019', codigo_Tipo_Proceso: 'GH', proceso: 'Capacitaciones y Desarrollo' },
    { codigo_Proceso: '020', codigo_Tipo_Proceso: 'GH', proceso: 'Comunicaciones' },
    { codigo_Proceso: '021', codigo_Tipo_Proceso: 'GH', proceso: 'Gestión Humana' },
    { codigo_Proceso: '022', codigo_Tipo_Proceso: 'GH', proceso: 'Bienestar Social' },
    { codigo_Proceso: '023', codigo_Tipo_Proceso: 'GH', proceso: 'Selección de Personal' },
    { codigo_Proceso: '024', codigo_Tipo_Proceso: 'SE', proceso: 'Estampado' },
    { codigo_Proceso: '025', codigo_Tipo_Proceso: 'SE', proceso: 'Bordado' },
    { codigo_Proceso: '026', codigo_Tipo_Proceso: 'SE', proceso: 'Calidad Estampado y Bordado' },
    { codigo_Proceso: '027', codigo_Tipo_Proceso: 'SE', proceso: 'Planeamiento y Programación de la Producción E&B' },
    { codigo_Proceso: '028', codigo_Tipo_Proceso: 'OM', proceso: 'Corte' },
    { codigo_Proceso: '029', codigo_Tipo_Proceso: 'OM', proceso: 'Costura' },
    { codigo_Proceso: '030', codigo_Tipo_Proceso: 'OM', proceso: 'Inspección' },
    { codigo_Proceso: '031', codigo_Tipo_Proceso: 'OM', proceso: 'Acabados' },
    { codigo_Proceso: '032', codigo_Tipo_Proceso: 'OM', proceso: 'Aseguramiento de la Calidad Manufactura' },
    { codigo_Proceso: '033', codigo_Tipo_Proceso: 'OM', proceso: 'Consumos' },
    { codigo_Proceso: '034', codigo_Tipo_Proceso: 'OT', proceso: 'Tejeduría' },
    { codigo_Proceso: '035', codigo_Tipo_Proceso: 'OT', proceso: 'Tintorería' },
    { codigo_Proceso: '036', codigo_Tipo_Proceso: 'OT', proceso: 'Laboratorio de Color' },
    { codigo_Proceso: '037', codigo_Tipo_Proceso: 'OT', proceso: 'Estampado Digital' },
    { codigo_Proceso: '038', codigo_Tipo_Proceso: 'OT', proceso: 'Acabados Textil' },
    { codigo_Proceso: '039', codigo_Tipo_Proceso: 'OT', proceso: 'Aseguramiento de Calidad Textil' },
    { codigo_Proceso: '040', codigo_Tipo_Proceso: 'OT', proceso: 'Lavandería' },
    { codigo_Proceso: '041', codigo_Tipo_Proceso: 'BM', proceso: 'Balance de Materia' },
    { codigo_Proceso: '042', codigo_Tipo_Proceso: 'PC', proceso: 'PCP Textil' },
    { codigo_Proceso: '043', codigo_Tipo_Proceso: 'PC', proceso: 'PCP Manufactura' },
    { codigo_Proceso: '044', codigo_Tipo_Proceso: 'PC', proceso: 'PCP Estampado y Bordado' },
    { codigo_Proceso: '045', codigo_Tipo_Proceso: 'LO', proceso: 'Almacén' },
    { codigo_Proceso: '046', codigo_Tipo_Proceso: 'LO', proceso: 'Comercio Exterior' },
    { codigo_Proceso: '047', codigo_Tipo_Proceso: 'LO', proceso: 'Logística' },
    { codigo_Proceso: '048', codigo_Tipo_Proceso: 'LO', proceso: 'Transporte' },
    { codigo_Proceso: '049', codigo_Tipo_Proceso: 'GC', proceso: 'Desarrollo de Producto' },
    { codigo_Proceso: '050', codigo_Tipo_Proceso: 'GC', proceso: 'Desarrollo de Estampado y Bordado' },
    { codigo_Proceso: '051', codigo_Tipo_Proceso: 'GC', proceso: 'Desarrollo Textil' },
    { codigo_Proceso: '052', codigo_Tipo_Proceso: 'GC', proceso: 'Comercial Exportación de Prendas' },
    { codigo_Proceso: '053', codigo_Tipo_Proceso: 'GG', proceso: 'Comercial Exportación de Telas' },
    { codigo_Proceso: '054', codigo_Tipo_Proceso: 'GG', proceso: 'Comercial Venta Local Textil' },
    { codigo_Proceso: '055', codigo_Tipo_Proceso: 'GG', proceso: 'Alianzas Estratégicas' },
    { codigo_Proceso: '056', codigo_Tipo_Proceso: 'GG', proceso: 'Desarrollo de Negocios' },
    { codigo_Proceso: '057', codigo_Tipo_Proceso: 'GG', proceso: 'Proyectos Gerenciales' },
    { codigo_Proceso: '058', codigo_Tipo_Proceso: 'GG', proceso: 'Sistema de Gestión General' },
    { codigo_Proceso: '059', codigo_Tipo_Proceso: 'GG', proceso: 'Gestión Estratégica' }
  ];

  onCargarProcesos(): void {
    // 1. Cargar procesos por defecto inmediatamente para que nunca esté vacío
    this.renderProcesosList(this.DEFAULT_PROCESOS);

    // 2. Traer procesos actualizados desde la BD
    this.procesosService.getListadoProcesos('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          this.renderProcesosList(res.elements);
        }
      }
    });
  }

  renderProcesosList(list: any[]): void {
    this.procesosList = list;
    this.procesosAgrupados = {};

    for (const proc of this.procesosList) {
      const tipoCode = (proc.codigo_Tipo_Proceso || '').trim();
      const label = this.TIPO_PROCESO_LABELS[tipoCode] || tipoCode || 'Otros';
      if (!this.procesosAgrupados[label]) {
        this.procesosAgrupados[label] = [];
      }
      this.procesosAgrupados[label].push(proc);

      if (this.data.Accion === 'U' && this.data.Datos) {
        if (proc.codigo_Sede === this.data.Datos.codigo_Sede) {
          this.checkedProcesoCodes.add(proc.codigo_Proceso);
        }
      }
    }
  }

  getProcesosGroupKeys(): string[] {
    return Object.keys(this.procesosAgrupados);
  }

  isProcesoChecked(code: string): boolean {
    return this.checkedProcesoCodes.has(code);
  }

  onToggleProceso(code: string): void {
    if (this.checkedProcesoCodes.has(code)) {
      this.checkedProcesoCodes.delete(code);
    } else {
      this.checkedProcesoCodes.add(code);
    }
  }

  onLoadInfo(){
    this.formulario.get('ctrol_nombre')?.setValue(this.data.Datos.denominacion);
    this.formulario.get('ctrol_direccion')?.setValue(this.data.Datos.direccion);
    this.formulario.get('ctrol_estado')?.setValue(this.data.Datos.localidad);
  }

  onSave(){
    const sTitle = this.data.Accion === 'I'? 'Registrar': 'Actualizar'; 
    const nombre = this.formulario.get('ctrol_nombre')?.value || '';
    const direccion = this.formulario.get('ctrol_direccion')?.value || '';
    const estado = this.formulario.get('ctrol_estado')?.value || '';

    if (!nombre.trim()) {
      this.matSnackBar.open("¡Ingrese el nombre de la sede...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    if (!direccion.trim()) {
      this.matSnackBar.open("¡Ingrese la dirección...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    if (!estado.trim()) {
      this.matSnackBar.open("¡Seleccione una ubicación/estado...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    Swal.fire({
      title: '¿Desea ' + sTitle.toLowerCase() + ' la sede?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {
        this.SpinnerService.show();
        
        let requestData: any = {};
        if (this.data.Accion === 'I') {
          requestData = {
            Accion: 'I',
            Codigo_Sede: '',
            Codigo_Organizacion: '001',
            Denominacion: nombre.trim(),
            Acronimo: '',
            Direccion: direccion.trim(),
            Localidad: estado,
            Provincia: '',
            Pais: '',
            Flg_Activo: '1',
            Cod_Usuario: this.sUsuario
          };
        } else {
          requestData = {
            Accion: 'U',
            Codigo_Sede: this.data.Datos.codigo_Sede,
            Codigo_Organizacion: this.data.Datos.codigo_Organizacion || '001',
            Denominacion: nombre.trim(),
            Acronimo: this.data.Datos.acronimo || '',
            Direccion: direccion.trim(),
            Localidad: estado,
            Provincia: this.data.Datos.provincia || '',
            Pais: this.data.Datos.pais || '',
            Flg_Activo: this.data.Datos.flg_Activo || '1',
            Cod_Usuario: this.sUsuario
          };
        }

        this.sedesService.postProcesoMntoSedes(requestData).subscribe({
          next: (res: any) => {
            this.SpinnerService.hide();
            if (res.codeResult === 200 || res.codeResult === 201) {
              const targetSedeCode = this.data.Accion === 'U' ? this.data.Datos.codigo_Sede : (res.element?.codigo_Sede || '001');
              this.saveProcesosForSede(targetSedeCode);
              this.toastr.success(res.message || 'Sede guardada con éxito.', '', { timeOut: 2500 });
              this.dialogRef.close(true);
            } else {
              this.toastr.error(res.message, '', { timeOut: 2500 });
            }
          },
          error: (err: any) => {
            this.SpinnerService.hide();
            this.toastr.error('Error al guardar datos.', '', { timeOut: 2500 });
          }
        });
      }
    });
  }

  saveProcesosForSede(sedeCode: string): void {
    if (!sedeCode) return;
    for (const proc of this.procesosList) {
      const isChecked = this.checkedProcesoCodes.has(proc.codigo_Proceso);
      let newSedeCode = proc.codigo_Sede;

      if (isChecked) {
        newSedeCode = sedeCode;
      } else if (proc.codigo_Sede === sedeCode) {
        newSedeCode = '001';
      }

      if (newSedeCode !== proc.codigo_Sede) {
        const procData = {
          Accion: 'U',
          Codigo_Proceso: proc.codigo_Proceso,
          Codigo_Organizacion: proc.codigo_Organizacion || '001',
          Codigo_Sede: newSedeCode,
          Proceso: proc.proceso,
          Codigo_Tipo_Proceso: proc.codigo_Tipo_Proceso,
          Descripcion: proc.descripcion || '',
          Nombre_Adjunto: proc.nombre_Adjunto || '',
          Ruta_Adjunto: proc.ruta_Adjunto || '',
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario
        };
        this.procesosService.postProcesoMntoProcesos(procData).subscribe();
      }
    }
  }

  onClose(){
    this.dialogRef.close();
  }  

}
