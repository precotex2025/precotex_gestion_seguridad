import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { OrganizacionService } from '../../services/organizacion.service';
import { SedesService } from '../../services/sedes.service';
import { MaeTabService } from '../../services/mae-tab.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PuestosRegeditComponent } from './puestos-regedit/puestos-regedit.component';
import { MatTableDataSource } from '@angular/material/table';
import { PuestosService } from '../../services/puestos.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

interface combo {
  codigo : string;
  descripcion : string;
}


@Component({
  selector: 'app-puestos',
  standalone: false,
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit {
formulario!: FormGroup;
lstOrganizacion:combo []= [];
lstSedes:combo []=[];
lstNivelRiesgo:combo []=[];

constructor(
  private dialog              : MatDialog             ,
  private SpinnerService      : NgxSpinnerService     ,
  private serviceOrganizacion : OrganizacionService   ,
  private serviceSede         : SedesService          ,
  private serviceMaeTab       : MaeTabService         ,
  private servicePuesto       : PuestosService        ,
  private formBuilder         : FormBuilder           , 
  private toastr              : ToastrService         ,  
){}

displayedColumns: string[] = [
  'codigo'      ,
  'denominacion',
  'organizacion',
  'sede'       ,
  'nivel'    ,
  'estado'      ,
  'acciones'
  ];  
  dataSource = new MatTableDataSource<any>();  

ngOnInit(): void {
   this.formulario = this.formBuilder.group({
      ctrol_sede:[""],
      ctrol_organizacion:[""],
      ctrol_nivel:[""]
    });      
  this.onComboOrganizacion();
  this.onComboNivelRiesgo();
  this.onListado();
}

onBuscar() {
  this.onListado();
}

onListado(){

  const sOrgaNizacion  = String(this.formulario.get('ctrol_organizacion')?.value)||'';    
  const sSede  = String(this.formulario.get('ctrol_sede')?.value)||'';    
  const sNivel  = String(this.formulario.get('ctrol_nivel')?.value)||'';    

  this.SpinnerService.show();
  this.servicePuesto.getListadoPuesto(sOrgaNizacion, sSede, sNivel).subscribe({
    next: (response: any)=> {
      if(response.success){
        if (response.totalElements > 0){
          this.dataSource.data = response.elements;
          this.SpinnerService.hide();
        }
        else{
          //this.dataListadoMemorandums = [];
          this.dataSource.data = [];            
          this.SpinnerService.hide();
        };
      }else{
        //this.dataListadoMemorandums = [];
        this.dataSource.data = [];
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

onComboNivelRiesgo(){
  this.lstNivelRiesgo = [];
  this.SpinnerService.show();
  this.serviceMaeTab.getListaMaeTab('TIPO_NIVEL_RIESGO').subscribe({
    next: (response: any)=> {
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

onChangeOrga(event: any){
  const valor = event.value;
  this.onComboSedes(valor);
}

onAgregar(){
    let dialogRef = this.dialog.open(PuestosRegeditComponent, {
    width: '55vw',   // viewport width
    height: '90vh',  // viewport height
    maxWidth: '100vw',
    maxHeight: '100vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "Registra nuevo puesto",
         Accion : "I",
         Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });      
}

onExportar(){

}

onImportar(){

}

onEditar(item: any){

    let dialogRef = this.dialog.open(PuestosRegeditComponent, {
    width: '55vw',   // viewport width
    height: '90vh',  // viewport height
    maxWidth: '100vw',
    maxHeight: '100vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "Edita puesto",
         Accion : "U",
         Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });  
}

onEliminar(item: any){
  const sCodPuesto: string = item?.codigo_Puesto;
    Swal.fire({
      title: '¿Desea eliminar el puesto?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {

          let data: any = {
            "codigo_Puesto" : sCodPuesto,
            "codigo_Organizacion" : '' ,
            "codigo_Sede"         : ''         ,
            "denominacion"        : '' ,
            "codigo_Nivel_Riesgo" : ''  ,
            "validacion_Periodica": '',
            "puesto_Descripcion"  : ''  ,
            "puesto_Funciones"    : ''    ,
            "puesto_Requisitos"   : ''   ,  
            "puesto_Caracteristicas" : ''     ,
            "caracteristicas_Visible": '',
            "flg_Activo"          : '1'           ,
            "cod_Usuario"         : "SISTEMAS"    ,
            "accion": 'D',           
          };        
          
      this.SpinnerService.show();
      this.serviceOrganizacion.postProcesoMntoOrganizacion(data).subscribe({
          next: (response: any)=> {
            if(response.success){
              if (response.codeResult == 200){
                this.toastr.success(response.message, '', {
                  timeOut: 2500,
                });
                this.onListado();

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


