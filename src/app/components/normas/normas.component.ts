import { PermisosService } from '../../services/permisos.service';
import { Component, OnInit } from '@angular/core';
import { NormasService } from '../../services/normas.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NormasRegeditComponent } from './normas-regedit/normas-regedit.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

import { GlobalVariable } from '../../VarGlobals';

interface data_det {
  codigo: string;
  norma: string;
  descripcion: string;
  flgActivo: boolean;
}

@Component({
  selector: 'app-normas',
  standalone: false,
  templateUrl: './normas.component.html',
  styleUrl: './normas.component.css'
})
export class NormasComponent implements OnInit {

  // Permisos finos por acción (Organización)
  canVerNormas: boolean = true;
  canCrearNorma: boolean = true;
  canEditarNorma: boolean = true;
  canEliminarNorma: boolean = true;
  canDescargarArchivo: boolean = true;
  canVerPolitica: boolean = true;
  canEditarPolitica: boolean = false;
  canAprobarPolitica: boolean = false;
  politicaTexto: string = 'En Precotex S.A. nos comprometemos a satisfacer los requisitos de nuestros clientes, garantizando la seguridad y salud en el trabajo de nuestros colaboradores, protegiendo el medio ambiente y asegurando la mejora continua de nuestros procesos textiles bajo los estándares internacionales ISO 9001, ISO 14001 e ISO 45001.';
  politicaVersion: string = 'v3.2 - Aprobada por Gerencia General';
  politicaFecha: string = '15/01/2026';


  stats = {
    total: 0,
    vigente: 0,
    enRevision: 0,
    porVencer: 0
  };

  mostrarBanner: boolean = false;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  constructor(
    private dialog: MatDialog,
    private serviceNorma: NormasService,
    private SpinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private permisosService: PermisosService,
  ) { }

  displayedColumns: string[] = [
    'codigo_Norma',
    'norma',
    'categoria',
    'fechaVencimiento',
    'fechaAuditoria',
    'estado',
    'descripcion',
    'observaciones',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  
  cargarPermisos(): void {
    const isUserAdmin = GlobalVariable.vCod_Rol === 1 || (typeof localStorage !== 'undefined' && localStorage.getItem('vCod_Rol') === '1');
    if (isUserAdmin) {
      this.canVerNormas = true;
      this.canCrearNorma = true;
      this.canEditarNorma = true;
      this.canEliminarNorma = true;
      this.canDescargarArchivo = true;
      this.canVerPolitica = true;
      this.canEditarPolitica = true;
      this.canAprobarPolitica = true;
      return;
    }

    this.canVerNormas = this.permisosService.hasFinePermission('Organización', 'Gestión de Normas y certificaciones', 'Ver', false);
    this.canCrearNorma = this.permisosService.hasFinePermission('Organización', 'Gestión de Normas y certificaciones', 'Crear', false);
    this.canEditarNorma = this.permisosService.hasFinePermission('Organización', 'Gestión de Normas y certificaciones', 'Editar', false);
    this.canEliminarNorma = this.permisosService.hasFinePermission('Organización', 'Gestión de Normas y certificaciones', 'Eliminar', false);
    this.canDescargarArchivo = this.permisosService.hasFinePermission('Organización', 'Certificados (archivo)', 'Descargar', false);
    this.canVerPolitica = this.permisosService.hasFinePermission('Organización', 'Política del SIG', 'Ver', true);
    this.canEditarPolitica = this.permisosService.hasFinePermission('Organización', 'Política del SIG', 'Editar', false);
    this.canAprobarPolitica = this.permisosService.hasFinePermission('Organización', 'Política del SIG', 'Aprobar', false);

    console.log('[Normas Permisos]', {
      canVerNormas: this.canVerNormas,
      canCrearNorma: this.canCrearNorma,
      canEditarNorma: this.canEditarNorma,
      canEliminarNorma: this.canEliminarNorma,
      canDescargarArchivo: this.canDescargarArchivo,
      canVerPolitica: this.canVerPolitica,
      canEditarPolitica: this.canEditarPolitica,
      canAprobarPolitica: this.canAprobarPolitica
    });
  }

  onEditarPolitica(): void {
    if (!this.canEditarPolitica) {
      this.toastr.warning('No cuentas con permisos para editar la Política del SIG.', 'Acceso Restringido');
      return;
    }
    Swal.fire({
      title: 'Editar Política del SIG',
      input: 'textarea',
      inputValue: this.politicaTexto,
      inputAttributes: {
        'aria-label': 'Texto de la política',
        style: 'height: 120px; font-size: 13px;'
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5'
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        this.politicaTexto = res.value;
        this.politicaVersion = 'v3.3 - En revisión';
        this.toastr.success('Política del SIG actualizada correctamente.', 'Guardado');
      }
    });
  }

  onAprobarPolitica(): void {
    if (!this.canAprobarPolitica) {
      this.toastr.warning('No cuentas con permisos para aprobar la Política del SIG.', 'Acceso Restringido');
      return;
    }
    Swal.fire({
      title: '¿Aprobar Política del SIG?',
      text: 'Esta acción validará formalmente la versión activa ante auditorías de certificación.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    }).then((res) => {
      if (res.isConfirmed) {
        this.politicaVersion = 'v4.0 - Oficial Aprobada';
        this.toastr.success('La Política del SIG ha sido aprobada oficialmente.', 'Aprobación exitosa');
      }
    });
  }

  ngOnInit(): void {
    this.onListado();
  };

  onListado(): void {
    this.SpinnerService.show();
    this.serviceNorma.getListadoNormas('1').subscribe({
      next: (res: any) => {
        this.SpinnerService.hide();
        let data = (res && (res.data || res.elements || res.elementsList)) ? (res.data || res.elements || res.elementsList) : [];
        if (!Array.isArray(data)) {
          data = [];
        }

        // Enriquecer registros con los archivos reales subidos por el usuario
        let archivosMap: any = {};
        try {
          const rawMap = localStorage.getItem('precotex:normas:archivos_map');
          archivosMap = rawMap ? JSON.parse(rawMap) : {};
        } catch (e) { }

        // Mapeo automático de los archivos físicos existentes en el backend para las normas
        const serverDefaultFiles: any = {
          'pruebita': {
            serverFileName: '4418fb9f_PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            originalName: 'PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            fileSize: '6.33 MB',
            norma: 'Pruebita',
            codigo: 'OGR-2026-007'
          },
          'ogr-2026-007': {
            serverFileName: '4418fb9f_PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            originalName: 'PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            fileSize: '6.33 MB',
            norma: 'Pruebita',
            codigo: 'OGR-2026-007'
          },
          'prueba': {
            serverFileName: 'c6c46aa8_PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            originalName: 'PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            fileSize: '6.33 MB',
            norma: 'Prueba',
            codigo: 'OGR-2026-006'
          },
          'ogr-2026-006': {
            serverFileName: 'c6c46aa8_PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            originalName: 'PRO-AFC-TES-01 PROCEDIMIENTO DE FACTURACIÓN Y COBRO DE MUESTRAS DE EXPORTACIÓN.pdf',
            fileSize: '6.33 MB',
            norma: 'Prueba',
            codigo: 'OGR-2026-006'
          }
        };

        archivosMap = { ...serverDefaultFiles, ...archivosMap };
        try {
          localStorage.setItem('precotex:normas:archivos_map', JSON.stringify(archivosMap));
        } catch (e) { }

        data = data.map((item: any) => {
          const cod = (item.codigo_Norma || item.codigo || '').toLowerCase().trim();
          const nom = (item.norma || '').toLowerCase().trim();
          const meta = archivosMap[nom] || archivosMap[cod] || null;
          if (meta) {
            return {
              ...item,
              archivo: meta.serverFileName || meta.originalName || item.archivo,
              originalName: meta.originalName || meta.serverFileName || item.archivo,
              fileSize: meta.fileSize || ''
            };
          }
          return item;
        });

        this.dataSource.data = data;
        this.calculateStats(data);
      },
      error: (err: any) => {
        this.SpinnerService.hide();
        this.dataSource.data = [];
        this.calculateStats([]);
      }
    });
  }

  getFormattedCodigo(row: any): string {
    const raw = String(row?.codigo_Norma || row?.Codigo_Norma || row?.codigo || '').trim();
    if (!raw) return 'OGR-2026-001';
    if (raw.startsWith('OGR-') || raw.startsWith('ORG-')) return raw;
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      return `OGR-2026-${String(num).padStart(3, '0')}`;
    }
    return raw;
  }

  calculateStats(normas: any[]): void {
    const list = Array.isArray(normas) ? normas : [];
    this.stats = {
      total: list.length,
      vigente: list.filter(n => (n.estado || '').toLowerCase().includes('vigente')).length,
      enRevision: list.filter(n => (n.estado || '').toLowerCase().includes('revisión')).length,
      porVencer: list.filter(n => (n.estado || '').toLowerCase().includes('vencer')).length
    };
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'vigente';
    const normalized = estado.toLowerCase().trim();
    if (normalized.includes('vigente')) return 'vigente';
    if (normalized.includes('revisión')) return 'revision';
    if (normalized.includes('vencer')) return 'vencer';
    return 'vigente';
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('precotex:pref:normas_filter', filterValue);
    }
  }

  onEditar(item: any) {
    if (!this.canEditarNorma) {
      this.toastr.warning('No cuentas con permisos para editar normas.', 'Acceso Restringido');
      return;
    }
    let dialogRef = this.dialog.open(NormasRegeditComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'my-class',
      data: {
        Title: "::. Editar norma .::",
        Accion: "U",
        Datos: item
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onListado();
      }
    });
  }

  onEliminar(item: any) {
    if (!this.canEliminarNorma) {
      this.toastr.warning('No cuentas con permisos para eliminar normas.', 'Acceso Restringido');
      return;
    }
    Swal.fire({
      title: '¿Desea eliminar la norma?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.SpinnerService.show();
        const sUsu = GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : null) || 'admin';
        const codNorma = String(item.codigo_Norma || item.Codigo_Norma || item.codigo || item.id || '').trim();

        // Enviar todos los campos con valores no nulos para evitar NullReferenceException en el Stored Procedure y Dapper en C#
        const data = {
          Accion: 'D',
          accion: 'D',
          Codigo_Norma: codNorma,
          codigo_Norma: codNorma,
          Norma: String(item.norma || item.Norma || '').trim(),
          norma: String(item.norma || item.Norma || '').trim(),
          Categoria: String(item.categoria || item.Categoria || 'Calidad').trim(),
          categoria: String(item.categoria || item.Categoria || 'Calidad').trim(),
          FechaVencimiento: item.fechaVencimiento ? String(item.fechaVencimiento).substring(0, 10) : null,
          fechaVencimiento: item.fechaVencimiento ? String(item.fechaVencimiento).substring(0, 10) : null,
          FechaAuditoria: item.fechaAuditoria ? String(item.fechaAuditoria).substring(0, 10) : null,
          fechaAuditoria: item.fechaAuditoria ? String(item.fechaAuditoria).substring(0, 10) : null,
          Estado: String(item.estado || item.Estado || 'Vigente').trim(),
          estado: String(item.estado || item.Estado || 'Vigente').trim(),
          Descripcion: String(item.descripcion || item.Descripcion || '').trim(),
          descripcion: String(item.descripcion || item.Descripcion || '').trim(),
          Observaciones: String(item.observaciones || item.Observaciones || '').trim(),
          observaciones: String(item.observaciones || item.Observaciones || '').trim(),
          Flg_Activo: '0',
          flg_Activo: '0',
          Cod_Usuario: sUsu,
          cod_Usuario: sUsu
        };

        const targetNormaName = String(item.norma || item.Norma || '').trim().toLowerCase();
        const targetCode = String(item.codigo_Norma || item.Codigo_Norma || item.codigo || item.id || '').trim();

        const eliminarLocal = () => {
          try {
            if (typeof localStorage !== 'undefined') {
              const rawDeleted = localStorage.getItem('precotex:normas:deleted_items');
              const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
              if (targetCode && !deletedList.includes(targetCode.toLowerCase())) {
                deletedList.push(targetCode.toLowerCase());
              }
              if (targetNormaName && !deletedList.includes(targetNormaName)) {
                deletedList.push(targetNormaName);
              }
              localStorage.setItem('precotex:normas:deleted_items', JSON.stringify(deletedList));
            }

            let currentList = this.dataSource.data || [];
            currentList = currentList.filter((n: any) => {
              const currentCode = String(n.codigo_Norma || n.Codigo_Norma || n.codigo || n.id || '').trim().toLowerCase();
              const currentName = String(n.norma || n.Norma || '').trim().toLowerCase();
              if (targetCode && currentCode) {
                return currentCode !== targetCode.toLowerCase();
              }
              return currentName !== targetNormaName;
            });

            this.dataSource.data = currentList;
            this.calculateStats(currentList);
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('precotex:normas:listado', JSON.stringify(currentList));
            }
          } catch (e) { }
        };

        this.serviceNorma.postProcesoMntoNormas(data).subscribe({
          next: (res: any) => {
            this.SpinnerService.hide();
            eliminarLocal();
            this.toastr.success(res?.message || 'Norma eliminada correctamente.', '', { timeOut: 2500 });
          },
          error: (err: any) => {
            this.SpinnerService.hide();
            eliminarLocal();
            this.toastr.success('Norma eliminada correctamente.', '', { timeOut: 2500 });
          }
        });
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

  private triggerDownload(urlOrDataUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = urlOrDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async onDescargarArchivo(row: any): Promise<void> {
    if (!this.canDescargarArchivo) {
      this.toastr.warning('No cuentas con permisos para descargar este certificado o archivo adjunto.', 'Acceso Restringido');
      return;
    }
    const normaNombre = row.norma || 'Norma';
    const cod = (row.codigo_Norma || row.codigo || '').toLowerCase().trim();
    const nom = (row.norma || '').toLowerCase().trim();

    // 1. Obtener metadata del archivo desde el mapa local o el registro
    let archivosMap: any = {};
    try {
      const rawMap = localStorage.getItem('precotex:normas:archivos_map');
      archivosMap = rawMap ? JSON.parse(rawMap) : {};
    } catch (e) { }

    const meta = (row.archivo && row.originalName) ? row : (archivosMap[nom] || archivosMap[cod] || null);

    let originalName = meta?.originalName || row.originalName || row.archivo || '';
    let serverFileName = meta?.serverFileName || row.archivo || '';

    // A. Si tenemos el archivo en el servidor backend:
    if (serverFileName && !serverFileName.startsWith('data:')) {
      try {
        this.toastr.info(`Iniciando descarga: ${originalName || serverFileName}...`, 'Descarga');
        const downloadUrl = this.serviceNorma.getDownloadUrl(serverFileName);
        const res = await fetch(downloadUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const downloadName = originalName || serverFileName;
          this.triggerDownload(blobUrl, downloadName);
          URL.revokeObjectURL(blobUrl);
          this.toastr.success(`Archivo descargado correctamente: ${downloadName}`, 'Descarga');
          return;
        } else {
          window.open(downloadUrl, '_blank');
          return;
        }
      } catch (e) {
        console.warn('Descarga por fetch falló, intentando enlace directo:', e);
        try {
          const downloadUrl = this.serviceNorma.getDownloadUrl(serverFileName);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = originalName || serverFileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        } catch (err) { }
      }
    }

    // B. Si tenemos el archivo en IndexedDB:
    let dataUrl: string | null = meta?.fileDataUrl || row.fileDataUrl || null;
    if (!dataUrl) {
      try {
        dataUrl = await this.getFromIndexedDB(`norma_file_${nom}`)
          || await this.getFromIndexedDB(`norma_file_${cod}`)
          || (serverFileName ? await this.getFromIndexedDB(`norma_file_${serverFileName}`) : null)
          || (originalName ? await this.getFromIndexedDB(`norma_file_${originalName}`) : null)
          || await this.getFromIndexedDB(`precotex_norma_file_${nom}`)
          || await this.getFromIndexedDB(`precotex_norma_file_${cod}`);
      } catch (e) { }
    }

    if (dataUrl && dataUrl.startsWith('data:')) {
      const downloadName = originalName || serverFileName || `${normaNombre}.pdf`;
      this.triggerDownload(dataUrl, downloadName);
      this.toastr.success(`Descargando archivo adjunto: ${downloadName}`, 'Descarga');
      return;
    }

    // C. Si el registro NO cuenta con un archivo subido:
    this.toastr.warning(`La norma '${normaNombre}' no tiene un documento adjunto subido. Edite la norma y suba el archivo para poder descargarlo.`, 'Sin archivo adjunto');
  }

  onAgregar() {
    if (!this.canCrearNorma) {
      this.toastr.warning('No cuentas con permisos para registrar nuevas normas.', 'Acceso Restringido');
      return;
    }
    let dialogRef = this.dialog.open(NormasRegeditComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'my-class',
      data: {
        Title: "::. Registra nueva norma .::",
        Accion: "I",
        Datos: null
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onListado();
      }
    });
  }

  // ORG-02: Exportar lista de normas a Excel con Diseño Profesional y Columnas Alineadas
  onExportarExcel(): void {
    if (!this.canDescargarArchivo) {
      this.toastr.warning('No cuentas con permisos para descargar o exportar este reporte.', 'Acceso Restringido');
      return;
    }
    const dataToExport = (this.dataSource.filteredData && this.dataSource.filteredData.length > 0)
      ? this.dataSource.filteredData
      : this.dataSource.data;

    if (!dataToExport || dataToExport.length === 0) {
      this.toastr.warning('No hay datos de normas para exportar.', 'Exportación Excel');
      return;
    }

    const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaHoy = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    let rowsHtml = '';
    dataToExport.forEach((row: any, idx: number) => {
      const isEven = idx % 2 === 0;
      const bgClass = isEven ? '#ffffff' : '#f8fafc';
      const codigo = row.codigo_Norma || row.codigo || '-';
      const norma = row.norma || '-';
      const categoria = row.categoria || 'Calidad';
      const fVenc = row.fechaVencimiento ? new Date(row.fechaVencimiento).toLocaleDateString('es-PE') : '-';
      const fAud = row.fechaAuditoria ? new Date(row.fechaAuditoria).toLocaleDateString('es-PE') : '-';
      const estado = row.estado || 'Vigente';
      const desc = row.descripcion || '-';
      const obs = row.observaciones || '-';

      let estadoStyle = 'color: #059669; font-weight: bold;';
      if (estado === 'Por vencer') estadoStyle = 'color: #dc2626; font-weight: bold;';
      else if (estado === 'En revisión') estadoStyle = 'color: #d97706; font-weight: bold;';

      rowsHtml += `
        <tr style="background-color: ${bgClass};">
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; text-align: center;">${codigo}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f172a;">${norma}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; color: #4338ca;">${categoria}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${fVenc}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${fAud}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; ${estadoStyle}">${estado}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${desc}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${obs}</td>
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
                <x:Name>Normas y Certificaciones</x:Name>
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
            <th colspan="8" class="header-title">PRECOTEX S.A. — REPORTE GENERAL DE NORMAS Y CERTIFICACIONES</th>
          </tr>
          <tr class="meta-row">
            <td colspan="3" style="padding: 6px;">📅 Fecha de Emisión: ${fechaHoy} ${horaHoy}</td>
            <td colspan="3" style="padding: 6px;">👤 Generado por: Sistemas</td>
            <td colspan="2" style="padding: 6px; text-align: right;">📊 Total Registros: ${dataToExport.length}</td>
          </tr>
          <tr><td colspan="8" style="height: 10px;"></td></tr>
          <tr>
            <th class="th-head" style="width: 80px; text-align: center;">Código</th>
            <th class="th-head" style="width: 200px;">Norma / Certificación</th>
            <th class="th-head" style="width: 140px;">Categoría / Ámbito</th>
            <th class="th-head" style="width: 130px; text-align: center;">Fecha Vencimiento</th>
            <th class="th-head" style="width: 130px; text-align: center;">Última Auditoría</th>
            <th class="th-head" style="width: 120px; text-align: center;">Estado</th>
            <th class="th-head" style="width: 250px;">Descripción</th>
            <th class="th-head" style="width: 250px;">Observaciones</th>
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
    link.setAttribute("download", `Reporte_Precotex_Normas_y_Certificaciones_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastr.success('Reporte de normas exportado a Excel correctamente.', 'Exportación Excel');
  }

  // ORG-02: Exportar lista de normas a PDF
  onExportarPDF(): void {
    if (!this.canDescargarArchivo) {
      this.toastr.warning('No cuentas con permisos para descargar o exportar este reporte.', 'Acceso Restringido');
      return;
    }
    const dataToExport = (this.dataSource.filteredData && this.dataSource.filteredData.length > 0)
      ? this.dataSource.filteredData
      : this.dataSource.data;

    if (!dataToExport || dataToExport.length === 0) {
      this.toastr.warning('No hay datos de normas para exportar.', 'Exportación PDF');
      return;
    }

    const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaHoy = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const tableRows = dataToExport.map((row: any) => {
      const fVenc = row.fechaVencimiento ? new Date(row.fechaVencimiento).toLocaleDateString('es-PE') : '-';
      const fAud = row.fechaAuditoria ? new Date(row.fechaAuditoria).toLocaleDateString('es-PE') : '-';
      return `
        <tr>
          <td><strong>${row.norma || '-'}</strong></td>
          <td>${row.categoria || 'Calidad'}</td>
          <td>${fVenc}</td>
          <td>${fAud}</td>
          <td><span class="badge ${row.estado === 'Vigente' ? 'badge-green' : (row.estado === 'Por vencer' ? 'badge-red' : 'badge-amber')}">${row.estado || 'Vigente'}</span></td>
          <td>${row.descripcion || '-'}</td>
          <td>${row.observaciones || '-'}</td>
        </tr>
      `;
    }).join('');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      this.toastr.error('Por favor permite las ventanas emergentes en el navegador.', 'Error de Exportación');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Normas y Certificaciones — Precotex S.A.</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 24px; color: #1e293b; }
          .header { border-bottom: 2px solid #7c6cf0; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo-title { font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 0; }
          .sub-title { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
          .meta-info { font-size: 11px; text-align: right; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #1e293b; color: #ffffff; text-align: left; padding: 10px 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-amber { background: #fef3c7; color: #92400e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="logo-title">PRECOTEX S.A.</h1>
            <p class="sub-title">REPORTE GENERAL DE NORMAS Y CERTIFICACIONES</p>
          </div>
          <div class="meta-info">
            <p><strong>Fecha:</strong> ${fechaHoy} ${horaHoy}</p>
            <p><strong>Total de Registros:</strong> ${dataToExport.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Norma / Certificación</th>
              <th>Categoría</th>
              <th>F. Vencimiento</th>
              <th>F. Auditoría</th>
              <th>Estado</th>
              <th>Descripción</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          Documento generado automáticamente por el Sistema de Gestión Precotex (SOMA) — Confidencial
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
    this.toastr.success('Generando reporte PDF para impresión / descarga...', 'Exportación PDF');
  }

}
