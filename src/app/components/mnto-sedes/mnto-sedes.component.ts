import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SedesService } from '../../services/sedes.service';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SedesRegeditComponent } from './sedes-regedit/sedes-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { OrganizacionService } from '../../services/organizacion.service';

@Component({
  selector: 'app-mnto-sedes',
  standalone: false,
  templateUrl: './mnto-sedes.component.html',
  styleUrl: './mnto-sedes.component.css'
})
export class MntoSedesComponent implements OnInit{
  formulario!: FormGroup;
  codigoOrganizacion: string = ''
  miOrganizacion: string = '';
  lstOrganizacion:any = [];

  constructor(
    private formBuilder         : FormBuilder       ,       
    private dialog              : MatDialog         ,
    private serviceSede         : SedesService      ,
    private serviceOrganizacion : OrganizacionService   ,
    private SpinnerService      : NgxSpinnerService ,
    private toastr              : ToastrService     ,
    private route               : ActivatedRoute    ,
    private router              : Router            ,
  ){}

  displayedColumns: string[] = [
    'codigo',
    'acronimo',
    'denominacion',
    'direccion',
    'distrito',
    'procesos',
    'organizacion',
    'estado',
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
    //const sEstadoOrganizacion: string = '';  
    this.SpinnerService.show();
    this.serviceSede.getListadoSedes(this.codigoOrganizacion,'0').subscribe({
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
        this.SpinnerService.hide();
        console.log(error.error.message, 'Cerrar', {
        timeOut: 2500,
         });
      }          
    });    
  }

  onEditar(row:any){
    console.log('editar', row);
    let dialogRef = this.dialog.open(SedesRegeditComponent, {
      width: '700px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar sede .::",
         Accion : "U",
         codOrganizacion  : null,
         Datos: row
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });   
  }

  onEliminar(row:any){

    const sCodigoSede: string = row?.codigo_Sede;
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
              "codigo_Sede": sCodigoSede,
              "codigo_Organizacion": "",
              "denominacion"  : "",
              "Acronimo"      : "",
              "direccion"     : "",
              "localidad"     : "",
              "provincia"     : "",
              "pais"          : "",
              "flg_Activo"    : '',
              "cod_Usuario"   : "SISTEMAS",
              "accion"        : "D",      
        };

      this.SpinnerService.show();
      this.serviceSede.postProcesoMntoSedes(data).subscribe({
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
    let dialogRef = this.dialog.open(SedesRegeditComponent, {
      width: '700px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Registra nueva sede .::",
         Accion : "I",
         codOrganizacion  : this.codigoOrganizacion,
         Datos: null
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
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

  onExportar(){
    const data = this.dataSource.data.map(row => ({
      'Código Sede': row.codigo_Sede,
      'Acrónimo': row.acronimo || '',
      'Sede / Denominación': row.denominacion || '',
      'Dirección': row.direccion || '',
      'Distrito / Localidad': row.localidad || row.provincia || '',
      'Procesos': row.procesos || row.nombre_Proceso || 'General',
      'Empresa': row.organizacion || '',
      'Estado': (row.flg_Activo === 'True' || row.flg_Activo === '1' || row.flg_Activo === 'A') ? 'Activo' : 'Inactivo'
    }));

    if (!data.length) {
      this.toastr.warning('No hay datos para exportar', 'Exportar Sedes');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(e => Object.values(e).map(v => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sedes_PrecoSIG_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.success('Exportación de sedes completada', 'Exportar Sedes');
  }

  aplicarFiltro(event: Event){
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAtras(){
    this.router.navigate(['/principal/organizacion']);
  }

}
