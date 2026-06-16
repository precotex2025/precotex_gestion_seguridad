import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProcesosService } from '../../services/procesos.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizacionService } from '../../services/organizacion.service';
import { ProcesosRegeditComponent } from './procesos-regedit/procesos-regedit.component';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-mnto-procesos',
  standalone: false,
  templateUrl: './mnto-procesos.component.html',
  styleUrl: './mnto-procesos.component.css'
})
export class MntoProcesosComponent implements OnInit{
   formulario!: FormGroup;
   codigoOrganizacion: string = '';
   miOrganizacion: string = '';
   lstOrganizacion:any = [];

  constructor(
    private formBuilder         : FormBuilder           ,  
    private dialog              : MatDialog             ,    
    private SpinnerService      : NgxSpinnerService     ,
    private serviceProceso      : ProcesosService       ,
    private route               : ActivatedRoute        ,
    private router              : Router                ,
    private serviceOrganizacion : OrganizacionService   ,
    private toastr              : ToastrService         ,
  ){

  }

  displayedColumns: string[] = [
    'codigo'      ,
    'proceso'     ,
    'sede'        ,
    'organizacion',
    'estado'      ,
    'acciones'    
  ];  
  dataSource = new MatTableDataSource<any>();    

  ngOnInit(): void {
    
    this.formulario = this.formBuilder.group({
      
     }); 
     this.codigoOrganizacion = this.route.snapshot.paramMap.get('codigoOrganizacion')!;  
     this.onObtenerDatoOrganizacion(this.codigoOrganizacion);
     this.onListado();
  }

  onListado(){

    const sEstadoOrganizacion: string = this.codigoOrganizacion??'';  
    this.SpinnerService.show();
    this.serviceProceso.getListadoProcesos(sEstadoOrganizacion,'0').subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
            this.dataSource.data = response.elements;
            this.SpinnerService.hide();
          }
          else{
            this.dataSource.data = [];            
            this.SpinnerService.hide();
          };
        }else{
          this.dataSource.data = [];
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

  onObtenerDatoOrganizacion(sCodOrganizacion: string){

    this.lstOrganizacion = [];

    this.SpinnerService.show();
    this.serviceOrganizacion.getObtenerOrganizacion(sCodOrganizacion).subscribe({
      next: (response: any)=> {
        if(response.success){
          if (response.totalElements > 0){
            this.lstOrganizacion = response.elements;
            this.miOrganizacion = `Empresa: ${this.lstOrganizacion[0].denominacion!}`;
            //this.formulario.get('ctrol_organizacion')?.setValue(this.lstOrganizacion[0].denominacion!);
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


  onEditar(row: any){

    console.log('editar', row);
    let dialogRef = this.dialog.open(ProcesosRegeditComponent, {
      width: '700px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar proceso .::",
         Accion : "U",
         codOrganizacion  : this.codigoOrganizacion,
         Datos: row
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });      

  }

  onEliminar(row: any){
    const sCodigoProceso: string = row?.codigo_Proceso;
    Swal.fire({
      title: '¿Desea eliminar la sede?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {
        
        let data: any = {
              "codigo_Proceso"      : sCodigoProceso,
              "codigo_Organizacion" : '',
              "codigo_Sede"         : '',
              "proceso"             : '',
              "codigo_Tipo_Proceso" : '',
              "descripcion"         : '',
              "nombre_Adjunto"      : '', //Por el momento es vacio
              "ruta_Adjunto"        : '', //Por el momento es vacio
              "flg_Activo"          : '',
              "cod_Usuario"         : "SISTEMAS",
              "accion"              : 'D',        
        };

      this.SpinnerService.show();
      this.serviceProceso.postProcesoMntoProcesos(data).subscribe({
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
    let dialogRef = this.dialog.open(ProcesosRegeditComponent, {
      width: '700px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Registra nuevo proceso .::",
         Accion : "I",
         codOrganizacion  : this.codigoOrganizacion,
         Datos: null
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });   
  }

  onExportar(){

  }

  aplicarFiltro(object: any){
    
  }  

  onAtras(){
    this.router.navigate(['/principal/organizacion']);
  }

}
