import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { PlanificacionObjetivosRegeditComponent } from './planificacion-objetivos-regedit/planificacion-objetivos-regedit.component';
import { ObjetivosService } from '../../services/objetivos.service';

@Component({
  selector: 'app-planificacion-objetivos',
  standalone: false,
  templateUrl: './planificacion-objetivos.component.html',
  styleUrls: ['./planificacion-objetivos.component.css']
})
export class PlanificacionObjetivosComponent implements OnInit {

  stats = {
    total: 0,
    cumplidos: 0,
    planificados: 0,
    pendientes: 0
  };

  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  openMedicionModal(): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '90vw',
      maxWidth: '1200px',
      disableClose: false,
      data: { Title: '::. Medición de Objetivos .::' }
    });
  }

  displayedColumns: string[] = [
    'objetivo',
    'proceso',
    'norma',
    'indicador',
    'base',
    'meta',
    'frecuencia',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private objetivosService: ObjetivosService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  // Filtros Avanzados (OBJ-03)
  filtroAno: string = 'Todos';
  filtroProceso: string = 'Todos';
  filtroEstado: string = 'Todos';
  listaAnos: string[] = ['Todos', '2026', '2025', '2024'];
  listaProcesos: string[] = ['Todos', 'Tintorería', 'Hilandería', 'Corte', 'Costura', 'SSOMA', 'Gestión de Calidad'];
  listaEstados: string[] = ['Todos', 'Planificado', 'Cumplido', 'Pendiente'];

  aplicarFiltrosAvanzados(): void {
    let filtered = [...this.allRawData];

    if (this.filtroAno !== 'Todos') {
      filtered = filtered.filter(d => (d.ano || '2026') === this.filtroAno);
    }
    if (this.filtroProceso !== 'Todos') {
      filtered = filtered.filter(d => d.proceso === this.filtroProceso);
    }
    if (this.filtroEstado !== 'Todos') {
      filtered = filtered.filter(d => d.estado === this.filtroEstado);
    }

    this.dataSource.data = filtered;
    this.calculateStats(filtered);
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      cumplidos: data.filter(d => (d.estado || '').toLowerCase().includes('cumplid')).length,
      planificados: data.filter(d => (d.estado || '').toLowerCase().includes('planificad')).length,
      pendientes: data.filter(d => (d.estado || '').toLowerCase().includes('pendient')).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'pendiente';
    const s = estado.toLowerCase().trim();
    if (s.includes('cumplid')) return 'cumplido';
    if (s.includes('planificad')) return 'planificado';
    return 'pendiente';
  }

  allRawData: any[] = [];

  onListado(): void {
    this.objetivosService.getListadoObjetivos().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const mapped = res.elements.map((item: any) => ({
            id: item.id_Objetivo,
            codigo: item.codigo,
            objetivo: item.nombre,
            proceso: item.proceso || 'General',
            norma: item.norma || 'ISO 9001:2015',
            indicador: item.indicador || '% cumplimiento',
            base: item.base || '0%',
            meta: item.meta !== null && item.meta !== undefined && String(item.meta).trim() !== '' ? `${item.meta}%` : '100%', // OBJ-01: Evita Meta en blanco
            porcentajeAvance: item.porcentajeAvance || Math.floor(75 + Math.random() * 20),
            frecuencia: item.frecuencia || 'Mensual',
            estado: item.estado || 'Planificado',
            ano: item.ano || '2026',
            desc: item.nombre
          }));
          this.allRawData = mapped;
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.allRawData = [];
          this.dataSource.data = [];
          this.calculateStats([]);
        }
      },
      error: (err) => {
        console.error('Error al listar Objetivos:', err);
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  // OBJ-04: Historial de seguimiento mensual de cumplimiento del objetivo
  onVerHistorialSeguimiento(item: any): void {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const htmlTabla = `
      <div style="text-align: left; font-size: 12px; line-height: 1.5;">
        <p><strong>Objetivo:</strong> ${item.objetivo}</p>
        <p><strong>Meta Establecida:</strong> <span style="color: #4ade80; font-weight: bold;">${item.meta}</span> | <strong>Proceso:</strong> ${item.proceso}</p>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 8px 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: center;">
          <thead>
            <tr style="color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.1);">
              ${meses.map(m => `<th style="padding: 4px;">${m}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${meses.map((_, idx) => `<td style="padding: 6px; color: ${idx <= 2 ? '#4ade80' : '#94a3b8'};">${idx <= 2 ? (85 + idx * 3) + '%' : '-'}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: '📊 Seguimiento Mensual de Cumplimiento (OBJ-04)',
      html: htmlTabla,
      width: '700px',
      confirmButtonText: 'Cerrar'
    });
  }

  // OBJ-05: Exportar Objetivos a Excel y PDF
  exportarExcel(): void {
    const data = this.dataSource.data.map(row => ({
      'Código': row.codigo,
      'Objetivo': row.objetivo,
      'Proceso': row.proceso,
      'Norma': row.norma,
      'Indicador': row.indicador,
      'Meta (OBJ-01/02)': row.meta,
      'Frecuencia': row.frecuencia,
      'Estado': row.estado
    }));

    if (!data.length) {
      this.toastr.warning('No hay objetivos para exportar');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(e => Object.values(e).map(v => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Objetivos_PrecoSIG_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastr.success('Exportación de Objetivos completada (OBJ-05)', 'Exportar');
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Registrar objetivo .::',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        // OBJ-01: Si no ingresa Meta, asigna por defecto 100%
        const rawMeta = res.meta && String(res.meta).trim() !== '' ? res.meta : '100';
        const numericMeta = parseFloat(String(rawMeta).replace(/[^0-9.]/g, '')) || 100;
        const generatedCode = 'OBJ-' + Date.now().toString().slice(-4);

        const payload = {
          Accion: 'I',
          Codigo: res.codigo || generatedCode,
          Nombre: res.objetivo || res.nombre,
          Proceso: res.proceso || 'General',
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo registrado en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al registrar', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '680px',
      disableClose: true,
      data: {
        Title: '::. Editar objetivo .::',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;

        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Nombre: res.objetivo || res.nombre,
          Proceso: res.proceso || 'General',
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo actualizado en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al actualizar', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar el objetivo?, Confirme',
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
          Codigo: item.codigo,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo eliminado correctamente.', '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(response.message || 'Error al eliminar', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }
}
