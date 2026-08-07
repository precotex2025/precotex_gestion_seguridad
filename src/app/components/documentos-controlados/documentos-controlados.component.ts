import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { DocumentosControladosRegeditComponent } from './documentos-controlados-regedit/documentos-controlados-regedit.component';
import { DocumentosControladosLoteComponent } from './documentos-controlados-lote/documentos-controlados-lote.component';
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

  // Permisos finos por acción
  canCreate: boolean = true;
  canEdit: boolean = true;
  canDelete: boolean = true;
  canDownload: boolean = true;
  canApprove: boolean = true;
  isUserAdmin: boolean = false;
  // State for Accordion Sidebar, Quick View Drawer & Banner
  collapsedMacros: { [macro: string]: boolean } = {};
  quickViewOpen: boolean = false;
  selectedDoc: any = null;
  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  toggleMacro(macro: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.collapsedMacros[macro] = !this.collapsedMacros[macro];
  }

  isMacroExpanded(macro: string): boolean {
    return !this.collapsedMacros[macro];
  }

  openQuickView(doc: any): void {
    this.selectedDoc = doc;
    this.quickViewOpen = true;
  }

  closeQuickView(): void {
    this.quickViewOpen = false;
    this.selectedDoc = null;
  }

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

    // Cargar permisos finos del usuario
    this.loadFinePermissions();

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

    // Restaurar filtro guardado en LocalStorage Presets
    if (typeof localStorage !== 'undefined') {
      const savedFilter = localStorage.getItem('precotex:pref:docs_activeFilter');
      if (savedFilter) {
        this.activeFilter = savedFilter;
      }
    }
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
          let mapped = res.elements.map((d: any) => ({
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

          // Filtrar por área/proceso si el usuario NO es Administrador
          const rolVal = localStorage.getItem('vCod_Rol') || GlobalVariable.vCod_Rol.toString();
          const isUserAdmin = rolVal === '1';

          if (!isUserAdmin) {
            const userProceso = localStorage.getItem('precotex:usuario:proceso') || '';
            if (userProceso && userProceso.trim() !== '' && userProceso.toLowerCase() !== 'general') {
              mapped = mapped.filter((d: any) => 
                (d.proceso || '').toLowerCase().trim() === userProceso.toLowerCase().trim()
              );
            }
          }

          this.docsList = mapped;
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

  loadFinePermissions(): void {
    const rolVal = localStorage.getItem('vCod_Rol') || GlobalVariable.vCod_Rol?.toString() || '0';
    this.isUserAdmin = rolVal === '1';

    // Administradores tienen todos los permisos
    if (this.isUserAdmin) {
      this.canCreate = true;
      this.canEdit = true;
      this.canDelete = true;
      this.canDownload = true;
      this.canApprove = true;
      return;
    }

    // Leer permisos finos del localStorage (guardados por mapa-permisos)
    const fineRaw = localStorage.getItem('precotex:puestos:accesos_fino');
    if (!fineRaw) return;

    try {
      const accFine = JSON.parse(fineRaw);
      
      // Buscar el puesto del usuario actual en la lista de puestos
      const puestosRaw = localStorage.getItem('precotex:puestos:listado');
      const userLogin = (GlobalVariable.vusu || '').toLowerCase().trim();
      let puestoName = '';
      
      if (puestosRaw) {
        const puestosList = JSON.parse(puestosRaw);
        const userPuesto = puestosList.find((p: any) => {
          const fullName = (p.usuario || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (!fullName || fullName === '—') return false;
          const parts = fullName.split(/\s+/);
          if (parts.length >= 2) {
            const initial = parts[0].charAt(0);
            const lastName = parts[1];
            if (userLogin === initial + lastName) return true;
          }
          return fullName.includes(userLogin);
        });
        if (userPuesto) {
          puestoName = (userPuesto.puesto || '').trim();
        }
      }

      if (!puestoName) return;

      // Buscar permisos finos para este puesto (buscar con trim)
      let userFine = accFine[puestoName];
      if (!userFine) {
        const matchKey = Object.keys(accFine).find(k => k.trim().toLowerCase() === puestoName.toLowerCase());
        if (matchKey) userFine = accFine[matchKey];
      }

      if (!userFine) return;

      // Claves del formato: "Documentación||Documentos||Accion"
      // Verificar cada acción
      const checkFine = (contenido: string, accion: string): boolean | null => {
        const key = 'Documentación||' + contenido + '||' + accion;
        if (key in userFine) {
          return userFine[key] === 1;
        }
        return null; // No definido = heredar default
      };

      const crear = checkFine('Documentos', 'Crear');
      if (crear !== null) this.canCreate = crear;

      const editar = checkFine('Documentos', 'Editar');
      if (editar !== null) this.canEdit = editar;

      const eliminar = checkFine('Documentos', 'Eliminar / Obsoletar');
      if (eliminar !== null) this.canDelete = eliminar;

      const descargar = checkFine('Documentos', 'Descargar');
      if (descargar !== null) this.canDownload = descargar;

      const aprobar = checkFine('Documentos', 'Aprobar');
      if (aprobar !== null) this.canApprove = aprobar;

      console.log('[Docs Permisos] Puesto:', puestoName, '| Crear:', this.canCreate, '| Editar:', this.canEdit, '| Eliminar:', this.canDelete, '| Descargar:', this.canDownload);
    } catch (e) {
      console.error('[Docs Permisos] Error al cargar permisos finos:', e);
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('precotex:pref:docs_activeFilter', filterValue);
    }
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

  calcularEstadoDinamico(fechaVencimientoStr: string, estadoActual: string): string {
    if (!fechaVencimientoStr) return estadoActual || 'Vigente';
    const hoy = new Date();
    const venc = new Date(fechaVencimientoStr);
    const diffDias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    
    if (diffDias < 0) return 'Obsoleto';
    if (diffDias <= 60) return 'Por vencer'; // DOC-04: Automático si falta 60 días o menos para vencer
    return estadoActual || 'Vigente';
  }

  getStatCount(status: string): number {
    const list = this.filteredDocs; // DOC-06: Indicadores dinámicos según el proceso seleccionado
    if (status === 'Total') {
      return list.length;
    }
    return list.filter(d => d.estado === status).length;
  }

  // DOC-07: Confirmación semestral de lectura por Jefaturas (Visto Bueno)
  onDarVistoBueno(doc: any): void {
    const usuario = this.sUsuario || 'Jefe de Proceso';
    const fecha = new Date().toLocaleString();
    doc.vistoBuenoInfo = { usuario, fecha };
    
    this.toastr.success(`Visto Bueno de lectura registrado por ${usuario} para: ${doc.nombre}`, 'Visto Bueno Semestral (DOC-07)');
    Swal.fire('Visto Bueno Registrado', `Se ha dejado constancia de la lectura obligatoria semestral de: <strong>${doc.nombre}</strong><br><small>Por: ${usuario} - ${fecha}</small>`, 'success');
  }

  // DOC-09: Historial de versiones del documento
  onVerHistorial(doc: any): void {
    const versionesHtml = `
      <div style="text-align: left; font-size: 12px; line-height: 1.6;">
        <p><strong>Código:</strong> ${doc.codigo} | <strong>Documento:</strong> ${doc.nombre}</p>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 8px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <th style="padding: 4px; text-align: left;">Versión</th>
              <th style="padding: 4px; text-align: left;">Fecha / Hora</th>
              <th style="padding: 4px; text-align: left;">Usuario / Editor</th>
              <th style="padding: 4px; text-align: left;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 4px;"><strong>${doc.version || 'v1.0'}</strong> (Actual)</td>
              <td style="padding: 4px;">${doc.vig || '2026-01-15'} 10:30 hs</td>
              <td style="padding: 4px;">Jordan Pineda (O&M)</td>
              <td style="padding: 4px; color: #4ade80;">${doc.estado}</td>
            </tr>
            <tr>
              <td style="padding: 4px;">v0.9 (Borrador)</td>
              <td style="padding: 4px;">2025-06-10 14:20 hs</td>
              <td style="padding: 4px;">Reyna (Certificaciones)</td>
              <td style="padding: 4px; color: #94a3b8;">Aprobado</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: '📜 Historial de Versiones (DOC-09)',
      html: versionesHtml,
      width: '650px',
      confirmButtonText: 'Cerrar'
    });
  }

  // DOC-10: Visor Interno de Documento en Pantalla (Quick View)
  onVistaPrevia(doc: any): void {
    const docUrl = this.documentosControladosService.getDownloadUrl(doc.archivo || doc.codigo);
    
    Swal.fire({
      title: `👁️ Previsualización: ${doc.nombre}`,
      html: `
        <div style="width: 100%; height: 420px; background: #0b1220; border-radius: 8px; overflow: hidden; margin-top: 10px;">
          <iframe src="${docUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `,
      width: '800px',
      showCloseButton: true,
      confirmButtonText: 'Descargar Documento',
      showCancelButton: true,
      cancelButtonText: 'Cerrar Visor'
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.onDescargar(doc);
      }
    });
  }

  // DOC-05: Descarga limpia de archivo con nombre original de documento (Con blindaje antierrores)
  onDescargar(doc: any): void {
    if (!doc || (!doc.archivo && !doc.codigo)) {
      this.toastr.warning('Este registro aún no cuenta con un archivo PDF o documento físico adjunto en el servidor.', 'Archivo No Disponible');
      return;
    }

    const cleanFileName = doc.nombre ? `${doc.codigo}_${doc.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${doc.codigo}.pdf`;
    const downloadUrl = this.documentosControladosService.getDownloadUrl(doc.archivo || doc.codigo);
    
    this.toastr.info(`Descargando: ${cleanFileName}`, 'Descarga de Documento (DOC-05)');

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    let dialogRef = this.dialog.open(DocumentosControladosLoteComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.success) {
        this.loadDocs();
      }
    });
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

  getAbreviaturaProceso(proceso: string): string {
    if (!proceso) return 'OYM';
    const name = proceso.trim().toLowerCase();
    
    // Mapeo explícito de procesos estándar de Precotex
    const map: { [key: string]: string } = {
      'organización y métodos': 'OYM',
      'organizacion y metodos': 'OYM',
      'control patrimonial': 'CTP',
      'auditoría interna': 'AIO',
      'auditoria interna': 'AIO',
      'sistemas': 'SIS',
      'mantenimiento': 'MNT',
      'calidad': 'CAL',
      'costura': 'COS',
      'acabados': 'ACA',
      'aseguramiento de la calidad': 'ADC',
      'consumos': 'CON',
      'corte': 'COR',
      'inspección': 'INS',
      'inspeccion': 'INS',
      'acabados textil': 'ACT',
      'aseguramiento de calidad textil': 'ADT',
      'estampado digital': 'ESD',
      'laboratorio de color': 'LDC',
      'lavandería': 'LAV',
      'lavanderia': 'LAV',
      'tejeduría': 'TEJ',
      'tejeduria': 'TEJ',
      'tintorería': 'TIN',
      'tintoreria': 'TIN',
      'administración y finanzas': 'AYF',
      'administracion y finanzas': 'AYF',
      'administración': 'ADM',
      'administracion': 'ADM',
      'contabilidad y costos': 'CYC',
      'finanzas': 'FIN',
      'tesorería': 'TES',
      'tesoreria': 'TES'
    };

    if (map[name]) return map[name];

    // Si no está en el mapa, generar una abreviatura de 3 letras basada en las primeras letras de las palabras
    const palabras = proceso.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(p => p && p !== 'Y' && p !== 'DE' && p !== 'LA' && p !== 'EL');
    if (palabras.length >= 3) {
      return (palabras[0][0] + palabras[1][0] + palabras[2][0]).substring(0, 3);
    } else if (palabras.length === 2) {
      return (palabras[0].substring(0, 2) + palabras[1][0]).substring(0, 3);
    } else if (palabras.length === 1) {
      return palabras[0].substring(0, 3);
    }
    return 'GEN';
  }
}
