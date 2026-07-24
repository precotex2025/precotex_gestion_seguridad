import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { OrganizacionRegeditComponent } from './organizacion-regedit/organizacion-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { SedesService } from '../../services/sedes.service';
import { ProcesosService } from '../../services/procesos.service';
import { GlobalVariable } from '../../VarGlobals';

@Component({
  selector: 'app-organizacion',
  standalone: false,
  templateUrl: './organizacion.component.html',
  styleUrl: './organizacion.component.css'
})
export class OrganizacionComponent implements OnInit {

  stats: {
    total: number;
    huachipa: number;
    independencia: number;
    ate: number;
  } = {
    total: 0,
    huachipa: 0,
    independencia: 0,
    ate: 0
  };

  organigramaNombre: string | null = null;
  sUsuario: string = GlobalVariable.vusu;

  constructor(
    private dialog              : MatDialog             ,
    private SpinnerService      : NgxSpinnerService     ,
    private toastr              : ToastrService         ,
    private sedesService        : SedesService          ,
    private procesosService      : ProcesosService
  ) {}

  displayedColumns: string[] = [
    'nombre',
    'direccion',
    'procesos',
    'estado',
    'acciones'
  ];  
  dataSource = new MatTableDataSource<any>();    

  ngOnInit(){
    this.onListado();
    this.organigramaNombre = localStorage.getItem('precotex_organigrama_nombre');
  }

  onListado(){
    this.SpinnerService.show();
    this.sedesService.getListadoSedes('001', '1').subscribe({
      next: (response: any) => {
        if (response && response.success && response.elements) {
          const sedes = response.elements;
          this.procesosService.getListadoProcesos('001', '1').subscribe({
            next: (procRes: any) => {
              const allProcs = (procRes && procRes.success && procRes.elements) ? procRes.elements : [];
              
              const mappedData = sedes.map((sede: any) => {
                const sProcs = allProcs.filter((p: any) => p.codigo_Sede === sede.codigo_Sede);
                return {
                  id: sede.codigo_Sede,
                  nombre: sede.denominacion,
                  direccion: sede.direccion,
                  estado: sede.localidad || 'Indefinido',
                  procesosCount: sProcs.length,
                  procesosNombres: sProcs.map((p: any) => p.proceso).join(', '),
                  raw: sede
                };
              });
              this.dataSource.data = mappedData;
              this.calculateStats(mappedData);
              this.SpinnerService.hide();
            },
            error: () => {
              const mappedData = sedes.map((sede: any) => ({
                id: sede.codigo_Sede,
                nombre: sede.denominacion,
                direccion: sede.direccion,
                estado: sede.localidad || 'Indefinido',
                procesosCount: 0,
                procesosNombres: '',
                raw: sede
              }));
              this.dataSource.data = mappedData;
              this.calculateStats(mappedData);
              this.SpinnerService.hide();
            }
          });
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
          this.SpinnerService.hide();
        }
      },
      error: (error: any) => {
        this.SpinnerService.hide();
        this.toastr.error('Error al cargar sedes.', 'Error');
      }
    });
  }

  calculateStats(sedes: any[]): void {
    this.stats = {
      total: sedes.length,
      huachipa: sedes.filter(s => s.estado && s.estado.toLowerCase().includes('huachipa')).length,
      independencia: sedes.filter(s => s.estado && s.estado.toLowerCase().includes('independencia')).length,
      ate: sedes.filter(s => s.estado && s.estado.toLowerCase().includes('ate')).length
    };
  }

  getEstadoClass(estado: string | null | undefined): string {
    if (!estado) return 'huachipa';
    const normalized = estado.toLowerCase().trim();
    if (normalized.includes('huachipa')) return 'huachipa';
    if (normalized.includes('independencia')) return 'independencia';
    if (normalized.includes('sjl')) return 'sjl';
    if (normalized.includes('ate')) return 'ate';
    return 'huachipa';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(){
    let dialogRef = this.dialog.open(OrganizacionRegeditComponent, {
      width: '750px',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Agregar sede .::",
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

  onEditar(item: any){
    let dialogRef = this.dialog.open(OrganizacionRegeditComponent, {
      width: '750px',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar sede .::",
         Accion : "U",
         Datos  : item.raw
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
      title: '¿Desea eliminar la sede?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {
        this.SpinnerService.show();
        
        item.raw.flg_Activo = '0'; // Soft delete
        item.raw.cod_Usuario = this.sUsuario;

        this.sedesService.postProcesoMntoSedes({
          Accion: 'D',
          Codigo_Sede: item.raw.codigo_Sede,
          Codigo_Organizacion: item.raw.codigo_Organizacion || '001',
          Denominacion: item.raw.denominacion || '',
          Acronimo: item.raw.acronimo || '',
          Direccion: item.raw.direccion || '',
          Localidad: item.raw.localidad || '',
          Provincia: item.raw.provincia || '',
          Pais: item.raw.pais || '',
          Flg_Activo: '0',
          Cod_Usuario: this.sUsuario
        }).subscribe({
          next: (res: any) => {
            this.SpinnerService.hide();
            if (res.codeResult === 200 || res.codeResult === 201) {
              this.toastr.success(res.message, '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(res.message, '', { timeOut: 2500 });
            }
          },
          error: (err: any) => {
            this.SpinnerService.hide();
            this.toastr.error('Error al eliminar la sede.', '', { timeOut: 2500 });
          }
        });
      }
    });      
  }

  triggerUpload() {
    const fileInput = document.getElementById('organigrama-upload');
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      localStorage.setItem('precotex_organigrama_nombre', file.name);
      this.organigramaNombre = file.name;
      this.toastr.success('Organigrama corporativo cargado correctamente.', '', {
        timeOut: 2500
      });
    }
  }

}
