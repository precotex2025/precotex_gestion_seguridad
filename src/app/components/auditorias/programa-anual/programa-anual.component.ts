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

  isInRange(audit: any, monthIdx: number): boolean {
    const start = this.getStartMonthIndex(audit);
    const end = this.getEndMonthIndex(audit);
    if (start === -1) return false;
    return monthIdx >= start && monthIdx <= end;
  }

  isStartMonth(audit: any, monthIdx: number): boolean {
    return monthIdx === this.getStartMonthIndex(audit);
  }

  isEndMonth(audit: any, monthIdx: number): boolean {
    return monthIdx === this.getEndMonthIndex(audit);
  }

  calcularMensualCounts(): void {
    this.counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.auditorias.forEach(a => {
      const start = this.getStartMonthIndex(a);
      const end = this.getEndMonthIndex(a);
      if (start >= 0 && start < 12) {
        for (let m = start; m <= Math.min(end, 11); m++) {
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
