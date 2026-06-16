import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { OrganizacionService } from '../../services/organizacion.service';
import { SedesService } from '../../services/sedes.service';
import { PuestosService } from '../../services/puestos.service';
import { ToastrService } from 'ngx-toastr';
import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit/documentos-controlados-regedit.component';

interface combo {
  codigo : string;
  descripcion : string;
}

@Component({
  selector: 'app-documentos-controlados',
  standalone: false,
  templateUrl: './documentos-controlados.component.html',
  styleUrl: './documentos-controlados.component.css'
})
export class DocumentosControladosComponent implements OnInit {
  formulario!: FormGroup;
  lstOrganizacion:combo []= [];
  lstSedes:combo []=[];

 constructor(
  private dialog              : MatDialog             ,
  private SpinnerService      : NgxSpinnerService     ,
  private serviceOrganizacion : OrganizacionService   ,
  private serviceSede         : SedesService          ,
  private servicePuesto       : PuestosService        ,
  private formBuilder         : FormBuilder           , 
  private toastr              : ToastrService         ,  
){} 

  ngOnInit(): void {

   this.formulario = this.formBuilder.group({
      ctrol_sede:[""],
      ctrol_organizacion:[""],
      ctrol_puesto:[""],
      ctrol_proceso:[""],
    });      

  }

  onChangeOrga(event: any){
    const valor = event.value;
    this.onComboSedes(valor);
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

  onBuscar(){

  }

  onAgregar(){
    let dialogRef = this.dialog.open(DocumentosControladosRegeditComponent, {
    width: '55vw',   // viewport width
    height: '90vh',  // viewport height
    maxWidth: '100vw',
    maxHeight: '100vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "Registra nuevo Documento Controlado",
         Accion : "I",
         Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      //this.onListado();
    });        
  }

}
