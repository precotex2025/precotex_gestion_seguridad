import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { OrganizacionService } from '../../services/organizacion.service';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { OrganizacionRegeditComponent } from './organizacion-regedit/organizacion-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MntoSedesComponent } from '../mnto-sedes/mnto-sedes.component';
import { MntoProcesosComponent } from '../mnto-procesos/mnto-procesos.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-organizacion',
  standalone: false,
  templateUrl: './organizacion.component.html',
  styleUrl: './organizacion.component.css'
})
export class OrganizacionComponent implements OnInit {

  constructor(
    private dialog              : MatDialog             ,
    private serviceOrganizacion : OrganizacionService   ,
    private SpinnerService      : NgxSpinnerService     ,
    private toastr              : ToastrService         ,
    private router              : Router                ,
    private route               : ActivatedRoute
  ){

  }

  displayedColumns: string[] = [
  'codigo'      ,
  'denominacion',
  'sedes'       ,
  'procesos'    ,
  'activos'     ,
  'estado'      ,
  'acciones'
  ];  
  dataSource = new MatTableDataSource<any>();    

  ngOnInit(){
    this.onListado();
  }

  onListado(){
    this.SpinnerService.show();
    this.serviceOrganizacion.getListadoOrganizacion('0').subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
              //this.dataListadoMemorandums = response.elements;
              this.dataSource.data = response.elements;
              console.log('datos de organizacion', response.elements);
              //this.dataSource.sort = this.sort;

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

  onExportar(){

  }

  onAgregar(){
    
    let dialogRef = this.dialog.open(OrganizacionRegeditComponent, {
      width: '700px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Registra nueva Organización .::",
         Accion : "I",
         Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });       

  }

  aplicarFiltro(object: any){
    
  }

  onEliminar(item: any){
     
    const sCodOrganizacion: string = item?.codigo_Organizacion;
    Swal.fire({
      title: '¿Desea eliminar la organización?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {
        
        let data: any = {
          "codigo_Organizacion" : sCodOrganizacion,
          "denominacion"        : "",
          "direccion"           : "",
          "localidad"           : "",
          "provincia"           : "",
          "pais"                : "",
          "flg_Activo"          : "",
          "cod_Usuario"         : "SISTEMAS",
          "accion": "D",           
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

  onEditar(item: any){

    let dialogRef = this.dialog.open(OrganizacionRegeditComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar organización .::",
         Accion : "U",
         Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });     

  }

  onSedes(item: any){

    const codigoOrganizacion:string =  item?.codigo_Organizacion;
    this.router.navigate(['/principal/mntoSedes', codigoOrganizacion]);
  }

  onProcesos(item: any){

    const codigoOrgnizacion:string = item?.codigo_Organizacion;
    this.router.navigate(['/principal/mntoProcesos', codigoOrgnizacion]);

    /*
    let dialogRef = this.dialog.open(MntoProcesosComponent, {
      width: '60vw',
      maxWidth: '95vw',
      maxHeight: '90vh',
      height: '50vh',

      disableClose: true,
      panelClass: 'my-class',
      data: {
         Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });     
    */
  }


}
