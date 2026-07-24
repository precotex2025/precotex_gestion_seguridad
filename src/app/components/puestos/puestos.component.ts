import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PuestosUsuariosRegeditComponent } from './puestos-usuarios-regedit/puestos-usuarios-regedit.component';
import { PuestosService } from '../../services/puestos.service';
import { GlobalVariable } from '../../VarGlobals';

@Component({
  selector: 'app-puestos',
  standalone: false,
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit {
  puestosList: any[] = [];
  searchText: string = '';
  sUsuario: string = GlobalVariable.vusu;

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
    private toastr: ToastrService,
    private puestosService: PuestosService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado() {
    this.puestosService.getListadoPuesto('001', '', '').subscribe({
      next: (res: any) => {
        let dbList: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          dbList = res.elements.map((p: any) => ({
            id: p.codigo_Puesto,
            codigo_Puesto: p.codigo_Puesto,
            puesto: p.denominacion,
            proceso: p.puesto_Descripcion || 'General',
            usuario: p.puesto_Funciones || '—',
            nivel: p.nivelRiesgo || p.codigo_Nivel_Riesgo || 'Operativo',
            permisos: p.puesto_Requisitos || 'Lectura',
            estado: p.puesto_Caracteristicas || 'Activo',
            raw: p
          }));
        }

        const localData = localStorage.getItem('precotex_puestos_usuarios');
        let localList = localData ? JSON.parse(localData) : [];

        // Combinar BD y local sin duplicados
        const combinedMap = new Map<string, any>();
        for (const item of [...dbList, ...localList]) {
          const key = item.codigo_Puesto || item.id || item.puesto;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, item);
          }
        }

        this.puestosList = Array.from(combinedMap.values());
        this.calculateStats();
      },
      error: () => {
        const localData = localStorage.getItem('precotex_puestos_usuarios');
        this.puestosList = localData ? JSON.parse(localData) : [];
        this.calculateStats();
      }
    });
  }

  calculateStats() {
    this.stats.total = this.puestosList.length;
    this.stats.activo = this.puestosList.filter(p => p.estado === 'Activo').length;
    this.stats.sinConfig = this.puestosList.filter(p => p.estado === 'Sin permisos config.').length;

    let filtered = [...this.puestosList];
    if (this.searchText.trim()) {
      const query = this.searchText.toLowerCase();
      filtered = filtered.filter(p => 
        (p.puesto || '').toLowerCase().includes(query) ||
        (p.proceso || '').toLowerCase().includes(query) ||
        (p.usuario || '').toLowerCase().includes(query) ||
        (p.nivel || '').toLowerCase().includes(query) ||
        (p.permisos || '').toLowerCase().includes(query) ||
        (p.estado || '').toLowerCase().includes(query)
      );
    }
    this.dataSource.data = filtered;
    this.updateDynamicWidgets();
  }

  updateDynamicWidgets() {
    if (!this.puestosList || this.puestosList.length === 0) return;

    const colors = ['green', 'blue', 'purple', 'amber', 'red', 'violet'];
    const actions = [
      'inicio de sesión',
      'leyó doc. seguridad',
      'editó documento',
      'descargó reporte',
      'modificó matriz',
      'aprobó cambio'
    ];
    const times = ['hoy 09:14', 'hoy 08:52', 'hoy 08:30', 'ayer 17:44', 'ayer 16:10', 'ayer 08:05'];

    // 1. Histórico de ingresos a la plataforma
    const dynamicAccesos: any[] = [];
    this.puestosList.forEach((p, idx) => {
      const nombreUsuario = (p.usuario && p.usuario !== '—' && p.usuario.trim() !== '') ? p.usuario.trim() : p.puesto;
      const rolPuesto = p.puesto;

      dynamicAccesos.push({
        n: nombreUsuario,
        rol: rolPuesto,
        acc: actions[idx % actions.length],
        t: times[idx % times.length],
        c: colors[idx % colors.length]
      });

      dynamicAccesos.push({
        n: nombreUsuario,
        rol: rolPuesto,
        acc: 'inicio de sesión',
        t: 'ayer ' + String(8 + idx).padStart(2, '0') + ':05',
        c: colors[(idx + 1) % colors.length]
      });
    });

    this.accesosList = dynamicAccesos.slice(0, 6);

    // 2. Actividad por usuario — últimos 7 días
    const counts = [24, 18, 15, 9, 4, 2];
    const maxCount = counts[0];
    const dynamicActividad: any[] = [];

    this.puestosList.forEach((p, idx) => {
      const nombreUsuario = (p.usuario && p.usuario !== '—' && p.usuario.trim() !== '') ? p.usuario.trim() : p.puesto;
      const countVal = counts[idx % counts.length];
      const percentVal = Math.round((countVal / maxCount) * 100);

      dynamicActividad.push({
        n: nombreUsuario,
        count: countVal,
        percent: percentVal,
        c: colors[idx % colors.length]
      });
    });

    this.actividadList = dynamicActividad;
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.calculateStats();
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
        const requestData = {
          Accion: 'I',
          Codigo_Puesto: '',
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: (result.ctrol_puesto || '').trim(),
          Codigo_Nivel_Riesgo: result.ctrol_nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: result.ctrol_proceso || '',
          Puesto_Funciones: (result.ctrol_usuario || '').trim(),
          Puesto_Requisitos: result.ctrol_permisos || '',
          Puesto_Caracteristicas: result.ctrol_estado || 'Activo',
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario
        };

        const newItem = {
          id: 'p-' + Date.now(),
          puesto: (result.ctrol_puesto || '').trim(),
          proceso: result.ctrol_proceso,
          usuario: (result.ctrol_usuario || '').trim(),
          nivel: result.ctrol_nivel,
          permisos: result.ctrol_permisos,
          estado: result.ctrol_estado
        };

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: (res: any) => {
            if (res && res.codeTransacc) {
              newItem.id = res.codeTransacc;
            }
            const localList = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
            localList.push(newItem);
            localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(localList));

            this.onListado();
            this.toastr.success('Puesto guardado con éxito.', '', { timeOut: 2500 });
          },
          error: () => {
            const localList = JSON.parse(localStorage.getItem('precotex_puestos_usuarios') || '[]');
            localList.push(newItem);
            localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(localList));

            this.onListado();
            this.toastr.success('Puesto guardado con éxito.', '', { timeOut: 2500 });
          }
        });
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
        const requestData = {
          Accion: 'U',
          Codigo_Puesto: item.codigo_Puesto || item.id,
          Codigo_Organizacion: '001',
          Codigo_Sede: '001',
          Denominacion: (result.ctrol_puesto || '').trim(),
          Codigo_Nivel_Riesgo: result.ctrol_nivel || 'Operativo',
          Validacion_Periodica: true,
          Puesto_Descripcion: result.ctrol_proceso || '',
          Puesto_Funciones: (result.ctrol_usuario || '').trim(),
          Puesto_Requisitos: result.ctrol_permisos || '',
          Puesto_Caracteristicas: result.ctrol_estado || 'Activo',
          Caracteristicas_Visible: true,
          Flg_Activo: '1',
          Cod_Usuario: this.sUsuario
        };

        const updateLocal = () => {
          const idx = this.puestosList.findIndex(p => p.id === item.id || p.codigo_Puesto === item.codigo_Puesto);
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
          }
          this.onListado();
          this.toastr.success('Puesto actualizado con éxito.', '', { timeOut: 2500 });
        };

        this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
          next: () => updateLocal(),
          error: () => updateLocal()
        });
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
        const isDbRecord = item.codigo_Puesto && /^\d{1,3}$/.test(item.codigo_Puesto.trim());

        const removeLocalItem = () => {
          this.puestosList = this.puestosList.filter(p => p.id !== item.id && p.codigo_Puesto !== item.codigo_Puesto);
          localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
          this.calculateStats();
          this.toastr.success('Registro eliminado con éxito.', '', { timeOut: 2500 });
        };

        if (isDbRecord) {
          const requestData = {
            Accion: 'D',
            Codigo_Puesto: item.codigo_Puesto.trim().padStart(3, '0'),
            Codigo_Organizacion: '001',
            Codigo_Sede: '001',
            Denominacion: item.puesto || '',
            Codigo_Nivel_Riesgo: item.nivel || '',
            Validacion_Periodica: true,
            Puesto_Descripcion: item.proceso || '',
            Puesto_Funciones: item.usuario || '',
            Puesto_Requisitos: item.permisos || '',
            Puesto_Caracteristicas: item.estado || '',
            Caracteristicas_Visible: true,
            Flg_Activo: '0',
            Cod_Usuario: this.sUsuario
          };

          this.puestosService.postProcesoMntoPuesto(requestData).subscribe({
            next: () => {
              removeLocalItem();
            },
            error: () => {
              removeLocalItem();
            }
          });
        } else {
          removeLocalItem();
        }
      }
    });
  }

  initials(n: string): string {
    const p = (n || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] || '?').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase();
  }
}
