import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { OrganizacionRegeditComponent } from './organizacion-regedit/organizacion-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

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

  constructor(
    private dialog              : MatDialog             ,
    private SpinnerService      : NgxSpinnerService     ,
    private toastr              : ToastrService         ,
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
    const localSedes = localStorage.getItem('precotex_sedes');
    if (localSedes) {
      const data = JSON.parse(localSedes);
      this.dataSource.data = data;
      this.calculateStats(data);
    } else {
      const defaultSedes = [
        { id: 's-001', nombre: 'Huachipa 1', direccion: 'Av. Los Frutales 123, Huachipa', procesos: 'Costura, Corte, Organización y Métodos', estado: 'Huachipa' },
        { id: 's-002', nombre: 'Huachipa 2', direccion: 'Av. Los Frutales 456, Huachipa', procesos: 'Costura, Estampado', estado: 'Huachipa' },
        { id: 's-003', nombre: 'Independencia', direccion: 'Av. Túpac Amaru 1200', procesos: 'SSOMA, Costura', estado: 'Independencia' },
        { id: 's-004', nombre: 'Santa Cecilia', direccion: 'Calle Santa Cecilia 340, SJL', procesos: 'Logística, Almacén', estado: 'SJL' }
      ];
      localStorage.setItem('precotex_sedes', JSON.stringify(defaultSedes));
      this.dataSource.data = defaultSedes;
      this.calculateStats(defaultSedes);
    }
  }

  calculateStats(sedes: any[]): void {
    this.stats = {
      total: sedes.length,
      huachipa: sedes.filter(s => s.estado === 'Huachipa').length,
      independencia: sedes.filter(s => s.estado === 'Independencia').length,
      ate: sedes.filter(s => s.estado === 'Ate').length
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
      width: '600px',
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
      width: '600px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar sede .::",
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
      title: '¿Desea eliminar la sede?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {
        try {
          const localSedes = localStorage.getItem('precotex_sedes');
          if (localSedes) {
            let data = JSON.parse(localSedes);
            data = data.filter((s: any) => s.id !== item.id);
            localStorage.setItem('precotex_sedes', JSON.stringify(data));
            
            this.toastr.success('Sede eliminada correctamente.', '', {
              timeOut: 2500,
            });
            this.onListado();
          }
        } catch (e) {
          this.toastr.error('Error al eliminar la sede.', '', {
            timeOut: 2500,
          });
        }
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
