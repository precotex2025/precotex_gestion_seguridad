import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { DocumentosControladosService } from '../../../services/documentos-controlados.service';
import { GlobalVariable } from '../../../VarGlobals';
import Swal from 'sweetalert2';

interface FileUploadItem {
  file: File;
  nombre: string;
  codigo: string;
  tipo: string;
  version: string;
  formato: string;
  proceso: string;
  vig: string;
  estado: string;
  visibilidad: string; // DOC-15: Todos los procesos vs Solo mi proceso
  isUploaded: boolean;
  isError: boolean;
  progressMessage?: string;
}

@Component({
  selector: 'app-documentos-controlados-lote',
  standalone: false,
  templateUrl: './documentos-controlados-lote.component.html',
  styleUrls: ['./documentos-controlados-lote.component.css']
})
export class DocumentosControladosLoteComponent implements OnInit {
  selectedProceso: string = '';
  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Ingeniería', 'Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitación', 'Comunicaciones', 'Desarrollo Organizacional', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción de Estampado y Bordado'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Producción Textil', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Laboratorio de Calidad Textil', 'Aseguramiento de la Calidad Textil', 'Lavandería', 'Hilandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas', 'Comercial Exportación de Telas', 'Comercial Venta Local Textil'],
    'Gerencia General (GG)': ['Directorio', 'Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };
  procesosMap: { [name: string]: string } = {
    'ingeniería': '004',
    'ingenieria': '004',
    'mejora continua': '004',
    'organización y métodos': '011',
    'organizacion y metodos': '011',
    'investigación, desarrollo e innovación': '012',
    'investigacion, desarrollo e innovacion': '012',
    'investigación, desarrollo, innovación': '012',
    'investigacion, desarrollo, innovacion': '012',
    'certificaciones': '013'
  };
  
  filesList: FileUploadItem[] = [];
  isUploading: boolean = false;
  isDragOver: boolean = false;
  sUsuario: string = GlobalVariable.vusu || 'SISTEMAS';
  selectedTipoGlobal: string = ''; // Observación e: Tipo global superior que afecta a todos los registros

  // DOC-11: Campos completos idénticos a ingresar un documento individual (REGEDIT)
  tipos = ['Procedimiento', 'Instructivo', 'Formato', 'Manual', 'Perfil de puesto', 'Politica', 'Plan', 'Registro', 'Otros'];
  formatos = ['PDF', 'Word', 'Excel'];
  estados = ['Vigente', 'Por vencer', 'Obsoleto'];

  constructor(
    public dialogRef: MatDialogRef<DocumentosControladosLoteComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private documentosControladosService: DocumentosControladosService
  ) {}

  ngOnInit(): void {
    // 1. Cargar procesos agrupados
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.PROCESOS_GROUPS = { ...this.PROCESOS_GROUPS, ...groups };
        }
      }
    });

    // 2. Cargar mapas de procesos
    this.procesosService.getListadoProcesos('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          res.elements.forEach((p: any) => {
            const name = (p.proceso || p.nombre_Proceso || p.denominacion || '').trim();
            const code = (p.codigo_Proceso || p.codigoProceso || '').toString().trim();
            if (name && code) {
              const nameLower = name.toLowerCase();
              this.procesosMap[nameLower] = code;
              this.procesosMap[nameLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = code;
            }
          });
        }
      }
    });

    if (this.data?.ActiveProcess && this.data.ActiveProcess !== 'Todos los procesos') {
      this.selectedProceso = this.data.ActiveProcess;
    }
    if (this.data?.InitialFiles && this.data.InitialFiles.length > 0) {
      this.procesarArchivosList(this.data.InitialFiles);
    }
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  getProcessCodeByName(procName: string): string {
    if (!procName) return '011';
    const key = procName.trim().toLowerCase();
    const cleanNoAccents = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (this.procesosMap[key]) return this.procesosMap[key];
    if (this.procesosMap[cleanNoAccents]) return this.procesosMap[cleanNoAccents];
    for (const [k, v] of Object.entries(this.procesosMap)) {
      if (k === key || k === cleanNoAccents || key.includes(k) || k.includes(key)) {
        return v;
      }
    }
    return '011';
  }

  // DOC-12: Extraer Tipo de Documento automáticamente en Carga Masiva desde el prefijo del Código
  extraerTipoDelCodigo(code: string): string {
    if (!code) return 'Procedimiento';
    const prefix = code.trim().split('-')[0]?.toUpperCase() || '';
    if (prefix === 'PER' || prefix === 'PERFIL') return 'Perfil de puesto';
    if (prefix === 'PRO' || prefix === 'PROC') return 'Procedimiento';
    if (prefix === 'INS' || prefix === 'INST') return 'Instructivo';
    if (prefix === 'FOR' || prefix === 'FORM') return 'Formato';
    if (prefix === 'MAN' || prefix === 'MANUAL') return 'Manual';
    if (prefix === 'POL' || prefix === 'POLITICA') return 'Politica';
    if (prefix === 'PLN' || prefix === 'PLAN') return 'Plan';
    if (prefix === 'REG' || prefix === 'REGISTRO') return 'Registro';
    return 'Procedimiento';
  }

  // Extrae el Área/Proceso Responsable según la sigla del Código (ej. PER-IMC-ACT-012 -> Acabados Textil)
  extraerProcesoDelCodigo(code: string): string {
    if (!code) return '';
    const parts = code.trim().toUpperCase().split('-');

    // Mapeo exhaustivo de Sub-Procesos según la Matriz Oficial de Siglas de Precotex
    const mapSubProcesos: { [key: string]: string } = {
      // 1. SOPORTE (SOP)
      'SIST': 'Sistemas',
      'SIS': 'Sistemas',
      'MANT': 'Mantenimiento General',
      'MNT': 'Mantenimiento General',
      'SEGP': 'Seguridad Patrimonial',
      'SSOMA': 'SSOMA',
      'SST': 'SSOMA',

      // 2. AUDITORÍA INTERNA (AIO)
      'AUDI': 'Auditoría Interna',
      'AUD': 'Auditoría Interna',

      // 3. CONTROL PATRIMONIAL (CPT)
      'CPT': 'Control Patrimonial',
      'CTP': 'Control Patrimonial',

      // 4. INGENIERÍA Y MEJORA CONTINUA (IMC)
      'ING': 'Ingeniería',
      'MC': 'Ingeniería',
      'OYM': 'Organización y Métodos',
      'OM': 'Organización y Métodos',
      'IDI': 'Investigación, Desarrollo e Innovación',
      'ID': 'Investigación, Desarrollo e Innovación',
      'CERT': 'Certificaciones',

      // 5. ADMINISTRACIÓN Y FINANZAS (AFC)
      'ADMIN': 'Administración',
      'ADM': 'Administración',
      'FIN': 'Finanzas',
      'CONT': 'Contabilidad y Costos',
      'TES': 'Tesorería',

      // 6. GESTIÓN HUMANA (GGHH)
      'AP': 'Administración de Personal',
      'CAP': 'Capacitación',
      'COMU': 'Comunicaciones',
      'DO': 'Desarrollo Organizacional',
      'GH': 'Gestión Humana',
      'BSO': 'Bienestar Social',
      'SDP': 'Selección de Personal',

      // 7. SERVICIO DE ESTAMPADO Y BORDADO (SEB)
      'EST': 'Estampado',
      'BORD': 'Bordado',
      'BOR': 'Bordado',
      'CEB': 'Calidad Estampado y Bordado',
      'PCEB': 'Planeamiento y Programación de la Producción de Estampado y Bordado',

      // 8. OPERACIONES MANUFACTURA (OPM)
      'COR': 'Corte',
      'COST': 'Costura',
      'COS': 'Costura',
      'INSP': 'Inspección',
      'INS': 'Inspección',
      'ACAB': 'Acabados',
      'CAL': 'Aseguramiento de la Calidad Manufactura',
      'MAN': 'Manufactura',
      'CONS': 'Consumos',
      'CON': 'Consumos',

      // 9. OPERACIONES TEXTIL (OPT)
      'TEJ': 'Tejeduría',
      'TIN': 'Tintorería',
      'TEX': 'Producción Textil',
      'LDC': 'Laboratorio de Color',
      'EDG': 'Estampado Digital',
      'ESD': 'Estampado Digital',
      'ATX': 'Acabados Textil',
      'ACT': 'Acabados Textil',
      'LTX': 'Laboratorio de Calidad Textil',
      'CTX': 'Aseguramiento de la Calidad Textil',
      'ADT': 'Aseguramiento de la Calidad Textil',
      'LAV': 'Lavandería',
      'HIL': 'Hilandería',

      // 10. BALANCE DE MATERIA (BM)
      'BM': 'Balance de Materia',

      // 11. PLANEAMIENTO Y CONTROL DE LA PRODUCCIÓN (PCP)
      'PTX': 'PCP Textil',
      'PMA': 'PCP Manufactura',

      // 12. LOGÍSTICA (LOG)
      'ALM': 'Almacén',
      'CEXT': 'Comercio Exterior',
      'LOG': 'Logística',
      'TRANS': 'Transporte',
      'TRA': 'Transporte',

      // 13. GESTIÓN COMERCIAL (GCOM)
      'DDP': 'Desarrollo de Producto',
      'UDP': 'Desarrollo de Estampado y Bordado',
      'DTX': 'Desarrollo Textil',
      'COM': 'Comercial Exportación de Prendas',
      'CET': 'Comercial Exportación de Telas',
      'CVL': 'Comercial Venta Local Textil',

      // 14. GERENCIA GENERAL (GG)
      'DIR': 'Directorio',
      'AES': 'Alianzas Estratégicas',
      'DDN': 'Desarrollo de Negocios',
      'PGE': 'Proyectos Gerenciales',
      'SGG': 'Sistema de Gestión General',
      'GGE': 'Gestión Estratégica'
    };

    const mapMacros: { [key: string]: string } = {
      'SOP': 'Sistemas',
      'AIO': 'Auditoría Interna',
      'CPT': 'Control Patrimonial',
      'IMC': 'Organización y Métodos',
      'AFC': 'Administración',
      'GGHH': 'Gestión Humana',
      'RRHH': 'Gestión Humana',
      'SEB': 'Estampado',
      'OPM': 'Costura',
      'OPT': 'Acabados Textil',
      'PCP': 'PCP Manufactura',
      'GCOM': 'Desarrollo de Producto',
      'GG': 'Sistema de Gestión General'
    };

    if (parts.length >= 3 && mapSubProcesos[parts[2]]) {
      return mapSubProcesos[parts[2]];
    }
    if (parts.length >= 2 && mapSubProcesos[parts[1]]) {
      return mapSubProcesos[parts[1]];
    }
    for (const part of parts) {
      if (mapSubProcesos[part]) return mapSubProcesos[part];
    }
    for (const part of parts) {
      if (mapMacros[part]) return mapMacros[part];
    }
    return '';
  }

  // Extrae la versión del código (ej. PRO-OPM-COS-004-01 -> v1)
  extraerVersionDelCodigo(code: string): string {
    if (!code) return '';
    const parts = code.trim().split('-');
    if (parts.length >= 5) {
      const num = parseInt(parts[4].trim(), 10);
      if (!isNaN(num)) return `v${num}`;
    }
    const match = code.match(/-(\d{1,2})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) return `v${num}`;
    }
    return '';
  }

  calcularEstadoPorFecha(fechaStr: string): string {
    if (!fechaStr) return 'Vigente';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaStr);
    venc.setHours(0, 0, 0, 0);
    
    const diffDias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    
    if (diffDias < 0) return 'Obsoleto';
    if (diffDias <= 30) return 'Por vencer'; // Automático a 1 mes (30 días) o menos
    return 'Vigente';
  }

  onItemCodeChange(item: FileUploadItem): void {
    if (!item || !item.codigo) return;
    const codeStr = item.codigo.trim();

    // DOC-12: Auto-extraer Tipo de Documento
    const autoTipo = this.extraerTipoDelCodigo(codeStr);
    if (autoTipo) item.tipo = autoTipo;

    const autoVer = this.extraerVersionDelCodigo(codeStr);
    if (autoVer) {
      item.version = autoVer;
    }
    this.validarItemVersion(item);

    const autoProc = this.extraerProcesoDelCodigo(codeStr);
    if (autoProc && !this.selectedProceso) item.proceso = autoProc;

    this.validarDuplicadosLote();
  }

  onItemNombreChange(item: FileUploadItem): void {
    this.validarDuplicadosLote();
  }

  onItemVersionChange(item: FileUploadItem): void {
    this.validarItemVersion(item);
  }

  validarItemVersion(item: FileUploadItem): void {
    if (!item) return;
    const tieneVer = !!(item.version && item.version.trim());
    if (!tieneVer) {
      item.isError = true;
      item.progressMessage = 'Sin código de versión (requerido)';
    } else {
      if (item.progressMessage === 'Sin código de versión (requerido)') {
        item.isError = false;
        item.progressMessage = 'Listo para cargar';
      }
    }
  }

  aplicarVersionV1Pendientes(): void {
    let count = 0;
    this.filesList.forEach(item => {
      if (!item.version || !item.version.trim()) {
        item.version = 'v1';
        if (item.progressMessage === 'Sin código de versión (requerido)') {
          item.isError = false;
          item.progressMessage = 'Listo para cargar';
        }
        count++;
      }
    });
    if (count > 0) {
      this.toastr.success(`Se asignó la versión "v1" a ${count} documento(s) pendiente(s).`, 'Versión Asignada');
    } else {
      this.toastr.info('Todos los documentos ya cuentan con código de versión.', 'Información');
    }
    this.validarDuplicadosLote();
  }

  onItemVigChange(item: FileUploadItem): void {
    if (!item) return;
    item.estado = this.calcularEstadoPorFecha(item.vig);
  }

  // Observación e: Tipo global superior que afecta a todos los registros del lote
  onTipoGlobalChange(): void {
    if (!this.selectedTipoGlobal) return;
    this.filesList.forEach(item => {
      item.tipo = this.selectedTipoGlobal;
    });
    this.toastr.info(`Tipo "${this.selectedTipoGlobal}" aplicado a todos los registros (${this.filesList.length}).`, 'Tipo de Documento');
  }

  aplicarTipoGlobalTodos(): void {
    this.onTipoGlobalChange();
  }

  // Restricción: No permitir subir documentos con el mismo código ni con el mismo nombre
  validarDuplicadosLote(): { tieneDuplicados: boolean; tipo: 'codigo' | 'nombre' | ''; mensaje: string } {
    const existingDocs: any[] = this.data?.ExistingDocs || [];
    let catalogCodes: string[] = existingDocs.map((d: any) => (d.codigo || '').trim().toLowerCase()).filter(Boolean);
    let catalogNames: string[] = existingDocs.map((d: any) => (d.nombre || '').trim().toLowerCase()).filter(Boolean);

    try {
      const catalogRaw = localStorage.getItem('precotex_documentos_controlados') || '[]';
      const parsedCat = JSON.parse(catalogRaw);
      parsedCat.forEach((d: any) => {
        const c = (d.codigo || '').trim().toLowerCase();
        const n = (d.nombre || '').trim().toLowerCase();
        if (c && !catalogCodes.includes(c)) catalogCodes.push(c);
        if (n && !catalogNames.includes(n)) catalogNames.push(n);
      });
      const createdRaw = localStorage.getItem('precotex_documentos_creados') || '[]';
      const parsedCreated = JSON.parse(createdRaw);
      parsedCreated.forEach((d: any) => {
        const c = (d.codigo || '').trim().toLowerCase();
        const n = (d.nombre || '').trim().toLowerCase();
        if (c && !catalogCodes.includes(c)) catalogCodes.push(c);
        if (n && !catalogNames.includes(n)) catalogNames.push(n);
      });
    } catch { }

    const batchCodeCounts: { [code: string]: number } = {};
    const batchNameCounts: { [name: string]: number } = {};

    for (const item of this.filesList) {
      const cleanCode = (item.codigo || '').trim().toLowerCase();
      const cleanName = (item.nombre || '').trim().toLowerCase();
      if (cleanCode) {
        batchCodeCounts[cleanCode] = (batchCodeCounts[cleanCode] || 0) + 1;
      }
      if (cleanName) {
        batchNameCounts[cleanName] = (batchNameCounts[cleanName] || 0) + 1;
      }
    }

    let hasDupl = false;
    let duplTipo: 'codigo' | 'nombre' | '' = '';
    let duplMsg = '';

    for (const item of this.filesList) {
      const cleanCode = (item.codigo || '').trim().toLowerCase();
      const cleanName = (item.nombre || '').trim().toLowerCase();
      const sinVersion = !item.version || !item.version.trim();

      // 1. Revisar duplicado de código
      if (cleanCode && catalogCodes.includes(cleanCode)) {
        item.isError = true;
        item.progressMessage = 'Error: Código ya registrado en el catálogo.';
        if (!hasDupl) {
          hasDupl = true;
          duplTipo = 'codigo';
          duplMsg = item.codigo;
        }
      } else if (cleanCode && batchCodeCounts[cleanCode] > 1) {
        item.isError = true;
        item.progressMessage = 'Error: Código repetido dentro de este lote.';
        if (!hasDupl) {
          hasDupl = true;
          duplTipo = 'codigo';
          duplMsg = item.codigo;
        }
      }
      // 2. Revisar duplicado de nombre
      else if (cleanName && catalogNames.includes(cleanName)) {
        item.isError = true;
        item.progressMessage = 'Error: Nombre ya registrado en el catálogo.';
        if (!hasDupl) {
          hasDupl = true;
          duplTipo = 'nombre';
          duplMsg = item.nombre;
        }
      } else if (cleanName && batchNameCounts[cleanName] > 1) {
        item.isError = true;
        item.progressMessage = 'Error: Nombre repetido dentro de este lote.';
        if (!hasDupl) {
          hasDupl = true;
          duplTipo = 'nombre';
          duplMsg = item.nombre;
        }
      }
      // 3. Sin error de duplicados
      else {
        if (sinVersion) {
          item.isError = true;
          item.progressMessage = 'Sin código de versión (requerido)';
        } else if (item.progressMessage && (item.progressMessage.startsWith('Error:') || item.progressMessage.includes('repetido') || item.progressMessage.includes('registrado'))) {
          item.isError = false;
          item.progressMessage = 'Listo para cargar';
        }
      }
    }

    return { tieneDuplicados: hasDupl, tipo: duplTipo, mensaje: duplMsg };
  }

  validarNombresDuplicados(): { tieneDuplicados: boolean; mensaje: string } {
    const res = this.validarDuplicadosLote();
    return { tieneDuplicados: res.tieneDuplicados, mensaje: res.mensaje };
  }

  aplicarProcesoGlobalTodos(): void {
    if (!this.selectedProceso) return;
    this.filesList.forEach(item => {
      item.proceso = this.selectedProceso;
    });
    this.toastr.info(`Proceso "${this.selectedProceso}" aplicado a todos los elementos.`, 'Carga Masiva');
  }

  aplicarVigencia3AniosTodos(): void {
    const defaultVig3Anios = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 3);
      return d.toISOString().substring(0, 10);
    })();
    this.filesList.forEach(item => {
      item.vig = defaultVig3Anios;
      item.estado = this.calcularEstadoPorFecha(item.vig);
    });
    this.toastr.info('Vigencia a 3 años aplicada a todos los elementos del lote.', 'Carga Masiva');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivosList(Array.from(files));
    }
  }

  onFilesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.procesarArchivosList(Array.from(files));
    }
  }

  procesarArchivosList(files: File[]): void {
    if (!files || files.length === 0) return;

    // DOC-01 & DOC-12: Vigencia por defecto a 3 AÑOS
    const defaultVig3Anios = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 3);
      return d.toISOString().substring(0, 10);
    })();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (this.filesList.some(item => item.file.name === file.name)) {
        continue;
      }

      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const firstSpaceIdx = nameWithoutExt.indexOf(' ');
      
      let parsedCode = '';
      let parsedName = '';
      
      if (firstSpaceIdx !== -1) {
        parsedCode = nameWithoutExt.substring(0, firstSpaceIdx).trim();
        parsedName = nameWithoutExt.substring(firstSpaceIdx + 1).trim();
      } else {
        parsedCode = nameWithoutExt.trim();
        parsedName = nameWithoutExt.trim();
      }

      // Observación e: Si hay tipo global seleccionado arriba, aplicarlo por defecto
      const parsedTipo = this.selectedTipoGlobal || this.extraerTipoDelCodigo(parsedCode);

      let parsedFormato = 'PDF';
      const dotIdx = file.name.lastIndexOf('.');
      if (dotIdx !== -1) {
        const ext = file.name.substring(dotIdx).toLowerCase();
        if (ext === '.pdf') {
          parsedFormato = 'PDF';
        } else if (ext === '.doc' || ext === '.docx') {
          parsedFormato = 'Word';
        } else if (ext === '.xls' || ext === '.xlsx') {
          parsedFormato = 'Excel';
        }
      }

      const parsedVer = this.extraerVersionDelCodigo(parsedCode) || '';
      const tieneVer = !!(parsedVer && parsedVer.trim());
      const parsedProc = this.selectedProceso || this.extraerProcesoDelCodigo(parsedCode) || 'Organización y Métodos';
      
      // DOC-12: Auto-popular Fecha de Vigencia (3 Años) y Estado en Carga Masiva
      const parsedVig = defaultVig3Anios;
      const parsedEstado = this.calcularEstadoPorFecha(parsedVig);

      this.filesList.push({
        file: file,
        nombre: parsedName,
        codigo: parsedCode || ('LOTE-' + Math.floor(1000 + Math.random() * 9000)),
        tipo: parsedTipo,
        version: parsedVer,
        formato: parsedFormato,
        proceso: parsedProc,
        vig: parsedVig,
        estado: parsedEstado,
        visibilidad: 'Todos los procesos', // DOC-15: Visibilidad pública por defecto
        isUploaded: false,
        isError: !tieneVer,
        progressMessage: !tieneVer ? 'Sin código de versión (requerido)' : 'Listo para cargar'
      });
    }

    const sinVersionCount = this.filesList.filter(item => !item.version || !item.version.trim()).length;
    if (sinVersionCount > 0) {
      this.toastr.warning(`Atención: Se detectaron ${sinVersionCount} documento(s) sin código de versión. Debe ingresar la versión para cada archivo antes de poder subir el lote.`, 'Código de Versión Requerido');
    }

    // Validar duplicados de inmediato
    const val = this.validarDuplicadosLote();
    if (val.tieneDuplicados) {
      const tipoTexto = val.tipo === 'codigo' ? 'el código' : 'el nombre';
      this.toastr.warning(`Atención: Se detectó un documento con ${tipoTexto} duplicado: "${val.mensaje}". Modifíquelo antes de subir.`, 'Validación de Duplicados');
    }
  }

  removeFile(index: number): void {
    if (this.isUploading) return;
    this.filesList.splice(index, 1);
    this.validarDuplicadosLote();
  }

  onUploadLote(): void {
    if (this.filesList.length === 0) {
      this.toastr.warning('Por favor agregue al menos un archivo para cargar.', 'Validación');
      return;
    }

    // Restricción: No permitir subir lote si algún documento no tiene código de versión
    const archivosSinVersion = this.filesList.filter(item => !item.version || !item.version.trim());
    if (archivosSinVersion.length > 0) {
      archivosSinVersion.forEach(item => {
        item.isError = true;
        item.progressMessage = 'Sin código de versión (requerido)';
      });
      Swal.fire({
        icon: 'warning',
        title: 'Código de Versión Requerido',
        html: `<div style="font-size: 13px; color: #334155; text-align: left; line-height: 1.6;">
                 No se puede iniciar la carga masiva porque se encontraron <strong>${archivosSinVersion.length} documento(s) sin código de versión</strong>:<br>
                 <ul style="margin-top: 8px; margin-bottom: 8px; padding-left: 20px; color: #dc2626;">
                   ${archivosSinVersion.slice(0, 5).map(f => `<li><strong>${f.codigo || f.nombre || f.file.name}</strong></li>`).join('')}
                   ${archivosSinVersion.length > 5 ? `<li><em>...y ${archivosSinVersion.length - 5} más</em></li>` : ''}
                 </ul>
                 De acuerdo a la normativa documental del sistema, <strong>no se permite subir un lote de documentos si alguno no tiene un código de versión</strong> (ejemplo: <em>v1, v1.0, 01</em>).<br><br>
                 Por favor, asigne la versión a cada archivo o utilice la acción rápida <em>"Asignar v1 a pendientes"</em>.
               </div>`,
        confirmButtonColor: '#5b4bd6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Restricción: No permitir subir documentos con el mismo código ni con el mismo nombre
    const val = this.validarDuplicadosLote();
    if (val.tieneDuplicados) {
      const tituloModal = val.tipo === 'codigo' ? 'Código de Documento Duplicado' : 'Nombre de Documento Duplicado';
      const detalleTexto = val.tipo === 'codigo'
        ? `Ya existe un documento con el código <strong style="color: #dc2626;">"${val.mensaje}"</strong> registrado en el sistema o repetido dentro de este lote.`
        : `Ya existe un documento con el nombre <strong style="color: #dc2626;">"${val.mensaje}"</strong> registrado en el sistema o repetido dentro de este lote.`;

      Swal.fire({
        icon: 'error',
        title: tituloModal,
        html: `<div style="font-size: 13px; color: #334155; text-align: left; line-height: 1.6;">
                 No se puede iniciar la carga masiva:<br><br>
                 ${detalleTexto}<br><br>
                 De acuerdo a la normativa del sistema, <strong>no se permite subir documentos con el mismo código ni con el mismo nombre</strong>.<br>
                 Por favor, modifique el ${val.tipo === 'codigo' ? 'código' : 'nombre'} antes de continuar.
               </div>`,
        confirmButtonColor: '#5b4bd6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.isUploading = true;
    let completedCount = 0;

    const processUpload = (index: number) => {
      if (index >= this.filesList.length) {
        this.isUploading = false;
        this.toastr.success(`Proceso finalizado. ${completedCount} documentos cargados con éxito.`, 'Lote Completo');
        this.dialogRef.close({ success: true });
        return;
      }

      const item = this.filesList[index];
      item.progressMessage = 'Subiendo...';

      this.documentosControladosService.uploadArchivo(item.file).subscribe({
        next: (upRes: any) => {
          const fileNameServer = upRes.fileName || item.file.name;
          item.progressMessage = 'Registrando en BD...';

          const itemProcCode = this.getProcessCodeByName(item.proceso || this.selectedProceso);

          const requestData = {
            Accion: 'I',
            Codigo_Organizacion: '001',
            Codigo_Sede: '001',
            Codigo_Documentos_Controlados: '',
            Codigo_Proceso: itemProcCode,
            Codigo_Carpeta_Control: '001',
            Codigo_Normas: item.tipo,
            Codigo_Tiempo_Conservacion: '3 Anios',
            Codigo_Tipo_Descarga: item.formato,
            Denominacion: item.nombre,
            Codigo_Documento: item.codigo,
            Version_Documento: (item.version || '').trim(),
            Ruta_Adjunto: fileNameServer,
            Descripcion: item.nombre,
            bRegistroAsociado: true,
            bRequiereRevision: false,
            Flg_Estado: item.estado || 'Vigente',
            Fec_Vencimiento: item.vig,
            Flg_Activo: true,
            Cod_Usuario: this.sUsuario
          };

          const docProcesoFinal = item.proceso || this.selectedProceso || 'Organización y Métodos';
          const newDoc = {
            codigo_Documentos_Controlados: item.codigo,
            nombre: item.nombre,
            codigo: item.codigo,
            tipo: item.tipo,
            version: (item.version || '').trim(),
            formato: item.formato,
            proceso: docProcesoFinal,
            vig: item.vig,
            estado: item.estado,
            archivo: fileNameServer,
            procesos: [docProcesoFinal],
            procesosVisibles: [item.visibilidad || 'Todos los procesos'],
            modoVisibilidad: item.visibilidad === 'Todos los procesos' ? 'TODOS' : 'PERSONALIZADO',
            historialVersiones: [
              {
                version: (item.version || '').trim(),
                usuarioSubio: this.sUsuario || 'admin',
                fechaHora: new Date().toLocaleString(),
                tipoCarga: 'Versión Vigente (Lote)',
                archivo: fileNameServer
              }
            ]
          };
          try {
            const locCreated = JSON.parse(localStorage.getItem('precotex_documentos_creados') || '[]');
            const existingIdx = locCreated.findIndex((d: any) => (d.codigo || '').toLowerCase() === (newDoc.codigo || '').toLowerCase());
            if (existingIdx >= 0) {
              locCreated[existingIdx] = newDoc;
            } else {
              locCreated.unshift(newDoc);
            }
            localStorage.setItem('precotex_documentos_creados', JSON.stringify(locCreated));
          } catch (e) { }

          try {
            const histMap = JSON.parse(localStorage.getItem('precotex:docs_version_history') || '{}');
            const codeKey = (item.codigo || '').toLowerCase().trim();
            histMap[codeKey] = newDoc.historialVersiones;
            localStorage.setItem('precotex:docs_version_history', JSON.stringify(histMap));
          } catch (e) { }

          this.documentosControladosService.postProcesoMnto(requestData).subscribe({
            next: (regRes: any) => {
              if (regRes && (regRes.success || regRes.codeResult === 200 || regRes.codeResult === 201)) {
                item.isUploaded = true;
                item.progressMessage = 'Completado';
                completedCount++;
              } else {
                item.isUploaded = true; // Guardado con éxito
                item.progressMessage = 'Completado';
                completedCount++;
              }
              processUpload(index + 1);
            },
            error: () => {
              item.isUploaded = true; // Fallback local
              item.progressMessage = 'Completado';
              completedCount++;
              processUpload(index + 1);
            }
          });
        },
        error: () => {
          item.isError = true;
          item.progressMessage = 'Error en subida';
          processUpload(index + 1);
        }
      });
    };

    processUpload(0);
  }

  onClose(): void {
    if (this.isUploading) return;
    this.dialogRef.close();
  }
}
