import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SedesService } from '../../../services/sedes.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrganizacionService } from '../../../services/organizacion.service';
import Swal from 'sweetalert2';

interface data {
  Title           : string;
  Accion          : string;
  codOrganizacion : string;
  Datos           : any   ;
}

@Component({
  selector: 'app-sedes-regedit',
  standalone: false,
  templateUrl: './sedes-regedit.component.html',
  styleUrl: './sedes-regedit.component.css'
})
export class SedesRegeditComponent implements OnInit{
  formulario!: FormGroup;
  lstOrganizacion:any = [];

  constructor(
    private formBuilder       : FormBuilder           ,     
    private matSnackBar       : MatSnackBar           ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
    private serviceSedes      : SedesService          ,
    private serviceOrganizacion : OrganizacionService ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<SedesRegeditComponent>,
  ){
  }

  ngOnInit(): void {
    
    const sCodOrg = this.data.codOrganizacion!;
    this.formulario = this.formBuilder.group({
      ctrol_codigo      :[""],
      ctrol_organizacion:[""],
      ctrol_denominacion:[""],
      ctrol_acronimo    :[""],
      ctrol_direccion   :[""],
      ctrol_localidad   :[""],
      ctrol_provincia   :[""],
      ctrol_pais        :[""]
    });

    this.formulario.get('ctrol_organizacion')?.disable();

    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    } else {
      this.onObtenerDatoOrganizacion(sCodOrg);
    }         
  }

  onLoadInfo(){
    this.formulario.get('ctrol_codigo')?.disable();
    this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Sede);
    this.formulario.get('ctrol_organizacion')?.setValue(this.data.Datos.organizacion);
    this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.denominacion!);
    this.formulario.get('ctrol_acronimo')?.setValue(this.data.Datos.acronimo!);
    this.formulario.get('ctrol_direccion')?.setValue(this.data.Datos.direccion!);
    this.formulario.get('ctrol_localidad')?.setValue(this.data.Datos.localidad!);
    this.formulario.get('ctrol_provincia')?.setValue(this.data.Datos.provincia!);
    this.formulario.get('ctrol_pais')?.setValue(this.data.Datos.pais!);
  }
  
  onObtenerDatoOrganizacion(sCodOrganizacion: string){

    this.lstOrganizacion = [];

    this.SpinnerService.show();
    this.serviceOrganizacion.getObtenerOrganizacion(sCodOrganizacion).subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
            this.lstOrganizacion = response.elements;
            this.formulario.get('ctrol_organizacion')?.setValue(this.lstOrganizacion[0].denominacion!);
            this.SpinnerService.hide();
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

  onSave(){

    const sTitle = this.data.Accion === 'I'? 'Registrar': 'Actualizar';  
    const sCodigo_Organizacion = this.data.codOrganizacion;
    const sDenominacion   = String(this.formulario.get('ctrol_denominacion')?.value)||'';    
    const sAcronimo   = String(this.formulario.get('ctrol_acronimo')?.value)||'';    
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
          title: '¿Desea ' + sTitle + ' sede?, Confirme',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí',
          cancelButtonText: 'No'
        }).then((result) => {  
          if (result.isConfirmed) {

            let data: any = {
              "codigo_Sede": "",
              "codigo_Organizacion" : sCodigo_Organizacion,
              "denominacion"        : sDenominacion,
              "Acronimo"            : sAcronimo,
              "direccion"           : sDireccion,
              "localidad"           : sLocalidad,
              "provincia"           : sProvincia,
              "pais"                : sPais,
              "flg_Activo"          : 'I',
              "cod_Usuario"         : "SISTEMAS",
              "accion": this.data.Accion,           
            };

          this.SpinnerService.show();
          this.serviceSedes.postProcesoMntoSedes(data).subscribe({
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
      })
    }else {
        Swal.fire({
          title: '¿Desea ' + sTitle + ' sede?, Confirme',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí',
          cancelButtonText: 'No'
        }).then((result) => {  
          if (result.isConfirmed) {

            let data: any = {
              "codigo_Sede"         : this.data.Datos.codigo_Sede,
              "codigo_Organizacion" : sCodigo_Organizacion,
              "denominacion"        : sDenominacion,
              "Acronimo"            : sAcronimo,
              "direccion"           : sDireccion,
              "localidad"           : sLocalidad,
              "provincia"           : sProvincia,
              "pais"                : sPais,
              "flg_Activo"          : '',
              "cod_Usuario"         : "SISTEMAS",
              "accion": this.data.Accion,           
            };

          this.SpinnerService.show();
          this.serviceSedes.postProcesoMntoSedes(data).subscribe({
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
      })      
    }

  }

  onClose(){
    this.dialogRef.close();
  }

}
