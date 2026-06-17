import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit/documentos-controlados-regedit.component';
import { OrganizacionService } from '../../services/organizacion.service';
import { SedesService } from '../../services/sedes.service';
import { PuestosService } from '../../services/puestos.service';

interface combo {
  codigo : string;
  descripcion : string;
}

export interface CarpetaGroup {
  nombre: string;
  documentos: any[];
}

export interface GroupRow {
  isGroup: boolean;
  nombre: string;
  expanded: boolean;
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
  
  displayedColumns: string[] = [
    'codigo', 
    'ver_ed', 
    'nombre', 
    'estado', 
    'vence', 
    'tiempo_conserv', 
    'acciones', 
    'registro_doc_asociados', 
    'registro_infinity_asociados', 
    'elaborado_por', 
    'revisado_por', 
  ];
  
  dataSource: any[] = [];

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

    this.getOrganizacion();
    
    // Mock data para las carpetas y documentos en formato plano
    this.dataSource = [
      { isGroup: true, nombre: 'MATRIZ IAIAS/ IPERC', expanded: true },
      { codigo: 'DOC-001', ver_ed: 'v1.0', nombre: 'Matriz IPERC General', estado: 'Aprobado', vence: '2027-01-01', tiempo_conserv: '5 años', carpetaNombre: 'MATRIZ IAIAS/ IPERC' },
      { isGroup: true, nombre: 'ACABADO', expanded: true },
      { codigo: 'DOC-002', ver_ed: 'v2.0', nombre: 'Procedimiento de Acabado', estado: 'En Revisión', vence: '2026-06-01', tiempo_conserv: '3 años', carpetaNombre: 'ACABADO' }
    ];
  }

  isGroup(index: number, item: any): boolean {
    return item.isGroup;
  }

  toggleGroup(group: any) {
    group.expanded = !group.expanded;
  }

  isGroupExpanded(row: any): boolean {
    const group = this.dataSource.find(item => item.isGroup && item.nombre === row.carpetaNombre);
    return group ? group.expanded : true;
  }

  getOrganizacion(){}

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
    width: '85vw',   // viewport width
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

  onArchivoImportado(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.toastr.info(`Documento seleccionado: ${file.name} para importar de registros anteriores.`, 'Importar');
    }
  }
}
