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

  stats = {
    total: 0,
    vigente: 0,
    enRevision: 0,
    porVencer: 0
  };

  constructor(
    private dialog            : MatDialog             ,
    private serviceNorma      : NormasService         ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
  ) { }   
  
   displayedColumns: string[] = [
    'norma',
    'categoria',
    'fechaVencimiento',
    'fechaAuditoria',
    'estado',
    'descripcion',
    'acciones'
   ];  
  dataSource = new MatTableDataSource<any>();  

  ngOnInit(): void {
    this.onListado();
  };
  
  onListado(): void {
    this.SpinnerService.show();
    this.serviceNorma.getListadoNormas('1').subscribe({
      next: (res: any) => {
        this.SpinnerService.hide();
        if (res.success) {
          const data = res.data || res.elements;
          this.dataSource.data = data;
          this.calculateStats(data);
        } else {
          this.toastr.error('Error al obtener los datos de la base de datos.', '', { timeOut: 2500 });
        }
      },
      error: (err: any) => {
        this.SpinnerService.hide();
        this.toastr.error('Error al conectarse al servicio.', '', { timeOut: 2500 });
      }
    });
  }

  calculateStats(normas: any[]): void {
    this.stats = {
      total: normas.length,
      vigente: normas.filter(n => n.estado === 'Vigente').length,
      enRevision: normas.filter(n => n.estado === 'En revisión').length,
      porVencer: normas.filter(n => n.estado === 'Por vencer').length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'vigente';
    const normalized = estado.toLowerCase().trim();
    if (normalized.includes('vigente')) return 'vigente';
    if (normalized.includes('revisión')) return 'revision';
    if (normalized.includes('vencer')) return 'vencer';
    return 'vigente';
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
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onListado();
      }
    });  
  }

  onEliminar(item: any){
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
        this.SpinnerService.show();
        const data = {
          codigo_Norma: item.codigo_Norma,
          accion: 'D',
          cod_Usuario: 'admin' // TODO: Get from auth
        };
        
        this.serviceNorma.postProcesoMntoNormas(data).subscribe({
          next: (res: any) => {
            this.SpinnerService.hide();
            if (res.success) {
              this.toastr.success(res.message, '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(res.message, '', { timeOut: 2500 });
            }
          },
          error: (err: any) => {
            this.SpinnerService.hide();
            this.toastr.error('Error al conectarse al servicio.', '', { timeOut: 2500 });
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
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onListado();
      }
    });    
  }

  onExportar(){
    // Export function placeholder
    this.toastr.info('Funcionalidad de exportación en desarrollo', '', {
      timeOut: 2000
    });
  }

}
