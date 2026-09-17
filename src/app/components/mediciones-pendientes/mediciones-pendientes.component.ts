import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MedicionObjetivosRegeditComponent } from '../planificacion-objetivos/medicion-objetivos-regedit/medicion-objetivos-regedit.component';
import { AnalyticsDetalleComponent } from '../analytics/analytics-detalle/analytics-detalle.component';

const STORAGE_KEY = 'precotex_mediciones_obj';

@Component({
  selector: 'app-mediciones-pendientes',
  standalone: false,
  templateUrl: './mediciones-pendientes.component.html',
  styleUrls: ['./mediciones-pendientes.component.css']
})
export class MedicionesPendientesComponent implements OnInit {

  stats = {
    total: 0,
    enMeta: 0,
    enRiesgo: 0,
    criticos: 0
  };

  displayedColumns: string[] = [
    'objetivo',
    'indicador',
    'proceso',
    'responsableSeguimiento',
    'frecuencia',
    'meta',
    'valor',
    'avance',
    'semaforo',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>();

  private readonly seedData = [
    {
      id: 'MOB-001',
      codigoObjetivo: 'OBJ-2026-001',
      objetivo: 'Reducir el índice de accidentabilidad laboral en todas las sedes operativas',
      indicador: 'Índice de Frecuencia de Accidentes (IFA)',
      proceso: 'SSOMA',
      responsableSeguimiento: 'Ana Gómez (Coordinador SIG)',
      frecuencia: 'Mensual',
      meta: '1.5',
      valor: '1.2',
      avance: 95,
      periodo: '2026-Q1',
      semaforo: 'En meta',
      evidencia: 'Reporte_Mensual_Accidentabilidad_SSOMA.pdf',
      obs: 'Cumplimiento adecuado tras capacitaciones preventivas'
    },
    {
      id: 'MOB-002',
      codigoObjetivo: 'OBJ-2026-002',
      objetivo: 'Optimizar la eficiencia productiva en Tintorería y acabados textiles',
      indicador: '% Rendimiento de Tintura',
      proceso: 'Tintorería',
      responsableSeguimiento: 'Manuel Rojas (Jefe Producción)',
      frecuencia: 'Mensual',
      meta: '92%',
      valor: '88%',
      avance: 85,
      periodo: '2026-Q1',
      semaforo: 'En riesgo',
      evidencia: 'Informe_Eficiencia_Tintoreria_Marzo.xlsx',
      obs: 'Requiere ajuste en temperatura de teñido'
    },
    {
      id: 'MOB-003',
      codigoObjetivo: 'OBJ-2026-003',
      objetivo: 'Cumplimiento del programa anual de auditorías internas del SIG',
      indicador: '% Avance del Programa de Auditorías',
      proceso: 'Gestión de Calidad',
      responsableSeguimiento: 'Carlos Mendoza (Auditor Líder)',
      frecuencia: 'Trimestral',
      meta: '95%',
      valor: '98%',
      avance: 100,
      periodo: '2026-Q1',
      semaforo: 'En meta',
      evidencia: 'Acta_Cierre_Auditorias_Q1.pdf',
      obs: 'Auditorías cerradas sin observaciones críticas'
    }
  ];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.onListado();
  }

  onListado(): void {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const data = JSON.parse(local).map((item: any) => ({
        ...item,
        indicador: item.indicador || '% Eficiencia / Cumplimiento',
        responsableSeguimiento: item.responsableSeguimiento || item.responsable || 'Coordinador SIG',
        avance: item.avance !== null && item.avance !== undefined ? item.avance : this.calcularAvanceAuto(item.valor, item.meta)
      }));
      this.dataSource.data = data;
      this.calculateStats(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.seedData));
      this.dataSource.data = this.seedData;
      this.calculateStats(this.seedData);
    }
  }

  calcularAvanceAuto(valor: any, meta: any): number {
    const valNum = parseFloat(String(valor || '').replace(/[^0-9.]/g, '')) || 0;
    const metaNum = parseFloat(String(meta || '').replace(/[^0-9.]/g, '')) || 100;
    if (metaNum <= 0) return 80;
    const pct = Math.round((valNum / metaNum) * 100);
    return Math.min(Math.max(pct, 0), 100);
  }

  calculateStats(data: any[]): void {
    this.stats = {
      total: data.length,
      enMeta: data.filter(d => d.semaforo === 'En meta').length,
      enRiesgo: data.filter(d => d.semaforo === 'En riesgo').length,
      criticos: data.filter(d => d.semaforo === 'Crítico').length
    };
  }

  getSemaforoClass(semaforo: string): string {
    if (!semaforo) return 'pendiente';
    const s = semaforo.toLowerCase().trim();
    if (s.includes('meta')) return 'completada';
    if (s.includes('riesgo')) return 'en-ejecucion';
    if (s.includes('crítico') || s.includes('critico')) return 'vencida';
    return 'pendiente';
  }

  getSemaforoColor(semaforo: string): string {
    if (!semaforo) return '#94a3b8';
    const s = semaforo.toLowerCase().trim();
    if (s.includes('meta')) return '#3ecf8e';
    if (s.includes('riesgo')) return '#f0b429';
    if (s.includes('crítico') || s.includes('critico')) return '#f0576b';
    return '#94a3b8';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(MedicionObjetivosRegeditComponent, {
      width: '920px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-no-padding',
      disableClose: true,
      data: {
        Title: 'Registrar Medición de Objetivo',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const local = localStorage.getItem(STORAGE_KEY);
        const data = local ? JSON.parse(local) : [];
        const newRecord = {
          id: 'MOB-' + Date.now(),
          ...res
        };
        data.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.toastr.success('Medición guardada correctamente.', '', { timeOut: 2500 });
        this.onListado();
      }
    });
  }

  onEditar(item: any): void {
    const dialogRef = this.dialog.open(MedicionObjetivosRegeditComponent, {
      width: '920px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-no-padding',
      disableClose: true,
      data: {
        Title: 'Editar Medición de Objetivo',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          let data = JSON.parse(local);
          data = data.map((d: any) => d.id === item.id ? { id: item.id, ...res } : d);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Medición actualizada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }

  onVerDetalle(item: any): void {
    this.dialog.open(AnalyticsDetalleComponent, {
      width: '1050px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: false,
      data: {
        indicador: {
          id: undefined,
          idIndicador: undefined,
          esObjetivo: true,
          codigo: item.codigoObjetivo || item.codigo || 'OBJ-2026-001',
          nombre: item.indicador || item.objetivo,
          objetivo: item.objetivo,
          proceso: item.proceso || 'SSOMA',
          frecuencia: item.frecuencia || 'Mensual',
          meta: parseFloat(String(item.meta || '90').replace(/[^0-9.]/g, '')) || 90,
          norma: item.norma || 'ISO 9001:2015',
          estado: 'Activo'
        }
      }
    });
  }

  onEliminar(item: any): void {
    Swal.fire({
      title: '¿Desea eliminar la medición?, Confirme',
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
          data = data.filter((d: any) => d.id !== item.id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          this.toastr.success('Medición eliminada correctamente.', '', { timeOut: 2500 });
          this.onListado();
        }
      }
    });
  }
}
