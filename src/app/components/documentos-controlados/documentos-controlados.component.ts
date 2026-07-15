import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit/documentos-controlados-regedit.component';

@Component({
  selector: 'app-documentos-controlados',
  standalone: false,
  templateUrl: './documentos-controlados.component.html',
  styleUrl: './documentos-controlados.component.css'
})
export class DocumentosControladosComponent implements OnInit {
  docsList: any[] = [];
  activeFilter: string = '__all__';
  searchQuery: string = '';

  PROCESOS_GROUPS: { [key: string]: string[] } = {
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

  defaultDocs = [
    { nombre: 'Procedimiento de Gestión de ACR y Mejora', codigo: 'PRO-IMC-OYM-003', tipo: 'Procedimiento', version: 'v2.1', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2026-06-10', estado: 'Vigente', archivo: 'PRO-IMC-OYM-003.pdf' },
    { nombre: 'Instructivo de Uso de Formato 5W-2H', codigo: 'INS-IMC-OYM-002', tipo: 'Instructivo', version: 'v1.2', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2026-01-15', estado: 'Vigente', archivo: 'INS-IMC-OYM-002.pdf' },
    { nombre: 'Manual de Organización y Funciones — O&M', codigo: 'MAN-IMC-OYM-001', tipo: 'Manual', version: 'v5.2', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2026-05-02', estado: 'Vigente', archivo: 'MAN-IMC-OYM-001.pdf' },
    { nombre: 'Perfil de Puesto — Analista O&M', codigo: 'PER-IMC-OYM-004', tipo: 'Perfil de puesto', version: 'v1.1', formato: 'PDF', proceso: 'Organización y Métodos', vig: '2025-06-30', estado: 'Por vencer', archivo: 'PER-IMC-OYM-004.pdf' },
    { nombre: 'Procedimiento de Control Patrimonial', codigo: 'PRO-SOP-CTP-002', tipo: 'Procedimiento', version: 'v1.0', formato: 'PDF', proceso: 'Control Patrimonial', vig: '2026-03-01', estado: 'Vigente', archivo: 'PRO-SOP-CTP-002.pdf' },
    { nombre: 'Plan Anual de Auditorías Internas', codigo: 'PLN-AIO-001', tipo: 'Formato', version: 'v2.0', formato: 'Excel', proceso: 'Auditoría Interna', vig: '2025-08-15', estado: 'Por vencer', archivo: 'PLN-AIO-001.xlsx' }
  ];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDocs();
  }

  loadDocs() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('precotex:documentacion');
      if (stored) {
        try {
          this.docsList = JSON.parse(stored);
          return;
        } catch (e) {}
      }
      this.docsList = [...this.defaultDocs];
      this.saveDocs();
    }
  }

  saveDocs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('precotex:documentacion', JSON.stringify(this.docsList));
    }
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  getMacroCount(group: string): number {
    const processes = this.PROCESOS_GROUPS[group] || [];
    return this.docsList.filter(d => processes.includes(d.proceso)).length;
  }

  getProcessCount(proc: string): number {
    return this.docsList.filter(d => d.proceso === proc).length;
  }

  setFilter(filterValue: string) {
    this.activeFilter = filterValue;
  }

  get filteredDocs() {
    let list = this.docsList;
    if (this.activeFilter !== '__all__') {
      if (this.activeFilter.startsWith('macro:')) {
        const macro = this.activeFilter.substring(6);
        const processes = this.PROCESOS_GROUPS[macro] || [];
        list = list.filter(d => processes.includes(d.proceso));
      } else {
        list = list.filter(d => d.proceso === this.activeFilter);
      }
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d =>
        (d.nombre || '').toLowerCase().includes(q) ||
        (d.codigo || '').toLowerCase().includes(q) ||
        (d.tipo || '').toLowerCase().includes(q) ||
        (d.version || '').toLowerCase().includes(q) ||
        (d.formato || '').toLowerCase().includes(q) ||
        (d.proceso || '').toLowerCase().includes(q) ||
        (d.vig || '').toLowerCase().includes(q) ||
        (d.estado || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  getStatCount(status: string): number {
    if (status === 'Total') {
      return this.docsList.length;
    }
    return this.docsList.filter(d => d.estado === status).length;
  }

  onAgregar() {
    let dialogRef = this.dialog.open(DocumentosControladosRegeditComponent, {
      width: '550px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        Title: "Nuevo registro",
        Accion: "I",
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.docsList.push(res);
        this.saveDocs();
        this.toastr.success('Documento registrado con éxito', 'Éxito');
      }
    });
  }

  onEditar(doc: any, index: number) {
    const mainIdx = this.docsList.findIndex(d => d.codigo === doc.codigo);
    
    let dialogRef = this.dialog.open(DocumentosControladosRegeditComponent, {
      width: '550px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        Title: "Editando registro",
        Accion: "E",
        Datos: doc
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && mainIdx !== -1) {
        this.docsList[mainIdx] = res;
        this.saveDocs();
        this.toastr.success('Documento actualizado con éxito', 'Éxito');
      }
    });
  }

  onEliminar(doc: any) {
    if (confirm('¿Eliminar este registro?')) {
      this.docsList = this.docsList.filter(d => d.codigo !== doc.codigo);
      this.saveDocs();
      this.toastr.success('Registro eliminado', 'Éxito');
    }
  }

  onCargarLote() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
          this.docsList.push({
            nombre: file.name.substring(0, file.name.lastIndexOf('.')),
            codigo: 'LOTE-' + Math.floor(1000 + Math.random() * 9000),
            tipo: 'Procedimiento',
            version: 'v1.0',
            formato: ext === 'XLSX' || ext === 'XLS' ? 'Excel' : ext === 'DOC' || ext === 'DOCX' ? 'Word' : 'PDF',
            proceso: 'Sistemas',
            vig: new Date().toISOString().split('T')[0],
            estado: 'Vigente',
            archivo: file.name
          });
        }
        this.saveDocs();
        this.toastr.success(files.length + ' documento(s) cargado(s)', 'Éxito');
      }
    };
    input.click();
  }

  exportExcel() {
    let t = '<table border="1"><tr><th>Nombre del documento</th><th>Código</th><th>Tipo</th><th>Versión</th><th>Formato</th><th>Proceso</th><th>Vigencia</th><th>Estado</th></tr>';
    this.filteredDocs.forEach(d => {
      t += `<tr>
        <td>${d.nombre || ''}</td>
        <td>${d.codigo || ''}</td>
        <td>${d.tipo || ''}</td>
        <td>${d.version || ''}</td>
        <td>${d.formato || ''}</td>
        <td>${d.proceso || ''}</td>
        <td>${d.vig || ''}</td>
        <td>${d.estado || ''}</td>
      </tr>`;
    });
    t += '</table>';
    const blob = new Blob(['\ufeff' + t], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'documentacion_precotex.xls';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Excel exportado', 'Éxito');
  }

  exportPDF() {
    this.toastr.info('Generando reporte PDF...', 'PDF');
    window.print();
  }

  downloadFile(doc: any) {
    this.toastr.success(`Descargando archivo: ${doc.archivo || doc.codigo + '.' + doc.formato.toLowerCase()}`, 'Descargar');
  }
}
