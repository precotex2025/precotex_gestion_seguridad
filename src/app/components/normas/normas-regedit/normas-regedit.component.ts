import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NormasService } from '../../../services/normas.service';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';

interface data {
  Title       : string;
  Accion      : string;
  Datos       : any   ;
}

@Component({
  selector: 'app-normas-regedit',
  standalone: false,
  templateUrl: './normas-regedit.component.html',
  styleUrl: './normas-regedit.component.css'
})
export class NormasRegeditComponent implements OnInit { 

  formulario!: FormGroup;

  constructor(
    private formBuilder       : FormBuilder           ,                  
    private SpinnerService    : NgxSpinnerService     ,
    private serviceNorma      : NormasService         ,
    private toastr            : ToastrService         ,
    private matSnackBar       : MatSnackBar           ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<NormasRegeditComponent>,
  ){}  



          
  ngOnInit(): void {

    this.formulario = this.formBuilder.group({
        ctrol_codigo: [''],
        ctrol_denominacion: [''],
        ctrol_descripcion: ['']
    });

    this.formulario.get('ctrol_codigo')?.disable();
    
    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }
  }

  onLoadInfo(){
     this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Norma!);
     this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.norma!);
     this.formulario.get('ctrol_descripcion')?.setValue(this.data.Datos.descripcion!);
  }

  onSave(){
    
    const sTitle = this.data.Accion === 'I'? 'Registrar': 'Actualizar'; 
    const sNorma   = String(this.formulario.get('ctrol_denominacion')?.value)||'';
    const sDescripcion = String(this.formulario.get('ctrol_descripcion')?.value)||'';    

    if (!sNorma || sNorma.trim() === ''){
      this.matSnackBar.open("¡Ingrese norma...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }  

    if (!sDescripcion || sDescripcion.trim() === ''){
      this.matSnackBar.open("¡Ingrese descripción...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });        
      return;
    }

    if (this.data.Accion === "I"){
      Swal.fire({
        title: '¿Desea ' + sTitle + ' norma?, Confirme',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      }).then((result) => {    
        if (result.isConfirmed) {
          
          let data: any = {
            "codigo_Norma"  : "",
            "norma"         : sNorma,
            "descripcion"   : sDescripcion,
            "flg_Activo"    : 'I',
            "cod_Usuario"   : "SISTEMAS",
            "accion": this.data.Accion,           
          };

        this.SpinnerService.show();
        this.serviceNorma.postProcesoMntoNormas(data).subscribe({
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

      //Obtiene el codigo de norma
      const sCodigoNorma = this.formulario.get('ctrol_codigo')?.value!; 

      Swal.fire({
        title: '¿Desea ' + sTitle + ' norma?, Confirme',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      }).then((result) => {    
        if (result.isConfirmed) {
          
          let data: any = {
            "codigo_Norma"  : sCodigoNorma,
            "norma"         : sNorma,
            "descripcion"   : sDescripcion,
            "flg_Activo"    : '', //No afecta el proceso porque no se considera comom ed
            "cod_Usuario"   : "SISTEMAS",
            "accion": this.data.Accion,           
          };

        this.SpinnerService.show();
        this.serviceNorma.postProcesoMntoNormas(data).subscribe({
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

