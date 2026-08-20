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
  estadoOpts: string[] = ['Abierto', 'Desarrollo- Análisis', 'Desarrollo- Acciones en ejecución', 'Cerrado'];
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
      estado: ['Abierto', Validators.required],
      fechaFin: [''],  // PDM-05: Fecha fin editable, se coloca al cerrar la incidencia/iniciativa
      archivo: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      const d = this.data.Datos;
      this.herramientaSeleccionada = d.herramienta || '5W-2H';
      this.archivoNombre = d.archivo || '';

      if (d.sede) {
        this.onSedeChange(d.sede);
      }

      this.formulario.patchValue({
        tipoRegistro: d.tipoRegistro || d.tipo || 'Iniciativa',
        sede: d.sede || '',
        proceso: d.proceso || '',
        herramienta: this.herramientaSeleccionada,
        titulo: d.titulo || '',
        apertura: d.apertura || '',
        limite: d.limite || '',
        registro: d.registro || today,
        proveniente: d.proveniente || '—',
        estado: d.estado || 'Abierto',
        fechaFin: d.fechaFin || d.fecha_Fin || '',
        archivo: this.archivoNombre
      });

      if (this.archivoNombre) {
        this.generarPrevistaExcel(null, d.titulo || 'Iniciativa de mejora');
      }
    }
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
              // Encabezados reales del Excel
              this.excelHeaders = validRows[0].map(h => (h !== null && h !== undefined) ? h.toString().trim() : '');

              // Filas reales leídas del Excel (máximo 15 filas)
              this.excelRows = validRows.slice(1, 15).map(row =>
                row.map(cell => (cell !== null && cell !== undefined) ? cell.toString().trim() : '')
              );
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

      // Leer las celdas y filas reales del Excel subido por el usuario
      this.leerContenidoExcelReal(file);

      // Subir archivo al backend servidor
      this.mejoraService.uploadArchivo(file).subscribe({
        next: (res: any) => {
          this.cargandoArchivo = false;
          if (res && res.success) {
            this.archivoNombre = res.fileName;
            this.formulario.get('archivo')?.setValue(res.fileName);

            if (!this.formulario.get('titulo')?.value) {
              this.formulario.get('titulo')?.setValue(nameWithoutExt);
            }

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

            this.toastr.success('Archivo Excel subido y contenido leído con éxito.', 'Prevista Generada');
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
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
