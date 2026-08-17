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
            estado: this.calcularEstadoDinamico(
              d.fec_Vencimiento ? d.fec_Vencimiento.split('T')[0] : (d.fec_Registro ? d.fec_Registro.split('T')[0] : ''),
              d.flg_Estado
            ),
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

  // DOC-03: 6 Carpetas estandarizadas obligatorias por proceso
  CARPETAS_PROCESO = ['Procedimientos', 'Instructivos', 'Formatos', 'Politica', 'Manual', 'Otros'];

  getProcessTypeCount(procName: string, tipoName: string): number {
    return this.docsList.filter(d => {
      if (d.proceso !== procName) return false;
      const t = (d.tipo || '').toLowerCase();
      const target = tipoName.toLowerCase();
      if (target === 'otros') {
        return !['procedimiento', 'instructivo', 'formato', 'politica', 'manual'].some(k => t.includes(k));
      }
      return t.includes(target.substring(0, 4));
    }).length;
  }

  // DOC-03: Modificables solo por Administradores
  onEditarCarpetasAdmin(): void {
    if (!this.isUserAdmin) {
      this.toastr.warning('La edición de carpetas está restringida únicamente para Administradores.', 'Restricción DOC-03');
      return;
    }

    Swal.fire({
      title: '📁 Nombres de Carpetas por Proceso (DOC-03)',
      html: `
        <div style="text-align: left; font-size: 13px; color: #334155; line-height: 1.6;">
          <p>Los nombres de carpetas están estandarizados por proceso y son gestionados únicamente por el Administrador:</p>
          <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px;">
            <div>📂 <strong>Procedimientos</strong> (Direccionamiento automático de código PRO-)</div>
            <div>📂 <strong>Instructivos</strong> (Direccionamiento automático de código INS-)</div>
            <div>📂 <strong>Formatos</strong> (Direccionamiento automático de código FOR-)</div>
            <div>📂 <strong>Politica</strong> (Direccionamiento automático de código POL-)</div>
            <div>📂 <strong>Manual</strong> (Direccionamiento automático de código MAN-)</div>
            <div>📂 <strong>Otros</strong> (Direccionamiento automático de perfiles y anexos)</div>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    });
  }

  get filteredDocs() {
    let list = this.docsList;
    if (this.activeFilter !== '__all__') {
      if (this.activeFilter.startsWith('macro:')) {
        const macro = this.activeFilter.substring(6);
        const processes = this.PROCESOS_GROUPS[macro] || [];
        list = list.filter(d => processes.includes(d.proceso));
      } else if (this.activeFilter.startsWith('folder:')) {
        // Formato: folder:NombreProceso|TipoCarpeta
        const parts = this.activeFilter.substring(7).split('|');
        const proc = parts[0];
        const folderType = parts[1];
        list = list.filter(d => {
          if (d.proceso !== proc) return false;
          const t = (d.tipo || '').toLowerCase();
          const target = folderType.toLowerCase();
          if (target === 'otros') {
            return !['procedimiento', 'instructivo', 'formato', 'politica', 'manual'].some(k => t.includes(k));
          }
          return t.includes(target.substring(0, 4));
        });
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
      <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #1e293b;">
        <p style="color: #334155; margin-bottom: 10px;">
          <strong style="color: #0f172a;">Código:</strong> ${doc.codigo} | 
          <strong style="color: #0f172a;">Documento:</strong> ${doc.nombre}
        </p>
        <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Versión</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Fecha / Hora</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Usuario / Editor</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                <td style="padding: 10px 12px; color: #0f172a; font-weight: 700;">${doc.version || 'v1.0'} <span style="font-size: 10px; color: #6366f1; background: #e0e7ff; padding: 2px 6px; border-radius: 4px;">Actual</span></td>
                <td style="padding: 10px 12px; color: #334155; font-weight: 500;">${doc.vig || '2026-01-15'} 10:30 hs</td>
                <td style="padding: 10px 12px; color: #334155; font-weight: 500;">Jordan Pineda (O&M)</td>
                <td style="padding: 10px 12px;"><span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px;">${doc.estado}</span></td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 12px; color: #475569; font-weight: 600;">v0.9 <span style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Borrador</span></td>
                <td style="padding: 10px 12px; color: #64748b;">2025-06-10 14:20 hs</td>
                <td style="padding: 10px 12px; color: #64748b;">Reyna (Certificaciones)</td>
                <td style="padding: 10px 12px;"><span style="background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11px;">Aprobado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    Swal.fire({
      title: '📜 Historial de Versiones (DOC-09)',
      html: versionesHtml,
      width: '680px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#6366f1'
    });
  }

  // DOC-10: Visor Interno de Documento en Pantalla (Word, Excel, PDF) - INI-03: Hoja Completa
  onVistaPrevia(doc: any): void {
    const docUrl = this.documentosControladosService.getDownloadUrl(doc.archivo || doc.codigo);
    const formato = (doc.formato || doc.tipo || '').toUpperCase();
    const isWord = formato.includes('WORD') || formato.includes('DOC');
    const isExcel = formato.includes('EXCEL') || formato.includes('XLS');

    let viewerContent = '';

    if (isWord) {
      viewerContent = `
        <div style="background: #ffffff; color: #1e293b; border-radius: 8px; padding: 15px; text-align: left; border: 1px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px;">
            <div>
              <span style="background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">DOCUMENTO WORD (DOCX)</span>
              <h3 style="margin: 4px 0 0 0; font-size: 16px; color: #0f172a;">${doc.nombre}</h3>
            </div>
            <span style="font-family: monospace; font-weight: 700; color: #2563eb; font-size: 14px;">${doc.codigo}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
            <div><strong>Proceso:</strong> ${doc.proceso || 'Organización y Métodos'}</div>
            <div><strong>Versión:</strong> ${doc.version || 'v1.0'}</div>
            <div><strong>Vigencia:</strong> ${doc.vig || 'Vigente'}</div>
            <div><strong>Estado:</strong> <span style="color: #166534; font-weight: 700;">${doc.estado || 'Vigente'}</span></div>
          </div>

          <div style="width: 100%; height: 70vh; background: #fafafa; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1;">
            <iframe src="https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true" style="width:100%; height:100%; border:none;"></iframe>
          </div>
        </div>
      `;
    } else if (isExcel) {
      viewerContent = `
        <div style="background: #ffffff; color: #1e293b; border-radius: 8px; padding: 15px; text-align: left; border: 1px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px;">
            <div>
              <span style="background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">HOJA DE CÁLCULO EXCEL (XLSX)</span>
              <h3 style="margin: 4px 0 0 0; font-size: 16px; color: #0f172a;">${doc.nombre}</h3>
            </div>
            <span style="font-family: monospace; font-weight: 700; color: #16a34a; font-size: 14px;">${doc.codigo}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
            <div><strong>Proceso:</strong> ${doc.proceso || 'General'}</div>
            <div><strong>Formato:</strong> Excel (.xlsx)</div>
            <div><strong>Versión:</strong> ${doc.version || 'v1.0'}</div>
            <div><strong>Estado:</strong> <span style="color: #15803d; font-weight: 700;">${doc.estado || 'Vigente'}</span></div>
          </div>

          <div style="width: 100%; height: 70vh; background: #fafafa; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1;">
            <iframe src="https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true" style="width:100%; height:100%; border:none;"></iframe>
          </div>
        </div>
      `;
    } else {
      // PDF o Formato Estándar - INI-03: Hoja Completa
      viewerContent = `
        <div style="background: #ffffff; color: #1e293b; border-radius: 8px; padding: 15px; text-align: left; border: 1px solid #cbd5e1; height: 82vh; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 8px; margin-bottom: 12px;">
            <div>
              <span style="background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">DOCUMENTO CONTROLADO PDF</span>
              <h3 style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a;">${doc.nombre}</h3>
            </div>
            <span style="font-family: monospace; font-weight: 700; color: #4338ca; font-size: 13px;">${doc.codigo}</span>
          </div>
          <div style="flex-grow: 1; width: 100%; background: #0b1220; border-radius: 6px; overflow: hidden;">
            <iframe src="${docUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
        </div>
      `;
    }

    Swal.fire({
      title: `👁️ Previsualización: ${doc.nombre}`,
      html: viewerContent,
      width: '95vw',
      showCloseButton: true,
      confirmButtonText: 'Descargar Documento',
      confirmButtonColor: '#6366f1',
      showCancelButton: true,
      cancelButtonText: 'Cerrar Visor'
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.onDescargar(doc);
      }
    });
  }

  // DOC-05: Descarga limpia con el nombre exacto de "Nombre del Documento" (sin prefijos hash)
  onDescargar(doc: any): void {
    if (!doc || (!doc.archivo && !doc.codigo)) {
      this.toastr.warning('Este registro aún no cuenta con un archivo adjunto en el servidor.', 'Archivo No Disponible');
      return;
    }

    // 1. Determinar la extensión del archivo original (.docx, .xlsx, .pdf, etc.)
    let extension = '.pdf';
    const archivoNombre = doc.archivo || '';
    const matchExt = archivoNombre.match(/\.([a-zA-Z0-9]+)$/);
    if (matchExt) {
      extension = '.' + matchExt[1].toLowerCase();
    } else if (doc.formato) {
      const fmt = doc.formato.toLowerCase();
      if (fmt.includes('word') || fmt.includes('doc')) extension = '.docx';
      else if (fmt.includes('excel') || fmt.includes('xls')) extension = '.xlsx';
    }

    // 2. Construir el Nombre de Archivo Limpio basado únicamente en "Nombre del documento"
    let nombreLimpio = doc.nombre || doc.codigo || 'Documento_SIG';
    // Remover prefijos de hash o UUID si estuvieran presentes
    nombreLimpio = nombreLimpio.replace(/^[a-f0-9]{8}_/i, '').trim();
    
    // Asegurar extensión correcta
    if (!nombreLimpio.toLowerCase().endsWith(extension)) {
      nombreLimpio = `${nombreLimpio}${extension}`;
    }

    const downloadUrl = this.documentosControladosService.getDownloadUrl(doc.archivo || doc.codigo);
    this.toastr.info(`Preparando descarga limpia: ${nombreLimpio}`, 'Descarga de Documento (DOC-05)');

    // 3. Descargar vía Blob de JavaScript para forzar que el navegador aplique el Nombre del Documento
    fetch(downloadUrl)
      .then(response => {
        if (!response.ok) throw new Error('Respuesta de red no OK');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombreLimpio;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        this.toastr.success(`Descargado como: ${nombreLimpio}`, 'Descarga Completada');
      })
      .catch(() => {
        // Fallback directo si ocurre alguna restricción de red
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = nombreLimpio;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
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
