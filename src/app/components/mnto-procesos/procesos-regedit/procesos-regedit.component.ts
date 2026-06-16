import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SedesService } from '../../../services/sedes.service';
import { OrganizacionService } from '../../../services/organizacion.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaeTabService } from '../../../services/mae-tab.service';
import Swal from 'sweetalert2';
import { ProcesosService } from '../../../services/procesos.service';

interface data {
  Title           : string;
  Accion          : string;
  codOrganizacion : string;
  Datos           : any   ;
}

interface combo {
  codigo : string;
  descripcion : string;
}

@Component({
  selector: 'app-procesos-regedit',
  standalone: false,
  templateUrl: './procesos-regedit.component.html',
  styleUrl: './procesos-regedit.component.css'
})
export class ProcesosRegeditComponent implements OnInit{
  formulario!: FormGroup;
  lstOrganizacion:any = [];
  lstSedes: combo[] = []; 
  lstTipo: combo[] = []; 
  archivoSeleccionado!: File | null;
  nombreArchivo: string = '';  
  glb_CodOrganizacion: string = '';
  

  constructor(
    private formBuilder       : FormBuilder           ,     
    private matSnackBar       : MatSnackBar           ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
    private serviceSedes      : SedesService          ,
    private serviceOrganizacion : OrganizacionService ,
    private serviceMaeTab     : MaeTabService         ,
    private serviceProceso    : ProcesosService       ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<ProcesosRegeditComponent>,
  ){}

  ngOnInit(): void {
   //const sCodOrg = this.data.codOrganizacion!;
   this.glb_CodOrganizacion = this.data.codOrganizacion!;
   this.formulario = this.formBuilder.group({
      ctrol_codigo      :[""],
      ctrol_organizacion:[""],
      ctrol_proceso:[""],
      ctrol_sede:[""],
      ctrol_tipo:[""],
      ctrol_descripcion:[""],
    });    

    this.formulario.get('ctrol_organizacion')?.disable();
    //this.formulario.get('ctrol_sede')?.disable();
    this.onListaComboSedes(this.glb_CodOrganizacion);
    this.onCombo('TIPO_PROCESO');

    if (this.data.Accion === 'U'){
      console.log('data', this.data.Datos)
      this.onLoadInfo();
    } else {
      this.onObtenerDatoOrganizacion(this.glb_CodOrganizacion);
    }      
    
  }

  onLoadInfo(){
    this.formulario.get('ctrol_codigo')?.disable();
    this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Proceso);   
    this.formulario.get('ctrol_organizacion')?.setValue(this.data.Datos.organizacion);
    this.formulario.get('ctrol_proceso')?.setValue(this.data.Datos.proceso);  
    this.formulario.get('ctrol_sede')?.setValue(this.data.Datos.codigo_Sede);    
    this.formulario.get('ctrol_tipo')?.setValue(this.data.Datos.codigo_Tipo_Proceso?.trimEnd());   
    this.formulario.get('ctrol_descripcion')?.setValue(this.data.Datos.descripcion);  
  }

  onListaComboSedes(sCodOrganizacion:string){

    this.lstSedes = [];

    this.SpinnerService.show();
    this.serviceSedes.getComboSedes(sCodOrganizacion).subscribe({
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

  onCombo(sTipo: string){

    this.lstTipo = [];

    this.SpinnerService.show();
    this.serviceMaeTab.getListaMaeTab(sTipo).subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
            this.lstTipo = response.elements;

            this.SpinnerService.hide();
          }
          else{
            this.lstTipo = [];       
            this.SpinnerService.hide();
          };
        }else{
          this.lstTipo = [];
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
    const sProceso =  String(this.formulario.get('ctrol_proceso')?.value);
    const sSede =  this.formulario.get('ctrol_sede')?.value ?? '';
    const sTipo =  this.formulario.get('ctrol_tipo')?.value ?? '';
    const sDescripcion = this.formulario.get('ctrol_descripcion')?.value ?? '';

    if (!sProceso || sProceso.trim() === ''){
      this.matSnackBar.open("!Nombre de proceso vacio...!", 'Cerrar', {
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
    
    if (!sTipo || sTipo.trim() === ''){
      this.matSnackBar.open("¡Seleccione Tipo...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }
    
    if (this.data.Accion === "I"){

        Swal.fire({
          title: '¿Desea ' + sTitle + ' proceso?, Confirme',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí',
          cancelButtonText: 'No'
        }).then((result) => {  
          if (result.isConfirmed) {

            let data: any = {
              "codigo_Proceso"      : "",
              "codigo_Organizacion" : this.glb_CodOrganizacion,
              "codigo_Sede"         : sSede,
              "proceso"             : sProceso,
              "codigo_Tipo_Proceso" : sTipo,
              "descripcion"         : sDescripcion,
              "nombre_Adjunto"      : '', //Por el momento es vacio
              "ruta_Adjunto"        : '', //Por el momento es vacio
              "flg_Activo"          : 'I',
              "cod_Usuario"         : "SISTEMAS",
              "accion": this.data.Accion,           
            };

          this.SpinnerService.show();
          this.serviceProceso.postProcesoMntoProcesos(data).subscribe({
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

    } else {

        Swal.fire({
          title: '¿Desea ' + sTitle + ' proceso?, Confirme',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí',
          cancelButtonText: 'No'
        }).then((result) => {  
          if (result.isConfirmed) {

            let data: any = {
              "codigo_Proceso"      : this.data.Datos.codigo_Proceso,
              "codigo_Organizacion" : this.data.Datos.codigo_Organizacion,
              "codigo_Sede"         : sSede,
              "proceso"             : sProceso,
              "codigo_Tipo_Proceso" : sTipo,
              "descripcion"         : sDescripcion,
              "nombre_Adjunto"      : '', //Por el momento es vacio
              "ruta_Adjunto"        : '', //Por el momento es vacio
              "flg_Activo"          : '',
              "cod_Usuario"         : "SISTEMAS",
              "accion": this.data.Accion,           
            };

          this.SpinnerService.show();
          this.serviceProceso.postProcesoMntoProcesos(data).subscribe({
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

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;

    console.log('Archivo:', file);
  }

}
