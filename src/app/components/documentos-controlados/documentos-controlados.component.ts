import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit/documentos-controlados-regedit.component';
import { ProcesosService } from '../../services/procesos.service';
import { DocumentosControladosService } from '../../services/documentos-controlados.service';
import { GlobalVariable } from '../../VarGlobals';

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
  sUsuario: string = GlobalVariable.vusu || 'SISTEMAS';

  PROCESOS_GROUPS: { [key: string]: string[] } = {};

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
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private documentosControladosService: DocumentosControladosService
  ) {}

  procesosMap: { [name: string]: string } = {};
  codeToProcessMap: { [code: string]: string } = {};

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('precotex:documentacion');
    }
    this.loadDocs();
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.PROCESOS_GROUPS = groups;
      }
    });

    this.procesosService.getListadoProcesos('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          res.elements.forEach((p: any) => {
            const name = (p.proceso || p.nombre_Proceso || p.denominacion || '').trim();
            const code = (p.codigo_Proceso || p.codigoProceso || '').toString().trim();
            if (name && code) {
              this.procesosMap[name.toLowerCase()] = code;
              this.codeToProcessMap[code] = name;
              this.codeToProcessMap[code.padStart(3, '0')] = name;
              this.codeToProcessMap[parseInt(code, 10).toString()] = name;
            }
          });
          this.loadDocs();
        }
      }
    });
  }

  getProcessCodeByName(procName: string): string {
    if (!procName) return '011';
    const key = procName.trim().toLowerCase();
    return this.procesosMap[key] || '011';
  }

  getProcessNameByCode(code: any): string {
    if (!code) return 'Organización y Métodos';
    const strCode = code.toString().trim();
    return this.codeToProcessMap[strCode] || this.codeToProcessMap[strCode.padStart(3, '0')] || 'Organización y Métodos';
  }

  loadDocs() {
    this.documentosControladosService.getListadoDocumentosControlados('001', '001', '', '').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          this.docsList = res.elements.map((d: any) => ({
            codigo_Documentos_Controlados: d.codigo_Documentos_Controlados,
            nombre: d.denominacion,
            codigo: d.codigo_Documento || d.codigo_Documentos_Controlados,
            tipo: d.codigo_Normas || 'Procedimiento',
            version: d.version_Documento || 'v1.0',
            formato: d.codigo_Tipo_Descarga || 'PDF',
            proceso: d.nombre_Proceso || this.getProcessNameByCode(d.codigo_Proceso),
            vig: d.fec_Vencimiento ? d.fec_Vencimiento.split('T')[0] : (d.fec_Registro ? d.fec_Registro.split('T')[0] : ''),
            estado: d.flg_Estado || 'Vigente',
            archivo: d.ruta_Adjunto || d.codigo_Documento,
            raw: d
          }));
        } else {
          this.docsList = [];
        }
      },
      error: () => {
        this.docsList = [];
      }
    });
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
        const procCode = this.getProcessCodeByName(res.proceso);
        const requestData = {
          Accion: 'I',
          Codigo_Documentos_Controlados: '',
          Codigo_Proceso: procCode,
          Codigo_Carpeta_Control: '001',
          Codigo_Normas: res.tipo || 'Procedimiento',
          Codigo_Tiempo_Conservacion: '1 Anio',
          Codigo_Tipo_Descarga: res.formato || 'PDF',
          Denominacion: res.nombre || '',
          Codigo_Documento: res.codigo || '',
          Version_Documento: res.version || 'v1.0',
          Ruta_Adjunto: res.archivo || '',
          Descripcion: res.nombre || '',
          bRegistroAsociado: true,
          bRequiereRevision: false,
          Flg_Estado: res.estado || 'Vigente',
          Fec_Vencimiento: res.vig || '',
          Flg_Activo: true,
          Cod_Usuario: this.sUsuario
        };

        this.documentosControladosService.postProcesoMnto(requestData).subscribe({
          next: () => {
            this.loadDocs();
            this.toastr.success('Documento guardado en la BD con éxito', 'Éxito');
          },
          error: () => {
            this.docsList.push(res);
            this.saveDocs();
            this.toastr.success('Documento registrado localmente', 'Éxito');
          }
        });
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
      if (res) {
        const procCode = this.getProcessCodeByName(res.proceso);
        const requestData = {
          Accion: 'U',
          Codigo_Documentos_Controlados: doc.codigo_Documentos_Controlados || doc.codigo || '001',
          Codigo_Proceso: procCode,
          Codigo_Carpeta_Control: '001',
          Codigo_Normas: res.tipo || 'Procedimiento',
          Codigo_Tiempo_Conservacion: '1 Anio',
          Codigo_Tipo_Descarga: res.formato || 'PDF',
          Denominacion: res.nombre || '',
          Codigo_Documento: res.codigo || '',
          Version_Documento: res.version || 'v1.0',
          Ruta_Adjunto: res.archivo || '',
          Descripcion: res.nombre || '',
          bRegistroAsociado: true,
          bRequiereRevision: false,
          Flg_Estado: res.estado || 'Vigente',
          Fec_Vencimiento: res.vig || '',
          Flg_Activo: true,
          Cod_Usuario: this.sUsuario
        };

        this.documentosControladosService.postProcesoMnto(requestData).subscribe({
          next: () => {
            this.loadDocs();
            this.toastr.success('Documento actualizado en la BD con éxito', 'Éxito');
          },
          error: () => {
            if (mainIdx !== -1) {
              this.docsList[mainIdx] = res;
              this.saveDocs();
            }
            this.toastr.success('Documento actualizado', 'Éxito');
          }
        });
      }
    });
  }

  onEliminar(doc: any) {
    if (confirm('¿Eliminar este registro?')) {
      const procCode = this.getProcessCodeByName(doc.proceso);
      const requestData = {
        Accion: 'D',
        Codigo_Documentos_Controlados: doc.codigo_Documentos_Controlados || doc.codigo || '001',
        Codigo_Proceso: procCode,
        Codigo_Carpeta_Control: '001',
        Codigo_Normas: doc.tipo || 'Procedimiento',
        Codigo_Tiempo_Conservacion: '1 Anio',
        Codigo_Tipo_Descarga: doc.formato || 'PDF',
        Denominacion: doc.nombre || '',
        Codigo_Documento: doc.codigo || '',
        Version_Documento: doc.version || 'v1.0',
        Ruta_Adjunto: doc.archivo || '',
        Descripcion: doc.nombre || '',
        bRegistroAsociado: true,
        bRequiereRevision: false,
        Flg_Estado: doc.estado || 'Vigente',
        Flg_Activo: false,
        Cod_Usuario: this.sUsuario
      };

      this.documentosControladosService.postProcesoMnto(requestData).subscribe({
        next: () => {
          this.loadDocs();
          this.toastr.success('Registro eliminado de la BD', 'Éxito');
        },
        error: () => {
          this.docsList = this.docsList.filter(d => d.codigo !== doc.codigo);
          this.saveDocs();
          this.toastr.success('Registro eliminado', 'Éxito');
        }
      });
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
    const fileName = doc.archivo || doc.codigo;
    if (fileName) {
      const url = this.documentosControladosService.getDownloadUrl(fileName);
      window.open(url, '_blank');
      this.toastr.success(`Descargando: ${fileName}`, 'Descargar');
    } else {
      this.toastr.warning('El registro no tiene un archivo adjunto.', 'Descargar');
    }
  }
}
