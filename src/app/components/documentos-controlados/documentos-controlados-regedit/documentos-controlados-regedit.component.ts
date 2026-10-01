import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProcesosService } from '../../../services/procesos.service';
import { DocumentosControladosService } from '../../../services/documentos-controlados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documentos-controlados-regedit',
  standalone: false,
  templateUrl: './documentos-controlados-regedit.component.html',
  styleUrls: ['./documentos-controlados-regedit.component.css']
})
export class DocumentosControladosRegeditComponent implements OnInit {
  formulario!: FormGroup;
  title: string = 'Registrar nuevo Documento';
  action: string = 'I';

  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Ingeniería', 'Organización y Métodos', 'Investigación, Desarrollo, Innovación', 'Certificaciones'],
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

  tipos = ['Procedimiento', 'Instructivo', 'Formato', 'Manual', 'Perfil de puesto', 'Politica', 'Plan', 'Registro'];
  formatos = ['PDF', 'Word', 'Excel'];
  estados = ['Vigente', 'Por vencer', 'Obsoleto'];

  fileName: string = 'Ningún archivo cargado';
  selectedFile: File | null = null;
  isUploading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DocumentosControladosRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private procesosService: ProcesosService,
    private documentosControladosService: DocumentosControladosService
  ) {}

  ngOnInit(): void {
    this.title = this.data?.Title || 'Registrar nuevo Documento';
    this.action = this.data?.Accion || 'I';
    const row = this.data?.Datos;

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.PROCESOS_GROUPS = { ...this.PROCESOS_GROUPS, ...groups };
        }
      }
    });

    const initialVig = row?.vig || this.obtenerVigencia3Anios();
    const initialEstado = this.calcularEstadoPorFecha(initialVig, row?.estado || 'Vigente');
    const initialTipo = row?.tipo || this.extraerTipoDelCodigo(row?.codigo) || 'Procedimiento';
    const initialVersion = row?.version || this.extraerVersionDelCodigo(row?.codigo) || '';
    const activeProcDestino = (this.data?.ActiveProcess || '').trim();
    const initialProceso = row?.proceso || activeProcDestino || this.extraerProcesoDelCodigo(row?.codigo) || 'Organización y Métodos';

    if (row) {
      if (row.modoVisibilidad) {
        this.modoVisibilidad = row.modoVisibilidad;
      } else if (row.procesosVisibles && row.procesosVisibles.includes('Todos los procesos')) {
        this.modoVisibilidad = 'TODOS';
      } else {
        this.modoVisibilidad = 'PERSONALIZADO';
      }

      if (row.procesos && Array.isArray(row.procesos) && row.procesos.length > 0) {
        this.procesosSeleccionados = [...row.procesos];
      } else if (row.procesosVisibles && Array.isArray(row.procesosVisibles) && row.procesosVisibles.length > 0 && !row.procesosVisibles.includes('Todos los procesos')) {
        this.procesosSeleccionados = [...row.procesosVisibles];
      } else if (row.proceso) {
        this.procesosSeleccionados = row.proceso.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } else {
      if (activeProcDestino && activeProcDestino !== 'Todos los procesos') {
        this.modoVisibilidad = 'PERSONALIZADO';
        this.procesosSeleccionados = [activeProcDestino];
      } else {
        this.modoVisibilidad = 'TODOS';
        const autoProc = this.extraerProcesoDelCodigo(initialProceso) || initialProceso;
        this.procesosSeleccionados = [autoProc || 'Organización y Métodos'];
      }
    }

    this.formulario = this.formBuilder.group({
      nombre: [row?.nombre || '', Validators.required],
      codigo: [row?.codigo || '', Validators.required],
      tipo: [initialTipo],
      version: [initialVersion, Validators.required],
      formato: [row?.formato || 'PDF'],
      proceso: [this.modoVisibilidad === 'TODOS' ? 'Todos los procesos' : this.procesosSeleccionados.join(', ')],
      vig: [initialVig],
      estado: [initialEstado],
      archivo: [row?.archivo || '', Validators.required]
    });

    // Escuchar cambios de Código para extraer automáticamente Tipo, Proceso y Versión
    this.formulario.get('codigo')?.valueChanges.subscribe((codeStr: string) => {
      if (codeStr) {
        const patchObj: any = {};

        // Auto-extraer Tipo de Documento
        const autoTipo = this.extraerTipoDelCodigo(codeStr);
        if (autoTipo) patchObj.tipo = autoTipo;

        // Auto-extraer Versión
        const autoVer = this.extraerVersionDelCodigo(codeStr);
        if (autoVer) patchObj.version = autoVer;

        // Auto-extraer Proceso Responsable
        const autoProc = this.extraerProcesoDelCodigo(codeStr);
        if (autoProc) {
          patchObj.proceso = autoProc;
          if (this.modoVisibilidad === 'PERSONALIZADO' && !this.procesosSeleccionados.includes(autoProc)) {
            if (this.procesosSeleccionados.length === 1 && this.procesosSeleccionados[0] === 'Organización y Métodos') {
              this.procesosSeleccionados = [autoProc];
            } else {
              this.procesosSeleccionados.push(autoProc);
            }
          }
        }

        this.formulario.patchValue(patchObj, { emitEvent: false });
      }
    });

    // Escuchar cambios de fecha de vigencia para calcular 'Por vencer' automáticamente si falta <= 30 días (1 mes)
    this.formulario.get('vig')?.valueChanges.subscribe((fecha: string) => {
      const autoEstado = this.calcularEstadoPorFecha(fecha);
      this.formulario.patchValue({ estado: autoEstado }, { emitEvent: false });
    });

    if (row?.archivo) {
      this.fileName = row.archivo;
    }

    // Si se pasó un archivo inicial (por ejemplo, mediante Drag & Drop desde la pantalla principal)
    if (this.data?.InitialFile) {
      this.procesarArchivo(this.data.InitialFile);
    }
  }

  // DOC-12: Extraer Tipo de Documento automáticamente desde el prefijo del Código
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

  // DOC-01: Obtener fecha de vigencia a 3 años por defecto
  obtenerVigencia3Anios(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().substring(0, 10);
  }

  // Extrae el Área/Proceso Responsable según la sigla o abreviatura del Código (ej. PER-IMC-ACT-012 -> Acabados Textil)
  // Extrae el Área/Proceso Responsable según la sigla o abreviatura del Código (ej. PER-IMC-ACT-012 -> Acabados Textil)
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
      'IDI': 'Investigación, Desarrollo, Innovación',
      'ID': 'Investigación, Desarrollo, Innovación',
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

    // Mapeo secundario de Macros
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

    // 1. Buscar coincidencia exacta de sub-proceso (prioridad: segmento 3, luego segmento 2, luego otros)
    if (parts.length >= 3 && mapSubProcesos[parts[2]]) {
      const targetProc = mapSubProcesos[parts[2]];
      this.asegurarProcesoEnGrupos(targetProc);
      return targetProc;
    }
    if (parts.length >= 2 && mapSubProcesos[parts[1]]) {
      const targetProc = mapSubProcesos[parts[1]];
      this.asegurarProcesoEnGrupos(targetProc);
      return targetProc;
    }
    for (const part of parts) {
      if (mapSubProcesos[part]) {
        const targetProc = mapSubProcesos[part];
        this.asegurarProcesoEnGrupos(targetProc);
        return targetProc;
      }
    }

    // 2. Si no coincide con sub-proceso, buscar en macros
    for (const part of parts) {
      if (mapMacros[part]) {
        const targetProc = mapMacros[part];
        this.asegurarProcesoEnGrupos(targetProc);
        return targetProc;
      }
    }

    return '';
  }

  asegurarProcesoEnGrupos(nombreProceso: string): void {
    if (!nombreProceso) return;
    let found = false;
    for (const macro in this.PROCESOS_GROUPS) {
      if (this.PROCESOS_GROUPS[macro].includes(nombreProceso)) {
        found = true;
        break;
      }
    }
    if (!found) {
      if (!this.PROCESOS_GROUPS['Operaciones Textil (OPT)']) {
        this.PROCESOS_GROUPS['Operaciones Textil (OPT)'] = [];
      }
      this.PROCESOS_GROUPS['Operaciones Textil (OPT)'].push(nombreProceso);
    }
  }

  // DOC-02: Extrae el entero de versión del 5to segmento (ej. PRO-OPM-COS-004-01 -> v1 o 1)
  extraerVersionDelCodigo(code: string): string {
    if (!code) return '';
    const parts = code.trim().split('-');
    if (parts.length >= 5) {
      const seg5 = parts[4].trim(); // los 2 últimos dígitos (01, 02, 03)
      const num = parseInt(seg5, 10);
      if (!isNaN(num)) {
        return `v${num}`;
      }
    }
    // Fallback: Si termina en "-01" o similar
    const match = code.match(/-(\d{1,2})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        return `v${num}`;
      }
    }
    return '';
  }

  calcularEstadoPorFecha(fechaStr: string, defaultEstado: string = 'Vigente'): string {
    if (!fechaStr) return defaultEstado;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaStr);
    venc.setHours(0, 0, 0, 0);
    
    const diffDias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    
    if (diffDias < 0) return 'Obsoleto';
    if (diffDias <= 30) return 'Por vencer'; // DOC-04: Automático a 1 mes (30 días) o menos
    return 'Vigente';
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  isDragOver: boolean = false;

  onDragOverFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeaveFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  onFileChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.fileName = 'Ningún archivo cargado';
    this.formulario.patchValue({ archivo: '' });
  }

  procesarArchivo(file: File): void {
    if (!file) return;
    this.selectedFile = file;
    this.fileName = file.name;
    
    // Parse file name (e.g. "PER-IMC-ACT-012 Perfil de Puesto.pdf")
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

    // DOC-12: Auto-popular Tipo de Documento desde prefijo del código
    const parsedTipo = this.extraerTipoDelCodigo(parsedCode);

    // Auto-populate Formato basado en extensión de archivo
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

    const parsedVersion = this.extraerVersionDelCodigo(parsedCode);
    const parsedProceso = this.extraerProcesoDelCodigo(parsedCode);

    // Build patching data
    const patchData: any = {
      archivo: file.name
    };
    
    if (parsedCode) patchData.codigo = parsedCode;
    if (parsedName) patchData.nombre = parsedName;
    if (parsedTipo) patchData.tipo = parsedTipo;
    if (parsedFormato) patchData.formato = parsedFormato;
    patchData.version = parsedVersion || '';
    
    if (parsedProceso) {
      patchData.proceso = parsedProceso;
      if (this.modoVisibilidad === 'PERSONALIZADO') {
        if (!this.procesosSeleccionados.includes(parsedProceso)) {
          this.procesosSeleccionados = [parsedProceso];
        }
      }
    } else if (this.data?.ActiveProcess && this.data.ActiveProcess !== 'Todos los procesos') {
      patchData.proceso = this.data.ActiveProcess;
      this.procesosSeleccionados = [this.data.ActiveProcess];
    }

    this.formulario.patchValue(patchData);
  }

  // DOC-15: Visibilidad y Permisos de lectura por Proceso (permite seleccionar 2 o más)
  modoVisibilidad: 'TODOS' | 'PERSONALIZADO' = 'TODOS';
  procesosSeleccionados: string[] = ['Organización y Métodos'];
  busquedaProceso: string = '';

  isProcesoSeleccionado(proc: string): boolean {
    return this.procesosSeleccionados.includes(proc);
  }

  toggleProceso(proc: string): void {
    if (this.isProcesoSeleccionado(proc)) {
      this.procesosSeleccionados = this.procesosSeleccionados.filter(p => p !== proc);
    } else {
      this.procesosSeleccionados.push(proc);
    }
    this.sincronizarControlProceso();
  }

  removeProceso(proc: string): void {
    this.procesosSeleccionados = this.procesosSeleccionados.filter(p => p !== proc);
    this.sincronizarControlProceso();
  }

  seleccionarTodosProcesos(): void {
    const todos = this.obtenerTodosLosProcesosArray();
    this.procesosSeleccionados = [...todos];
    this.sincronizarControlProceso();
  }

  limpiarProcesos(): void {
    this.procesosSeleccionados = [];
    this.sincronizarControlProceso();
  }

  toggleMacroCompleto(macro: string): void {
    const list = this.PROCESOS_GROUPS[macro] || [];
    const todosMarcados = list.length > 0 && list.every(p => this.isProcesoSeleccionado(p));
    if (todosMarcados) {
      this.procesosSeleccionados = this.procesosSeleccionados.filter(p => !list.includes(p));
    } else {
      list.forEach(p => {
        if (!this.isProcesoSeleccionado(p)) this.procesosSeleccionados.push(p);
      });
    }
    this.sincronizarControlProceso();
  }

  isMacroTodoSeleccionado(macro: string): boolean {
    const list = this.PROCESOS_GROUPS[macro] || [];
    return list.length > 0 && list.every(p => this.isProcesoSeleccionado(p));
  }

  setModoVisibilidad(modo: 'TODOS' | 'PERSONALIZADO'): void {
    this.modoVisibilidad = modo;
    if (modo === 'TODOS') {
      this.formulario.patchValue({ proceso: 'Todos los procesos' }, { emitEvent: false });
    } else {
      if (this.procesosSeleccionados.length === 0) {
        this.procesosSeleccionados = ['Organización y Métodos'];
      }
      this.sincronizarControlProceso();
    }
  }

  getProcesosFiltradosPorMacro(macro: string): string[] {
    const list = this.PROCESOS_GROUPS[macro] || [];
    if (!this.busquedaProceso.trim()) return list;
    const q = this.busquedaProceso.toLowerCase().trim();
    return list.filter(p => p.toLowerCase().includes(q));
  }

  obtenerTodosLosProcesosArray(): string[] {
    const all: string[] = [];
    for (const macro in this.PROCESOS_GROUPS) {
      (this.PROCESOS_GROUPS[macro] || []).forEach(p => {
        if (!all.includes(p)) all.push(p);
      });
    }
    return all;
  }

  sincronizarControlProceso(): void {
    if (this.modoVisibilidad === 'TODOS') {
      this.formulario.patchValue({ proceso: 'Todos los procesos' }, { emitEvent: false });
    } else if (this.procesosSeleccionados.length > 0) {
      this.formulario.patchValue({ proceso: this.procesosSeleccionados.join(', ') }, { emitEvent: false });
    } else {
      this.formulario.patchValue({ proceso: '' }, { emitEvent: false });
    }
  }

  onSave() {
    // Restricción: Código de Versión obligatorio
    const versionVal = (this.formulario.get('version')?.value || '').trim();
    if (!versionVal) {
      this.formulario.get('version')?.setErrors({ required: true });
      this.formulario.get('version')?.markAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Código de Versión Requerido',
        html: `<div style="font-size: 13px; color: #334155; text-align: left; line-height: 1.6;">
                 De acuerdo a la normativa documental del sistema, <strong>no se permite subir o registrar un documento sin su código de versión</strong> (ejemplo: <em>v1, v1.0, 01</em>).<br><br>
                 Por favor, ingrese el código de versión correspondiente antes de guardar el documento.
               </div>`,
        confirmButtonColor: '#5b4bd6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    // Restricción: No permitir documentos con el mismo código ni con el mismo nombre
    const nuevoNombre = (this.formulario.get('nombre')?.value || '').trim();
    const codigoActual = (this.formulario.get('codigo')?.value || '').trim();
    const existingDocs = this.data?.ExistingDocs || [];
    const originalCodigo = (this.data?.Datos?.codigo || '').trim().toLowerCase();

    // 1. Validar código duplicado
    const esCodigoDuplicado = existingDocs.some((d: any) => 
      d.codigo && d.codigo.trim().toLowerCase() === codigoActual.toLowerCase() &&
      (this.action === 'I' || (d.codigo.trim().toLowerCase() !== originalCodigo))
    );

    if (esCodigoDuplicado) {
      this.formulario.get('codigo')?.setErrors({ duplicateCode: true });
      this.formulario.get('codigo')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Código Duplicado',
        html: `<div style="font-size: 13px; color: #334155; text-align: left; line-height: 1.6;">
                 Ya existe un documento registrado con el código:<br>
                 <strong style="color: #dc2626; font-size: 14px;">"${codigoActual}"</strong><br><br>
                 De acuerdo a la normativa del sistema, no se permite registrar o subir documentos con el mismo código.
               </div>`,
        confirmButtonColor: '#5b4bd6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // 2. Validar nombre duplicado
    const esNombreDuplicado = existingDocs.some((d: any) => 
      d.nombre && d.nombre.trim().toLowerCase() === nuevoNombre.toLowerCase() &&
      (this.action === 'I' || (d.codigo && d.codigo.trim().toLowerCase() !== originalCodigo))
    );

    if (esNombreDuplicado) {
      this.formulario.get('nombre')?.setErrors({ duplicateName: true });
      this.formulario.get('nombre')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Nombre de Documento Duplicado',
        html: `<div style="font-size: 13px; color: #334155; text-align: left; line-height: 1.6;">
                 Ya existe un documento registrado con el nombre:<br>
                 <strong style="color: #dc2626; font-size: 14px;">"${nuevoNombre}"</strong><br><br>
                 De acuerdo a la normativa del sistema, no se permite registrar o subir documentos con el mismo nombre.
               </div>`,
        confirmButtonColor: '#5b4bd6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.modoVisibilidad === 'PERSONALIZADO' && this.procesosSeleccionados.length === 0) {
      this.formulario.get('proceso')?.setErrors({ required: true });
      return;
    }

    const val = this.formulario.value;
    val.estado = this.calcularEstadoPorFecha(val.vig, val.estado);
    val.modoVisibilidad = this.modoVisibilidad;

    if (this.modoVisibilidad === 'TODOS') {
      val.proceso = this.procesosSeleccionados.length > 0 ? this.procesosSeleccionados[0] : 'General';
      val.procesos = this.obtenerTodosLosProcesosArray();
      val.procesosVisibles = ['Todos los procesos'];
    } else {
      val.proceso = this.procesosSeleccionados.join(', ');
      val.procesos = [...this.procesosSeleccionados];
      val.procesosVisibles = [...this.procesosSeleccionados];
    }

    if (this.selectedFile) {
      this.isUploading = true;
      this.documentosControladosService.uploadArchivo(this.selectedFile).subscribe({
        next: (res: any) => {
          this.isUploading = false;
          val.archivo = res.fileName || this.selectedFile?.name;
          val.filePath = res.filePath;
          this.dialogRef.close(val);
        },
        error: () => {
          this.isUploading = false;
          this.dialogRef.close(val);
        }
      });
    } else {
      this.dialogRef.close(val);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
