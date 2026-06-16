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

interface data {
  Title       : string;
  Accion      : string;
  Datos       : any   ;
}

interface combo {
  codigo : string;
  descripcion : string;
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

  constructor(
    private formBuilder         : FormBuilder           ,     
    private matSnackBar         : MatSnackBar           ,
    private SpinnerService      : NgxSpinnerService     ,
    private toastr              : ToastrService         ,
    private serviceOrganizacion : OrganizacionService   ,
    private serviceSede         : SedesService          ,
    private serviceMaeTab       : MaeTabService         ,
    private servicePuesto       : PuestosService        ,
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

    if(this.data.Accion === 'U'){
      this.onComboSedes(this.data.Datos.codigo_Organizacion);
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
