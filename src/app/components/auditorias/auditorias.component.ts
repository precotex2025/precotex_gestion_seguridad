import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriasRegeditComponent } from './auditorias-regedit/auditorias-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

const STORAGE_KEY = 'precotex_auditorias';

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

  private readonly seedData = [
    {
      codigo_Auditoria: 'AUD-INT-2025-001',
      tipo: 'Interna',
      norma: 'ISO 9001:2015',
      responsable: 'Juan Pérez',
      areas: 'Costura, Calidad',
      inicio: '2025-01-15',
      fin: '2025-01-16',
      frecuencia: 'Semestral',
      estado: 'Realizada',
      alcance: 'Auditoría interna de procesos de costura y calidad.'
    },
    {
      codigo_Auditoria: 'AUD-EXT-2025-001',
      tipo: 'Externa',
      norma: 'ISO 45001:2018',
      responsable: 'Ana Torres',
      areas: 'Todas',
      inicio: '2025-03-20',
      fin: '2025-03-22',
      frecuencia: 'Anual',
      estado: 'Realizada',
      alcance: 'Auditoría externa Bureau Veritas.'
    },
    {
      codigo_Auditoria: 'AUD-INT-2025-004',
      tipo: 'Interna',
      norma: 'ISO 9001:2015',
      responsable: 'Jordan Pinedo',
      areas: 'Corte, Logística',
      inicio: '2025-05-05',
      fin: '2025-05-06',
      frecuencia: 'Trimestral',
      estado: 'No realizada',
      alcance: 'Auditoría interna de corte y logística.'
    },
    {
      codigo_Auditoria: 'AUD-INT-2025-006',
      tipo: 'Interna',
      norma: 'ISO 9001:2015',
      responsable: 'Juan Pérez',
      areas: 'Costura, Calidad',
      inicio: '2025-07-15',
      fin: '2025-07-17',
      frecuencia: 'Semestral',
      estado: 'Programada',
      alcance: 'Auditoría interna programada.'
    },
    {
      codigo_Auditoria: 'AUD-EXT-2025-003',
      tipo: 'Externa',
      norma: 'ISO 45001:2018',
      responsable: 'Ana Torres',
      areas: 'SSOMA, Producción',
      inicio: '2025-07-29',
      fin: '2025-08-01',
      frecuencia: 'Anual',
      estado: 'Programada',
      alcance: 'Auditoría externa Bureau Veritas.'
    }
  ];

  constructor(
    private dialog : MatDialog,
    private toastr : ToastrService,
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const data = JSON.parse(local);
      this.dataSource.data = data;
      this.calculateStats(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.seedData));
      this.dataSource.data = this.seedData;
      this.calculateStats(this.seedData);
    }
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
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.filter((d: any) => d.codigo_Auditoria !== item.codigo_Auditoria);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Auditoría eliminada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }
}
