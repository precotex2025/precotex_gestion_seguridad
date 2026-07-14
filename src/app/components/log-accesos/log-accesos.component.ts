import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export interface LogAccesoRegistro {
  fechaHora: string;
  usuario: string;
  puesto: string;
}

@Component({
  selector: 'app-log-accesos',
  standalone: false,
  templateUrl: './log-accesos.component.html',
  styleUrls: ['./log-accesos.component.css']
})
export class LogAccesosComponent implements OnInit {

  // Mock database of logs
  allLogs: LogAccesoRegistro[] = [
    // Page 1 data from mockup
    { fechaHora: '2026-03-12 12:19:12', usuario: 'Hans Flores', puesto: 'Jefe de Soporte' },
    { fechaHora: '2026-03-12 12:17:41', usuario: 'José Luis Elias', puesto: 'Jefe SSOMA' },
    { fechaHora: '2026-03-12 12:01:50', usuario: 'José Luis Elias', puesto: 'Jefe SSOMA' },
    { fechaHora: '2026-03-12 11:54:57', usuario: 'Hans Flores', puesto: 'Jefe de Soporte' },
    { fechaHora: '2026-03-12 11:53:14', usuario: 'Hans Flores', puesto: 'Jefe de Soporte' },
    { fechaHora: '2026-03-12 10:01:29', usuario: 'José Luis Elias', puesto: 'Jefe SSOMA' },
    { fechaHora: '2026-03-12 08:58:04', usuario: 'José Luis Elias', puesto: 'Jefe SSOMA' },
    { fechaHora: '2026-03-11 09:20:24', usuario: 'Miguel Angel Rojas Veliz', puesto: 'Asistente de Gerencia de Estampado' },
    { fechaHora: '2026-03-09 18:10:44', usuario: 'Ismael Cruz', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-04 14:21:55', usuario: 'admin', puesto: 'SIN ASIGNAR' },
    { fechaHora: '2026-03-04 14:12:43', usuario: 'Cesar Rivera', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-04 14:07:28', usuario: 'Cesar Rivera', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-04 14:03:28', usuario: 'Jordan Pinedo', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-04 11:32:15', usuario: 'admin', puesto: 'SIN ASIGNAR' },
    { fechaHora: '2026-03-04 09:45:00', usuario: 'Hans Flores', puesto: 'Jefe de Soporte' },

    // Page 2 data
    { fechaHora: '2026-03-03 17:30:11', usuario: 'Jordan Pinedo', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-03 16:15:22', usuario: 'Cesar Rivera', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-03 14:10:05', usuario: 'Ismael Cruz', puesto: 'Analista OYM' },
    { fechaHora: '2026-03-02 11:58:04', usuario: 'Rommel Solis', puesto: 'Gerente Adjunto' },
    { fechaHora: '2026-03-02 09:22:15', usuario: 'José Luis Elias', puesto: 'Jefe SSOMA' },
    { fechaHora: '2026-03-02 08:14:30', usuario: 'Hans Flores', puesto: 'Jefe de Soporte' },
    { fechaHora: '2026-02-28 15:44:00', usuario: 'admin', puesto: 'SIN ASIGNAR' },
    { fechaHora: '2026-02-28 10:20:12', usuario: 'Sayda Huaranga', puesto: 'Acabado e inspección' },
    { fechaHora: '2026-02-27 16:05:44', usuario: 'Vanesa Arriaga', puesto: 'Asistente de Costura' },
    { fechaHora: '2026-02-27 11:30:19', usuario: 'Teresa Villalva', puesto: 'Gerencia de Auditoria Interna' },
    { fechaHora: '2026-02-26 14:15:00', usuario: 'Alan Torres', puesto: 'Jefe de Exportaciones' },
    { fechaHora: '2026-02-26 09:00:22', usuario: 'Hans Flores', puesto: 'Jefe de Soporte' },
    { fechaHora: '2026-02-25 16:45:10', usuario: 'Rodolfo Gerstein', puesto: 'Gerente de Gestión Humana' },
    { fechaHora: '2026-02-25 10:30:00', usuario: 'Ricardo Muñante', puesto: 'JEFE DE PLANEAMIENTO Y CONTROL DE LA PRODUCCIÓN' },
    { fechaHora: '2026-02-24 14:20:15', usuario: 'Ricardo Diaz', puesto: 'Gerente DDP, Manufactura y Gestión Comercial' }
  ];

  // For filters
  personasUnicas: string[] = [];
  filtroPersona: string = 'Selecciona';
  filtroDesde: string = '';
  filtroHasta: string = '';

  // Pagination details
  filteredLogs: LogAccesoRegistro[] = [];
  displayedLogs: LogAccesoRegistro[] = [];
  
  totalRecords = 1038; // Mock database total records
  pageSize = 15;
  currentPage = 1;
  totalPages = 42;
  pages: number[] = [];

  constructor(private toastr: ToastrService) { }

  ngOnInit(): void {
    // Populate dropdown with unique names
    const names = this.allLogs.map(l => l.usuario).filter(n => n && n.toLowerCase() !== 'admin');
    this.personasUnicas = ['Selecciona', ...Array.from(new Set(names))];
    
    // Generate page list
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    this.filtrarDatos();
  }

  onFiltrar(): void {
    this.currentPage = 1;
    this.filtrarDatos();
    this.toastr.success('Filtros aplicados correctamente.', 'Búsqueda');
  }

  filtrarDatos(): void {
    let result = [...this.allLogs];

    // Filter by person
    if (this.filtroPersona && this.filtroPersona !== 'Selecciona') {
      result = result.filter(l => l.usuario === this.filtroPersona);
    }

    // Filter by Desde (fecha)
    if (this.filtroDesde) {
      result = result.filter(l => l.fechaHora >= this.filtroDesde);
    }

    // Filter by Hasta (fecha)
    if (this.filtroHasta) {
      result = result.filter(l => l.fechaHora <= this.filtroHasta + ' 23:59:59');
    }

    this.filteredLogs = result;
    
    // If filtering matches, update total records count dynamically, or default to mock
    if (this.filtroPersona !== 'Selecciona' || this.filtroDesde || this.filtroHasta) {
      this.totalRecords = this.filteredLogs.length;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      this.totalRecords = 1038; // Keep mock 1038 if no filters
      this.totalPages = 42;
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    this.updateDisplayedPage();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateDisplayedPage();
  }

  updateDisplayedPage(): void {
    // If we're displaying mock records for 1038 total items, we simulate pages 3-42 with generated data
    if (this.currentPage === 1 && this.filtroPersona === 'Selecciona' && !this.filtroDesde && !this.filtroHasta) {
      this.displayedLogs = this.allLogs.slice(0, 15);
    } else if (this.currentPage === 2 && this.filtroPersona === 'Selecciona' && !this.filtroDesde && !this.filtroHasta) {
      this.displayedLogs = this.allLogs.slice(15, 30);
    } else {
      // Generate some dummy logs relative to the current page and filters to make the pagination feel alive
      const startIdx = (this.currentPage - 1) * this.pageSize;
      
      if (this.filteredLogs.length > startIdx) {
        this.displayedLogs = this.filteredLogs.slice(startIdx, startIdx + this.pageSize);
      } else {
        // Generate simulated logs for higher pages
        this.displayedLogs = this.generateSimulatedLogs(this.currentPage);
      }
    }
  }

  generateSimulatedLogs(page: number): LogAccesoRegistro[] {
    const users = ['Hans Flores', 'José Luis Elias', 'Miguel Angel Rojas Veliz', 'Ismael Cruz', 'Cesar Rivera', 'Jordan Pinedo'];
    const puestos = {
      'Hans Flores': 'Jefe de Soporte',
      'José Luis Elias': 'Jefe SSOMA',
      'Miguel Angel Rojas Veliz': 'Asistente de Gerencia de Estampado',
      'Ismael Cruz': 'Analista OYM',
      'Cesar Rivera': 'Analista OYM',
      'Jordan Pinedo': 'Analista OYM'
    };

    const simulatedList: LogAccesoRegistro[] = [];
    const baseDay = 12 - Math.floor(page / 3);
    const dayString = String(baseDay > 0 ? baseDay : 1).padStart(2, '0');

    for (let i = 0; i < 15; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const hour = String(17 - Math.floor(i / 2)).padStart(2, '0');
      const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');

      simulatedList.push({
        fechaHora: `2026-03-${dayString} ${hour}:${min}:${sec}`,
        usuario: user,
        puesto: puestos[user as keyof typeof puestos]
      });
    }

    return simulatedList;
  }
}
