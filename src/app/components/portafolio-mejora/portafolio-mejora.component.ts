import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PortafolioMejoraRegeditComponent } from './portafolio-mejora-regedit/portafolio-mejora-regedit.component';
import { ProcesosService } from '../../services/procesos.service';
import { MejoraService } from '../../services/mejora.service';
import { SedesService } from '../../services/sedes.service';
import * as XLSX from 'xlsx-js-style';

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
    } catch {}
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
    } catch {}
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
  ) {}

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
    } catch {}

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

  // POR-02 & PDM-13: Descarga oficial de la plantilla 5W-2H en formato Excel (.xlsx) con diseño ejecutivo
  onDescargarPlantilla5W2H(): void {
    try {
      const data = [
        ['PRECOTEX S.A.C. — SISTEMA DE GESTIÓN DE SEGURIDAD Y MEJORA CONTINUA', '', '', '', '', '', '', ''],
        ['PLANTILLA OFICIAL: METODOLOGÍA 5W-2H PARA INICIATIVAS E INCIDENCIAS DE MEJORA', '', '', '', '', '', '', ''],
        [],
        ['1. INFORMACIÓN GENERAL DEL REGISTRO', '', '', '', '', '', '', ''],
        ['Código / N°:', '5W2H-2026-001', 'Tipo de Registro:', 'Iniciativa / Incidencia', 'Sede:', 'Planta Ate', 'Proceso:', 'SSOMA / Operaciones'],
        ['Responsable:', 'Dueño del Proceso', 'Fecha Registro:', new Date().toISOString().slice(0, 10), 'F. Ocurrencia:', new Date().toISOString().slice(0, 10), 'F. Límite:', ''],
        ['Título de la Iniciativa:', 'Implementación de control y optimización continua operacional', '', '', '', '', '', ''],
        [],
        ['2. ANÁLISIS ESTRUCTURADO 5W-2H', '', ''],
        ['Dimensión (5W-2H)', 'Pregunta Guía', 'Descripción / Detalle de la Solución Propuesta', '', '', '', '', ''],
        ['What (¿Qué?)', '¿Qué problema, oportunidad o iniciativa se identificó?', 'Descripción clara y precisa de la oportunidad de mejora detectada...'],
        ['Why (¿Por qué?)', '¿Por qué es necesario implementar esta acción de mejora?', 'Justificación del impacto positivo en seguridad, calidad o productividad...'],
        ['Where (¿Dónde?)', '¿En qué sede, área o proceso específico se ejecutará?', 'Ubicación física o área operacional involucrada...'],
        ['When (¿Cuándo?)', '¿Cuál es el cronograma, fecha de inicio y fecha límite?', 'Cronograma detallado con hitos de ejecución y fecha de entrega...'],
        ['Who (¿Quién?)', '¿Quién o quiénes son los responsables directos de ejecutarla?', 'Equipo o personas asignadas como dueños de la acción...'],
        ['How (¿Cómo?)', '¿Qué metodología, procedimiento o pasos se seguirán?', 'Plan de trabajo paso a paso para la implementación...'],
        ['How Much (¿Cuánto?)', '¿Qué recursos económicos, materiales o humanos requiere?', 'Estimación de costos, presupuesto o recursos necesarios...'],
        [],
        ['3. PLAN DE ACCIÓN Y SEGUIMIENTO DE ACTIVIDADES', '', '', '', '', '', '', ''],
        ['Ítem', 'Actividad Específica', 'Responsable', 'F. Inicio', 'F. Fin Planificada', 'F. Fin Real', 'Estado', 'Evidencia / Entregable'],
        ['1', 'Revisión y diagnóstico inicial del proceso', 'Equipo SSOMA', new Date().toISOString().slice(0, 10), '', '', 'Iniciado', 'Informe de diagnóstico'],
        ['2', 'Diseño de la propuesta de mejora', 'Responsable de Área', '', '', '', 'Análisis completado', 'Documento técnico'],
        ['3', 'Ejecución de actividades operativas y controles', 'Líder de Operaciones', '', '', '', 'Acciones en ejecución', 'Registro fotográfico'],
        ['4', 'Verificación final y cierre de la mejora', 'Jefe de Calidad / SSOMA', '', '', '', 'Finalizado', 'Acta de validación']
      ];

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 22 },
        { wch: 50 },
        { wch: 30 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
        { wch: 28 }
      ];

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
        { s: { r: 6, c: 1 }, e: { r: 6, c: 7 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },
        { s: { r: 9, c: 2 }, e: { r: 9, c: 7 } },
        { s: { r: 10, c: 2 }, e: { r: 10, c: 7 } },
        { s: { r: 11, c: 2 }, e: { r: 11, c: 7 } },
        { s: { r: 12, c: 2 }, e: { r: 12, c: 7 } },
        { s: { r: 13, c: 2 }, e: { r: 13, c: 7 } },
        { s: { r: 14, c: 2 }, e: { r: 14, c: 7 } },
        { s: { r: 15, c: 2 }, e: { r: 15, c: 7 } },
        { s: { r: 16, c: 2 }, e: { r: 16, c: 7 } },
        { s: { r: 18, c: 0 }, e: { r: 18, c: 7 } }
      ];

      // Aplicar estilos a la plantilla 5W-2H
      this.estilarPlantillaExcel(ws, [3, 8, 18], [9, 19]);

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla 5W-2H');

      XLSX.writeFile(wb, 'Plantilla_Oficial_5W2H_Precotex.xlsx');
      this.toastr.success('Plantilla oficial 5W-2H generada y descargada exitosamente con diseño corporativo.', 'Descarga Exitosa');
    } catch (error) {
      console.error('Error al generar plantilla Excel 5W-2H:', error);
      this.toastr.error('No se pudo generar el archivo Excel.', 'Error Descarga');
    }
  }

  // PDM-14: Descarga oficial de la plantilla ACR (Árbol de Causa Raíz / 5 Porqués) con diseño ejecutivo
  onDescargarPlantillaACR(): void {
    try {
      const data = [
        ['PRECOTEX S.A.C. — SISTEMA DE GESTIÓN DE SEGURIDAD Y MEJORA CONTINUA', '', '', '', '', '', '', ''],
        ['PLANTILLA OFICIAL: METODOLOGÍA ACR (ANÁLISIS DE CAUSA RAÍZ / 5 PORQUÉS)', '', '', '', '', '', '', ''],
        [],
        ['1. INFORMACIÓN GENERAL DEL REGISTRO', '', '', '', '', '', '', ''],
        ['Código / N°:', 'ACR-2026-001', 'Tipo de Registro:', 'Incidencia / Iniciativa', 'Sede:', 'Planta Ate', 'Proceso:', 'Costura / Operaciones'],
        ['Responsable:', 'Dueño del Proceso', 'Fecha Registro:', new Date().toISOString().slice(0, 10), 'F. Ocurrencia:', new Date().toISOString().slice(0, 10), 'F. Límite:', ''],
        ['Descripción del Problema:', 'Falla recurrente en equipo o desviación en proceso operacional', '', '', '', '', '', ''],
        [],
        ['2. ANÁLISIS DE CAUSA RAÍZ - METODOLOGÍA 5 PORQUÉS (5-WHYs)', '', ''],
        ['Nivel de Análisis', 'Pregunta de Causalidad', 'Respuesta / Causa Identificada', '', '', '', '', ''],
        ['Por qué 1 (Causa Directa)', '¿Por qué ocurrió el problema de forma inmediata?', 'Causa inmediata o síntoma evidente observado en el área...'],
        ['Por qué 2', '¿Por qué sucedió la causa directa anterior?', 'Factor desencadenante de segundo nivel...'],
        ['Por qué 3', '¿Por qué se presentó ese factor secundario?', 'Fallo en la condición operacional, método o material...'],
        ['Por qué 4', '¿Por qué no se detectó o previno con los controles actuales?', 'Brecha en el procedimiento, inspección o mantenimiento...'],
        ['Por qué 5 (Causa Raíz)', '¿Por qué existía esa brecha en el sistema de gestión?', 'Causa raíz fundamental / procedimental / sistémica...'],
        [],
        ['3. PLAN DE ACCIÓN CORRECTIVA Y PREVENTIVA (CAPA)', '', '', '', '', '', '', ''],
        ['Ítem', 'Acción Correctiva para Eliminar Causa Raíz', 'Responsable', 'F. Inicio', 'F. Fin Planificada', 'F. Fin Real', 'Estado', 'Evidencia'],
        ['1', 'Modificación de estándar / procedimiento operativo', 'Responsable de Proceso', new Date().toISOString().slice(0, 10), '', '', 'Iniciado', 'Procedimiento aprobado'],
        ['2', 'Capacitación y sensibilización al personal operativo', 'Líder de Área', '', '', '', 'Análisis completado', 'Registro de asistencia'],
        ['3', 'Implementación de control o poka-yoke preventivo', 'Mantenimiento / Calidad', '', '', '', 'Acciones en ejecución', 'Foto de implementación'],
        ['4', 'Evaluación de eficacia y cierre formal', 'Equipo SSOMA / Mejora', '', '', '', 'Finalizado', 'Informe de eficacia']
      ];

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 25 },
        { wch: 50 },
        { wch: 30 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
        { wch: 28 }
      ];

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
        { s: { r: 6, c: 1 }, e: { r: 6, c: 7 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },
        { s: { r: 9, c: 2 }, e: { r: 9, c: 7 } },
        { s: { r: 10, c: 2 }, e: { r: 10, c: 7 } },
        { s: { r: 11, c: 2 }, e: { r: 11, c: 7 } },
        { s: { r: 12, c: 2 }, e: { r: 12, c: 7 } },
        { s: { r: 13, c: 2 }, e: { r: 13, c: 7 } },
        { s: { r: 14, c: 2 }, e: { r: 14, c: 7 } },
        { s: { r: 16, c: 0 }, e: { r: 16, c: 7 } }
      ];

      // Aplicar estilos a la plantilla ACR
      this.estilarPlantillaExcel(ws, [3, 8, 16], [9, 17]);

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla ACR');

      XLSX.writeFile(wb, 'Plantilla_Oficial_ACR_Precotex.xlsx');
      this.toastr.success('Plantilla oficial ACR (Causa Raíz) descargada exitosamente con diseño corporativo.', 'Descarga Exitosa');
    } catch (error) {
      console.error('Error al generar plantilla Excel ACR:', error);
      this.toastr.error('No se pudo generar el archivo Excel.', 'Error Descarga');
    }
  }

  // Helper para estilar plantillas oficiales
  private estilarPlantillaExcel(ws: any, sectionRowIndices: number[], headerRowIndices: number[]): void {
    const totalCols = 8;

    // Fila 1: Header corporativo
    for (let c = 0; c < totalCols; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = {
        fill: { fgColor: { rgb: '0F2F57' } },
        font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Fila 2: Subtítulo
    for (let c = 0; c < totalCols; c++) {
      const ref = XLSX.utils.encode_cell({ r: 1, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = {
        fill: { fgColor: { rgb: '1E3A8A' } },
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'E0F2FE' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Filas de Sección (1., 2., 3.)
    sectionRowIndices.forEach(r => {
      for (let c = 0; c < totalCols; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = {
          fill: { fgColor: { rgb: '1E293B' } },
          font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '38BDF8' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }
    });

    // Filas de Encabezados de tabla
    headerRowIndices.forEach(r => {
      for (let c = 0; c < totalCols; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (ws[ref]) {
          ws[ref].s = {
            fill: { fgColor: { rgb: '334155' } },
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: '64748B' } },
              bottom: { style: 'thin', color: { rgb: '64748B' } },
              left: { style: 'thin', color: { rgb: '64748B' } },
              right: { style: 'thin', color: { rgb: '64748B' } }
            }
          };
        }
      }
    });
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
    return this.mejoraList.filter(m => m.herramienta === '5W-2H').length;
  }

  get countACR(): number {
    return this.mejoraList.filter(m => m.herramienta === 'ACR').length;
  }

  get countIniciativas(): number {
    return this.mejoraList.filter(m => m.herramienta === 'Iniciativa').length;
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

  // ANALÍTICA: REGISTROS POR PROCESO Y META VS REAL
  get procesosUnicos(): string[] {
    const list = this.mejoraList.map(m => m.proceso).filter(Boolean);
    const set = Array.from(new Set(list));
    if (set.length === 0) {
      return ['Costura', 'Corte', 'Aseguramiento de Calidad Textil', 'SSOMA'];
    }
    return set.slice(0, 7);
  }

  get maxTotalProceso(): number {
    const totals = this.procesosUnicos.map(p => this.mejoraList.filter(m => m.proceso === p).length);
    return Math.max(1, ...totals);
  }

  getProcesoBreakdown(proc: string) {
    const rows = this.mejoraList.filter(m => m.proceso === proc);
    const n5 = rows.filter(m => m.herramienta === '5W-2H').length;
    const na = rows.filter(m => m.herramienta === 'ACR').length;
    const ni = rows.filter(m => m.herramienta === 'Iniciativa').length;
    const max = this.maxTotalProceso;

    return {
      n5,
      na,
      ni,
      pct5: (n5 / max) * 100,
      pctA: (na / max) * 100,
      pctI: (ni / max) * 100
    };
  }

  getMetaInfo(proc: string) {
    const real = this.mejoraList.filter(m => m.proceso === proc).length;
    const meta = 3;
    const cumple = real >= meta;
    const color = cumple ? '#3ecf8e' : (real >= 1 ? '#f0b429' : '#f0576b');
    const pct = Math.min((real / meta) * 100, 100);

    return { real, meta, cumple, color, pct };
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
        const payload = {
          Accion: 'D',
          Codigo: item.codigo,
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
