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

    this.formulario = this.formBuilder.group({
      nombre: [row?.nombre || '', Validators.required],
      codigo: [row?.codigo || '', Validators.required],
      tipo: [row?.tipo || 'Procedimiento'],
      version: [row?.version || 'v1.0'],
      formato: [row?.formato || 'PDF'],
      proceso: [row?.proceso || 'Sistemas'],
      vig: [row?.vig || ''],
      estado: [row?.estado || 'Vigente'],
      archivo: [row?.archivo || '', Validators.required]
    });

    if (row?.archivo) {
      this.fileName = row.archivo;
    }
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

      // Build patching data
      const patchData: any = {
        archivo: file.name
      };
      
      if (parsedCode) patchData.codigo = parsedCode;
      if (parsedName) patchData.nombre = parsedName;
      if (parsedTipo) patchData.tipo = parsedTipo;
      if (parsedFormato) patchData.formato = parsedFormato;

      this.formulario.patchValue(patchData);
    }
  }

  onSave() {
    if (this.formulario.invalid) {
      return;
    }

    if (this.selectedFile) {
      this.isUploading = true;
      this.documentosControladosService.uploadArchivo(this.selectedFile).subscribe({
        next: (res: any) => {
          this.isUploading = false;
          const val = this.formulario.value;
          val.archivo = res.fileName || this.selectedFile?.name;
          val.filePath = res.filePath;
          this.dialogRef.close(val);
        },
        error: () => {
          this.isUploading = false;
          this.dialogRef.close(this.formulario.value);
        }
      });
    } else {
      this.dialogRef.close(this.formulario.value);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
