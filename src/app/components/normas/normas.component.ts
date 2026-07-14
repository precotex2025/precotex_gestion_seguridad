import { Component, OnInit } from '@angular/core';
import { NormasService } from '../../services/normas.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NormasRegeditComponent } from './normas-regedit/normas-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

interface data_det {
  codigo: string;
  norma: string;
  descripcion: string;
  flgActivo: boolean;
}

@Component({
  selector: 'app-normas',
  standalone: false,
  templateUrl: './normas.component.html',
  styleUrl: './normas.component.css'
})
export class NormasComponent implements OnInit {

  constructor(
    private dialog            : MatDialog             ,
    private serviceNorma      : NormasService         ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
  ) { }   
  
   displayedColumns: string[] = [
    'codigo',
    'norma',
    'descripcion',
    'estado',
    'acciones'
   ];  
    dataSource = new MatTableDataSource<any>();  

  ngOnInit(): void {
    this.onListado();
  };
  
  onListado(){

    this.SpinnerService.show();
    this.serviceNorma.getListadoNormas('0').subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
              //this.dataListadoMemorandums = response.elements;
              this.dataSource.data = response.elements;
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

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onEditar(item: any){

    let dialogRef = this.dialog.open(NormasRegeditComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar norma .::",
         Accion : "U",
         Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });  


  }

  onEliminar(item: any){
    
    const sCodigoNorma: string = item?.codigo_Norma;
    Swal.fire({
      title: '¿Desea eliminar la norma?, Confirme',
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
          "norma"         : "",
          "descripcion"   : "",
          "flg_Activo"    : '', 
          "cod_Usuario"   : "SISTEMAS",
          "accion"        : "D",           
        };

      this.SpinnerService.show();
      this.serviceNorma.postProcesoMntoNormas(data).subscribe({
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

  onAgregar(){

    let dialogRef = this.dialog.open(NormasRegeditComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Registra nueva norma .::",
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

}
