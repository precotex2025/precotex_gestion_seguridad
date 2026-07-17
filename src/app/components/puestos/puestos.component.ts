import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PuestosUsuariosRegeditComponent } from './puestos-usuarios-regedit/puestos-usuarios-regedit.component';

@Component({
  selector: 'app-puestos',
  standalone: false,
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit {
  puestosList: any[] = [];
  searchText: string = '';

  stats = { total: 0, activo: 0, sinConfig: 0 };

  displayedColumns: string[] = [
    'puesto',
    'proceso',
    'usuario',
    'nivel',
    'permisos',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  accesosList = [
    { n: 'Carlos Ríos', rol: 'Ger. Producción', acc: 'editó documento', t: 'hoy 09:14', c: 'blue' },
    { n: 'Ana Torres', rol: 'Jefe SSOMA', acc: 'leyó doc. seguridad', t: 'hoy 08:52', c: 'green' },
    { n: 'Rosa Chávez', rol: 'Coord. Logística', acc: 'inicio de sesión', t: 'hoy 08:30', c: 'amber' },
    { n: 'Luis Mamani', rol: 'Sup. Calidad', acc: 'descargó reporte', t: 'ayer 17:44', c: 'violet' },
    { n: 'Pedro Salas', rol: 'Analista Riesgos', acc: 'modificó matriz', t: 'ayer 16:10', c: 'blue' },
    { n: 'Ana Torres', rol: 'Jefe SSOMA', acc: 'inicio de sesión', t: 'ayer 08:05', c: 'green' }
  ];

  actividadList = [
    { n: 'Carlos Ríos', count: 24, percent: 100, c: 'green' },
    { n: 'Ana Torres', count: 18, percent: 75, c: 'blue' },
    { n: 'Pedro Salas', count: 15, percent: 62, c: 'purple' },
    { n: 'Luis Mamani', count: 9, percent: 37, c: 'amber' },
    { n: 'Rosa Chávez', count: 4, percent: 16, c: 'red' }
  ];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado() {
    try {
      const localData = localStorage.getItem('precotex_puestos_usuarios');
      if (localData) {
        this.puestosList = JSON.parse(localData);
      } else {
        // Seed default mock items
        this.puestosList = [
          {
            id: 'p-1',
            puesto: 'Gerente de Producción',
            proceso: 'Corte',
            usuario: 'Carlos Ríos',
            nivel: 'Gerencial',
            permisos: 'Lectura + descarga + modificar',
            estado: 'Activo'
          },
          {
            id: 'p-2',
            puesto: 'Jefe de SSOMA',
            proceso: 'SSOMA',
            usuario: 'Ana Torres',
            nivel: 'Jefatura',
            permisos: 'Lectura + descarga + modificar',
            estado: 'Activo'
          },
          {
            id: 'p-3',
            puesto: 'Asistente de Costura',
            proceso: 'Costura',
            usuario: '',
            nivel: 'Operativo',
            permisos: 'Lectura',
            estado: 'Sin permisos config.'
          }
        ];
        localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
      }

      // Calculate stats based on full list
      this.stats.total = this.puestosList.length;
      this.stats.activo = this.puestosList.filter(p => p.estado === 'Activo').length;
      this.stats.sinConfig = this.puestosList.filter(p => p.estado === 'Sin permisos config.').length;

      // Filter list for table source
      let filtered = [...this.puestosList];
      if (this.searchText.trim()) {
        const query = this.searchText.toLowerCase();
        filtered = filtered.filter(p => 
          p.puesto.toLowerCase().includes(query) ||
          p.proceso.toLowerCase().includes(query) ||
          (p.usuario && p.usuario.toLowerCase().includes(query)) ||
          p.nivel.toLowerCase().includes(query) ||
          p.permisos.toLowerCase().includes(query) ||
          p.estado.toLowerCase().includes(query)
        );
      }

      this.dataSource.data = filtered;

    } catch (e) {
      this.toastr.error('Error al cargar la información.', '', { timeOut: 2500 });
    }
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.onListado();
  }

  onAgregar() {
    const dialogRef = this.dialog.open(PuestosUsuariosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Nuevo registro',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newItem = {
          id: 'p-' + Date.now(),
          puesto: (result.ctrol_puesto || '').trim(),
          proceso: result.ctrol_proceso,
          usuario: (result.ctrol_usuario || '').trim(),
          nivel: result.ctrol_nivel,
          permisos: result.ctrol_permisos,
          estado: result.ctrol_estado
        };
        this.puestosList.push(newItem);
        localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
        this.onListado();
        this.toastr.success('Registro guardado correctamente.', '', { timeOut: 2000 });
      }
    });
  }

  onEditar(item: any) {
    const dialogRef = this.dialog.open(PuestosUsuariosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar registro',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const idx = this.puestosList.findIndex(p => p.id === item.id);
        if (idx !== -1) {
          this.puestosList[idx] = {
            ...this.puestosList[idx],
            puesto: (result.ctrol_puesto || '').trim(),
            proceso: result.ctrol_proceso,
            usuario: (result.ctrol_usuario || '').trim(),
            nivel: result.ctrol_nivel,
            permisos: result.ctrol_permisos,
            estado: result.ctrol_estado
          };
          localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
          this.onListado();
          this.toastr.success('Registro actualizado correctamente.', '', { timeOut: 2000 });
        }
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: '¿Desea eliminar el registro?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          this.puestosList = this.puestosList.filter(p => p.id !== item.id);
          localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
          this.onListado();
          this.toastr.success('Registro eliminado correctamente.', '', { timeOut: 2000 });
        } catch (e) {
          this.toastr.error('Error al eliminar el registro.', '', { timeOut: 2000 });
        }
      }
    });
  }

  initials(n: string): string {
    const p = (n || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] || '?').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase();
  }
}
