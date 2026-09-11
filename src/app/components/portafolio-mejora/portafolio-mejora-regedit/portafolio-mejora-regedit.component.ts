import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { MejoraService } from '../../../services/mejora.service';
import { SedesService } from '../../../services/sedes.service';
import * as XLSX from 'xlsx';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U'
  Datos: any;
}

export interface HerramientaOption {
  key: string;
  label: string;
  sub: string;
  color: string;
}

@Component({
  selector: 'app-portafolio-mejora-regedit',
  standalone: false,
  templateUrl: './portafolio-mejora-regedit.component.html',
  styleUrls: ['./portafolio-mejora-regedit.component.css']
})
export class PortafolioMejoraRegeditComponent implements OnInit {
  formulario!: FormGroup;

  // Sedes y procesos se cargan 100% desde la BD (módulo Organización)
  sedes: string[] = [];
  procesosPorSedeMap: { [key: string]: string[] } = {};
  todosLosProcesos: string[] = [];
  procesosActuales: string[] = [];

  readonly herramientasOpts: HerramientaOption[] = [
    { key: '5W-2H', label: '5W-2H', sub: 'Análisis rápido', color: '#3ecf8e' },
    { key: 'ACR', label: 'ACR', sub: 'Análisis profundo', color: '#f0b429' },
    { key: 'Iniciativa', label: 'Iniciativa', sub: 'Derivada de ACR', color: '#7c6cf0' }
  ];

  tiposRegistroOpts: string[] = ['Incidencia', 'Iniciativa'];
  estadoOpts: string[] = ['Iniciado', 'Análisis completado', 'Acciones en ejecución', 'Finalizado'];
  herramientaSeleccionada: string = '5W-2H';
  archivoNombre: string = '';
  archivoTamanio: string = '';
  cargandoArchivo: boolean = false;
  mostrarVistaPrevia: boolean = false;
  previewRows: { campo: string; detalle: string }[] = [];

  // Datos reales leídos del archivo Excel
  excelHeaders: string[] = [];
  excelRows: any[][] = [];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PortafolioMejoraRegeditComponent>,
    private procesosService: ProcesosService,
    private mejoraService: MejoraService,
    private sedesService: SedesService
  ) { }

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);

    // Cargar Sedes y Procesos exclusivamente desde la BD (módulo Organización)
    this.sedesService.getListadoSedes('001', '1').subscribe({
      next: (sedeRes: any) => {
        if (sedeRes && sedeRes.success && sedeRes.elements && sedeRes.elements.length > 0) {
          const bdSedes = sedeRes.elements;

          // Cargar procesos de BD y vincular a cada sede
          this.procesosService.getListadoProcesos('001', '1').subscribe({
            next: (procRes: any) => {
              const bdProcs = (procRes && procRes.success && procRes.elements) ? procRes.elements : [];

              bdSedes.forEach((sItem: any) => {
                const sName = (sItem.denominacion || '').trim();
                const sCodeNorm = (sItem.codigo_Sede || '').toString().trim();

                if (!sName) return;

                // Agregar sede al listado (sin duplicados)
                if (!this.sedes.includes(sName)) {
                  this.sedes.push(sName);
                }

                // Buscar procesos asignados a esta sede por codigo_Sede
                const assignedProcs = bdProcs.filter((pItem: any) => {
                  const pSedeCode = (pItem.codigo_Sede || '').toString().trim();
                  return pSedeCode === sCodeNorm ||
                    (pSedeCode !== '' && parseInt(pSedeCode, 10) === parseInt(sCodeNorm, 10));
                });

                const procNames = assignedProcs
                  .map((pItem: any) => pItem.proceso || pItem.nombre_Proceso || pItem.denominacion || '')
                  .filter((n: string) => n.trim().length > 0);

                if (procNames.length > 0) {
                  this.procesosPorSedeMap[sName] = procNames;
                  // Agregar al listado maestro de procesos
                  procNames.forEach((p: string) => {
                    if (!this.todosLosProcesos.includes(p)) {
                      this.todosLosProcesos.push(p);
                    }
                  });
                }
              });

              // Actualizar procesosActuales si hay sede seleccionada
              const currentSede = this.formulario?.get('sede')?.value;
              if (currentSede) {
                this.onSedeChange(currentSede);
              }
            }
          });
        }
      }
    });

    this.formulario = this.fb.group({
      tipoRegistro: ['Iniciativa', Validators.required],
      sede: ['', Validators.required],
      proceso: ['', Validators.required],
      herramienta: ['5W-2H', Validators.required],
      titulo: ['', Validators.required],
      apertura: ['', Validators.required],
      limite: ['', Validators.required],
      registro: [today, Validators.required],
      proveniente: ['—'],
      estado: ['Iniciado', Validators.required],
      fechaFin: [''],  // PDM-05 & PDM-11: Fecha fin editable, se coloca al terminar la incidencia/iniciativa
      archivo: ['']
    });

    // PDM-11: Si se marca como Finalizado y no tiene Fecha Fin, colocar la fecha actual automáticamente
    this.formulario.get('estado')?.valueChanges.subscribe(est => {
      if (est === 'Finalizado' && !this.formulario.get('fechaFin')?.value) {
        this.formulario.get('fechaFin')?.setValue(new Date().toISOString().slice(0, 10));
      }
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      const d = this.data.Datos;
      this.herramientaSeleccionada = d.herramienta || '5W-2H';
      this.archivoNombre = d.archivo || '';

      if (d.sede) {
        this.onSedeChange(d.sede);
      }

      const fFin = this.normalizarFecha(d.fechaFin || d.fecha_Fin || d.fechafin || d.fecha_Cierre || d.fechaCierre || '');

      this.formulario.patchValue({
        tipoRegistro: d.tipoRegistro || d.tipo || 'Iniciativa',
        sede: d.sede || '',
        proceso: d.proceso || '',
        herramienta: this.herramientaSeleccionada,
        titulo: d.titulo || '',
        apertura: this.normalizarFecha(d.apertura || d.fecha_Inicio || ''),
        limite: this.normalizarFecha(d.limite || d.fecha_Fin_Estimada || ''),
        registro: this.normalizarFecha(d.registro || d.fecha_Registro || today),
        proveniente: d.proveniente || '—',
        estado: d.estado || 'Iniciado',
        fechaFin: fFin,
        archivo: this.archivoNombre
      });

      if (this.archivoNombre) {
        this.generarPrevistaExcel(null, d.titulo || 'Iniciativa de mejora');
      }
    }
  }

  normalizarFecha(val: any): string {
    if (!val && val !== 0) return '';
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      // Si la hora es 00:00:00 UTC (como las fechas generadas por xlsx), usar UTC para evitar desfase de zona horaria local (-5h)
      if (val.getUTCHours() === 0 && val.getUTCMinutes() === 0) {
        return val.toISOString().slice(0, 10);
      }
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // Si es número de serie de fecha de Excel (ej. 46184 = 11/06/2026)
    const num = typeof val === 'number' ? val : (typeof val === 'string' && /^\d{5}$/.test(val.trim()) ? Number(val.trim()) : null);
    if (num !== null && num > 30000 && num < 65000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
    }
    const s = val.toString().trim();
    if (!s || s.startsWith('0001') || s.startsWith('1900') || s.startsWith('00/00') || s.startsWith('00-00')) return '';
    
    // YYYY-MM-DD o YYYY/MM/DD
    const mY = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (mY) {
      return `${mY[1]}-${mY[2].padStart(2, '0')}-${mY[3].padStart(2, '0')}`;
    }
    
    // DD/MM/YYYY o DD-MM-YYYY (con 1 o 2 dígitos para día/mes)
    const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      let yyyy = m[3];
      if (yyyy.length === 2) yyyy = '20' + yyyy;
      return `${yyyy}-${mm}-${dd}`;
    }

    try {
      const d = new Date(s);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
        return d.toISOString().slice(0, 10);
      }
    } catch {}
    return '';
  }

  onSedeChange(sedeVal: string): void {
    if (!sedeVal) {
      this.procesosActuales = [];
      this.formulario?.get('proceso')?.setValue('');
      return;
    }

    const procs = this.procesosPorSedeMap[sedeVal];
    if (procs && procs.length > 0) {
      this.procesosActuales = procs;
    } else {
      // Sede sin procesos asignados en la BD → mostrar lista vacía
      this.procesosActuales = [];
    }

    const currentProc = this.formulario?.get('proceso')?.value;
    if (currentProc && !this.procesosActuales.includes(currentProc)) {
      this.formulario?.get('proceso')?.setValue('');
    }

    if (this.mostrarVistaPrevia) {
      this.actualizarDetallePrevista();
    }
  }

  selectHerramienta(key: string): void {
    this.herramientaSeleccionada = key;
    this.formulario.get('herramienta')?.setValue(key);
    if (this.mostrarVistaPrevia) {
      this.actualizarDetallePrevista();
    }
  }

  onQuitarArchivo(): void {
    this.archivoNombre = '';
    this.archivoTamanio = '';
    this.mostrarVistaPrevia = false;
    this.previewRows = [];
    this.excelHeaders = [];
    this.excelRows = [];
    this.formulario.get('archivo')?.setValue('');
  }

  // PDM-14: Motor de autocompletado inteligente desde formatos 5W-2H y ACR
  autocompletarDesdeExcel(validRows: any[][], fileName: string): void {
    if (!validRows || validRows.length === 0) return;

    // 1. Título / descripción breve: se jala del nombre con que se guardó el documento (sin extensión)
    const docTitle = fileName.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').trim();
    const detectedTitulo: string = docTitle;

    let detectedHerramienta: string | null = null;
    let detectedTipo: string | null = null;
    let detectedSede: string | null = null;
    let detectedProceso: string | null = null;
    let detectedApertura: string | null = null; // F. ocurrencia (amarillo en Acción Inmediata)
    let detectedRegistro: string | null = null; // F. registro (amarillo en cabecera)
    let detectedLimite: string | null = null;   // F. límite
    let detectedFechaFin: string | null = null;
    let detectedEstado: string | null = null;

    const fnLower = fileName.toLowerCase();
    if (fnLower.includes('acr') || fnLower.includes('arbol') || fnLower.includes('porques') || fnLower.includes('causa')) {
      detectedHerramienta = 'ACR';
    } else if (fnLower.includes('5w') || fnLower.includes('5w2h') || fnLower.includes('5w-2h')) {
      detectedHerramienta = '5W-2H';
    }

    if (fnLower.includes('incidencia') || fnLower.includes('falla') || fnLower.includes('desviacion')) {
      detectedTipo = 'Incidencia';
    } else if (fnLower.includes('iniciativa') || fnLower.includes('mejora') || fnLower.includes('kaizen')) {
      detectedTipo = 'Iniciativa';
    }

    // Escanear todas las celdas del Excel para extraer campos clave
    for (let r = 0; r < validRows.length; r++) {
      const row = validRows[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const cellRaw = row[c];
        if (cellRaw === null || cellRaw === undefined) continue;
        const cellStr = cellRaw.toString().trim();
        const cellLower = cellStr.toLowerCase();
        // Limpiar saltos de línea (\r, \n) y espacios múltiples para búsquedas robustas
        const cellClean = cellLower.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

        // 1. Herramienta (Priorizar ACR si contiene análisis de causa raíz, código de acr, fecha de análisis, etc.)
        if (!detectedHerramienta) {
          if (
            cellClean.includes('análisis de causa raíz') ||
            cellClean.includes('analisis de causa raiz') ||
            cellClean.includes('código de acr') ||
            cellClean.includes('codigo de acr') ||
            cellClean.includes('fecha de análisis') ||
            cellClean.includes('fecha de analisis') ||
            cellClean.includes('arbol de causa') ||
            cellClean.includes('árbol de causa') ||
            cellClean.includes('5 porqués') ||
            cellClean.includes('5 porques')
          ) {
            detectedHerramienta = 'ACR';
          } else if (
            cellClean.includes('análisis de las 5w-2h') ||
            cellClean.includes('analisis de las 5w-2h') ||
            cellClean.includes('5w-2h') ||
            cellClean.includes('5w 2h') ||
            cellClean.includes('5w2h') ||
            cellClean.includes('fecha ocurencia')
          ) {
            detectedHerramienta = '5W-2H';
          }
        }

        // 2. Tipo (Incidencia si es No Conformidad, Iniciativa si es Oportunidad de Mejora)
        if (!detectedTipo) {
          if (cellClean.includes('no conformidad') || cellClean.includes('incidencia') || cellClean.includes('desviacion')) {
            detectedTipo = 'Incidencia';
          } else if (cellClean.includes('oportunidad de mejora') || cellClean.includes('iniciativa') || cellClean.includes('kaizen')) {
            detectedTipo = 'Iniciativa';
          } else if (cellClean.includes('tipo de registro') || cellClean.includes('tipo registro')) {
            const nextVal = (row[c + 1] || '').toString().trim().toLowerCase();
            if (nextVal.includes('incidencia') || nextVal.includes('no conformidad')) detectedTipo = 'Incidencia';
            if (nextVal.includes('iniciativa') || nextVal.includes('mejora')) detectedTipo = 'Iniciativa';
          }
        }

        // 3. F. REGISTRO: En 5W-2H ("Fecha Registro:") y en ACR ("Fecha de análisis:" = F. registro)
        if (!detectedRegistro && (
          /fecha\s*d?e?\s*an[aá]lisis/i.test(cellClean) ||
          /f\.?\s*an[aá]lisis/i.test(cellClean) ||
          /fecha\s*d?e?\s*regist/i.test(cellClean) ||
          /f\.?\s*regist/i.test(cellClean) ||
          cellClean.includes('fecha de análisis') ||
          cellClean.includes('fecha de analisis') ||
          cellClean.includes('fecha análisis') ||
          cellClean.includes('fecha analisis') ||
          cellClean.includes('fecha registro') ||
          cellClean.includes('fecha registr') ||
          cellClean.includes('f. registro') ||
          cellClean.includes('f.registro')
        )) {
          // Si la misma celda contiene la fecha (ej. "Fecha de análisis: 26/06/2026")
          const selfDate = this.normalizarFecha(cellStr);
          if (selfDate) {
            detectedRegistro = selfDate;
          } else {
            // Buscar primero a la derecha en la misma fila (en ACR: row[c+1] contiene 26/06/2026)
            for (let offset = 1; offset <= 5; offset++) {
              const val = row[c + offset];
              const norm = this.normalizarFecha(val);
              if (norm) {
                detectedRegistro = norm;
                break;
              }
            }
            // Si no está a la derecha, buscar en las filas siguientes (r+1 o r+2)
            if (!detectedRegistro) {
              for (let rOff = 1; rOff <= 2; rOff++) {
                if (validRows[r + rOff]) {
                  for (let offset = 0; offset <= 3; offset++) {
                    const val = validRows[r + rOff][c + offset];
                    const norm = this.normalizarFecha(val);
                    if (norm) {
                      detectedRegistro = norm;
                      break;
                    }
                  }
                }
                if (detectedRegistro) break;
              }
            }
          }
        }

        // 4. F. OCURRENCIA (Apertura): En ACR ("Fecha de ocurrencia:") y en 5W-2H ("Fecha Ocurencia" / "Fecha Ocurrencia")
        if (!detectedApertura && (
          /fecha\s*d?e?\s*ocu[r]+encia/i.test(cellClean) ||
          /f\.?\s*ocu[r]+encia/i.test(cellClean) ||
          cellClean.includes('fecha inicio') ||
          cellClean.includes('when (inicio)') ||
          cellClean.includes('when (cuándo)') ||
          cellClean.includes('when (cuando)')
        )) {
          // Si la misma celda contiene la fecha
          const selfDate = this.normalizarFecha(cellStr);
          if (selfDate) {
            detectedApertura = selfDate;
          } else {
            // 1) Buscar primero a la derecha en la misma fila (en ACR: row[c+1] contiene 19/06/2026)
            for (let offset = 1; offset <= 5; offset++) {
              const val = row[c + offset];
              const norm = this.normalizarFecha(val);
              if (norm) {
                detectedApertura = norm;
                break;
              }
            }
            // 2) Si no está a la derecha, buscar debajo en las filas siguientes (en 5W-2H: validRows[r+1] contiene 11/06/2026)
            if (!detectedApertura) {
              for (let rOff = 1; rOff <= 3; rOff++) {
                if (validRows[r + rOff]) {
                  for (let offset = 0; offset <= 3; offset++) {
                    const val1 = validRows[r + rOff][c + offset];
                    const norm1 = this.normalizarFecha(val1);
                    if (norm1) {
                      detectedApertura = norm1;
                      break;
                    }
                    if (c - offset >= 0) {
                      const val2 = validRows[r + rOff][c - offset];
                      const norm2 = this.normalizarFecha(val2);
                      if (norm2) {
                        detectedApertura = norm2;
                        break;
                      }
                    }
                  }
                }
                if (detectedApertura) break;
              }
            }
          }
        }

        // 5. F. LÍMITE: "Fecha límite", "Fecha limite", "Fecha fin estimada", "When (límite)"
        if (!detectedLimite && (
          /fecha\s*d?e?\s*l[ií]mite/i.test(cellClean) ||
          /f\.?\s*l[ií]mite/i.test(cellClean) ||
          cellClean.includes('fecha límite') ||
          cellClean.includes('fecha limite') ||
          cellClean.includes('fecha fin estimada') ||
          cellClean.includes('when (límite)') ||
          cellClean.includes('when (limite)')
        )) {
          const selfDate = this.normalizarFecha(cellStr);
          if (selfDate) {
            detectedLimite = selfDate;
          } else {
            for (let offset = 1; offset <= 5; offset++) {
              const val = row[c + offset];
              const norm = this.normalizarFecha(val);
              if (norm) {
                detectedLimite = norm;
                break;
              }
            }
            if (!detectedLimite && validRows[r + 1]) {
              const norm = this.normalizarFecha(validRows[r + 1][c]);
              if (norm) detectedLimite = norm;
            }
          }
        }

        // 6. Sede
        if (!detectedSede) {
          if (cellClean.startsWith('sede:') || cellClean.startsWith('sede') || cellClean === 'where (¿dónde?)' || cellClean.includes('sede santa rosa')) {
            const candidate = (row[c + 1] || cellStr).toString().trim();
            for (const s of this.sedes) {
              if (candidate.toLowerCase().includes(s.toLowerCase())) {
                detectedSede = s;
                break;
              }
            }
          }
          if (!detectedSede) {
            for (const s of this.sedes) {
              if (cellClean === s.toLowerCase() || cellClean.includes(s.toLowerCase())) {
                detectedSede = s;
                break;
              }
            }
          }
        }

        // 7. Proceso / Área
        if (!detectedProceso) {
          if (
            cellClean.startsWith('línea/área/máquina') ||
            cellClean.startsWith('linea/area/maquina') ||
            cellClean.startsWith('proceso:') ||
            cellClean.startsWith('proceso') ||
            cellClean.startsWith('área:') ||
            cellClean.startsWith('area:') ||
            cellClean === 'área' ||
            cellClean === 'area'
          ) {
            const candidate = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
            for (const p of this.todosLosProcesos) {
              if (candidate.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(candidate.toLowerCase())) {
                detectedProceso = p;
                break;
              }
            }
          }
          if (!detectedProceso) {
            for (const p of this.todosLosProcesos) {
              if (cellLower === p.toLowerCase() || (cellLower.includes(p.toLowerCase()) && p.length > 4)) {
                detectedProceso = p;
                break;
              }
            }
          }
        }

        // 8. Fecha Fin Real / Cierre
        if (!detectedFechaFin && (cellLower.includes('fecha fin real') || cellLower.includes('fecha cierre') || cellLower.includes('fecha término') || cellLower.includes('fecha termino'))) {
          const val = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
          const norm = this.normalizarFecha(val);
          if (norm) detectedFechaFin = norm;
        }

        // 9. Estado
        if (!detectedEstado) {
          if (cellLower.includes('estado')) {
            const nextVal = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
            for (const est of this.estadoOpts) {
              if (nextVal.toLowerCase() === est.toLowerCase()) {
                detectedEstado = est;
                break;
              }
            }
          }
        }
      }
    }

    // Si no se detectó fecha límite pero sí ocurrencia, calcular por defecto +14 días
    if (detectedApertura && !detectedLimite) {
      try {
        const dOcc = new Date(detectedApertura + 'T12:00:00');
        dOcc.setDate(dOcc.getDate() + 14);
        detectedLimite = dOcc.toISOString().slice(0, 10);
      } catch {}
    }

    // Si encontramos Sede, actualizar y poblar procesos de esa sede
    if (detectedSede) {
      this.formulario.get('sede')?.setValue(detectedSede);
      this.onSedeChange(detectedSede);
    }

    // Si encontramos Proceso
    if (detectedProceso) {
      this.formulario.get('proceso')?.setValue(detectedProceso);
    }

    // Si encontramos Herramienta
    if (detectedHerramienta) {
      this.selectHerramienta(detectedHerramienta);
    }

    // Parchear valores en el formulario (Título con el nombre guardado, F. ocurrencia, F. registro)
    const patchObj: any = {
      titulo: detectedTitulo
    };
    if (detectedTipo) patchObj.tipoRegistro = detectedTipo;
    if (detectedApertura) patchObj.apertura = detectedApertura;
    if (detectedRegistro) patchObj.registro = detectedRegistro;
    if (detectedLimite) patchObj.limite = detectedLimite;
    if (detectedFechaFin) patchObj.fechaFin = detectedFechaFin;
    if (detectedEstado) patchObj.estado = detectedEstado;

    this.formulario.patchValue(patchObj);
    this.actualizarDetallePrevista(detectedTitulo);

    const autoSummary = [
      `Título: ${detectedTitulo}`,
      detectedApertura ? `F. Ocurrencia: ${detectedApertura}` : null,
      detectedRegistro ? `F. Registro: ${detectedRegistro}` : null,
      detectedHerramienta ? `Herramienta: ${detectedHerramienta}` : null,
      detectedSede ? `Sede: ${detectedSede}` : null,
      detectedProceso ? `Proceso: ${detectedProceso}` : null
    ].filter(Boolean).join(' · ');

    this.toastr.success(`Campos autocompletados desde el archivo: ${autoSummary}`, 'Autocompletado Automático');
  }

  leerContenidoExcelReal(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convertir hoja de Excel a matriz de filas 2D
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (jsonData && jsonData.length > 0) {
            // Filtrar filas completamente vacías
            const validRows = jsonData.filter(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== ''));

            if (validRows.length > 0) {
              const maxCols = Math.min(Math.max(...validRows.map(r => r.length)), 12);
              
              // Encabezados normalizados
              const rawHeaders = validRows[0] || [];
              const headers: string[] = [];
              for (let c = 0; c < maxCols; c++) {
                const hVal = (rawHeaders[c] !== null && rawHeaders[c] !== undefined) ? rawHeaders[c].toString().trim() : '';
                headers.push(hVal || `Columna ${c + 1}`);
              }
              this.excelHeaders = headers;

              // Filas normalizadas (máximo 25 filas)
              this.excelRows = validRows.slice(1, 26).map(row => {
                const cells: string[] = [];
                for (let c = 0; c < maxCols; c++) {
                  const val = (row[c] !== null && row[c] !== undefined) ? row[c].toString().trim() : '';
                  cells.push(val);
                }
                return cells;
              });

              // PDM-14: Ejecutar autocompletado inteligente (Título, F. Ocurrencia, F. Registro)
              this.autocompletarDesdeExcel(validRows, file.name);
            }
          }
        }
      } catch (err) {
        console.error('Error leyendo documento Excel:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  generarPrevistaExcel(file: File | null, nameWithoutExt: string): void {
    this.archivoTamanio = file ? (file.size / 1024).toFixed(1) + ' KB' : '245.8 KB';
    this.mostrarVistaPrevia = true;
    this.actualizarDetallePrevista(nameWithoutExt);

    if (file && (!this.excelRows || this.excelRows.length === 0)) {
      this.leerContenidoExcelReal(file);
    }
  }

  actualizarDetallePrevista(tituloDefault?: string): void {
    const titleVal = this.formulario.get('titulo')?.value || tituloDefault || 'Incidencia / Iniciativa de Mejora';
    const herr = this.formulario.get('herramienta')?.value || this.herramientaSeleccionada || '5W-2H';
    const sede = this.formulario.get('sede')?.value || 'No seleccionada';
    const proc = this.formulario.get('proceso')?.value || 'No seleccionado';
    const aper = this.formulario.get('apertura')?.value || new Date().toISOString().slice(0, 10);
    const lim = this.formulario.get('limite')?.value || new Date().toISOString().slice(0, 10);

    this.previewRows = [
      { campo: 'What (¿Qué?)', detalle: titleVal },
      { campo: 'Why (¿Por qué?)', detalle: 'Optimización de procesos y causa raíz identificada en matriz 5W-2H / ACR' },
      { campo: 'Where (¿Dónde?)', detalle: `Sede: ${sede} | Proceso: ${proc}` },
      { campo: 'When (¿Cuándo?)', detalle: `Fecha Ocurrencia: ${aper} | Fecha Límite: ${lim}` },
      { campo: 'Who (¿Quién?)', detalle: 'Responsable del Proceso / Equipo SSOMA' },
      { campo: 'How (¿Cómo?)', detalle: `Ejecución de plan de acción estructurado con metodología ${herr}` },
      { campo: 'How much (¿Cuánto?)', detalle: 'Recursos operativos asignados al plan' }
    ];
  }

  onFileChange(event: any): void {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.cargandoArchivo = true;
      const docTitle = file.name.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').trim();

      // Jalar inmediatamente el título del nombre con que se guardó el documento
      this.formulario.get('titulo')?.setValue(docTitle);

      // Leer las celdas y filas reales del Excel y autocompletar formulario (PDM-14)
      this.leerContenidoExcelReal(file);

      // Subir archivo al backend servidor
      this.mejoraService.uploadArchivo(file).subscribe({
        next: (res: any) => {
          this.cargandoArchivo = false;
          if (res && res.success) {
            this.archivoNombre = res.fileName;
            this.formulario.get('archivo')?.setValue(res.fileName);

            // Generar la prevista visual del Excel sin re-parsear innecesariamente
            this.archivoTamanio = (file.size / 1024).toFixed(1) + ' KB';
            this.mostrarVistaPrevia = true;
            this.actualizarDetallePrevista(docTitle);
          } else {
            this.toastr.error('Error al subir el archivo.', 'Error Carga');
          }
        },
        error: (err) => {
          this.cargandoArchivo = false;
          console.error('Error al subir archivo:', err);
          this.toastr.error('Ocurrió un error al subir el archivo al servidor.', 'Error Carga');
        }
      });
    }
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor llene todos los campos obligatorios (*).', 'Formulario Incompleto');
      return;
    }
    this.dialogRef.close(this.formulario.getRawValue());
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
