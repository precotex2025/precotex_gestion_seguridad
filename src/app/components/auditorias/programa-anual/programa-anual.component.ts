import { Component, OnInit } from '@angular/core';
import { AuditoriasService } from '../../../services/auditorias.service';

@Component({
  selector: 'app-programa-anual',
  standalone: false,
  templateUrl: './programa-anual.component.html',
  styleUrl: './programa-anual.component.css'
})
export class ProgramaAnualComponent implements OnInit {
  auditorias: any[] = [];
  meses: string[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  counts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  mostrarBanner: boolean = false;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  getGanttTooltip(audit: any): string {
    const resp = audit.responsable || 'Sin asignar';
    const norma = audit.norma || 'General';
    const dates = (audit.inicio || '—') + ' al ' + (audit.fin || '—');
    const estado = audit.estado || 'Programada';
    return `Responsable: ${resp} • ${norma} • ${estado} (${dates})`;
  }

  constructor(private auditoriasService: AuditoriasService) {}

  ngOnInit(): void {
    this.cargarAuditorias();
  }

  cargarAuditorias(): void {
    this.auditoriasService.getListadoAuditorias('').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.auditorias = res.elements.map((d: any) => ({
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
          this.calcularMensualCounts();
        } else {
          this.auditorias = [];
          this.counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
      },
      error: () => {
        this.auditorias = [];
        this.counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
    });
  }

  baseYear: number = 2025;
  selectedYear: number = 2026;

  get availableYears(): number[] {
    return [this.baseYear, this.baseYear + 1, this.baseYear + 2, this.baseYear + 3];
  }

  setYear(year: number): void {
    this.selectedYear = year;
    this.calcularMensualCounts();
  }

  previousYearsBlock(): void {
    this.baseYear -= 4;
    if (this.selectedYear < this.baseYear || this.selectedYear > this.baseYear + 3) {
      this.selectedYear = this.baseYear + 3;
    }
    this.calcularMensualCounts();
  }

  nextYearsBlock(): void {
    this.baseYear += 4;
    if (this.selectedYear < this.baseYear || this.selectedYear > this.baseYear + 3) {
      this.selectedYear = this.baseYear;
    }
    this.calcularMensualCounts();
  }

  getFechaYear(fechaStr: string): number {
    if (!fechaStr) return -1;
    const parts = fechaStr.split('-');
    if (parts.length >= 1 && parts[0].length === 4) {
      return parseInt(parts[0], 10);
    }
    return -1;
  }

  getStartYear(audit: any): number {
    return this.getFechaYear(audit.inicio);
  }

  getEndYear(audit: any): number {
    const endY = this.getFechaYear(audit.fin);
    return endY !== -1 ? endY : this.getStartYear(audit);
  }

  getMesIndex(fechaStr: string): number {
    if (!fechaStr) return -1;
    const parts = fechaStr.split('-');
    if (parts.length >= 2) {
      return parseInt(parts[1], 10) - 1;
    }
    return -1;
  }

  getStartMonthIndex(audit: any): number {
    return this.getMesIndex(audit.inicio);
  }

  getEndMonthIndex(audit: any): number {
    const start = this.getStartMonthIndex(audit);
    const end = this.getMesIndex(audit.fin);
    if (end === -1 || end < start) {
      return start;
    }
    return end;
  }

  get filteredAuditorias(): any[] {
    return this.auditorias.filter(audit => {
      const startY = this.getStartYear(audit);
      const endY = this.getEndYear(audit);
      if (startY === -1) return true; // Si no tiene fecha, mostrar para no ocultarla
      return startY === this.selectedYear || endY === this.selectedYear || (startY <= this.selectedYear && endY >= this.selectedYear);
    });
  }

  isInRange(audit: any, monthIdx: number): boolean {
    const startY = this.getStartYear(audit);
    const endY = this.getEndYear(audit);
    const startM = this.getStartMonthIndex(audit);
    const endM = this.getEndMonthIndex(audit);

    if (startY === -1 || startM === -1) return false;

    const startAbs = startY * 12 + startM;
    const endAbs = (endY !== -1 ? endY : startY) * 12 + (endM !== -1 ? endM : startM);
    const currentCellAbs = this.selectedYear * 12 + monthIdx;

    return currentCellAbs >= startAbs && currentCellAbs <= endAbs;
  }

  isStartMonth(audit: any, monthIdx: number): boolean {
    const startY = this.getStartYear(audit);
    const startM = this.getStartMonthIndex(audit);
    return startY === this.selectedYear && monthIdx === startM;
  }

  isEndMonth(audit: any, monthIdx: number): boolean {
    const endY = this.getEndYear(audit);
    const endM = this.getEndMonthIndex(audit);
    return (endY === this.selectedYear || (endY === -1 && this.getStartYear(audit) === this.selectedYear)) && monthIdx === endM;
  }

  calcularMensualCounts(): void {
    this.counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.filteredAuditorias.forEach(a => {
      for (let m = 0; m < 12; m++) {
        if (this.isInRange(a, m)) {
          this.counts[m]++;
        }
      }
    });
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'programada';
    const s = estado.toLowerCase().trim();
    if (s.includes('realizada') && !s.includes('no')) return 'realizada';
    if (s.includes('programada')) return 'programada';
    if (s.includes('no realizada')) return 'no-realizada';
    return 'programada';
  }
}
