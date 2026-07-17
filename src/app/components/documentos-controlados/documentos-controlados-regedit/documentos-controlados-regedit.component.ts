import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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

  tipos = ['Procedimiento', 'Instructivo', 'Formato', 'Manual', 'Perfil de puesto'];
  formatos = ['PDF', 'Word', 'Excel'];
  estados = ['Vigente', 'Por vencer', 'Obsoleto'];

  fileName: string = 'Ningún archivo cargado';

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DocumentosControladosRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.title = this.data?.Title || 'Registrar nuevo Documento';
    this.action = this.data?.Accion || 'I';
    const row = this.data?.Datos;

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
    this.dialogRef.close(this.formulario.value);
  }

  onClose() {
    this.dialogRef.close();
  }
}
