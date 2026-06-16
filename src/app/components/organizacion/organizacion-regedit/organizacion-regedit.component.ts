import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { OrganizacionService } from '../../../services/organizacion.service';
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
    private serviceOrganizacion : OrganizacionService ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<OrganizacionRegeditComponent>,
  ) {

  }

  ngOnInit(): void {

    this.formulario = this.formBuilder.group({
        ctrol_codigo: [''],
        ctrol_denominacion: [''],
        ctrol_direccion: [''],
        ctrol_localidad: [''],
        ctrol_provincia: [''],
        ctrol_pais: [''],
        // ctrol_denominacionSP: [''],
        // ctrol_acronimoSP: [''],
        // ctrol_direccionSP: [''],
        // ctrol_localidadSP: [''],
        // ctrol_provinciaSP: [''],
        // ctrol_paisSP: [''],
        
    });

    this.formulario.get('ctrol_codigo')?.disable();

    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }    

  }

  onLoadInfo(){

    this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Organizacion!);
    this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.denominacion!);
    this.formulario.get('ctrol_direccion')?.setValue(this.data.Datos.direccion!);
    this.formulario.get('ctrol_localidad')?.setValue(this.data.Datos.localidad!);
    this.formulario.get('ctrol_provincia')?.setValue(this.data.Datos.provincia!);
    this.formulario.get('ctrol_pais')?.setValue(this.data.Datos.pais!);
  }

  onSave(){

    const sTitle = this.data.Accion === 'I'? 'Registrar': 'Actualizar'; 
    const sDenominacion   = String(this.formulario.get('ctrol_denominacion')?.value)||'';    
    const sDireccion   = String(this.formulario.get('ctrol_direccion')?.value)||'';    
    const sLocalidad   = String(this.formulario.get('ctrol_localidad')?.value)||'';    
    const sProvincia   = String(this.formulario.get('ctrol_provincia')?.value)||'';    
    const sPais  = String(this.formulario.get('ctrol_pais')?.value)||'';    

    if (!sDenominacion || sDenominacion.trim() === ''){
      this.matSnackBar.open("¡Ingrese denominación...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }  
    
    if (this.data.Accion === "I"){

      Swal.fire({
        title: '¿Desea ' + sTitle + ' organización?, Confirme',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      }).then((result) => {    
        if (result.isConfirmed) {
          
          let data: any = {
            "codigo_Organizacion" : "",
            "denominacion"        : sDenominacion,
            "direccion"           : sDireccion,
            "localidad"           : sLocalidad,
            "provincia"           : sProvincia,
            "pais"                : sPais,
            "flg_Activo"          : 'I',
            "cod_Usuario"         : "SISTEMAS",
            "accion": this.data.Accion,           
          };

        this.SpinnerService.show();
        this.serviceOrganizacion.postProcesoMntoOrganizacion(data).subscribe({
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

    }else{

      //Obtiene el codigo de organizacion
      const sCodigoOrganizacion = this.formulario.get('ctrol_codigo')?.value!; 

      Swal.fire({
        title: '¿Desea ' + sTitle + ' organización?, Confirme',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      }).then((result) => {    
        if (result.isConfirmed) {
          
          let data: any = {
            "codigo_Organizacion" : sCodigoOrganizacion,
            "denominacion"        : sDenominacion,
            "direccion"           : sDireccion,
            "localidad"           : sLocalidad,
            "provincia"           : sProvincia,
            "pais"                : sPais,
            "flg_Activo"          : '',
            "cod_Usuario"         : "SISTEMAS",
            "accion": this.data.Accion,           
          };

        this.SpinnerService.show();
        this.serviceOrganizacion.postProcesoMntoOrganizacion(data).subscribe({
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
