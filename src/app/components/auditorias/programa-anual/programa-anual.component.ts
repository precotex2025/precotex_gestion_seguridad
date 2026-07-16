import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-programa-anual',
  standalone: false,
  templateUrl: './programa-anual.component.html',
  styleUrl: './programa-anual.component.css'
})
export class ProgramaAnualComponent implements OnInit {
  storageKey = 'precotex_auditorias';
  auditorias: any[] = [];
  meses: string[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  counts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  ngOnInit(): void {
    this.cargarAuditorias();
  }

  cargarAuditorias(): void {
    const local = localStorage.getItem(this.storageKey);
    if (local) {
      this.auditorias = JSON.parse(local);
    }
    this.calcularMensualCounts();
  }

  calcularMensualCounts(): void {
    this.counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.auditorias.forEach(a => {
      const monthIdx = this.getMesIndex(a.inicio);
      if (monthIdx >= 0 && monthIdx < 12) {
        this.counts[monthIdx]++;
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

  getEstadoClass(estado: string): string {
    if (!estado) return 'programada';
    const s = estado.toLowerCase().trim();
    if (s.includes('realizada') && !s.includes('no')) return 'realizada';
    if (s.includes('programada')) return 'programada';
    if (s.includes('no realizada')) return 'no-realizada';
    return 'programada';
  }
}
