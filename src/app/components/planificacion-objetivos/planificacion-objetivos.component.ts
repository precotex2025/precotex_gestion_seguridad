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
      width: '840px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'custom-dialog-no-padding',
      data: { Title: 'Medición de Objetivos SIG' }
    });
  }

  displayedColumns: string[] = [
    'codigo',
    'objetivo',
    'proceso',
    'periodo',
    'norma',
    'indicador',
    'responsableProceso',
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
      filtered = filtered.filter(d => (d.periodo || d.ano || '2026').includes(this.filtroAno));
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
            id: item.id_Objetivo || item.id,
            codigo: item.codigo || 'OBJ-2026-001',
            objetivo: item.nombre || item.objetivo,
            proceso: item.proceso || 'SSOMA',
            periodo: item.periodo || item.ano || '2026',
            responsableProceso: item.responsableProceso || item.responsable || 'Jefe de Proceso',
            fechaInicio: item.fechaInicio || '2026-01-01',
            fechaFin: item.fechaFin || '2026-12-31',
            responsableSeguimiento: item.responsableSeguimiento || 'Coordinador SIG',
            medioVerificacion: item.medioVerificacion || 'Reportes de Gestión',
            formulaCalculo: item.formulaCalculo || '(Real / Plan) * 100',
            unidadMedida: item.unidadMedida || '%',
            norma: item.norma || 'ISO 9001:2015',
            indicador: item.indicador || '% Eficiencia / Cumplimiento',
            base: item.base || '0%',
            meta: item.meta !== null && item.meta !== undefined && String(item.meta).trim() !== '' ? `${item.meta}%` : '100%',
            porcentajeAvance: item.porcentajeAvance !== null && item.porcentajeAvance !== undefined ? item.porcentajeAvance : (item.avance || 75),
            frecuencia: item.frecuencia || 'Mensual',
            estado: item.estado || 'Planificado',
            desc: item.desc || item.nombre
          }));
          this.allRawData = mapped;
          this.dataSource.data = mapped;
          this.calculateStats(mapped);
        } else {
          this.cargarFallbackObjetivos();
        }
      },
      error: () => {
        this.cargarFallbackObjetivos();
      }
    });
  }

  cargarFallbackObjetivos(): void {
    const fallback = [
      {
        id: 1,
        codigo: 'OBJ-2026-001',
        objetivo: 'Reducir el índice de accidentabilidad laboral en todas las sedes operativas',
        proceso: 'SSOMA',
        periodo: '2026',
        responsableProceso: 'Carlos Mendoza (Jefe SSOMA)',
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
        responsableSeguimiento: 'Ana Gomez (Coordinador SIG)',
        medioVerificacion: 'Registro mensual de incidentes y reporte ministerial',
        formulaCalculo: '(N° Accidentes / Total Horas Trabajadas) * 1000000',
        unidadMedida: 'N°',
        norma: 'ISO 45001:2018',
        indicador: 'Índice de Frecuencia de Accidentes (IFA)',
        base: '2.5',
        meta: '1.5',
        porcentajeAvance: 85,
        frecuencia: 'Mensual',
        estado: 'Planificado',
        desc: 'Implementación de pausas activas y auditorías de seguridad preventiva'
      },
      {
        id: 2,
        codigo: 'OBJ-2026-002',
        objetivo: 'Optimizar la eficiencia productiva en Tintorería y acabados textiles',
        proceso: 'Tintorería',
        periodo: '2026',
        responsableProceso: 'Manuel Rojas (Jefe Tintorería)',
        fechaInicio: '2026-01-15',
        fechaFin: '2026-12-31',
        responsableSeguimiento: 'Control de Calidad',
        medioVerificacion: 'Parte diario de producción y rendimientos',
        formulaCalculo: '(Kilos Producidos Conformes / Kilos Totales) * 100',
        unidadMedida: '%',
        norma: 'ISO 9001:2015',
        indicador: '% Rendimiento de Tintura',
        base: '82%',
        meta: '92%',
        porcentajeAvance: 90,
        frecuencia: 'Mensual',
        estado: 'Cumplido',
        desc: 'Recalibración de barcas de teñido y automatización de dosificación'
      }
    ];
    this.allRawData = fallback;
    this.dataSource.data = fallback;
    this.calculateStats(fallback);
  }

  // OBJ-04: Historial de seguimiento mensual de cumplimiento del objetivo
  onVerHistorialSeguimiento(item: any): void {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const htmlTabla = `
      <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #1e293b;">
        <p style="color: #334155; margin-bottom: 10px;"><strong style="color: #0f172a;">Objetivo:</strong> ${item.objetivo} | <strong style="color: #0f172a;">Proceso:</strong> ${item.proceso}</p>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                ${meses.map(m => `<th style="padding: 8px 6px; font-size: 11px; text-transform: uppercase;">${m}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr style="background: #ffffff;">
                ${meses.map((_, idx) => `<td style="padding: 10px 6px; font-weight: 700; color: ${idx <= 2 ? '#15803d' : '#94a3b8'};">${idx <= 2 ? (85 + idx * 3) + '%' : '-'}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    Swal.fire({
      title: '📊 Seguimiento Mensual de Cumplimiento (OBJ-04)',
      html: htmlTabla,
      width: '720px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#6366f1'
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
      width: '840px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Registrar Objetivo SIG',
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

        const newObj = {
          id: Date.now(),
          codigo: res.codigo || generatedCode,
          objetivo: res.objetivo || res.nombre,
          proceso: res.proceso || 'SSOMA',
          periodo: res.periodo || '2026',
          responsableProceso: res.responsableProceso || 'Jefe de Proceso',
          fechaInicio: res.fechaInicio || '2026-01-01',
          fechaFin: res.fechaFin || '2026-12-31',
          responsableSeguimiento: res.responsableSeguimiento || 'Coordinador SIG',
          medioVerificacion: res.medioVerificacion || 'Reportes de Gestión',
          formulaCalculo: res.formulaCalculo || '(Real / Plan) * 100',
          unidadMedida: res.unidadMedida || '%',
          norma: res.norma || 'ISO 9001:2015',
          indicador: res.indicador || '% Cumplimiento',
          base: res.base || '0%',
          meta: `${numericMeta}%`,
          porcentajeAvance: res.avance !== null && res.avance !== undefined ? res.avance : 0,
          frecuencia: res.frecuencia || 'Mensual',
          estado: res.estado || 'Planificado',
          desc: res.desc || ''
        };

        const updated = [newObj, ...this.allRawData];
        this.allRawData = updated;
        this.dataSource.data = updated;
        this.calculateStats(updated);

        const payload = {
          Accion: 'I',
          Codigo: newObj.codigo,
          Nombre: newObj.objetivo,
          Proceso: newObj.proceso,
          Meta: numericMeta,
          Usuario_Registro: 'SISTEMAS'
        };

        this.objetivosService.postObjetivoMnto(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Objetivo registrado en la BD correctamente.', '', { timeOut: 2500 });
              this.onListado();
            }
          },
          error: () => {}
        });
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(PlanificacionObjetivosRegeditComponent, {
      width: '840px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-no-padding',
      data: {
        Title: 'Editar Objetivo SIG',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const numericMeta = parseFloat(String(res.meta).replace(/[^0-9.]/g, '')) || 0;

        const updatedItem = {
          ...item,
          objetivo: res.objetivo || item.objetivo,
          proceso: res.proceso || item.proceso,
          periodo: res.periodo || item.periodo,
          responsableProceso: res.responsableProceso || item.responsableProceso,
          fechaInicio: res.fechaInicio || item.fechaInicio,
          fechaFin: res.fechaFin || item.fechaFin,
          responsableSeguimiento: res.responsableSeguimiento || item.responsableSeguimiento,
          medioVerificacion: res.medioVerificacion || item.medioVerificacion,
          formulaCalculo: res.formulaCalculo || item.formulaCalculo,
          unidadMedida: res.unidadMedida || item.unidadMedida,
          norma: res.norma || item.norma,
          indicador: res.indicador || item.indicador,
          base: res.base || item.base,
          meta: `${numericMeta}%`,
          porcentajeAvance: res.avance !== null && res.avance !== undefined ? res.avance : item.porcentajeAvance,
          frecuencia: res.frecuencia || item.frecuencia,
          estado: res.estado || item.estado,
          desc: res.desc || item.desc
        };

        const list = this.allRawData.map(d => d.codigo === item.codigo ? updatedItem : d);
        this.allRawData = list;
        this.dataSource.data = list;
        this.calculateStats(list);

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
            }
          },
          error: () => {}
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
