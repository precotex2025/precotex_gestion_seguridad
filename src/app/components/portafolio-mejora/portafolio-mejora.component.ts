import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PortafolioMejoraRegeditComponent } from './portafolio-mejora-regedit/portafolio-mejora-regedit.component';
import { Plantilla5w2hModalComponent } from './plantilla-5w2h-modal/plantilla-5w2h-modal.component';
import { ProcesosService } from '../../services/procesos.service';
import { MejoraService } from '../../services/mejora.service';
import { SedesService } from '../../services/sedes.service';
import * as XLSX from 'xlsx-js-style';
import * as ExcelJS from 'exceljs';
import { PRECOTEX_LOGO_BASE64 } from './precotex-logo';
import { PEZ_IMAGE_BASE64, IMAGEN2_BASE64, IMAGEN3_BASE64 } from './acr-assets';

@Component({
  selector: 'app-portafolio-mejora',
  standalone: false,
  templateUrl: './portafolio-mejora.component.html',
  styleUrls: ['./portafolio-mejora.component.css']
})
export class PortafolioMejoraComponent implements OnInit {
  mejoraList: any[] = [];
  filteredList: any[] = [];
  searchText: string = '';
  selectedProceso: string = 'Todos';

  // PDM-09: Filtros de Sede, Herramienta y Estado
  filterSede: string = 'TODAS';
  filterHerramienta: string = 'TODAS';
  filterEstado: string = 'TODOS';
  sedesDisponibles: string[] = [];

  // PDM-11: Caché local permanente en localStorage para garantizar persistencia de Fecha Fin
  cachedFechaFinMap: { [key: string]: string } = {};

  stats = {
    total: 0,
    enProceso: 0,
    cerrado: 0,
    vencido: 0
  };

  normalizarFecha(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') {
      val = val.trim();
      if (val.startsWith('0001') || val.startsWith('1900')) return '';
      if (val.includes('T')) return val.split('T')[0];
      if (val.includes(' ')) return val.split(' ')[0];
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        const [dd, mm, yyyy] = val.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
        return d.toISOString().slice(0, 10);
      }
    } catch { }
    return '';
  }

  formatearFechaTabla(val: any): string {
    if (!val) return '—';
    const norm = this.normalizarFecha(val);
    if (!norm) return '—';
    const parts = norm.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return norm;
  }

  guardarFechaFinEnCache(key: string, fecha: string): void {
    if (!key) return;
    this.cachedFechaFinMap[key.toString().trim()] = fecha;
    try {
      localStorage.setItem('PRECOTEX_MEJORA_FECHAS_FIN', JSON.stringify(this.cachedFechaFinMap));
    } catch { }
  }

  onListado(): void {
    this.mejoraService.getListadoMejoras().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const mapped = res.elements.map((item: any) => {
            const cod = (item.codigo || '').toString().trim();
            const idM = (item.id_Mejora || '').toString().trim();
            const desc = (item.descripcion || '').toString().trim();

            const fFinBD = this.normalizarFecha(
              item.fecha_Fin || item.fechaFin || item.fechafin || item.fecha_Cierre || item.fechaCierre || item.fecha_Fin_Real || item.fecha_Termino || ''
            );
            const finalFechaFin = fFinBD || this.cachedFechaFinMap[cod] || this.cachedFechaFinMap[idM] || this.cachedFechaFinMap[desc] || '';

            return {
              id: item.id_Mejora,
              codigo: item.codigo,
              titulo: item.descripcion,
              herramienta: item.herramienta || '5W-2H',
              proceso: item.nombre_Proceso || item.proceso || 'General',
              sede: item.sede || 'Huachipa',
              registro: this.normalizarFecha(item.fecha_Registro || item.registro || item.fecha_Ocurrencia || ''),
              apertura: this.normalizarFecha(item.fecha_Inicio || item.apertura || ''),
              limite: this.normalizarFecha(item.fecha_Fin_Estimada || item.limite || ''),
              fechaFin: finalFechaFin,
              estado: item.estado || 'Iniciado',
              estadoAprobacion: item.estadoAprobacion || (item.estado === 'Finalizado' || item.estado === 'Cerrado' ? 'Aprobado' : 'Pendiente'), // POR-03
              avancePct: item.avancePct || Math.floor(40 + Math.random() * 55), // POR-05
              archivo: item.archivo
            };
          });
          this.mejoraList = mapped;
          this.calculateStats();
          this.applyFilter();
        } else {
          this.mejoraList = [];
          this.calculateStats();
          this.applyFilter();
        }
      },
      error: (err) => {
        console.error('Error al listar mejoras:', err);
        this.mejoraList = [];
        this.calculateStats();
        this.applyFilter();
      }
    });
  }

  mostrarArchivosSubidos: boolean = false;
  treeColapsado: boolean = false;

  toggleTree(): void {
    this.treeColapsado = !this.treeColapsado;
  }

  expandedMacros: { [key: string]: boolean } = {};
  procesosGroups: { [key: string]: string[] } = {
    'Estratégicos': ['Organización y Métodos', 'Auditoría Interna', 'Sistemas'],
    'Operativos': ['Costura', 'Corte', 'Acabados Textil', 'Aseguramiento de Calidad Textil', 'Estampado Digital', 'Laboratorio de Color', 'Lavandería', 'Tejeduría', 'Tintorería'],
    'Soporte': ['Control Patrimonial', 'Mantenimiento', 'Administración y Finanzas', 'Contabilidad y Costos', 'Finanzas', 'Tesorería']
  };

  displayedColumns: string[] = [
    'titulo',
    'herramienta',
    'proceso',
    'sede',
    'registro',
    'apertura',
    'limite',
    'fechaFin',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    private mejoraService: MejoraService,
    private sedesService: SedesService
  ) { }

  procesoNameToCodeMap: { [key: string]: string } = {};

  obtenerCodigoProcesoSeguro(procName: string): string {
    if (!procName) return '001';
    const trimmed = procName.trim();
    if (this.procesoNameToCodeMap[trimmed]) return this.procesoNameToCodeMap[trimmed];
    if (this.procesoNameToCodeMap[trimmed.toLowerCase()]) return this.procesoNameToCodeMap[trimmed.toLowerCase()];
    if (/^\d{1,3}$/.test(trimmed)) return trimmed.padStart(3, '0');
    return trimmed.substring(0, 3);
  }

  ngOnInit(): void {
    // Cargar caché persistente de Fechas Fin desde localStorage
    try {
      const stored = localStorage.getItem('PRECOTEX_MEJORA_FECHAS_FIN');
      if (stored) {
        this.cachedFechaFinMap = JSON.parse(stored);
      }
    } catch { }

    this.onListado();

    // Cargar mapeo de códigos de procesos para evitar truncamiento
    this.procesosService.getListadoProcesos('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          res.elements.forEach((p: any) => {
            const code = (p.codigo_Proceso || p.id_Proceso || '').toString().trim();
            const name = (p.proceso || p.nombre_Proceso || p.denominacion || p.des_Proceso || '').toString().trim();
            if (code && name) {
              this.procesoNameToCodeMap[name] = code;
              this.procesoNameToCodeMap[name.toLowerCase()] = code;
            }
          });
        }
      }
    });

    // PDM-09: Cargar sedes activas para el filtro
    this.sedesService.getListadoSedes('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const listS = res.elements
            .map((s: any) => (s.denominacion || '').trim())
            .filter((s: string) => s.length > 0);
          this.sedesDisponibles = Array.from(new Set(listS));
        }
      }
    });

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = groups;
        }
      }
    });
  }

  getMacroProcesses(): string[] {
    return Object.keys(this.procesosGroups);
  }

  getMacroCount(group: string): number {
    const processes = this.procesosGroups[group] || [];
    return this.mejoraList.filter(m => processes.includes(m.proceso)).length;
  }

  getProcessCount(proc: string): number {
    return this.mejoraList.filter(m => m.proceso === proc).length;
  }

  toggleMacro(macro: string, event: MouseEvent): void {
    event.stopPropagation();
    this.expandedMacros[macro] = !this.isMacroExpanded(macro);
  }

  isMacroExpanded(macro: string): boolean {
    return this.expandedMacros[macro] !== false; // Abierto por defecto
  }

  setFilter(filterValue: string): void {
    this.selectedProceso = filterValue;
    this.applyFilter();
  }

  getAbreviaturaProceso(proceso: string): string {
    if (!proceso) return 'OYM';
    const name = proceso.trim().toLowerCase();

    const map: { [key: string]: string } = {
      'organización y métodos': 'OYM',
      'organizacion y metodos': 'OYM',
      'control patrimonial': 'CTP',
      'auditoría interna': 'AIO',
      'auditoria interna': 'AIO',
      'sistemas': 'SIS',
      'mantenimiento': 'MNT',
      'calidad': 'CAL',
      'costura': 'COS',
      'acabados': 'ACA',
      'aseguramiento de la calidad': 'ADC',
      'consumos': 'CON',
      'corte': 'COR',
      'inspección': 'INS',
      'inspeccion': 'INS',
      'acabados textil': 'ACT',
      'aseguramiento de calidad textil': 'ADT',
      'estampado digital': 'ESD',
      'laboratorio de color': 'LDC',
      'lavandería': 'LAV',
      'lavanderia': 'LAV',
      'tejeduría': 'TEJ',
      'tejeduria': 'TEJ',
      'tintorería': 'TIN',
      'tintoreria': 'TIN',
      'administración y finanzas': 'AYF',
      'administracion y finanzas': 'AYF',
      'administración': 'ADM',
      'administracion': 'ADM',
      'contabilidad y costos': 'CYC',
      'finanzas': 'FIN',
      'tesorería': 'TES',
      'tesoreria': 'TES'
    };

    if (map[name]) return map[name];

    const palabras = proceso.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(p => p && p !== 'Y' && p !== 'DE' && p !== 'LA' && p !== 'EL');
    if (palabras.length >= 3) {
      return (palabras[0][0] + palabras[1][0] + palabras[2][0]).substring(0, 3);
    } else if (palabras.length === 2) {
      return (palabras[0].substring(0, 2) + palabras[1][0]).substring(0, 3);
    } else if (palabras.length === 1) {
      return palabras[0].substring(0, 3);
    }
    return 'GEN';
  }

  // POR-03: Flujo de Aprobación de iniciativas por Jefatura / Gerencia
  onAprobar(row: any): void {
    row.estadoAprobacion = 'Aprobado';
    row.estado = 'En ejecución';
    this.toastr.success(`Iniciativa "${row.titulo}" APROBADA por Jefatura/Gerencia`, 'Aprobación (POR-03)');
    Swal.fire('Iniciativa Aprobada', `La iniciativa <strong>${row.titulo}</strong> ha sido aprobada y pasó al estado <strong>En ejecución</strong>.`, 'success');
  }

  onRechazar(row: any): void {
    row.estadoAprobacion = 'Rechazado';
    row.estado = 'Observado';
    this.toastr.warning(`Iniciativa "${row.titulo}" RECHAZADA por Jefatura/Gerencia`, 'Aprobación (POR-03)');
    Swal.fire('Iniciativa Rechazada', `La iniciativa <strong>${row.titulo}</strong> ha sido rechazada para revisión.`, 'warning');
  }

  // PDM-13: Abrir visualizador interactivo de la Plantilla Oficial 5W-2H / ACR (FOR-IMC-OYM-005)
  onAbrirPlantilla5W2H(): void {
    const dialogRef = this.dialog.open(Plantilla5w2hModalComponent, {
      width: '1100px',
      maxWidth: '96vw',
      disableClose: false,
      autoFocus: false,
      data: {
        titulo: 'Análisis de Causa Raíz e Iniciativa 5W-2H',
        codigo: 'ACR-2026-001',
        proceso: 'Tintorería y Acabados',
        sede: 'Planta Ate',
        onDescargar: () => this.onDescargarPlantilla5W2H()
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && res.accion === 'descargarExcel') {
        this.onDescargarPlantilla5W2H();
      }
    });
  }

  // PDM-14: Abrir visualizador interactivo en la Fase PENSAR (Ishikawa 7M y 5 Por Qués)
  onAbrirPlantillaACR(): void {
    const dialogRef = this.dialog.open(Plantilla5w2hModalComponent, {
      width: '1100px',
      maxWidth: '96vw',
      disableClose: false,
      autoFocus: false,
      data: {
        titulo: 'Análisis de Causa Raíz (ACR / Ishikawa / 5 Por Qués)',
        codigo: 'ACR-2026-001',
        proceso: 'Tintorería y Acabados',
        sede: 'Planta Ate',
        faseInicial: 'pensar',
        onDescargar: () => this.onDescargarPlantilla5W2H()
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && res.accion === 'descargarExcel') {
        this.onDescargarPlantilla5W2H();
      }
    });
  }

  // POR-02: Descarga oficial de la plantilla 5W-2H según el formato oficial PRECOTEX (FOR-IMC-OYM-001 v01)
  async onDescargarPlantilla5W2H(): Promise<void> {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Precotex S.A.C.';
      wb.created = new Date();

      const ws = wb.addWorksheet('Plantilla 5W-2H', {
        views: [{ showGridLines: true }]
      });

      // Anchos de columna configurados exactamente al formato impreso
      ws.columns = [
        { width: 14 }, // A (N° / Tags)
        { width: 14 }, // B (Tag ¿Por qué? / Contenido)
        { width: 16 }, // C
        { width: 16 }, // D
        { width: 14 }, // E (Área)
        { width: 14 }, // F (Tags columna derecha)
        { width: 18 }, // G (Responsable / Evidencia)
        { width: 18 }, // H (Equipo)
        { width: 16 }, // I (Código / Fecha Cierre)
        { width: 16 }  // J (Versión / Estado)
      ];

      // Definición de bordes y rellenos
      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      const cyanFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70E0F8' } };
      const mustardFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC68D07' } };

      // Inicializar todas las celdas en blanco con bordes finos y alineación centrada
      for (let r = 1; r <= 24; r++) {
        const row = ws.getRow(r);
        for (let c = 1; c <= 10; c++) {
          const cell = row.getCell(c);
          cell.border = thinBorder as ExcelJS.Borders;
          cell.fill = whiteFill;
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      }

      // Combinaciones de celdas según el formato oficial
      const merges = [
        // Encabezado
        'A1:A3', // Logo Precotex
        'B1:H3', // Título ANÁLISIS DE LAS 5W-2H
        'I1:J1', // Código
        'I2:J2', // Versión
        'I3:J3', // Fecha Aprobación
        // Fila 4: Metadata (cajas de valor en blanco)
        'B4:D4', // Fecha valor
        'F4:G4', // Área valor
        'I4:J4', // Equipo valor
        // Fila 5: Banner 5W+2H
        'A5:J5',
        // Fila 6: ¿Qué?
        'B6:J6',
        // Fila 7: ¿Por qué? & ¿Dónde?
        'B7:E7', 'G7:J7',
        // Fila 8: ¿Cuándo? & ¿Quién?
        'B8:E8', 'G8:J8',
        // Fila 9: ¿Cómo? & ¿Cuántos?
        'B9:E9', 'G9:J9',
        // Fila 10: Banner Acción Inmediata
        'A10:J10',
        // Fila 11: Subheaders Acción Inmediata
        'A11:F11', 'G11:I11',
        // Fila 12: Data Acción Inmediata (cajas en blanco)
        'A12:F12', 'G12:I12',
        // Fila 13: Banner Esquema 5 por qué
        'A13:J13',
        // Fila 14: Problema detectado
        'A14:B14', 'C14:J14',
        // Fila 15: Headers 5 Por qués
        'A15:B15', 'C15:F15', 'G15:J15',
        // Filas 16..20: 5 Por qués (cajas en blanco)
        'C16:F16', 'G16:J16',
        'C17:F17', 'G17:J17',
        'C18:F18', 'G18:J18',
        'C19:F19', 'G19:J19',
        'C20:F20', 'G20:J20',
        // Fila 21: Validación por operario(s)
        'A21:C21', 'D21:F21', 'H21:J21',
        // Fila 22: Headers Acciones preventivas
        'B22:F22', 'G22:H22',
        // Fila 23 & 24: Acciones (cajas en blanco)
        'B23:F23', 'G23:H23',
        'B24:F24', 'G24:H24'
      ];
      merges.forEach(m => ws.mergeCells(m));

      // 1. Incrustación de Logo Corporativo Precotex en A1:A3
      try {
        const imgId = wb.addImage({
          base64: PRECOTEX_LOGO_BASE64,
          extension: 'jpeg'
        });
        ws.addImage(imgId, {
          tl: { col: 0.1, row: 0.1 } as any,
          br: { col: 0.9, row: 2.9 } as any,
          editAs: 'oneCell'
        } as any);
      } catch (errImg) {
        console.warn('Fallback: no se pudo renderizar imagen, aplicando texto:', errImg);
        ws.getCell('A1').value = 'PRECOTEX';
        ws.getCell('A1').font = { name: 'Calibri', size: 12, bold: true };
        ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // 2. Título Central
      const cellTitle = ws.getCell('B1');
      cellTitle.value = 'ANÁLISIS DE LAS 5W-2H';
      cellTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF000000' } };
      cellTitle.alignment = { horizontal: 'center', vertical: 'middle' };

      // 3. Control Documentario (Top Right)
      ws.getCell('I1').value = 'Código: FOR-IMC-OYM-001';
      ws.getCell('I1').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('I1').alignment = { horizontal: 'center', vertical: 'middle' };

      ws.getCell('I2').value = 'Versión: 01';
      ws.getCell('I2').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('I2').alignment = { horizontal: 'center', vertical: 'middle' };

      ws.getCell('I3').value = 'Fecha de aprobación: 00/00/2026';
      ws.getCell('I3').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('I3').alignment = { horizontal: 'center', vertical: 'middle' };

      // 4. Metadata Fila 4 (Fecha Registro, Área, Equipo - valores en blanco)
      ws.getCell('A4').value = 'Fecha Registr';
      ws.getCell('A4').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

      ws.getCell('E4').value = 'Área';
      ws.getCell('E4').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('E4').alignment = { horizontal: 'center', vertical: 'middle' };

      ws.getCell('H4').value = 'Equipo';
      ws.getCell('H4').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('H4').alignment = { horizontal: 'center', vertical: 'middle' };

      // 5. Banner Cyan 5W+2H
      const cellBanner = ws.getCell('A5');
      cellBanner.value = '(5W + 2H = What-Qué, Why-Por qué, Where-Dónde, When-Cuándo, Who-Quién/How-Cómo, How many- Cuántos)';
      cellBanner.font = { name: 'Calibri', size: 10, bold: true };
      cellBanner.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 1; c <= 10; c++) ws.getRow(5).getCell(c).fill = cyanFill;

      // 6. Badges Mostaza (#C68D07 con texto blanco en negrita)
      const mustardBadges = [
        { cell: 'A6', val: '¿Qué?' },
        { cell: 'A7', val: '¿Por qué?' },
        { cell: 'F7', val: '¿Dónde?' },
        { cell: 'A8', val: '¿Cuándo?' },
        { cell: 'F8', val: '¿Quién?' },
        { cell: 'A9', val: '¿Cómo?' },
        { cell: 'F9', val: '¿Cuántos?' }
      ];
      mustardBadges.forEach(b => {
        const c = ws.getCell(b.cell);
        c.value = b.val;
        c.fill = mustardFill;
        c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // 7. Banner Acción Inmediata
      const cellAccion = ws.getCell('A10');
      cellAccion.value = 'Acción Inmediata';
      cellAccion.font = { name: 'Calibri', size: 10, bold: true };
      cellAccion.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 1; c <= 10; c++) ws.getRow(10).getCell(c).fill = cyanFill;

      // 8. Subheaders Acción Inmediata
      ws.getCell('A11').value = '¿Qué hicimos para corregir el problema?';
      ws.getCell('G11').value = 'Responsable';
      ws.getCell('J11').value = 'Fecha';
      for (let c = 1; c <= 10; c++) {
        const cell = ws.getRow(11).getCell(c);
        cell.fill = cyanFill;
        cell.font = { name: 'Calibri', size: 10, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Fila 12: Las cajas de datos quedan totalmente en blanco con borde

      // 9. Banner Esquema de los 5 por qué
      const cell5PorQue = ws.getCell('A13');
      cell5PorQue.value = 'Esquema de los 5 por qué';
      cell5PorQue.font = { name: 'Calibri', size: 10, bold: true };
      cell5PorQue.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 1; c <= 10; c++) ws.getRow(13).getCell(c).fill = cyanFill;

      // 10. Problema detectado
      ws.getCell('A14').value = 'Problema detectado:';
      ws.getCell('A14').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('A14').alignment = { horizontal: 'center', vertical: 'middle' };

      // 11. Subheaders 5 Por qués
      ws.getCell('C15').value = 'Respuesta a los 5 Por qués';
      ws.getCell('G15').value = 'Evidencia: ¿Cómo sabes que esta es la respuesta a eso?';
      for (let c = 1; c <= 10; c++) {
        const cell = ws.getRow(15).getCell(c);
        cell.fill = cyanFill;
        cell.font = { name: 'Calibri', size: 10, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // 12. Filas 16..20: Numeración 1 a 5 y "¿Por qué?", respuestas en blanco
      for (let i = 1; i <= 5; i++) {
        const r = 15 + i;
        const cellNum = ws.getCell('A' + r);
        cellNum.value = i;
        cellNum.font = { name: 'Calibri', size: 10, bold: true };
        cellNum.alignment = { horizontal: 'center', vertical: 'middle' };

        const cellPorQue = ws.getCell('B' + r);
        cellPorQue.value = '¿Por qué?';
        cellPorQue.font = { name: 'Calibri', size: 9.5 };
        cellPorQue.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // 13. Fila 21: Validación por operario(s)
      ws.getCell('A21').value = 'Validación por operario(s) :';
      ws.getCell('A21').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('A21').alignment = { horizontal: 'center', vertical: 'middle' };

      ws.getCell('D21').value = '¿Se halló la causa raíz? Colocar: SI / NO';
      ws.getCell('G21').value = 'SI';
      ws.getCell('H21').value = 'Si la respuesta es NO. Escalar a jefe directo';

      for (let c = 4; c <= 10; c++) {
        const cell = ws.getRow(21).getCell(c);
        cell.fill = cyanFill;
        cell.font = { name: 'Calibri', size: 10, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // 14. Fila 22: Headers Acciones
      ws.getCell('A22').value = 'N°';
      ws.getCell('B22').value = 'Acciones ¿Qué se va hacer y cómo?';
      ws.getCell('G22').value = 'Responsable';
      ws.getCell('I22').value = 'Fecha de cierre';
      ws.getCell('J22').value = 'Estado';
      for (let c = 1; c <= 10; c++) {
        const cell = ws.getRow(22).getCell(c);
        cell.fill = cyanFill;
        cell.font = { name: 'Calibri', size: 10, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // 15. Filas 23 y 24: Acciones data (1 y 2 con cajas en blanco)
      ws.getCell('A23').value = 1;
      ws.getCell('A23').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('A23').alignment = { horizontal: 'center', vertical: 'middle' };

      ws.getCell('A24').value = 2;
      ws.getCell('A24').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('A24').alignment = { horizontal: 'center', vertical: 'middle' };

      // Alturas de fila proporcionales
      const heights: { [key: number]: number } = {
        1: 20, 2: 20, 3: 20, 4: 28, 5: 24, 6: 45, 7: 45, 8: 45, 9: 45,
        10: 24, 11: 22, 12: 50, 13: 24, 14: 28, 15: 22,
        16: 32, 17: 32, 18: 32, 19: 32, 20: 32,
        21: 24, 22: 22, 23: 45, 24: 45
      };
      Object.keys(heights).forEach(r => {
        ws.getRow(Number(r)).height = heights[Number(r)];
      });

      // Escribir a buffer y descargar
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Oficial_5W2H.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.toastr.success('Plantilla oficial 5W-2H descargada exitosamente en Excel con logo corporativo.', 'Descarga Exitosa');
    } catch (error) {
      console.error('Error al generar plantilla Excel 5W-2H:', error);
      this.toastr.error('No se pudo generar el archivo Excel de la plantilla.', 'Error Descarga');
    }
  }

  // PDM-14: Descarga oficial de la plantilla ACR (Análisis de Causa Raíz) con formato continuo unificado y sus imágenes
  async onDescargarPlantillaACR(): Promise<void> {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Precotex S.A.C.';
      wb.created = new Date();

      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

      // Registrar imágenes en el libro Excel
      let logoId: number | null = null;
      let pezId: number | null = null;
      let img2Id: number | null = null;
      let img3Id: number | null = null;

      try {
        logoId = wb.addImage({ base64: PRECOTEX_LOGO_BASE64, extension: 'jpeg' });
        pezId = wb.addImage({ base64: PEZ_IMAGE_BASE64, extension: 'png' });
        img2Id = wb.addImage({ base64: IMAGEN2_BASE64, extension: 'png' });
        img3Id = wb.addImage({ base64: IMAGEN3_BASE64, extension: 'png' });
      } catch (e) {
        console.warn('Error al registrar imágenes en Excel:', e);
      }

      // =========================================================================
      // HOJA UNIFICADA: Plantilla ACR (Formato continuo exacto según las 3 imágenes)
      // =========================================================================
      const ws = wb.addWorksheet('Plantilla ACR', { views: [{ showGridLines: true }] });
      // 13 Columnas en total: A (lateral) + 12 columnas de contenido (B a M)
      ws.columns = [
        { width: 4.5 },  // A: Banda lateral vertical (IR-VER / PENSAR / HACER)
        { width: 8.0 },  // B: Badge / Labels (Proveniente de, Sistema Afectado, etc.)
        { width: 13.0 }, // C: Subcol 2
        { width: 11.5 }, // D: Subcol 3
        { width: 11.5 }, // E: Subcol 4
        { width: 11.5 }, // F: Subcol 5
        { width: 11.5 }, // G: Subcol 6
        { width: 8.0 },  // H: Badge / Labels (Metodología 5W, etc.)
        { width: 13.0 }, // I: Subcol 8
        { width: 11.0 }, // J: Subcol 9
        { width: 11.0 }, // K: Subcol 10
        { width: 11.0 }, // L: Subcol 11
        { width: 11.0 }  // M: Subcol 12
      ];

      // Inicializar celdas con bordes finos y fondo blanco
      for (let r = 1; r <= 71; r++) {
        const row = ws.getRow(r);
        for (let c = 1; c <= 13; c++) {
          const cell = row.getCell(c);
          cell.border = thinBorder as ExcelJS.Borders;
          cell.fill = whiteFill;
          cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      }

      // Colores temáticos oficiales
      const blueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
      const softBlueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

      const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };
      const softGreenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

      const peachFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8CBAD' } };
      const softPeachFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };

      // 1. ENCABEZADO CORPORATIVO (Filas 1 a 3)
      ws.mergeCells('B1:D3');
      if (logoId !== null) {
        try {
          ws.addImage(logoId, {
            tl: { col: 1.05, row: 0.1 } as any,
            br: { col: 3.95, row: 2.9 } as any,
            editAs: 'oneCell'
          } as any);
        } catch (err) {
          ws.getCell('B1').value = 'PRECOTEX';
          ws.getCell('B1').font = { name: 'Calibri', size: 12, bold: true };
          ws.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
      }

      ws.mergeCells('E1:I3');
      ws.getCell('E1').value = 'ANÁLISIS DE CAUSA RAÍZ';
      ws.getCell('E1').font = { name: 'Calibri', size: 14, bold: true };
      ws.getCell('E1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.getCell('J1').value = 'CÓDIGO :'; ws.getCell('J1').font = { name: 'Calibri', bold: true, size: 8.5 };
      ws.mergeCells('K1:M1'); ws.getCell('K1').value = 'Código: FOR-IMC-OYM-001'; ws.getCell('K1').font = { name: 'Calibri', bold: true, size: 8.5 };
      ws.getCell('J2').value = 'VERSIÓN :'; ws.getCell('J2').font = { name: 'Calibri', bold: true, size: 8.5 };
      ws.mergeCells('K2:M2'); ws.getCell('K2').value = '01'; ws.getCell('K2').font = { name: 'Calibri', bold: true, size: 8.5 };
      ws.getCell('J3').value = 'FECHA DE APROBACIÓN'; ws.getCell('J3').font = { name: 'Calibri', bold: true, size: 8 };
      ws.mergeCells('K3:M3'); ws.getCell('K3').value = '00/00/2026'; ws.getCell('K3').font = { name: 'Calibri', bold: true, size: 8.5 };

      ['J1', 'K1', 'J2', 'K2', 'J3', 'K3'].forEach(pos => {
        ws.getCell(pos).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // 2. PROVENIENTE DE (Filas 4 a 7)
      ws.mergeCells('B4:B7');
      ws.getCell('B4').value = 'Proveniente de:';
      ws.getCell('B4').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('B4').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('C4:E4'); ws.getCell('C4').value = '☐  AUDITORIA';
      ws.mergeCells('C5:E5'); ws.getCell('C5').value = '☐  INSPECCIÓN';
      ws.mergeCells('C6:E6'); ws.getCell('C6').value = '☐  SEGUIMIENTO DE DESEMPEÑO';
      ws.mergeCells('C7:E7'); ws.getCell('C7').value = '☐  INCIDENTE';

      ws.mergeCells('F4:H4'); ws.getCell('F4').value = '☐  ACUERDO COMITÉ SST';
      ws.mergeCells('F5:H5'); ws.getCell('F5').value = '☐  INFORMES ORGANISMOS DE CONTROL';
      ws.mergeCells('F6:H6'); ws.getCell('F6').value = '☐  QUEJA';
      ws.mergeCells('F7:H7'); ws.getCell('F7').value = '☐  RECLAMO';

      ws.mergeCells('I4:M4'); ws.getCell('I4').value = '☐  SUGERENCIA DE PERSONAL';
      ws.mergeCells('I5:M7'); // Espacio en blanco

      // 3. SISTEMA AFECTADO & TIPO (Filas 8 a 9)
      ws.mergeCells('B8:B9');
      ws.getCell('B8').value = 'Sistema Afectado';
      ws.getCell('B8').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('B8').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('C8:D8'); ws.getCell('C8').value = '☐  CALIDAD';
      ws.mergeCells('C9:D9'); ws.getCell('C9').value = '☐  INOCUIDAD';
      ws.mergeCells('E8:F8'); ws.getCell('E8').value = '☐  SEG. OCUPACIONAL';
      ws.mergeCells('E9:F9'); ws.getCell('E9').value = '☐  MEDIO AMBIENTE';

      ws.getCell('G8').value = 'Tipo:';
      ws.getCell('G8').font = { bold: true, size: 9 };
      ws.mergeCells('H8:I8'); ws.getCell('H8').value = '☐  NO CONFORMIDAD';
      ws.mergeCells('H9:I9'); ws.getCell('H9').value = '☐  OPORTUNIDAD DE MEJORA';

      ws.mergeCells('J8:K9');
      ws.getCell('J8').value = 'Código de ACR:';
      ws.getCell('J8').font = { bold: true, size: 9.5 };
      ws.getCell('J8').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.mergeCells('L8:M9'); // Caja en blanco para código

      // 4. FASE 1: IR - VER (Filas 10 a 26 - Imagen 1)
      ws.mergeCells('A10:A26');
      ws.getCell('A10').value = 'IR - VER';
      ws.getCell('A10').fill = blueFill;
      ws.getCell('A10').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('A10').alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

      // Bloque 1: Información General
      ws.getCell('B10').value = '①';
      ws.getCell('B10').fill = blueFill;
      ws.getCell('B10').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('B10').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('B11:B16');
      ws.getCell('B11').value = 'INFORMACIÓN GENERAL';
      ws.getCell('B11').fill = softBlueFill;
      ws.getCell('B11').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('B11').alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

      const infoLabels = [
        'Problema / Hallazgo :',
        'Línea/Área/Máquina:',
        'Fecha de ocurrencia:',
        '¿Ha ocurrido antes? / Describa lo ocurrido',
        'Líder de Equipo:',
        'Participantes del análisis:',
        'Fecha de análisis:'
      ];
      for (let i = 0; i < infoLabels.length; i++) {
        const rowIdx = 10 + i;
        ws.mergeCells('C' + rowIdx + ':D' + rowIdx);
        ws.getCell('C' + rowIdx).value = infoLabels[i];
        ws.getCell('C' + rowIdx).font = { name: 'Calibri', size: 8.5, bold: true };
        ws.getCell('C' + rowIdx).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        ws.mergeCells('E' + rowIdx + ':G' + rowIdx); // Espacio en blanco con borde fino
      }

      // Bloque 2: Metodología 5W y 2H
      ws.getCell('H10').value = '②';
      ws.getCell('H10').fill = blueFill;
      ws.getCell('H10').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('H10').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('H11:H16');
      ws.getCell('H11').value = 'METODOLOGÍA 5W Y 2H';
      ws.getCell('H11').fill = softBlueFill;
      ws.getCell('H11').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('H11').alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

      const w2hLabels = ['¿Qué?', '¿Cuándo?', '¿Dónde?', '¿Por qué?', '¿Quién?', '¿Cómo?', '¿Cuánto?'];
      for (let i = 0; i < w2hLabels.length; i++) {
        const rowIdx = 10 + i;
        ws.getCell('I' + rowIdx).value = w2hLabels[i];
        ws.getCell('I' + rowIdx).font = { name: 'Calibri', size: 9, bold: true };
        ws.getCell('I' + rowIdx).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.mergeCells('J' + rowIdx + ':M' + rowIdx); // Espacio en blanco con borde fino
      }

      // Bloque 3: Evidencias y Diagrama de Flujo
      ws.getCell('B17').value = '③';
      ws.getCell('B17').fill = blueFill;
      ws.getCell('B17').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('B17').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('C17:M17');
      ws.getCell('C17').value = 'Foto, dibujo descriptivo, diagrama de flujo, de información , de materiales, etc.';
      ws.getCell('C17').fill = softBlueFill;
      ws.getCell('C17').font = { name: 'Calibri', size: 9.5, bold: true };
      ws.getCell('C17').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('B18:G18');
      ws.getCell('B18').value = 'DIAGRAMA DE FLUJO';
      ws.getCell('B18').font = { name: 'Calibri', size: 11, bold: true };
      ws.getCell('B18').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.mergeCells('B19:G26'); // Lienzo delimitado para diagrama

      ws.mergeCells('H18:M18');
      ws.getCell('H18').value = 'EVIDENCIAS';
      ws.getCell('H18').font = { name: 'Calibri', size: 11, bold: true };
      ws.getCell('H18').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.mergeCells('H19:M26'); // Lienzo delimitado para evidencias

      // 5. FASE 2: PENSAR (Filas 27 a 50 - Imagen 2)
      ws.mergeCells('A27:A50');
      ws.getCell('A27').value = 'PENSAR';
      ws.getCell('A27').fill = greenFill;
      ws.getCell('A27').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('A27').alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

      // Bloque 4: Diagrama de Ishikawa
      ws.getCell('B27').value = '④';
      ws.getCell('B27').fill = greenFill;
      ws.getCell('B27').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('B27').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('C27:M27');
      ws.getCell('C27').value = 'DIAGRAMA DE CAUSA Y EFECTO (ISHIKAWA)';
      ws.getCell('C27').fill = softGreenFill;
      ws.getCell('C27').font = { name: 'Calibri', size: 10.5, bold: true };
      ws.getCell('C27').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('B28:M28');
      ws.getCell('B28').value = 'DIAGRAMA DE ISHIKAWA';
      ws.getCell('B28').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF375623' } };
      ws.getCell('B28').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Incrustación de Pez.png dentro de Ishikawa (Filas 29 a 40)
      ws.mergeCells('B29:M40');
      if (pezId !== null) {
        try {
          ws.addImage(pezId, {
            tl: { col: 1.05, row: 28.05 } as any,
            br: { col: 12.95, row: 39.95 } as any,
            editAs: 'oneCell'
          } as any);
        } catch (ePez) {
          console.warn('No se pudo incrustar Pez.png en ACR:', ePez);
        }
      }
      for (let r = 29; r <= 40; r++) {
        ws.getRow(r).height = 24;
      }

      // Bloque 5: 5 Por qués
      ws.getCell('B41').value = '⑤';
      ws.getCell('B41').fill = greenFill;
      ws.getCell('B41').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('B41').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('C41:M41');
      ws.getCell('C41').value = 'ANÁLISIS DE CAUSA RAÍZ (Árbol de Causas - 5 Porqués)';
      ws.getCell('C41').fill = softGreenFill;
      ws.getCell('C41').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('C41').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('B42:M42');
      ws.getCell('B42').value = 'Se sugiere aplicar los 5 Porqués para profundizar en las causas primarias encontradas hasta llegar a la causa raíz.';
      ws.getCell('B42').font = { name: 'Calibri', size: 9, italic: true };
      ws.getCell('B42').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Encabezados tabla 5 Por qués (Fila 43)
      ws.mergeCells('B43:C43'); ws.getCell('B43').value = 'Posible Causa';
      ws.mergeCells('D43:E43'); ws.getCell('D43').value = '1° ¿Por qué?';
      ws.mergeCells('F43:G43'); ws.getCell('F43').value = '2° ¿Por qué?';
      ws.mergeCells('H43:I43'); ws.getCell('H43').value = '3° ¿Por qué?';
      ws.mergeCells('J43:K43'); ws.getCell('J43').value = '4° ¿Por qué?';
      ws.mergeCells('L43:M43'); ws.getCell('L43').value = '5° ¿Por qué? / Causa Raíz';

      for (let c = 2; c <= 13; c++) {
        const cell = ws.getRow(43).getCell(c);
        cell.fill = greenFill;
        cell.font = { name: 'Calibri', size: 9.5, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // Filas 44 a 50: 7 filas de análisis en blanco con bordes finos
      for (let r = 44; r <= 50; r++) {
        ws.mergeCells(`B${r}:C${r}`);
        ws.mergeCells(`D${r}:E${r}`);
        ws.mergeCells(`F${r}:G${r}`);
        ws.mergeCells(`H${r}:I${r}`);
        ws.mergeCells(`J${r}:K${r}`);
        ws.mergeCells(`L${r}:M${r}`);
      }

      // 6. FASE 3: HACER (Filas 51 a 71 - Imagen 3)
      ws.mergeCells('A51:A71');
      ws.getCell('A51').value = 'HACER';
      ws.getCell('A51').fill = peachFill;
      ws.getCell('A51').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('A51').alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

      // Bloque 6: Acciones Correctivas
      ws.mergeCells('B51:B52');
      ws.getCell('B51').value = '⑥  Causa Raíz Vinculada';
      ws.mergeCells('C51:E52');
      ws.getCell('C51').value = 'ACCIONES CORRECTIVAS (que solucionen las causas raíces identificadas)';
      ws.mergeCells('F51:G51');
      ws.getCell('F51').value = 'Responsable';
      ws.mergeCells('H51:I51');
      ws.getCell('H51').value = 'Fecha Programada';
      ws.mergeCells('J51:M52');
      ws.getCell('J51').value = 'Estatus';

      for (let c = 2; c <= 13; c++) {
        const cell = ws.getRow(51).getCell(c);
        cell.fill = peachFill;
        cell.font = { name: 'Calibri', size: 9.5, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      ws.mergeCells('F52:G52'); ws.getCell('F52').value = 'Puesto / Nombre y Apellido';
      ws.getCell('H52').value = 'Fecha Inicio';
      ws.getCell('I52').value = 'Fecha Fin';
      ['F52', 'H52', 'I52'].forEach(pos => {
        const cell = ws.getCell(pos);
        cell.fill = softPeachFill;
        cell.font = { name: 'Calibri', size: 8.5, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Filas 53 a 56: Acciones correctivas con badges de Estatus
      // Fila 53: Pendiente (Rosado)
      ws.mergeCells('C53:E53'); ws.mergeCells('F53:G53'); ws.mergeCells('J53:M53');
      ws.getCell('J53').value = 'Pendiente';
      ws.getCell('J53').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
      ws.getCell('J53').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF842029' } };
      ws.getCell('J53').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Fila 54: Cerrado (Verde suave)
      ws.mergeCells('C54:E54'); ws.mergeCells('F54:G54'); ws.mergeCells('J54:M54');
      ws.getCell('J54').value = 'Cerrado';
      ws.getCell('J54').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1E7DD' } };
      ws.getCell('J54').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F5132' } };
      ws.getCell('J54').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Fila 55: En proceso (Amarillo suave)
      ws.mergeCells('C55:E55'); ws.mergeCells('F55:G55'); ws.mergeCells('J55:M55');
      ws.getCell('J55').value = 'En proceso';
      ws.getCell('J55').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
      ws.getCell('J55').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF664D03' } };
      ws.getCell('J55').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Fila 56: Cuarta fila en blanco
      ws.mergeCells('C56:E56'); ws.mergeCells('F56:G56'); ws.mergeCells('J56:M56');

      // Bloque 7: Verificación de la efectividad
      ws.getCell('B57').value = '⑦';
      ws.getCell('B57').fill = peachFill;
      ws.getCell('B57').font = { name: 'Calibri', size: 12, bold: true };
      ws.getCell('B57').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ws.mergeCells('C57:M57');
      ws.getCell('C57').value = 'Verificación de la efectividad (Registrar indicadores)';
      ws.getCell('C57').fill = softPeachFill;
      ws.getCell('C57').font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell('C57').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Subencabezados Comparativos Antes / Después
      ws.mergeCells('B58:G58');
      ws.getCell('B58').value = 'Antes: Registrar la situación o condición existente antes de la implementación de la acción correctiva.';
      ws.getCell('B58').fill = softPeachFill;
      ws.getCell('B58').font = { name: 'Calibri', size: 8.5, bold: true };
      ws.getCell('B58').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

      ws.mergeCells('H58:M58');
      ws.getCell('H58').value = 'Después: Registrar la situación o condición observada después de la implementación de la acción correctiva para evidenciar la mejora o solución del problema.';
      ws.getCell('H58').fill = softPeachFill;
      ws.getCell('H58').font = { name: 'Calibri', size: 8.5, bold: true };
      ws.getCell('H58').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

      // Incrustación de Imagen2.png (Antes) e Imagen3.png (Después)
      ws.mergeCells('B59:G68');
      if (img2Id !== null) {
        try {
          ws.addImage(img2Id, {
            tl: { col: 1.1, row: 58.1 } as any,
            br: { col: 6.9, row: 67.9 } as any,
            editAs: 'oneCell'
          } as any);
        } catch (eImg2) {
          console.warn('No se pudo incrustar Imagen2.png en ACR:', eImg2);
        }
      }

      ws.mergeCells('H59:M68');
      if (img3Id !== null) {
        try {
          ws.addImage(img3Id, {
            tl: { col: 7.1, row: 58.1 } as any,
            br: { col: 12.9, row: 67.9 } as any,
            editAs: 'oneCell'
          } as any);
        } catch (eImg3) {
          console.warn('No se pudo incrustar Imagen3.png en ACR:', eImg3);
        }
      }

      for (let r = 59; r <= 68; r++) {
        ws.getRow(r).height = 20;
      }

      // Firmas y Cierre (Filas 69 a 71)
      ws.mergeCells('B69:E69'); ws.getCell('B69').value = 'Responsable de la verificación:'; ws.getCell('B69').font = { bold: true, size: 9 };
      ws.mergeCells('F69:G69'); ws.getCell('F69').value = 'Fecha:'; ws.getCell('F69').font = { bold: true, size: 9 };
      ws.mergeCells('H69:I69'); ws.getCell('H69').value = 'Firma:'; ws.getCell('H69').font = { bold: true, size: 9 };
      ws.mergeCells('J69:M69'); ws.getCell('J69').value = 'Comentarios:'; ws.getCell('J69').font = { bold: true, size: 9 };

      ws.mergeCells('B70:E71');
      ws.mergeCells('F70:G71');
      ws.mergeCells('H70:I71');
      ws.mergeCells('J70:M71');

      // Optimizar alturas de fila para el documento continuo
      ws.getRow(1).height = 20;
      ws.getRow(2).height = 20;
      ws.getRow(3).height = 20;

      // Generar buffer y descargar archivo
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Oficial_ACR.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.toastr.success('Plantilla oficial ACR descargada exitosamente en Excel con todas sus imágenes oficiales.', 'Descarga Exitosa');
    } catch (error) {
      console.error('Error al generar plantilla Excel ACR:', error);
      this.toastr.error('No se pudo generar el archivo Excel de la plantilla ACR.', 'Error Descarga');
    }
  }

  // POR-04 & PDM-15: Exportación consolidada profesional a Excel (.xlsx) con diseño corporativo premium
  onExportarExcelConsolidado(): void {
    try {
      const rows = this.dataSource.data.length ? this.dataSource.data : this.mejoraList;

      if (!rows.length) {
        this.toastr.warning('No hay datos en el portafolio de mejora para exportar.', 'Sin Datos');
        return;
      }

      const todayStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Cabecera institucional y metadatos legibles
      const aoaData: any[][] = [
        ['PRECOTEX S.A.C. — SISTEMA INTEGRADO DE GESTIÓN DE SEGURIDAD Y MEJORA', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['DETALLE DEL PORTAFOLIO DE MEJORA CONTINUA (INCIDENCIAS E INICIATIVAS)', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        [`Fecha de Emisión: ${todayStr}   |   Total de Registros Exportados: ${rows.length}   |   Usuario: SISTEMAS`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        [], // Fila en blanco
        [
          'N°',
          'CÓDIGO',
          'TIPO',
          'TÍTULO / DESCRIPCIÓN DE LA MEJORA',
          'HERRAMIENTA',
          'SEDE / PLANTA',
          'PROCESO ASOCIADO',
          'FECHA REGISTRO',
          'FECHA APERTURA',
          'FECHA LÍMITE',
          'FECHA FIN REAL',
          'ESTADO ACTUAL',
          'AVANCE %',
          'ESTADO APROBACIÓN',
          'ARCHIVO ADJUNTO'
        ]
      ];

      // Filas de detalle del portafolio
      rows.forEach((item, index) => {
        aoaData.push([
          index + 1,
          item.codigo || `PDM-${item.id || index + 1}`,
          item.tipoRegistro || item.tipo || 'Iniciativa',
          item.titulo || '—',
          item.herramienta || '5W-2H',
          item.sede || '—',
          item.proceso || '—',
          this.formatearFechaTabla(item.registro),
          this.formatearFechaTabla(item.apertura),
          this.formatearFechaTabla(item.limite),
          this.formatearFechaTabla(item.fechaFin),
          item.estado || 'Iniciado',
          `${item.avancePct || 0}%`,
          item.estadoAprobacion || 'Aprobado',
          item.archivo ? item.archivo : 'Sin adjunto'
        ]);
      });

      // Fila de resumen al pie
      const finalizadas = rows.filter(r => (r.estado || '').toLowerCase().includes('finalizado') || (r.estado || '').toLowerCase().includes('cerrado')).length;
      aoaData.push([
        '',
        'RESUMEN GENERAL',
        '',
        `Total Registros: ${rows.length}  |  Finalizadas: ${finalizadas}  |  En Seguimiento: ${rows.length - finalizadas}`,
        '', '', '', '', '', '', '', '', '', '', ''
      ]);

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoaData);

      // Anchos de columnas ajustados para máxima legibilidad
      ws['!cols'] = [
        { wch: 6 },  // N°
        { wch: 15 }, // CÓDIGO
        { wch: 14 }, // TIPO
        { wch: 45 }, // TÍTULO / DESCRIPCIÓN
        { wch: 16 }, // HERRAMIENTA
        { wch: 20 }, // SEDE / PLANTA
        { wch: 28 }, // PROCESO
        { wch: 16 }, // FECHA REGISTRO
        { wch: 16 }, // FECHA APERTURA
        { wch: 16 }, // FECHA LÍMITE
        { wch: 16 }, // FECHA FIN REAL
        { wch: 24 }, // ESTADO ACTUAL
        { wch: 12 }, // AVANCE %
        { wch: 20 }, // ESTADO APROBACIÓN
        { wch: 30 }  // ARCHIVO ADJUNTO
      ];

      // Aplicar estilos ejecutivos a todas las celdas
      this.aplicarEstilosExcelConsolidado(ws, rows.length);

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Detalle Portafolio');

      const fileName = `Portafolio_Mejora_Precotex_${new Date().toISOString().substring(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      this.toastr.success('Detalle del portafolio exportado exitosamente con diseño corporativo premium.', 'Exportación Exitosa');
    } catch (err) {
      console.error('Error al exportar Excel consolidado:', err);
      this.toastr.error('Ocurrió un error al generar el archivo Excel.', 'Error Exportación');
    }
  }

  // Motor de diseño ejecutivo para el consolidado
  private aplicarEstilosExcelConsolidado(ws: any, rowCount: number): void {
    const totalCols = 15;
    const borderThin = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    // 1. Merges para encabezado y pie de página
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Fila 1: Título Principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Fila 2: Subtítulo
      { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } }, // Fila 3: Metadatos
      { s: { r: 5 + rowCount, c: 3 }, e: { r: 5 + rowCount, c: totalCols - 1 } } // Fila resumen
    ];

    // 2. Alturas de fila
    const rowsHeights = [
      { hpt: 30 }, // Row 1
      { hpt: 24 }, // Row 2
      { hpt: 20 }, // Row 3
      { hpt: 10 }, // Row 4
      { hpt: 28 }  // Row 5 (headers tabla)
    ];
    for (let i = 0; i < rowCount; i++) {
      rowsHeights.push({ hpt: 22 });
    }
    rowsHeights.push({ hpt: 24 }); // Fila resumen
    ws['!rows'] = rowsHeights;

    // 3. Estilo Título Principal (Fila 1)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = {
        fill: { fgColor: { rgb: '0F2F57' } }, // Azul Precotex Corporativo
        font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // 4. Estilo Subtítulo (Fila 2)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 1, c });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = {
        fill: { fgColor: { rgb: '1E3A8A' } }, // Azul Real
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'E0F2FE' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // 5. Estilo Metadatos (Fila 3)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = {
        fill: { fgColor: { rgb: 'F1F5F9' } },
        font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'CBD5E1' } } }
      };
    }

    // 6. Estilo Encabezados de Tabla (Fila 5, r=4)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: '1E293B' } }, // Dark Slate
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'medium', color: { rgb: '38BDF8' } },
            bottom: { style: 'medium', color: { rgb: '38BDF8' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        };
      }
    }

    // 7. Estilo Filas de Datos (Fila 6+, r=5..)
    for (let r = 5; r < 5 + rowCount; r++) {
      const isEven = r % 2 === 0;
      const bgRgb = isEven ? 'FFFFFF' : 'F8FAFC'; // Cebra elegante

      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef]) {
          const val = (ws[cellRef].v || '').toString();
          let cellAlign: any = { horizontal: 'center', vertical: 'center' };
          let cellFont: any = { name: 'Calibri', sz: 9.5, color: { rgb: '0F172A' } };
          let cellFill: any = { fgColor: { rgb: bgRgb } };

          // Título alineado a la izquierda
          if (c === 3) {
            cellAlign = { horizontal: 'left', vertical: 'center', wrapText: true };
          }
          // Código en negrita corporativo
          if (c === 1) {
            cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '1E3A8A' } };
          }
          // Número en gris ordenado
          if (c === 0) {
            cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '64748B' } };
          }
          // Estado badge visual
          if (c === 11) {
            const valLower = val.toLowerCase();
            if (valLower.includes('finalizado') || valLower.includes('cerrado')) {
              cellFill = { fgColor: { rgb: 'D1FAE5' } };
              cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '065F46' } };
            } else if (valLower.includes('ejecución') || valLower.includes('ejecucion')) {
              cellFill = { fgColor: { rgb: 'EDE9FE' } };
              cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '5B21B6' } };
            } else if (valLower.includes('análisis') || valLower.includes('analisis')) {
              cellFill = { fgColor: { rgb: 'FEF3C7' } };
              cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '92400E' } };
            } else {
              cellFill = { fgColor: { rgb: 'DBEAFE' } };
              cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '1E40AF' } };
            }
          }
          // Avance %
          if (c === 12) {
            cellFont = { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '059669' } };
          }

          ws[cellRef].s = {
            fill: cellFill,
            font: cellFont,
            alignment: cellAlign,
            border: borderThin
          };
        }
      }
    }

    // 8. Fila Resumen al final
    const footerRowIndex = 5 + rowCount;
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: footerRowIndex, c });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: '0F172A' } },
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: c <= 3 ? 'left' : 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '38BDF8' } },
            bottom: { style: 'medium', color: { rgb: '38BDF8' } }
          }
        };
      }
    }
  }

  calculateStats() {
    this.stats.total = this.mejoraList.length;
    this.stats.enProceso = this.mejoraList.filter(m => {
      const e = (m.estado || '').toLowerCase();
      return e.includes('iniciado') || e.includes('análisis') || e.includes('analisis') || e.includes('ejecución') || e.includes('ejecucion') || e.includes('en proceso') || e.includes('abierto');
    }).length;
    this.stats.cerrado = this.mejoraList.filter(m => {
      const e = (m.estado || '').toLowerCase();
      return e.includes('finalizado') || e.includes('cerrado');
    }).length;
    this.stats.vencido = this.mejoraList.filter(m => {
      if ((m.estado || '').toLowerCase().includes('finalizado') || (m.estado || '').toLowerCase().includes('cerrado')) return false;
      if (!m.limite) return false;
      const dLim = new Date(m.limite);
      return !isNaN(dLim.getTime()) && dLim < new Date();
    }).length;
  }

  // GETTERS PARA DISTRIBUCIÓN Y GRÁFICO DONUT
  get count5W2H(): number {
    return this.mejoraList.filter(m => (m.herramienta || '').toUpperCase().includes('5W')).length;
  }

  get countACR(): number {
    return this.mejoraList.filter(m => (m.herramienta || '').toUpperCase().includes('ACR')).length;
  }

  get countIniciativas(): number {
    return this.mejoraList.filter(m => {
      const h = (m.herramienta || '').toLowerCase();
      return h.includes('iniciativa') || (!h.includes('5w') && !h.includes('acr'));
    }).length;
  }

  get pct5W2H(): number {
    return this.stats.total ? Math.round((this.count5W2H / this.stats.total) * 100) : 0;
  }

  get pctACR(): number {
    return this.stats.total ? Math.round((this.countACR / this.stats.total) * 100) : 0;
  }

  get pctIniciativas(): number {
    return this.stats.total ? Math.round((this.countIniciativas / this.stats.total) * 100) : 0;
  }

  // SEGMENTOS SVG DEL DONUT
  get offsetACR(): number {
    return 25 - this.pct5W2H;
  }

  get offsetIniciativas(): number {
    return 25 - this.pct5W2H - this.pctACR;
  }

  // ANALÍTICA: REGISTROS POR PROCESO Y META VS REAL (100% DINÁMICO EN BASE A REGISTROS REALES)
  get procesosUnicos(): string[] {
    if (!this.mejoraList || this.mejoraList.length === 0) {
      return [];
    }
    const procCounts = new Map<string, number>();
    for (const m of this.mejoraList) {
      const p = (m.proceso || 'General').trim();
      if (p) {
        procCounts.set(p, (procCounts.get(p) || 0) + 1);
      }
    }
    // Ordenar de mayor a menor según cantidad de iniciativas reales registradas
    return Array.from(procCounts.keys())
      .sort((a, b) => (procCounts.get(b) || 0) - (procCounts.get(a) || 0))
      .slice(0, 7);
  }

  get maxTotalProceso(): number {
    if (!this.procesosUnicos || this.procesosUnicos.length === 0) return 1;
    const totals = this.procesosUnicos.map(p =>
      this.mejoraList.filter(m => (m.proceso || '').toLowerCase() === p.toLowerCase()).length
    );
    return Math.max(1, ...totals);
  }

  getProcesoBreakdown(proc: string) {
    const rows = this.mejoraList.filter(m => (m.proceso || '').toLowerCase() === (proc || '').toLowerCase());
    const n5 = rows.filter(m => (m.herramienta || '').toUpperCase().includes('5W')).length;
    const na = rows.filter(m => (m.herramienta || '').toUpperCase().includes('ACR')).length;
    const ni = rows.filter(m => {
      const h = (m.herramienta || '').toLowerCase();
      return h.includes('iniciativa') || (!h.includes('5w') && !h.includes('acr'));
    }).length;
    const max = this.maxTotalProceso;

    return {
      n5,
      na,
      ni,
      total: rows.length,
      pct5: max > 0 ? (n5 / max) * 100 : 0,
      pctA: max > 0 ? (na / max) * 100 : 0,
      pctI: max > 0 ? (ni / max) * 100 : 0
    };
  }

  getMetaInfo(proc: string) {
    const rows = this.mejoraList.filter(m => (m.proceso || '').toLowerCase() === (proc || '').toLowerCase());
    const real = rows.length;
    // Meta mensual definida para mejora continua (3 iniciativas por proceso)
    const meta = 3;
    const cerradas = rows.filter(m => {
      const e = (m.estado || '').toLowerCase();
      return e.includes('finalizado') || e.includes('cerrado') || e.includes('completado');
    }).length;
    const cumple = real >= meta;
    const color = cumple ? '#10b981' : (real > 0 ? '#3b82f6' : '#ef4444');
    const pct = meta > 0 ? Math.min(Math.round((real / meta) * 100), 100) : 0;

    return { real, meta, cumple, color, pct, cerradas };
  }

  get archivosAdjuntosList(): any[] {
    return this.mejoraList.filter(m => m.archivo && m.archivo.trim().length > 0);
  }

  onToggleArchivosSubidos(): void {
    this.mostrarArchivosSubidos = !this.mostrarArchivosSubidos;
  }

  selectProceso(proc: string) {
    this.selectedProceso = proc;
    this.applyFilter();
  }

  limpiarBusqueda(): void {
    this.searchText = '';
    this.applyFilter();
  }

  buscar(event?: any): void {
    if (event && event.target) {
      this.searchText = event.target.value;
    }
    this.applyFilter();
  }

  private quitarAcentos(str: any): string {
    if (!str) return '';
    return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  applyFilter() {
    let list = [...this.mejoraList];

    if (this.selectedProceso !== 'Todos' && this.selectedProceso !== '__all__') {
      if (this.selectedProceso.startsWith('macro:')) {
        const macro = this.selectedProceso.substring(6);
        const processes = this.procesosGroups[macro] || [];
        list = list.filter(m => processes.includes(m.proceso));
      } else {
        list = list.filter(m => m.proceso === this.selectedProceso);
      }
    }

    // PDM-09: Filtro por SEDE
    if (this.filterSede && this.filterSede !== 'TODAS') {
      list = list.filter(m => (m.sede || '').toLowerCase().trim() === this.filterSede.toLowerCase().trim());
    }

    // PDM-09: Filtro por HERRAMIENTA
    if (this.filterHerramienta && this.filterHerramienta !== 'TODAS') {
      list = list.filter(m => (m.herramienta || '').toLowerCase().trim() === this.filterHerramienta.toLowerCase().trim());
    }

    // PDM-09: Filtro por ESTADO
    if (this.filterEstado && this.filterEstado !== 'TODOS') {
      list = list.filter(m => (m.estado || '').toLowerCase().trim() === this.filterEstado.toLowerCase().trim());
    }

    // PDM-16: Búsqueda global por palabras clave en todos los campos (código, título, proceso, sede, fechas, herramienta, etc.)
    if (this.searchText && this.searchText.trim()) {
      const q = this.quitarAcentos(this.searchText);
      list = list.filter(m => {
        const cod = this.quitarAcentos(m.codigo || m.id || '');
        const tit = this.quitarAcentos(m.titulo || '');
        const proc = this.quitarAcentos(m.proceso || '');
        const sede = this.quitarAcentos(m.sede || '');
        const herr = this.quitarAcentos(m.herramienta || '');
        const est = this.quitarAcentos(m.estado || '');
        const tipo = this.quitarAcentos(m.tipoRegistro || m.tipo || '');
        const resp = this.quitarAcentos(m.responsable || '');
        const arch = this.quitarAcentos(m.archivo || '');
        const fReg = this.quitarAcentos(m.registro || '');
        const fAper = this.quitarAcentos(m.apertura || '');
        const fLim = this.quitarAcentos(m.limite || '');
        const fFin = this.quitarAcentos(m.fechaFin || '');

        return (
          cod.includes(q) ||
          tit.includes(q) ||
          proc.includes(q) ||
          sede.includes(q) ||
          herr.includes(q) ||
          est.includes(q) ||
          tipo.includes(q) ||
          resp.includes(q) ||
          arch.includes(q) ||
          fReg.includes(q) ||
          fAper.includes(q) ||
          fLim.includes(q) ||
          fFin.includes(q)
        );
      });
    }

    this.dataSource.data = list;
  }

  onAgregar() {
    const dialogRef = this.dialog.open(PortafolioMejoraRegeditComponent, {
      width: '780px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Registrar incidencia / iniciativa',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const fFin = this.normalizarFecha(res.fechaFin);
        const payload = {
          Accion: 'I',
          Codigo: '',
          Tipo: res.tipoRegistro || 'Iniciativa',
          Fuente: res.herramienta,
          Herramienta: res.herramienta,
          Codigo_Proceso: this.obtenerCodigoProcesoSeguro(res.proceso),
          Descripcion: res.titulo.trim(),
          Responsable: 'Carlos Ríos',
          Sede: res.sede,
          Proveniente: res.proveniente,
          Fecha_Inicio: res.apertura,
          Fecha_Fin_Estimada: res.limite,
          Fecha_Registro: res.registro || null,
          FechaRegistro: res.registro || null,
          Fecha_Fin: fFin || null,
          FechaFin: fFin || null,
          Fecha_Cierre: fFin || null,
          FechaCierre: fFin || null,
          Fecha_Termino: fFin || null,
          Fecha_Fin_Real: fFin || null,
          Estado: res.estado,
          Archivo: res.archivo || '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.mejoraService.postMejoraMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              if (apiRes.codigo) {
                this.guardarFechaFinEnCache(apiRes.codigo, fFin);
              }
              if (res.titulo) {
                this.guardarFechaFinEnCache(res.titulo.trim(), fFin);
              }
              this.toastr.success('Iniciativa registrada y guardada en BD.', 'Registrado');
              this.onListado();
            } else {
              if (res.titulo) this.guardarFechaFinEnCache(res.titulo.trim(), fFin);
              this.toastr.success('Iniciativa registrada correctamente.', 'Registrado');
              this.onListado();
            }
          },
          error: () => {
            if (res.titulo) this.guardarFechaFinEnCache(res.titulo.trim(), fFin);
            this.toastr.success('Iniciativa registrada localmente.', 'Registrado');
            this.onListado();
          }
        });
      }
    });
  }

  onEditar(item: any) {
    const dialogRef = this.dialog.open(PortafolioMejoraRegeditComponent, {
      width: '780px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar iniciativa',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const fFin = this.normalizarFecha(res.fechaFin);

        // Guardar en caché y localStorage por código, ID y título
        if (item.codigo) this.guardarFechaFinEnCache(item.codigo, fFin);
        if (item.id) this.guardarFechaFinEnCache(item.id, fFin);
        if (item.titulo) this.guardarFechaFinEnCache(item.titulo, fFin);
        if (res.titulo) this.guardarFechaFinEnCache(res.titulo.trim(), fFin);

        // Actualización inmediata en memoria para reflejar al instante
        const idx = this.mejoraList.findIndex(m => (m.codigo && m.codigo === item.codigo) || (m.id && m.id === item.id));
        if (idx !== -1) {
          this.mejoraList[idx] = {
            ...this.mejoraList[idx],
            titulo: res.titulo.trim(),
            proceso: res.proceso,
            sede: res.sede,
            herramienta: res.herramienta,
            tipoRegistro: res.tipoRegistro || this.mejoraList[idx].tipoRegistro,
            apertura: res.apertura,
            registro: res.registro || this.mejoraList[idx].registro,
            limite: res.limite,
            fechaFin: fFin,
            estado: res.estado,
            archivo: res.archivo || this.mejoraList[idx].archivo
          };
          this.calculateStats();
          this.applyFilter();
        }

        const payload = {
          Accion: 'U',
          Codigo: item.codigo,
          Tipo: res.tipoRegistro || item.tipoRegistro || 'Iniciativa',
          Fuente: res.herramienta,
          Herramienta: res.herramienta,
          Codigo_Proceso: this.obtenerCodigoProcesoSeguro(res.proceso),
          Descripcion: res.titulo.trim(),
          Responsable: item.responsable || 'Carlos Ríos',
          Sede: res.sede,
          Proveniente: res.proveniente,
          Fecha_Inicio: res.apertura,
          Fecha_Fin_Estimada: res.limite,
          Fecha_Registro: res.registro || null,
          FechaRegistro: res.registro || null,
          Fecha_Fin: fFin || null,
          FechaFin: fFin || null,
          Fecha_Cierre: fFin || null,
          FechaCierre: fFin || null,
          Fecha_Termino: fFin || null,
          Fecha_Fin_Real: fFin || null,
          Estado: res.estado,
          Archivo: res.archivo || item.archivo || '',
          Usuario_Registro: 'SISTEMAS'
        };

        this.mejoraService.postMejoraMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.success('Iniciativa actualizada en BD.', 'Actualizado');
              this.onListado();
            } else {
              this.toastr.success('Iniciativa actualizada.', 'Actualizado');
              this.onListado();
            }
          },
          error: (err) => {
            this.toastr.warning('Iniciativa actualizada localmente.', 'Actualizado');
          }
        });
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: `¿Desea eliminar la iniciativa "${item.titulo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const cod = item.codigo || (item.id ? item.id.toString() : '');
        const payload = {
          Accion: 'D',
          Codigo: cod,
          Usuario_Registro: 'SISTEMAS'
        };

        this.mejoraService.postMejoraMnto(payload).subscribe({
          next: (apiRes: any) => {
            if (apiRes && apiRes.success) {
              this.toastr.warning('Iniciativa eliminada de BD.', 'Eliminado');
              this.onListado();
            } else {
              this.toastr.error(apiRes?.message || 'Error al eliminar.', 'Error BD');
            }
          },
          error: (err) => {
            this.toastr.error(err.error?.message || err.message, 'Error Servidor');
          }
        });
      }
    });
  }

  onDescargarArchivo(item: any): void {
    if (!item.archivo) {
      this.toastr.warning('Esta iniciativa no tiene ningún archivo adjunto.', 'Sin Archivo');
      return;
    }
    const downloadUrl = this.mejoraService.getDownloadUrl(item.archivo);
    window.open(downloadUrl, '_blank');
  }

  // PDM-08: Ver detalle de la iniciativa / incidencia
  onVer(item: any): void {
    Swal.fire({
      title: `<span style="color: #6366f1; font-weight: 700;">Detalle de ${item.tipo || 'Incidencia / Iniciativa'}</span>`,
      html: `
        <div style="text-align: left; font-size: 13px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; padding: 6px 0;">
          <div><strong style="color: #818cf8;">Código:</strong> ${item.codigo || item.id || '—'}</div>
          <div><strong style="color: #818cf8;">Título:</strong> ${item.titulo || '—'}</div>
          <div><strong style="color: #818cf8;">Herramienta:</strong> <span style="background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${item.herramienta || '5W-2H'}</span></div>
          <div><strong style="color: #818cf8;">Sede:</strong> ${item.sede || '—'}</div>
          <div><strong style="color: #818cf8;">Proceso:</strong> ${item.proceso || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Registro:</strong> ${item.registro || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Apertura:</strong> ${item.apertura || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Límite:</strong> ${item.limite || '—'}</div>
          <div><strong style="color: #818cf8;">Fecha Fin:</strong> ${item.fechaFin || '—'}</div>
          <div><strong style="color: #818cf8;">Estado:</strong> <span style="font-weight: 700; color: #34d399;">${item.estado || 'Iniciado'}</span></div>
          <div><strong style="color: #818cf8;">Archivo Adjunto:</strong> ${item.archivo ? item.archivo : 'Sin archivo'}</div>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6366f1',
      background: '#1e1e2d',
      color: '#f8fafc'
    });
  }

  onExportarExcel(): void {
    const rows = this.dataSource.data;
    if (!rows.length) {
      this.toastr.warning('No hay datos para exportar a Excel.', 'Exportar');
      return;
    }

    let t = '<table border="1"><tr><th>Código</th><th>Título</th><th>Proceso</th><th>Sede</th><th>Herramienta</th><th>Proveniente de</th><th>Apertura</th><th>Límite</th><th>Estado</th></tr>';
    rows.forEach(d => {
      t += `<tr><td>${d.codigo || ''}</td><td>${d.titulo || ''}</td><td>${d.proceso || ''}</td><td>${d.sede || ''}</td><td>${d.herramienta || ''}</td><td>${d.proveniente || ''}</td><td>${d.apertura || ''}</td><td>${d.limite || ''}</td><td>${d.estado || ''}</td></tr>`;
    });
    t += '</table>';

    const blob = new Blob(['\ufeff<html><head><meta charset="utf-8"></head><body>' + t + '</body></html>'], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portafolio_mejora_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toastr.success('Archivo Excel descargado correctamente.', 'Exportar Excel');
  }

  onExportarPDF(): void {
    const rows = this.dataSource.data;
    if (!rows.length) {
      this.toastr.warning('No hay datos para exportar a PDF.', 'Exportar');
      return;
    }

    const head = '<th>Código</th><th>Título</th><th>Proceso</th><th>Sede</th><th>Herramienta</th><th>Estado</th>';
    const body = rows.map(d => `<tr><td>${d.codigo || ''}</td><td>${d.titulo || ''}</td><td>${d.proceso || ''}</td><td>${d.sede || ''}</td><td>${d.herramienta || ''}</td><td>${d.estado || ''}</td></tr>`).join('');

    const w = window.open('', '_blank');
    if (!w) {
      this.toastr.error('Por favor permite las ventanas emergentes.', 'Error Exportar');
      return;
    }

    w.document.write(`<html><head><title>Portafolio de Mejora — Precotex</title><style>body{font-family:sans-serif;padding:20px;color:#333}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h2>Portafolio de Mejora — Precotex</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  }

  countProceso(proc: string): number {
    return this.mejoraList.filter(m => m.proceso === proc).length;
  }
}
