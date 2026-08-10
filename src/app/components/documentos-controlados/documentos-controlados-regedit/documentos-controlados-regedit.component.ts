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

  PROCESOS_GROUPS: { [key: string]: string[] } = {};

  tipos = ['Procedimiento', 'Instructivo', 'Formato', 'Manual', 'Perfil de puesto'];
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
        this.PROCESOS_GROUPS = groups;
      }
    });

    const initialVig = row?.vig || '';
    const initialEstado = this.calcularEstadoPorFecha(initialVig, row?.estado);
    const initialVersion = row?.version || this.extraerVersionDelCodigo(row?.codigo) || 'v1';

    this.formulario = this.formBuilder.group({
      nombre: [row?.nombre || '', Validators.required],
      codigo: [row?.codigo || '', Validators.required],
      tipo: [row?.tipo || 'Procedimiento'],
      version: [initialVersion],
      formato: [row?.formato || 'PDF'],
      proceso: [row?.proceso || 'Sistemas'],
      vig: [initialVig],
      estado: [initialEstado],
      archivo: [row?.archivo || '', Validators.required]
    });

    // DOC-02: Escuchar cambios de Código para extraer la Versión automáticamente del 5to segmento (los 2 últimos dígitos)
    this.formulario.get('codigo')?.valueChanges.subscribe((codeStr: string) => {
      if (codeStr) {
        const autoVer = this.extraerVersionDelCodigo(codeStr);
        if (autoVer) {
          this.formulario.patchValue({ version: autoVer }, { emitEvent: false });
        }
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
      
      // Parse file name (e.g. "PRO-ERP-OYM-003 Procedimiento de ACR.pdf")
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

      // Auto-populate Tipo de Documento based on parsed code prefix
      let parsedTipo = '';
      const prefix = parsedCode.split('-')[0]?.toUpperCase() || '';
      if (prefix === 'PRO') {
        parsedTipo = 'Procedimiento';
      } else if (prefix === 'INS') {
        parsedTipo = 'Instructivo';
      } else if (prefix === 'FOR') {
        parsedTipo = 'Formato';
      } else if (prefix === 'MAN') {
        parsedTipo = 'Manual';
      } else if (prefix === 'PER') {
        parsedTipo = 'Perfil de puesto';
      }

      // Auto-populate Formato based on file extension
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

      // Build patching data
      const patchData: any = {
        archivo: file.name
      };
      
      if (parsedCode) patchData.codigo = parsedCode;
      if (parsedName) patchData.nombre = parsedName;
      if (parsedTipo) patchData.tipo = parsedTipo;
      if (parsedFormato) patchData.formato = parsedFormato;
      if (parsedVersion) patchData.version = parsedVersion;

      this.formulario.patchValue(patchData);
    }
  }

  onSave() {
    if (this.formulario.invalid) {
      return;
    }

    const val = this.formulario.value;
    val.estado = this.calcularEstadoPorFecha(val.vig, val.estado);

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
