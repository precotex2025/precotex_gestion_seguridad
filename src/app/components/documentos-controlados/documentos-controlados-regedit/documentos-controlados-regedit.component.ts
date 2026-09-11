import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProcesosService } from '../../../services/procesos.service';
import { DocumentosControladosService } from '../../../services/documentos-controlados.service';

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
    'Operaciones Textil (OPT)': ['Acabados Textil', 'Costura', 'Estampado', 'Hilandería', 'Tejitud'],
    'Ingeniería y Mejora Continua (IMC)': ['Organización y Métodos', 'Mejora Continua', 'Control de Calidad'],
    'Soporte (SOP)': ['Control Patrimonial', 'Sistemas', 'Mantenimiento'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Gestión Humana (GGHH)': ['Gestión Humana', 'SSOMA']
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

    const initialVig = row?.vig || '';
    const initialEstado = this.calcularEstadoPorFecha(initialVig, row?.estado || 'Vigente');
    const initialTipo = row?.tipo || this.extraerTipoDelCodigo(row?.codigo) || 'Procedimiento';
    const initialVersion = row?.version || this.extraerVersionDelCodigo(row?.codigo) || 'v1';
    const initialProceso = row?.proceso || this.extraerProcesoDelCodigo(row?.codigo) || 'Organización y Métodos';

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
      this.modoVisibilidad = 'TODOS';
      const autoProc = this.extraerProcesoDelCodigo(initialProceso) || initialProceso;
      this.procesosSeleccionados = [autoProc || 'Organización y Métodos'];
    }

    this.formulario = this.formBuilder.group({
      nombre: [row?.nombre || '', Validators.required],
      codigo: [row?.codigo || '', Validators.required],
      tipo: [initialTipo],
      version: [initialVersion],
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

    // Escuchar cambios de fecha de vigencia para calcular 'Por vencer' automáticamente si falta <= 60 días
    this.formulario.get('vig')?.valueChanges.subscribe((fecha: string) => {
      const autoEstado = this.calcularEstadoPorFecha(fecha);
      this.formulario.patchValue({ estado: autoEstado }, { emitEvent: false });
    });

    if (row?.archivo) {
      this.fileName = row.archivo;
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
      'ADM': 'Administración y Finanzas',
      'BM': 'Balance de Materia',
      'OPM': 'Operaciones Manufactura',
      'OPT': 'Operaciones Textil'
    };

    for (const part of parts) {
      if (mapAbbr[part]) {
        const targetProc = mapAbbr[part];
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
    if (diffDias <= 60) return 'Por vencer'; // DOC-04: Automático a 2 meses (60 días) o menos
    return 'Vigente';
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
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
      }

      // DOC-12: Auto-popular Tipo de Documento desde prefijo del código
      const parsedTipo = this.extraerTipoDelCodigo(parsedCode);

      // Auto-populate Formato basado en extensión de archivo
      let parsedFormato = '';
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
      if (parsedVersion) patchData.version = parsedVersion;
      if (parsedProceso) patchData.proceso = parsedProceso;

      this.formulario.patchValue(patchData);
    }
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
    if (this.formulario.invalid) {
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
