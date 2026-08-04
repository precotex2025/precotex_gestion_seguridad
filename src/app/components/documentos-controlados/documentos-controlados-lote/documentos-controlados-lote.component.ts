import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { DocumentosControladosService } from '../../../services/documentos-controlados.service';
import { GlobalVariable } from '../../../VarGlobals';

interface FileUploadItem {
  file: File;
  nombre: string;
  codigo: string;
  tipo: string;
  formato: string;
  estado: string;
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
  PROCESOS_GROUPS: { [key: string]: string[] } = {};
  procesosMap: { [name: string]: string } = {};
  
  filesList: FileUploadItem[] = [];
  isUploading: boolean = false;
  sUsuario: string = GlobalVariable.vusu || 'SISTEMAS';

  tipos = ['Procedimiento', 'Instructivo', 'Formato', 'Manual', 'Perfil de puesto'];
  formatos = ['PDF', 'Word', 'Excel'];

  constructor(
    public dialogRef: MatDialogRef<DocumentosControladosLoteComponent>,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private documentosControladosService: DocumentosControladosService
  ) {}

  ngOnInit(): void {
    // 1. Cargar procesos agrupados
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.PROCESOS_GROUPS = groups;
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
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  getProcessCodeByName(procName: string): string {
    if (!procName) return '011';
    const key = procName.trim().toLowerCase();
    return this.procesosMap[key] || '011';
  }

  onFilesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Evitar duplicados por nombre
        if (this.filesList.some(item => item.file.name === file.name)) {
          continue;
        }

        // Parsear nombre de archivo para sugerir codigo y nombre
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

        // Auto-detectar tipo de documento
        let parsedTipo = 'Procedimiento';
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

        // Auto-detectar formato
        let parsedFormato = 'PDF';
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext === '.pdf') {
          parsedFormato = 'PDF';
        } else if (ext === '.doc' || ext === '.docx') {
          parsedFormato = 'Word';
        } else if (ext === '.xls' || ext === '.xlsx') {
          parsedFormato = 'Excel';
        }

        this.filesList.push({
          file: file,
          nombre: parsedName,
          codigo: parsedCode || ('LOTE-' + Math.floor(1000 + Math.random() * 9000)),
          tipo: parsedTipo,
          formato: parsedFormato,
          estado: 'Vigente',
          isUploaded: false,
          isError: false,
          progressMessage: 'Listo'
        });
      }
    }
  }

  removeFile(index: number): void {
    if (this.isUploading) return;
    this.filesList.splice(index, 1);
  }

  onUploadLote(): void {
    if (!this.selectedProceso) {
      this.toastr.warning('Por favor seleccione un área o proceso responsable.', 'Validación');
      return;
    }

    if (this.filesList.length === 0) {
      this.toastr.warning('Por favor agregue al menos un archivo para cargar.', 'Validación');
      return;
    }

    this.isUploading = true;
    const procCode = this.getProcessCodeByName(this.selectedProceso);
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
          item.progressMessage = 'Registrando...';

          const requestData = {
            Accion: 'I',
            Codigo_Documentos_Controlados: '',
            Codigo_Proceso: procCode,
            Codigo_Carpeta_Control: '001',
            Codigo_Normas: item.tipo,
            Codigo_Tiempo_Conservacion: '1 Anio',
            Codigo_Tipo_Descarga: item.formato,
            Denominacion: item.nombre,
            Codigo_Documento: item.codigo,
            Version_Documento: 'v1.0',
            Ruta_Adjunto: fileNameServer,
            Descripcion: item.nombre,
            bRegistroAsociado: true,
            bRequiereRevision: false,
            Flg_Estado: item.estado,
            Fec_Vencimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            Flg_Activo: true,
            Cod_Usuario: this.sUsuario
          };

          this.documentosControladosService.postProcesoMnto(requestData).subscribe({
            next: (regRes: any) => {
              if (regRes && regRes.success) {
                item.isUploaded = true;
                item.progressMessage = 'Completado';
                completedCount++;
              } else {
                item.isError = true;
                item.progressMessage = regRes?.message || 'Error';
              }
              processUpload(index + 1);
            },
            error: (err: any) => {
              item.isError = true;
              item.progressMessage = 'Error BD';
              processUpload(index + 1);
            }
          });
        },
        error: (err: any) => {
          item.isError = true;
          item.progressMessage = 'Error archivo';
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
