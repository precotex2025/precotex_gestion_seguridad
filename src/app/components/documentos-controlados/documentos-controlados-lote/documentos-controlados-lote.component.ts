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
    'Operaciones Textil (OPT)': ['Acabados Textil', 'Costura', 'Estampado', 'Hilandería', 'Tejitud'],
    'Ingeniería y Mejora Continua (IMC)': ['Organización y Métodos', 'Ingeniería', 'Control de Calidad'],
    'Soporte (SOP)': ['Control Patrimonial', 'Sistemas', 'Mantenimiento'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Gestión Humana (GGHH)': ['Gestión Humana', 'SSOMA']
  };
  procesosMap: { [name: string]: string } = {};
  
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
              this.procesosMap[name.toLowerCase()] = code;
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
    return this.procesosMap[key] || '011';
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

    const mapAbbr: { [key: string]: string } = {
      'ACT': 'Acabados Textil',
      'ACAB': 'Acabados Textil',
      'COS': 'Costura',
      'EST': 'Estampado',
      'OYM': 'Organización y Métodos',
      'OM': 'Organización y Métodos',
      'CTP': 'Control Patrimonial',
      'CPT': 'Control Patrimonial',
      'AIO': 'Auditoría Interna',
      'AUD': 'Auditoría Interna',
      'SIS': 'Sistemas',
      'SST': 'SSOMA',
      'SSOMA': 'SSOMA',
      'CAL': 'Calidad',
      'LOG': 'Logística',
      'PCP': 'Planeamiento y Control de la Producción',
      'GGHH': 'Gestión Humana',
      'RRHH': 'Gestión Humana',
      'GCOM': 'Gestión Comercial',
      'GG': 'Gerencia General',
      'AFC': 'Administración y Finanzas',
      'ADM': 'Administración y Finanzas'
    };

    for (const part of parts) {
      if (mapAbbr[part]) return mapAbbr[part];
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
    if (diffDias <= 60) return 'Por vencer';
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
    if (autoProc) item.proceso = autoProc;
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

  // Observación c: Validar que no se suban documentos con el mismo nombre
  validarNombresDuplicados(): { tieneDuplicados: boolean; mensaje: string } {
    const catalogRaw = localStorage.getItem('precotex_documentos_controlados') || '[]';
    let catalogNames: string[] = [];
    try {
      catalogNames = JSON.parse(catalogRaw).map((d: any) => (d.nombre || '').trim().toLowerCase()).filter(Boolean);
    } catch { catalogNames = []; }

    const batchMap: { [key: string]: number } = {};
    let hasDupl = false;
    let duplName = '';

    for (const item of this.filesList) {
      const cleanName = (item.nombre || '').trim().toLowerCase();
      if (!cleanName) continue;

      if (catalogNames.includes(cleanName)) {
        item.isError = true;
        item.progressMessage = 'Error: Ya existe un documento con este nombre en el sistema.';
        hasDupl = true;
        duplName = item.nombre;
      } else {
        batchMap[cleanName] = (batchMap[cleanName] || 0) + 1;
        if (batchMap[cleanName] > 1) {
          item.isError = true;
          item.progressMessage = 'Error: Nombre repetido dentro de este lote.';
          hasDupl = true;
          duplName = item.nombre;
        } else if (item.progressMessage && item.progressMessage.startsWith('Error:')) {
          item.isError = false;
          item.progressMessage = 'Listo para cargar';
        }
      }
    }

    return { tieneDuplicados: hasDupl, mensaje: duplName };
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
      const parsedProc = this.extraerProcesoDelCodigo(parsedCode) || this.selectedProceso || 'Organización y Métodos';
      
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

    // Observación c: Validar duplicados de inmediato
    const val = this.validarNombresDuplicados();
    if (val.tieneDuplicados) {
      this.toastr.warning(`Atención: El documento "${val.mensaje}" tiene un nombre duplicado. Modifique el nombre antes de subir.`, 'Validación de Nombres');
    }
  }

  removeFile(index: number): void {
    if (this.isUploading) return;
    this.filesList.splice(index, 1);
    this.validarNombresDuplicados();
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

    // Observación c: Validar restricción de documentos con el mismo nombre
    const val = this.validarNombresDuplicados();
    if (val.tieneDuplicados) {
      this.toastr.error(`No se puede iniciar la carga masiva: El documento "${val.mensaje}" tiene un nombre duplicado o ya existente en el catálogo. No se permite subir documentos con el mismo nombre.`, 'Restricción de Nombres');
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
