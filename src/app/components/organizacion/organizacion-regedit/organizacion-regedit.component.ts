import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

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

  constructor(
    private formBuilder       : FormBuilder           ,     
    private matSnackBar       : MatSnackBar           ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<OrganizacionRegeditComponent>,
  ) {

  }

  procesosGroups = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitaciones y Desarrollo', 'Comunicaciones', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Aseguramiento de Calidad Textil', 'Lavandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas'],
    'Gerencia General (GG)': ['Comercial Exportación de Telas', 'Comercial Venta Local Textil', 'Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };

  selectedProcesos: string[] = [];

  ngOnInit(): void {

    this.formulario = this.formBuilder.group({
        ctrol_nombre: ['', Validators.required],
        ctrol_direccion: ['', Validators.required],
        ctrol_procesos: [''],
        ctrol_estado: ['', Validators.required],
    });

    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }    

  }

  onLoadInfo(){
    this.formulario.get('ctrol_nombre')?.setValue(this.data.Datos.nombre);
    this.formulario.get('ctrol_direccion')?.setValue(this.data.Datos.direccion);
    this.formulario.get('ctrol_procesos')?.setValue(this.data.Datos.procesos);
    this.formulario.get('ctrol_estado')?.setValue(this.data.Datos.estado);

    const procesosStr = this.data.Datos.procesos || '';
    this.selectedProcesos = procesosStr.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  isProcesoSelected(proceso: string): boolean {
    return this.selectedProcesos.includes(proceso);
  }

  onProcesoToggle(proceso: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedProcesos.includes(proceso)) {
        this.selectedProcesos.push(proceso);
      }
    } else {
      this.selectedProcesos = this.selectedProcesos.filter(p => p !== proceso);
    }
    this.formulario.get('ctrol_procesos')?.setValue(this.selectedProcesos.join(', '));
  }

  onSave(){
    const sTitle = this.data.Accion === 'I'? 'Registrar': 'Actualizar'; 
    const nombre = this.formulario.get('ctrol_nombre')?.value || '';
    const direccion = this.formulario.get('ctrol_direccion')?.value || '';
    const procesos = this.formulario.get('ctrol_procesos')?.value || '';
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
        
        try {
          const localSedes = localStorage.getItem('precotex_sedes');
          let sedes = localSedes ? JSON.parse(localSedes) : [];

          if (this.data.Accion === 'I') {
            const newSede = {
              id: 's-' + Date.now(),
              nombre: nombre.trim(),
              direccion: direccion.trim(),
              procesos: procesos.trim(),
              estado: estado
            };
            sedes.push(newSede);
          } else {
            const index = sedes.findIndex((s: any) => s.id === this.data.Datos.id);
            if (index !== -1) {
              sedes[index] = {
                ...sedes[index],
                nombre: nombre.trim(),
                direccion: direccion.trim(),
                procesos: procesos.trim(),
                estado: estado
              };
            }
          }

          localStorage.setItem('precotex_sedes', JSON.stringify(sedes));
          
          setTimeout(() => {
            this.SpinnerService.hide();
            this.toastr.success(`Sede ${this.data.Accion === 'I' ? 'registrada' : 'actualizada'} correctamente.`, '', {
              timeOut: 2500,
            });
            this.dialogRef.close(true);
          }, 600);

        } catch (e) {
          this.SpinnerService.hide();
          this.toastr.error('Error al guardar datos localmente.', '', {
            timeOut: 2500,
          });
        }
      }
    });
  }

  onClose(){
    this.dialogRef.close();
  }  

}
