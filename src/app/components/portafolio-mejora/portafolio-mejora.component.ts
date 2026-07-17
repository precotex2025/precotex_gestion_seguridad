import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PortafolioMejoraRegeditComponent } from './portafolio-mejora-regedit/portafolio-mejora-regedit.component';

@Component({
  selector: 'app-portafolio-mejora',
  standalone: false,
  templateUrl: './portafolio-mejora.component.html',
  styleUrls: ['./portafolio-mejora.component.css']
})
export class PortafolioMejoraComponent implements OnInit {
  mejoraList: any[] = [];
  filteredList: any[] = [];
  searchText: string = '';
  selectedProceso: string = 'Todos';

  stats = {
    total: 0,
    enProceso: 0,
    cerrado: 0,
    vencido: 0
  };

  procesosGroups = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitaciones y Desarrollo', 'Comunicaciones', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Aseguramiento de Calidad Textil', 'Lavandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas'],
    'Gerencia General (GG)': ['Comercial Exportación de Telas', 'Comercial Venta Local Textil', 'Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };

  displayedColumns: string[] = [
    'titulo',
    'herramienta',
    'proceso',
    'sede',
    'apertura',
    'limite',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onListado() {
    try {
      const localData = localStorage.getItem('precotex_portafolio_mejora');
      if (localData) {
        this.mejoraList = JSON.parse(localData);
      } else {
        this.mejoraList = [
          {
            id: 'm-1',
            titulo: 'Reprocesos en costura línea 3',
            proceso: 'Costura',
            sede: 'Huachipa 1',
            herramienta: '5W-2H',
            proveniente: '—',
            apertura: '2025-06-15',
            limite: '2025-06-29',
            estado: 'Cerrado'
          },
          {
            id: 'm-2',
            titulo: 'Falla agujas máquina 12',
            proceso: 'Costura',
            sede: 'Huachipa 2',
            herramienta: 'ACR',
            proveniente: 'Incidente',
            apertura: '2025-06-10',
            limite: '2025-06-24',
            estado: 'En proceso'
          },
          {
            id: 'm-3',
            titulo: 'Reducción consumo energía',
            proceso: 'SSOMA',
            sede: 'Independencia',
            herramienta: 'ACR',
            proveniente: 'Oport. mejora',
            apertura: '2025-05-28',
            limite: '2025-06-11',
            estado: 'Vencido'
          }
        ];
        localStorage.setItem('precotex_portafolio_mejora', JSON.stringify(this.mejoraList));
      }

      this.calculateStats();
      this.applyFilter();
    } catch (e) {
      this.toastr.error('Error al cargar la información.', '', { timeOut: 2500 });
    }
  }

  calculateStats() {
    this.stats.total = this.mejoraList.length;
    this.stats.enProceso = this.mejoraList.filter(m => m.estado === 'En proceso').length;
    this.stats.cerrado = this.mejoraList.filter(m => m.estado === 'Cerrado').length;
    this.stats.vencido = this.mejoraList.filter(m => m.estado === 'Vencido').length;
  }

  selectProceso(proc: string) {
    this.selectedProceso = proc;
    this.applyFilter();
  }

  buscar(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchText = val;
    this.applyFilter();
  }

  applyFilter() {
    let list = [...this.mejoraList];

    // Filter by process tree selection
    if (this.selectedProceso !== 'Todos') {
      list = list.filter(m => m.proceso === this.selectedProceso);
    }

    // Filter by search bar query
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      list = list.filter(m =>
        m.titulo.toLowerCase().includes(q) ||
        m.proceso.toLowerCase().includes(q) ||
        m.sede.toLowerCase().includes(q) ||
        m.herramienta.toLowerCase().includes(q) ||
        m.estado.toLowerCase().includes(q)
      );
    }

    this.dataSource.data = list;
  }

  onAgregar() {
    const dialogRef = this.dialog.open(PortafolioMejoraRegeditComponent, {
      width: '650px',
      disableClose: true,
      data: {
        Title: 'Registrar iniciativa',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const newItem = {
          id: 'm-' + Date.now(),
          titulo: res.titulo.trim(),
          proceso: res.proceso,
          sede: res.sede,
          herramienta: res.herramienta,
          proveniente: res.proveniente,
          apertura: res.apertura,
          limite: res.limite,
          estado: res.estado
        };
        this.mejoraList.push(newItem);
        localStorage.setItem('precotex_portafolio_mejora', JSON.stringify(this.mejoraList));
        this.onListado();
        this.toastr.success('Iniciativa registrada correctamente.', '', { timeOut: 2000 });
      }
    });
  }

  onEditar(item: any) {
    const dialogRef = this.dialog.open(PortafolioMejoraRegeditComponent, {
      width: '650px',
      disableClose: true,
      data: {
        Title: 'Editar iniciativa',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const idx = this.mejoraList.findIndex(m => m.id === item.id);
        if (idx !== -1) {
          this.mejoraList[idx] = {
            ...this.mejoraList[idx],
            titulo: res.titulo.trim(),
            proceso: res.proceso,
            sede: res.sede,
            herramienta: res.herramienta,
            proveniente: res.proveniente,
            apertura: res.apertura,
            limite: res.limite,
            estado: res.estado
          };
          localStorage.setItem('precotex_portafolio_mejora', JSON.stringify(this.mejoraList));
          this.onListado();
          this.toastr.success('Iniciativa actualizada correctamente.', '', { timeOut: 2000 });
        }
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: '¿Desea eliminar la iniciativa?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          this.mejoraList = this.mejoraList.filter(m => m.id !== item.id);
          localStorage.setItem('precotex_portafolio_mejora', JSON.stringify(this.mejoraList));
          this.onListado();
          this.toastr.success('Iniciativa eliminada correctamente.', '', { timeOut: 2000 });
        } catch (e) {
          this.toastr.error('Error al eliminar la iniciativa.', '', { timeOut: 2000 });
        }
      }
    });
  }

  countProceso(proc: string): number {
    return this.mejoraList.filter(m => m.proceso === proc).length;
  }
}
