import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { NuevaRevisionModalComponent } from './nueva-revision-modal/nueva-revision-modal.component';

export interface VerificacionRegistro {
  fechaHora: string;
  responsable: string;
  usuariosInactivos: number;
}

@Component({
  selector: 'app-verificacion-accesos',
  standalone: false,
  templateUrl: './verificacion-accesos.component.html',
  styleUrls: ['./verificacion-accesos.component.css']
})
export class VerificacionAccesosComponent implements OnInit {

  dataSource = new MatTableDataSource<VerificacionRegistro>();
  displayedColumns: string[] = ['fechaHora', 'responsable', 'usuariosInactivos', 'acciones'];

  // Toggle for original PHP bug visual
  mostrarErrorPHP: boolean = false;

  // Mock data
  originalRegistros: VerificacionRegistro[] = [
    {
      fechaHora: '2026-06-25 14:20',
      responsable: 'fhuamani',
      usuariosInactivos: 2
    },
    {
      fechaHora: '2026-06-24 09:15',
      responsable: 'admin',
      usuariosInactivos: 5
    },
    {
      fechaHora: '2026-06-22 11:30',
      responsable: 'sys',
      usuariosInactivos: 0
    },
    {
      fechaHora: '2026-06-20 16:45',
      responsable: 'fhuamani',
      usuariosInactivos: 1
    }
  ];

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.dataSource.data = [...this.originalRegistros];
  }

  onNuevaRevision(): void {
    const dialogRef = this.dialog.open(NuevaRevisionModalComponent, {
      width: '95%',
      maxWidth: '1300px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinner.show();
        setTimeout(() => {
          const hoy = new Date();
          const fechaString = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')} ${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`;
          
          const nuevo: VerificacionRegistro = {
            fechaHora: fechaString,
            responsable: 'fhuamani',
            usuariosInactivos: result.desactivados
          };

          this.originalRegistros.unshift(nuevo);
          this.cargarDatos();
          
          this.toastr.success(
            `Se ha realizado la revisión de usuarios. Inactivos encontrados: ${nuevo.usuariosInactivos}`,
            'Revisión Completada'
          );
          this.spinner.hide();
        }, 800);
      }
    });
  }

  onEliminar(row: VerificacionRegistro): void {
    this.spinner.show();
    setTimeout(() => {
      this.originalRegistros = this.originalRegistros.filter(r => r.fechaHora !== row.fechaHora);
      this.cargarDatos();
      this.toastr.error('Revisión eliminada con éxito.', 'Eliminado');
      this.spinner.hide();
    }, 300);
  }
}
