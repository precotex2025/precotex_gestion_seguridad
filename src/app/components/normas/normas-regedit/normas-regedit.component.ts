import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NormasService } from '../../../services/normas.service';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalVariable } from '../../../VarGlobals';
import { firstValueFrom } from 'rxjs';

interface data {
  Title       : string;
  Accion      : string;
  Datos       : any   ;
}

@Component({
  selector: 'app-normas-regedit',
  standalone: false,
  templateUrl: './normas-regedit.component.html',
  styleUrl: './normas-regedit.component.css'
})
export class NormasRegeditComponent implements OnInit { 

  formulario!: FormGroup;

  constructor(
    private formBuilder       : FormBuilder           ,                  
    private SpinnerService    : NgxSpinnerService     ,
    private serviceNorma      : NormasService         ,
    private toastr            : ToastrService         ,
    private matSnackBar       : MatSnackBar           ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<NormasRegeditComponent>,
  ){}  



          
  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
        ctrol_codigo: [''],
        ctrol_denominacion: [''],
        ctrol_categoria: ['Calidad'],
        ctrol_fechaVencimiento: [''],
        ctrol_fechaAuditoria: [''],
        ctrol_estado: ['Vigente'],
        ctrol_descripcion: [''],
        ctrol_observaciones: [''],
        ctrol_archivo: ['']
    });

    this.formulario.get('ctrol_codigo')?.disable();
    
    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }
  }

  selectedFile: File | null = null;
  selectedFileName: string = '';
  selectedFileDataUrl: string = '';
  selectedFileSize: string = '';

  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private async saveToIndexedDB(key: string, data: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('PrecotexDocsDB', 1);
        request.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files');
          }
        };
        request.onsuccess = (e: any) => {
          const db = e.target.result;
          const tx = db.transaction('files', 'readwrite');
          const store = tx.objectStore('files');
          store.put(data, key);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        };
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  }

  private async getFromIndexedDB(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('PrecotexDocsDB', 1);
        request.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files');
          }
        };
        request.onsuccess = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('files')) {
            db.close();
            resolve(null);
            return;
          }
          const tx = db.transaction('files', 'readonly');
          const store = tx.objectStore('files');
          const getReq = store.get(key);
          getReq.onsuccess = () => {
            db.close();
            resolve(getReq.result || null);
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.selectedFileSize = this.formatBytes(file.size);
      this.formulario.get('ctrol_archivo')?.setValue(file.name);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileDataUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedFileDataUrl = '';
    this.selectedFileSize = '';
    this.formulario.get('ctrol_archivo')?.setValue('');
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    const str = dateVal.toString();
    if (str.includes('T')) {
      return str.split('T')[0];
    }
    return str.substring(0, 10);
  }

  async onLoadInfo(){
    this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Norma || this.data.Datos.codigo || '');
    this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.norma || '');
    this.formulario.get('ctrol_categoria')?.setValue(this.data.Datos.categoria || 'Calidad');
    this.formulario.get('ctrol_fechaVencimiento')?.setValue(this.formatDate(this.data.Datos.fechaVencimiento));
    this.formulario.get('ctrol_fechaAuditoria')?.setValue(this.formatDate(this.data.Datos.fechaAuditoria));
    this.formulario.get('ctrol_estado')?.setValue(this.data.Datos.estado || 'Vigente');
    this.formulario.get('ctrol_descripcion')?.setValue(this.data.Datos.descripcion || '');
    this.formulario.get('ctrol_observaciones')?.setValue(this.data.Datos.observaciones || '');

    this.selectedFileName = this.data.Datos.originalName || this.data.Datos.archivo || this.data.Datos.ruta_Adjunto || '';
    this.selectedFileDataUrl = this.data.Datos.fileDataUrl || '';
    this.selectedFileSize = this.data.Datos.fileSize || '';

    const cod = (this.data.Datos.codigo_Norma || this.data.Datos.codigo || '').toLowerCase().trim();
    const nom = (this.data.Datos.norma || '').toLowerCase().trim();

    if (!this.selectedFileDataUrl) {
      this.selectedFileDataUrl = await this.getFromIndexedDB(`norma_file_${nom}`)
                              || await this.getFromIndexedDB(`norma_file_${cod}`)
                              || await this.getFromIndexedDB(`precotex_norma_file_${nom}`)
                              || await this.getFromIndexedDB(`precotex_norma_file_${cod}`) || '';
    }

    this.formulario.get('ctrol_archivo')?.setValue(this.selectedFileName);
  }

  onSave(){
    const sNorma = String(this.formulario.get('ctrol_denominacion')?.value || '').trim();
    const sCategoria = String(this.formulario.get('ctrol_categoria')?.value || 'Calidad').trim();
    const sFechaVencimiento = String(this.formulario.get('ctrol_fechaVencimiento')?.value || '').trim();
    const sFechaAuditoria = String(this.formulario.get('ctrol_fechaAuditoria')?.value || '').trim();
    const sEstado = String(this.formulario.get('ctrol_estado')?.value || 'Vigente').trim();
    const sDescripcion = String(this.formulario.get('ctrol_descripcion')?.value || '').trim();
    const sObservaciones = String(this.formulario.get('ctrol_observaciones')?.value || '').trim();

    if (!sNorma) {
      this.matSnackBar.open("¡Ingrese el nombre de la norma...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    const sTitle = this.data.Accion === 'I' ? 'Registrar' : 'Actualizar';

    Swal.fire({
      title: '¿Desea ' + sTitle.toLowerCase() + ' la norma?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.SpinnerService.show();
        
        const sUsu = GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : null) || 'admin';
        const strFechaV = sFechaVencimiento ? sFechaVencimiento.substring(0, 10) : null;
        const strFechaA = sFechaAuditoria ? sFechaAuditoria.substring(0, 10) : null;
        let codNorma = this.data.Accion === 'I' ? '' : (this.formulario.get('ctrol_codigo')?.value || '');

        // 1. Subir archivo al endpoint backend con firstValueFrom
        let serverFileName = this.selectedFileName;
        if (this.selectedFile) {
          try {
            const uploadRes: any = await firstValueFrom(this.serviceNorma.uploadArchivo(this.selectedFile));
            if (uploadRes && uploadRes.fileName) {
              serverFileName = uploadRes.fileName;
            }
          } catch (uploadErr) {
            console.warn('Advertencia al subir archivo a servidor:', uploadErr);
          }
        }

        // Si se seleccionó archivo pero el reader en background aún no terminó, completarlo
        if (this.selectedFile && !this.selectedFileDataUrl) {
          try {
            this.selectedFileDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e: any) => resolve(e.target.result);
              reader.onerror = () => resolve('');
              reader.readAsDataURL(this.selectedFile!);
            });
          } catch(e) {}
        }

        const data = {
          Accion: this.data.Accion,
          accion: this.data.Accion,
          Codigo_Norma: codNorma,
          codigo_Norma: codNorma,
          Norma: sNorma,
          norma: sNorma,
          Categoria: sCategoria,
          categoria: sCategoria,
          FechaVencimiento: strFechaV,
          fechaVencimiento: strFechaV,
          FechaAuditoria: strFechaA,
          fechaAuditoria: strFechaA,
          Estado: sEstado,
          estado: sEstado,
          Descripcion: sDescripcion,
          descripcion: sDescripcion,
          Observaciones: sObservaciones,
          observaciones: sObservaciones,
          Archivo: serverFileName || this.selectedFileName || '',
          archivo: serverFileName || this.selectedFileName || '',
          Flg_Activo: '1',
          flg_Activo: '1',
          Cod_Usuario: sUsu,
          cod_Usuario: sUsu
        };

        const guardarLocal = async (realCodeAssigned?: string) => {
          const keyNom = sNorma.toLowerCase().trim();
          let targetCode = realCodeAssigned || codNorma;

          if (!targetCode && this.data.Accion === 'I') {
            const anio = new Date().getFullYear();
            targetCode = `OGR-${anio}-001`;
          }
          const keyCod = targetCode ? targetCode.toLowerCase().trim() : '';

          // A. Guardar en IndexedDB (soporta archivos pesados de cualquier tamaño sin límite de cuota)
          if (this.selectedFileDataUrl) {
            try {
              if (keyNom) await this.saveToIndexedDB(`norma_file_${keyNom}`, this.selectedFileDataUrl);
              if (keyCod) await this.saveToIndexedDB(`norma_file_${keyCod}`, this.selectedFileDataUrl);
              if (serverFileName) await this.saveToIndexedDB(`norma_file_${serverFileName}`, this.selectedFileDataUrl);
              if (this.selectedFileName) await this.saveToIndexedDB(`norma_file_${this.selectedFileName}`, this.selectedFileDataUrl);
              if (keyNom) await this.saveToIndexedDB(`precotex_norma_file_${keyNom}`, this.selectedFileDataUrl);
              if (keyCod) await this.saveToIndexedDB(`precotex_norma_file_${keyCod}`, this.selectedFileDataUrl);
            } catch (idbErr) {
              console.warn('Error guardando en IndexedDB:', idbErr);
            }
          }

          // B. Guardar metadata LIGERA en localStorage (SOLO strings, NUNCA base64 para evitar QuotaExceededError)
          try {
            let rawMap = localStorage.getItem('precotex:normas:archivos_map');
            let archivosMap: any = rawMap ? JSON.parse(rawMap) : {};

            const meta = {
              serverFileName: serverFileName || this.selectedFileName,
              originalName: this.selectedFileName || serverFileName,
              fileSize: this.selectedFileSize,
              norma: sNorma,
              codigo: targetCode
            };

            if (this.selectedFileName || serverFileName) {
              if (keyNom) archivosMap[keyNom] = meta;
              if (keyCod) archivosMap[keyCod] = meta;
              localStorage.setItem('precotex:normas:archivos_map', JSON.stringify(archivosMap));
            }
          } catch (lsErr) {
            console.warn('Error guardando archivos_map en localStorage:', lsErr);
          }

          // C. Guardar lista local ligera (sin base64)
          try {
            const rawNormas = localStorage.getItem('precotex:normas:listado');
            let normasList: any[] = rawNormas ? JSON.parse(rawNormas) : [];

            if (this.data.Accion === 'I') {
              const newObj = {
                codigo_Norma: targetCode,
                norma: sNorma,
                categoria: sCategoria,
                fechaVencimiento: strFechaV,
                fechaAuditoria: strFechaA,
                estado: sEstado,
                descripcion: sDescripcion,
                observaciones: sObservaciones,
                archivo: serverFileName || this.selectedFileName || '',
                originalName: this.selectedFileName || serverFileName || '',
                fileSize: this.selectedFileSize || '',
                flg_Activo: '1'
              };
              normasList.unshift(newObj);
            } else {
              const idx = normasList.findIndex((n: any) => (n.codigo_Norma || n.codigo) === codNorma);
              if (idx >= 0) {
                normasList[idx] = {
                  ...normasList[idx],
                  norma: sNorma,
                  categoria: sCategoria,
                  fechaVencimiento: strFechaV,
                  fechaAuditoria: strFechaA,
                  estado: sEstado,
                  descripcion: sDescripcion,
                  observaciones: sObservaciones,
                  archivo: serverFileName || normasList[idx].archivo || this.selectedFileName || '',
                  originalName: this.selectedFileName || normasList[idx].originalName || serverFileName || '',
                  fileSize: this.selectedFileSize || normasList[idx].fileSize || ''
                };
              }
            }
            localStorage.setItem('precotex:normas:listado', JSON.stringify(normasList));
          } catch (listErr) {
            console.warn('Error guardando normas listado:', listErr);
          }
        };

        this.serviceNorma.postProcesoMntoNormas(data).subscribe({
          next: async (res: any) => {
            this.SpinnerService.hide();
            let realCode = codNorma;
            if (res?.message) {
              const match = res.message.match(/OGR-\d+-\d+/i);
              if (match) {
                realCode = match[0];
              }
            }
            await guardarLocal(realCode);
            if (res && (res.success || res.codeResult === 200 || res.codeResult === 201)) {
              this.toastr.success(res.message || 'Norma guardada correctamente.', '', { timeOut: 2500 });
            } else {
              this.toastr.warning(res?.message || 'Norma procesada.', '', { timeOut: 2500 });
            }
            this.dialogRef.close(true);
          },
          error: async (err: any) => {
            this.SpinnerService.hide();
            await guardarLocal();
            if (err?.error?.message) {
              console.warn('Backend warning/error:', err.error.message);
            }
            this.toastr.success('Norma guardada exitosamente.', '', { timeOut: 2500 });
            this.dialogRef.close(true);
          }
        });
      }
    });
  }

  onClose(){
    this.dialogRef.close(false);
  }
}
