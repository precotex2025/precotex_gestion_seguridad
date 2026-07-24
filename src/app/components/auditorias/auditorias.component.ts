import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriasRegeditComponent } from './auditorias-regedit/auditorias-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AuditoriasService } from '../../services/auditorias.service';

@Component({
  selector: 'app-auditorias',
  standalone: false,
  templateUrl: './auditorias.component.html',
  styleUrl: './auditorias.component.css'
})
export class AuditoriasComponent implements OnInit {

  stats = {
    total: 0,
    realizadas: 0,
    programadas: 0,
    noRealizadas: 0
  };

  displayedColumns: string[] = [
    'codigo',
    'tipo',
    'norma',
    'responsable',
    'areas',
    'inicio',
    'fin',
    'frecuencia',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog : MatDialog,
    private toastr : ToastrService,
    private auditoriasService : AuditoriasService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    this.auditoriasService.getListadoAuditorias('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const list = res.elements.map((d: any) => ({
            codigo_Auditoria: d.codigo_Auditoria,
            tipo: d.tipo,
            norma: d.norma,
            responsable: d.responsable,
            areas: d.areas,
            inicio: d.fecha_Inicio ? d.fecha_Inicio.split('T')[0] : '',
            fin: d.fecha_Fin ? d.fecha_Fin.split('T')[0] : '',
            frecuencia: d.frecuencia,
            estado: d.estado,
            alcance: d.alcance
          }));
          this.dataSource.data = list;
          this.calculateStats(list);
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: () => {
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total        : data.length,
      realizadas   : data.filter(d => d.estado === 'Realizada').length,
      programadas  : data.filter(d => d.estado === 'Programada').length,
      noRealizadas : data.filter(d => d.estado === 'No realizada').length,
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'programada';
    const s = estado.toLowerCase().trim();
    if (s.includes('realizada') && !s.includes('no')) return 'realizada';
    if (s.includes('programada')) return 'programada';
    if (s.includes('no realizada')) return 'no-realizada';
    return 'programada';
  }

  getTipoClass(tipo: string): string {
    return tipo === 'Externa' ? 'externa' : 'interna';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(AuditoriasRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
        Title  : '::. Planificar auditoría .::'  ,
        Accion : 'I'                              ,
        Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe(res => { if (res) this.onListado(); });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(AuditoriasRegeditComponent, {
      width: '680px',
      disableClose: true,
      panelClass: 'my-class',
      data: {
        Title  : '::. Editar auditoría .::'  ,
        Accion : 'U'                          ,
        Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(res => { if (res) this.onListado(); });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar la auditoría?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        const payload = {
          Accion: 'D',
          Codigo_Auditoria: item.codigo_Auditoria,
          Cod_Usuario: 'SISTEMAS'
        };
        this.auditoriasService.postProcesoMntoAuditoria(payload).subscribe({
          next: () => {
            this.toastr.success('Auditoría eliminada correctamente en la BD.', '', { timeOut: 2500 });
            this.onListado();
          },
          error: () => {
            this.toastr.error('Error al eliminar auditoría en la BD.', '', { timeOut: 2500 });
          }
        });
      }
    });
  }
}
