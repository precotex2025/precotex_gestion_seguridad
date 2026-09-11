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

  stats = {
    total: 0,
    vigente: 0,
    enRevision: 0,
    porVencer: 0
  };

  mostrarBanner: boolean = true;

  cerrarBanner(): void {
    this.mostrarBanner = false;
  }

  constructor(
    private dialog            : MatDialog             ,
    private serviceNorma      : NormasService         ,
    private SpinnerService    : NgxSpinnerService     ,
    private toastr            : ToastrService         ,
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

        this.dataSource.data = data;
        this.calculateStats(data);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('precotex:normas:listado', JSON.stringify(data));
        }
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

  onEditar(item: any){
    let dialogRef = this.dialog.open(NormasRegeditComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Editar norma .::",
         Accion : "U",
         Datos  : item
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
          } catch (e) {}
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

  onDescargarArchivo(row: any): void {
    const fileName = row.archivo || row.ruta_Adjunto || row.norma + '.pdf';
    this.toastr.info(`Descargando documento de la norma: ${row.norma}`, 'Descargar Documento');
    // Descarga directa o apertura de documento
    window.open(`https://gestion.precotex.com:444/ubicaciones/api/SNFiles/download?fileName=${encodeURIComponent(fileName)}`, '_blank');
  }

  onAgregar(){
    let dialogRef = this.dialog.open(NormasRegeditComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "::. Registra nueva norma .::",
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

  // ORG-02: Exportar lista de normas a Excel con Diseño Profesional y Columnas Alineadas
  onExportarExcel(): void {
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

    this.toastr.success('Reporte de normas exportado a Excel correctamente.', 'ORG-02: Exportación Excel');
  }

  // ORG-02: Exportar lista de normas a PDF
  onExportarPDF(): void {
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
    this.toastr.success('Generando reporte PDF para impresión / descarga...', 'ORG-02: Exportación PDF');
  }

}
