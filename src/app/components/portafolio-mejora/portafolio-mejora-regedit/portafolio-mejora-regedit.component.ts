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

    let detectedHerramienta: string | null = null;
    let detectedTipo: string | null = null;
    let detectedTitulo: string | null = null;
    let detectedSede: string | null = null;
    let detectedProceso: string | null = null;
    let detectedApertura: string | null = null;
    let detectedLimite: string | null = null;
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

        // 1. Detectar Herramienta
        if (!detectedHerramienta) {
          if (cellLower.includes('5w-2h') || cellLower.includes('5w 2h') || cellLower.includes('5w2h')) {
            detectedHerramienta = '5W-2H';
          } else if (cellLower.includes('análisis de causa raíz') || cellLower.includes('analisis de causa raiz') || cellLower.includes('arbol de causa') || cellLower.includes('acr') || cellLower.includes('5 porqués') || cellLower.includes('5 porques')) {
            detectedHerramienta = 'ACR';
          }
        }

        // 2. Detectar Tipo
        if (!detectedTipo) {
          if (cellLower.includes('tipo de registro') || cellLower.includes('tipo registro')) {
            const nextVal = (row[c + 1] || '').toString().trim().toLowerCase();
            if (nextVal.includes('incidencia')) detectedTipo = 'Incidencia';
            if (nextVal.includes('iniciativa')) detectedTipo = 'Iniciativa';
          }
        }

        // 3. Detectar Título / ¿Qué? / What / Descripción del Problema
        if (!detectedTitulo) {
          if (
            cellLower === 'what (¿qué?)' || cellLower === 'what' || cellLower === '¿qué?' ||
            cellLower.startsWith('título de la iniciativa') || cellLower.startsWith('titulo de la iniciativa') ||
            cellLower.startsWith('descripción del problema') || cellLower.startsWith('descripcion del problema') ||
            cellLower.startsWith('título') || cellLower.startsWith('titulo') || cellLower.startsWith('problema')
          ) {
            const val = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
            if (val && val.length > 3 && !val.toLowerCase().startsWith('descripción')) {
              detectedTitulo = val;
            }
          }
        }

        // 4. Detectar Sede
        if (!detectedSede) {
          if (cellLower.startsWith('sede:') || cellLower.startsWith('sede') || cellLower === 'where (¿dónde?)') {
            const candidate = (row[c + 1] || '').toString().trim();
            for (const s of this.sedes) {
              if (candidate.toLowerCase().includes(s.toLowerCase())) {
                detectedSede = s;
                break;
              }
            }
          }
          if (!detectedSede) {
            for (const s of this.sedes) {
              if (cellLower === s.toLowerCase() || cellLower.includes(s.toLowerCase())) {
                detectedSede = s;
                break;
              }
            }
          }
        }

        // 5. Detectar Proceso
        if (!detectedProceso) {
          if (cellLower.startsWith('proceso:') || cellLower.startsWith('proceso') || cellLower.startsWith('área:') || cellLower.startsWith('area:')) {
            const candidate = (row[c + 1] || '').toString().trim();
            for (const p of this.todosLosProcesos) {
              if (candidate.toLowerCase().includes(p.toLowerCase())) {
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

        // 6. Detectar Fechas
        if (!detectedApertura && (cellLower.includes('fecha ocurrencia') || cellLower.includes('fecha inicio') || cellLower.includes('fecha apertura') || cellLower.includes('when (inicio)'))) {
          const val = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
          const norm = this.normalizarFecha(val);
          if (norm) detectedApertura = norm;
        }

        if (!detectedLimite && (cellLower.includes('fecha límite') || cellLower.includes('fecha limite') || cellLower.includes('fecha fin estimada') || cellLower.includes('when (límite)') || cellLower.includes('when (limite)'))) {
          const val = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
          const norm = this.normalizarFecha(val);
          if (norm) detectedLimite = norm;
        }

        if (!detectedFechaFin && (cellLower.includes('fecha fin real') || cellLower.includes('fecha cierre') || cellLower.includes('fecha término') || cellLower.includes('fecha termino'))) {
          const val = (row[c + 1] || (validRows[r + 1] && validRows[r + 1][c]) || '').toString().trim();
          const norm = this.normalizarFecha(val);
          if (norm) detectedFechaFin = norm;
        }

        // 7. Detectar Estado
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

    // Fallback de título desde el nombre del archivo si no vino en el Excel
    if (!detectedTitulo) {
      detectedTitulo = fileName.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').trim();
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

    // Parchear valores en el formulario
    const patchObj: any = {};
    if (detectedTipo) patchObj.tipoRegistro = detectedTipo;
    if (detectedTitulo) patchObj.titulo = detectedTitulo;
    if (detectedApertura) patchObj.apertura = detectedApertura;
    if (detectedLimite) patchObj.limite = detectedLimite;
    if (detectedFechaFin) patchObj.fechaFin = detectedFechaFin;
    if (detectedEstado) patchObj.estado = detectedEstado;

    this.formulario.patchValue(patchObj);
    this.actualizarDetallePrevista(detectedTitulo);

    const autoSummary = [
      detectedHerramienta ? `Herramienta: ${detectedHerramienta}` : null,
      detectedSede ? `Sede: ${detectedSede}` : null,
      detectedProceso ? `Proceso: ${detectedProceso}` : null,
      detectedTitulo ? `Título autollenado` : null
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

              // PDM-14: Ejecutar autocompletado inteligente
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

    if (file) {
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
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ');

      // Leer las celdas y filas reales del Excel y autocompletar formulario (PDM-14)
      this.leerContenidoExcelReal(file);

      // Subir archivo al backend servidor
      this.mejoraService.uploadArchivo(file).subscribe({
        next: (res: any) => {
          this.cargandoArchivo = false;
          if (res && res.success) {
            this.archivoNombre = res.fileName;
            this.formulario.get('archivo')?.setValue(res.fileName);

            const today = new Date();
            const occ = new Date();
            occ.setDate(occ.getDate() - 3);
            const lim = new Date();
            lim.setDate(lim.getDate() + 14);

            if (!this.formulario.get('apertura')?.value) {
              this.formulario.get('apertura')?.setValue(occ.toISOString().slice(0, 10));
            }
            if (!this.formulario.get('limite')?.value) {
              this.formulario.get('limite')?.setValue(lim.toISOString().slice(0, 10));
            }

            // Generar la prevista visual del Excel
            this.generarPrevistaExcel(file, nameWithoutExt);
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
