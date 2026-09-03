import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OrganizacionRegeditComponent } from './organizacion-regedit/organizacion-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { SedesService } from '../../services/sedes.service';
import { ProcesosService } from '../../services/procesos.service';
import { GlobalVariable } from '../../VarGlobals';

@Component({
  selector: 'app-organizacion',
  standalone: false,
  templateUrl: './organizacion.component.html',
  styleUrl: './organizacion.component.css'
})
export class OrganizacionComponent implements OnInit {

  stats: {
    total: number;
    huachipa: number;
    independencia: number;
    ate: number;
  } = {
    total: 0,
    huachipa: 0,
    independencia: 0,
    ate: 0
  };

  organigramaNombre: string | null = null;
  organigramaUrl: string | null = null;
  organigramaSafeUrl: SafeResourceUrl | null = null;
  organigramaFileType: string = 'pdf';
  organigramaFileSize: string = '';

  mapaProcesosNombre: string | null = null;
  mapaProcesosUrl: string | null = null;
  mapaProcesosSafeUrl: SafeResourceUrl | null = null;
  mapaProcesosFileType: string = 'pdf';
  mapaProcesosFileSize: string = '';

  mostrarPreviewOrganigrama: boolean = false;
  mostrarPreviewMapaProcesos: boolean = false;

  sUsuario: string = GlobalVariable.vusu;

  constructor(
    private dialog              : MatDialog             ,
    private SpinnerService      : NgxSpinnerService     ,
    private toastr              : ToastrService         ,
    private sedesService        : SedesService          ,
    private procesosService     : ProcesosService       ,
    private sanitizer           : DomSanitizer
  ) {}

  displayedColumns: string[] = [
    'nombre',
    'direccion',
    'distrito',
    'procesos',
    'estado',
    'acciones'
  ];  
  dataSource = new MatTableDataSource<any>();    

  async ngOnInit(){
    this.onListado();
    await this.loadDocument('organigrama');
    await this.loadDocument('mapaprocesos');
  }

  // ORG-07: Persistencia robusta en IndexedDB y LocalStorage
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
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
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
          const tx = db.transaction('files', 'readonly');
          const store = tx.objectStore('files');
          const getReq = store.get(key);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  async loadDocument(type: 'organigrama' | 'mapaprocesos') {
    const isOrganigrama = type === 'organigrama';
    const nameKey = isOrganigrama ? 'precotex_organigrama_nombre' : 'precotex_mapaprocesos_nombre';
    const urlKey = isOrganigrama ? 'precotex_organigrama_url' : 'precotex_mapaprocesos_url';
    const sizeKey = isOrganigrama ? 'precotex_organigrama_size' : 'precotex_mapaprocesos_size';

    const fileName = localStorage.getItem(nameKey) || null;
    const fileSize = localStorage.getItem(sizeKey) || '';

    let fileDataUrl = localStorage.getItem(urlKey);
    if (!fileDataUrl) {
      fileDataUrl = await this.getFromIndexedDB(urlKey);
    }

    this.updateDocState(type, fileName, fileDataUrl, fileSize);
  }

  async saveDocument(type: 'organigrama' | 'mapaprocesos', fileName: string, fileDataUrl: string, fileSizeFormatted: string) {
    const isOrganigrama = type === 'organigrama';
    const nameKey = isOrganigrama ? 'precotex_organigrama_nombre' : 'precotex_mapaprocesos_nombre';
    const urlKey = isOrganigrama ? 'precotex_organigrama_url' : 'precotex_mapaprocesos_url';
    const sizeKey = isOrganigrama ? 'precotex_organigrama_size' : 'precotex_mapaprocesos_size';

    localStorage.setItem(nameKey, fileName);
    localStorage.setItem(sizeKey, fileSizeFormatted);

    try {
      localStorage.setItem(urlKey, fileDataUrl);
    } catch (e) {
      localStorage.removeItem(urlKey);
    }

    await this.saveToIndexedDB(urlKey, fileDataUrl);
    this.updateDocState(type, fileName, fileDataUrl, fileSizeFormatted);
  }

  updateDocState(type: 'organigrama' | 'mapaprocesos', fileName: string | null, fileUrl: string | null, fileSize: string = '') {
    const safeUrl = fileUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl) : null;
    const fileType = this.detectFileType(fileName, fileUrl);

    if (type === 'organigrama') {
      this.organigramaNombre = fileName;
      this.organigramaUrl = fileUrl;
      this.organigramaSafeUrl = safeUrl;
      this.organigramaFileType = fileType;
      this.organigramaFileSize = fileSize;
    } else {
      this.mapaProcesosNombre = fileName;
      this.mapaProcesosUrl = fileUrl;
      this.mapaProcesosSafeUrl = safeUrl;
      this.mapaProcesosFileType = fileType;
      this.mapaProcesosFileSize = fileSize;
    }
  }

  detectFileType(fileName: string | null, fileUrl: string | null): string {
    const name = (fileName || '').toLowerCase();
    const url = (fileUrl || '').toLowerCase();

    if (name.endsWith('.pdf') || url.includes('application/pdf')) return 'pdf';
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.svg') || url.includes('image/')) return 'image';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'word';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'excel';
    return 'other';
  }

  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // ORG-10: Exportar reporte de sedes a Excel con Título Oficial, Procesos completos y Diseño Premium
  onExportarSedes(): void {
    const dataToExport = (this.dataSource.filteredData && this.dataSource.filteredData.length > 0) 
      ? this.dataSource.filteredData 
      : this.dataSource.data;

    if (!dataToExport || dataToExport.length === 0) {
      this.toastr.warning('No hay datos de sedes para exportar.', 'Exportación');
      return;
    }

    const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaHoy = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    let rowsHtml = '';
    dataToExport.forEach((row: any, idx: number) => {
      const isEven = idx % 2 === 0;
      const bgClass = isEven ? '#ffffff' : '#f8fafc';
      const idStr = row.id || row.codigo_Sede || '-';
      const nombreStr = row.nombre || row.denominacion || '-';
      const dirStr = row.direccion || '-';
      const distStr = row.distrito || row.localidad || 'Lima';
      const procsStr = (row.procesosNombres && row.procesosNombres.trim() !== '') ? row.procesosNombres : 'Sin procesos asignados';
      const isActivo = row.isActivo !== undefined ? row.isActivo : (row.estado === 'Activo');
      const estadoBadge = isActivo 
        ? '<span style="color: #166534; font-weight: bold;">🟢 Activo</span>' 
        : '<span style="color: #991b1b; font-weight: bold;">🔴 Inactivo</span>';

      rowsHtml += `
        <tr style="background-color: ${bgClass};">
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; text-align: center;">${idStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f172a;">${nombreStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${dirStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #4338ca; font-weight: bold;">${distStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; color: #1e1b4b; background-color: #f1f5f9;">${procsStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${estadoBadge}</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Estructura Organizacional</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; }
          .header-title { background-color: #0f172a; color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; height: 40px; }
          .meta-row { background-color: #e2e8f0; color: #334155; font-size: 11px; font-weight: bold; }
          .th-head { background-color: #1e293b; color: #ffffff; font-size: 12px; font-weight: bold; text-transform: uppercase; border: 1px solid #0f172a; height: 30px; text-align: left; padding: 6px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th colspan="6" class="header-title">PRECOTEX S.A. — REPORTE DE ESTRUCTURA ORGANIZACIONAL Y SEDES</th>
          </tr>
          <tr class="meta-row">
            <td colspan="2" style="padding: 6px;">📅 Fecha de Emisión: ${fechaHoy} ${horaHoy}</td>
            <td colspan="2" style="padding: 6px;">👤 Generado por: ${this.sUsuario || 'Sistemas'}</td>
            <td colspan="2" style="padding: 6px; text-align: right;">📊 Total Sedes: ${dataToExport.length}</td>
          </tr>
          <tr><td colspan="6" style="height: 10px;"></td></tr>
          <tr>
            <th class="th-head" style="width: 100px; text-align: center;">Código Sede</th>
            <th class="th-head" style="width: 200px;">Nombre de la Sede</th>
            <th class="th-head" style="width: 250px;">Dirección</th>
            <th class="th-head" style="width: 130px; text-align: center;">Distrito</th>
            <th class="th-head" style="width: 350px;">Procesos que Operan</th>
            <th class="th-head" style="width: 120px; text-align: center;">Estado</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Precotex_Estructura_Organizacional_Sedes_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastr.success('Reporte de sedes con título oficial y procesos exportado a Excel.', 'ORG-10: Exportación');
  }

  triggerUpload(type: string) {
    const fileInput = document.getElementById(type === 'organigrama' ? 'organigrama-upload' : 'mapaprocesos-upload');
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: Event, type: 'organigrama' | 'mapaprocesos') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileSizeFormatted = this.formatBytes(file.size);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const fileDataUrl = e.target.result;
        this.saveDocument(type, file.name, fileDataUrl, fileSizeFormatted);
        const label = type === 'organigrama' ? 'Organigrama' : 'Mapa de Procesos';
        this.toastr.success(`${label} '${file.name}' resguardado correctamente y previsualizado en la parte inferior.`, 'ORG-07: Resguardo Documental');
      };
      reader.readAsDataURL(file);
    }
  }

  onDescargarArchivo(type: string) {
    const url = type === 'organigrama' ? this.organigramaUrl : this.mapaProcesosUrl;
    const name = type === 'organigrama' ? this.organigramaNombre : this.mapaProcesosNombre;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name || 'documento.pdf';
      link.click();
      this.toastr.info(`Descargando ${name}...`, 'Descarga');
    } else {
      this.toastr.warning('No hay un archivo guardado para descargar.', 'Atención');
    }
  }

  togglePreview(type: 'organigrama' | 'mapaprocesos') {
    if (type === 'organigrama') {
      this.mostrarPreviewOrganigrama = !this.mostrarPreviewOrganigrama;
    } else {
      this.mostrarPreviewMapaProcesos = !this.mostrarPreviewMapaProcesos;
    }
  }

  onVerPantallaCompleta(type: string) {
    const url = type === 'organigrama' ? this.organigramaUrl : this.mapaProcesosUrl;
    const name = type === 'organigrama' ? this.organigramaNombre : this.mapaProcesosNombre;
    if (url) {
      const win = window.open();
      if (win) {
        if (url.startsWith('data:application/pdf') || name?.toLowerCase().endsWith('.pdf')) {
          win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100vh;" allowfullscreen></iframe>`);
          win.document.title = name || 'Previsualización PDF';
        } else {
          win.document.write(`<title>${name}</title><body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${url}" style="max-width:98%; max-height:98vh; object-fit:contain; border-radius:8px; shadow:0 8px 30px rgba(0,0,0,0.5);"/></body>`);
        }
      }
    }
  }

  onListado(){
    this.SpinnerService.show();
    this.sedesService.getListadoSedes('001', '1').subscribe({
      next: (response: any) => {
        if (response && response.success && response.elements) {
          const sedes = response.elements;
          this.procesosService.getListadoProcesos('001', '1').subscribe({
            next: (procRes: any) => {
              const allProcs = (procRes && procRes.success && procRes.elements) ? procRes.elements : [];
              
              const mappedData = sedes.map((sede: any) => {
                const sedeCodeNorm = (sede.codigo_Sede || '').toString().trim();
                const sProcs = allProcs.filter((p: any) => {
                  const pSedeCodeNorm = (p.codigo_Sede || '').toString().trim();
                  return pSedeCodeNorm === sedeCodeNorm || 
                         (pSedeCodeNorm !== '' && parseInt(pSedeCodeNorm, 10) === parseInt(sedeCodeNorm, 10));
                });
                const procNames = sProcs.map((p: any) => p.proceso || p.nombre_Proceso || p.denominacion || '').filter((n: string) => n.trim().length > 0);
                const isActivo = sede.flg_Activo === '1' || sede.flg_Activo === true || sede.flg_Activo === 1 || sede.flg_Activo === 'True';
                return {
                  id: sede.codigo_Sede,
                  nombre: sede.denominacion,
                  direccion: sede.direccion,
                  distrito: sede.localidad || 'Lima',
                  estado: isActivo ? 'Activo' : 'Inactivo',
                  isActivo: isActivo,
                  procesosCount: procNames.length,
                  procesosNombres: procNames.length > 0 ? procNames.join(', ') : 'Sin procesos asignados',
                  raw: sede
                };
              });
              this.dataSource.data = mappedData;
              this.calculateStats(mappedData);
              this.SpinnerService.hide();
            },
            error: () => {
              const mappedData = sedes.map((sede: any) => {
                const isActivo = sede.flg_Activo === '1' || sede.flg_Activo === true || sede.flg_Activo === 1 || sede.flg_Activo === 'True';
                return {
                  id: sede.codigo_Sede,
                  nombre: sede.denominacion,
                  direccion: sede.direccion,
                  distrito: sede.localidad || 'Lima',
                  estado: isActivo ? 'Activo' : 'Inactivo',
                  isActivo: isActivo,
                  procesosCount: 0,
                  procesosNombres: '',
                  raw: sede
                };
              });
              this.dataSource.data = mappedData;
              this.calculateStats(mappedData);
              this.SpinnerService.hide();
            }
          });
        } else {
          this.dataSource.data = [];
          this.calculateStats([]);
          this.SpinnerService.hide();
        }
      },
      error: (error: any) => {
        this.SpinnerService.hide();
        this.toastr.error('Error al cargar sedes.', 'Error');
      }
    });
  }

  calculateStats(sedes: any[]): void {
    const matchLocation = (s: any, keyword: string) => {
      const fullText = (
        (s.distrito || '') + ' ' + 
        (s.nombre || '') + ' ' + 
        (s.direccion || '') + ' ' + 
        (s.localidad || '')
      ).toLowerCase();
      return fullText.includes(keyword.toLowerCase());
    };

    this.stats = {
      total: sedes.length,
      huachipa: sedes.filter(s => matchLocation(s, 'huachipa') || matchLocation(s, 'chosica') || matchLocation(s, 'lurigancho')).length,
      independencia: sedes.filter(s => matchLocation(s, 'independencia')).length,
      ate: sedes.filter(s => matchLocation(s, 'ate') || matchLocation(s, 'vitarte')).length
    };
  }

  getEstadoClass(estado: string | null | undefined): string {
    if (!estado) return 'huachipa';
    const normalized = estado.toLowerCase().trim();
    if (normalized.includes('huachipa')) return 'huachipa';
    if (normalized.includes('independencia')) return 'independencia';
    if (normalized.includes('sjl')) return 'sjl';
    if (normalized.includes('ate')) return 'ate';
    return 'huachipa';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAgregar(){
    let dialogRef = this.dialog.open(OrganizacionRegeditComponent, {
      width: '750px',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Agregar sede .::",
         Accion : "I",
         Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onListado();
      }
    });       
  }

  onEditar(item: any){
    let dialogRef = this.dialog.open(OrganizacionRegeditComponent, {
      width: '750px',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar sede .::",
         Accion : "U",
         Datos  : item.raw
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onListado();
      }
    });     
  }

  onEliminar(item: any){
    Swal.fire({
      title: '¿Desea eliminar la sede?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {    
      if (result.isConfirmed) {
        this.SpinnerService.show();
        
        item.raw.flg_Activo = '0'; // Soft delete
        item.raw.cod_Usuario = this.sUsuario;

        this.sedesService.postProcesoMntoSedes({
          Accion: 'D',
          Codigo_Sede: item.raw.codigo_Sede,
          Codigo_Organizacion: item.raw.codigo_Organizacion || '001',
          Denominacion: item.raw.denominacion || '',
          Acronimo: item.raw.acronimo || '',
          Direccion: item.raw.direccion || '',
          Localidad: item.raw.localidad || '',
          Provincia: item.raw.provincia || '',
          Pais: item.raw.pais || '',
          Flg_Activo: '0',
          Cod_Usuario: this.sUsuario
        }).subscribe({
          next: (res: any) => {
            this.SpinnerService.hide();
            if (res.codeResult === 200 || res.codeResult === 201) {
              this.toastr.success(res.message, '', { timeOut: 2500 });
              this.onListado();
            } else {
              this.toastr.error(res.message, '', { timeOut: 2500 });
            }
          },
          error: (err: any) => {
            this.SpinnerService.hide();
            this.toastr.error('Error al eliminar la sede.', '', { timeOut: 2500 });
          }
        });
      }
    });      
  }
}
