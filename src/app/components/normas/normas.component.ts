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
    const localNormas = localStorage.getItem('precotex_normas');
    if (localNormas) {
      const data = JSON.parse(localNormas);
      this.dataSource.data = data;
      this.calculateStats(data);
    } else {
      // Default initial mock data matching Image 1 exactly
      const initialNorms = [
        {
          codigo_Norma: 'N-001',
          norma: 'ISO 9001:2015',
          categoria: 'Calidad',
          fechaVencimiento: '2027-12-31',
          fechaAuditoria: '2026-06-15',
          estado: 'Vigente',
          descripcion: 'Sistema de gestión de calidad para los procesos clave de producción y servicios.',
          flg_Activo: 'True'
        },
        {
          codigo_Norma: 'N-002',
          norma: 'ISO 45001:2018',
          categoria: 'Seguridad y Salud',
          fechaVencimiento: '2027-08-20',
          fechaAuditoria: '2026-05-10',
          estado: 'Vigente',
          descripcion: 'Sistema de gestión de seguridad y salud en el trabajo para la prevención de riesgos laborales.',
          flg_Activo: 'True'
        },
        {
          codigo_Norma: 'N-003',
          norma: 'ISO 14001:2015',
          categoria: 'Medio Ambiente',
          fechaVencimiento: '2026-08-30',
          fechaAuditoria: '2025-08-30',
          estado: 'Por vencer',
          descripcion: 'Sistema de gestión ambiental para el control de residuos y eficiencia energética.',
          flg_Activo: 'True'
        }
      ];
      localStorage.setItem('precotex_normas', JSON.stringify(initialNorms));
      this.dataSource.data = initialNorms;
      this.calculateStats(initialNorms);
    }
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
        const localNormas = localStorage.getItem('precotex_normas');
        if (localNormas) {
          let data = JSON.parse(localNormas);
          data = data.filter((n: any) => n.codigo_Norma !== item.codigo_Norma);
          localStorage.setItem('precotex_normas', JSON.stringify(data));
          this.toastr.success('Norma eliminada correctamente.', '', {
            timeOut: 2500,
          });
          this.onListado();
        }
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
