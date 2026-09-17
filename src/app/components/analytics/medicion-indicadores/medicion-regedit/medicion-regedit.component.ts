import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../../services/procesos.service';
import { IndicadoresService } from '../../../../services/indicadores.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-medicion-regedit',
  standalone: false,
  templateUrl: './medicion-regedit.component.html',
  styleUrls: ['./medicion-regedit.component.css']
})
export class MedicionRegeditComponent implements OnInit {

  formulario!: FormGroup;
  indicadores: any[] = [];
  indicadorSeleccionado: any = null;
  nombreArchivoEvidencia: string = '';
  archivoEvidenciaBase64: string = '';
  
  // Sedes requeridas por la organización Precotex
  sedesOptions: string[] = [
    'Santa Maria',
    'Santa Cecilia',
    'Santa Rosa',
    'Huachipa 1',
    'Huachipa 2',
    'Huachipa 3',
    'Independencia 1',
    'Independencia 2',
    'Todas'
  ];

  semaforosOptions = ['En meta', 'En riesgo', 'Crítico', 'Pendiente'];

  procesosGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<MedicionRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService,
    private indicadoresService: IndicadoresService
  ) {}

  ngOnInit(): void {
    // Limpiar título de posibles caracteres "::." y ".::"
    if (this.data && this.data.Title) {
      this.data.Title = this.data.Title.replace(/[.:]+/g, ' ').trim();
    }

    this.formulario = this.fb.group({
      idIndicador: [null],
      codigoIndicador: [''],
      indicador: ['', Validators.required],
      tipo: ['Eficacia'],
      sede: ['Todas', Validators.required],
      proceso: ['SSOMA', Validators.required],
      norma: ['ISO 9001:2015'],
      frecuencia: ['Mensual'],
      meta: ['', Validators.required],
      valor: ['', Validators.required],
      periodo: ['', Validators.required],
      semaforo: ['En meta', Validators.required],
      evidencia: [''],
      archivoBase64: [''],
      obs: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.aplicarDatosEdicion(this.data.Datos);
    }

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
        if (this.data.Accion === 'U' && this.data.Datos) {
          this.reparcharProceso(this.data.Datos.proceso || this.data.Datos.nombre_Proceso);
        }
      }
    });

    this.cargarIndicadores();

    this.formulario.get('indicador')?.valueChanges.subscribe(val => {
      this.buscarYAutocompletar(val);
    });

    // Auto-cálculo reactivo del semáforo al escribir el valor obtenido
    this.formulario.get('valor')?.valueChanges.subscribe(val => {
      this.autoCalcularSemaforo(val);
    });
  }

  limpiarTexto(text: any): string {
    if (text === null || text === undefined) return '';
    let str = String(text).trim();

    str = str
      .replace(/AuditorÃ[a\u00ad]?\s*Interna/gi, 'Auditoría Interna')
      .replace(/Auditor[ií]a\s*Interna/gi, 'Auditoría Interna')
      .replace(/InspecciÃ[³\u00f3]?n/gi, 'Inspección')
      .replace(/Inspecci[oó]n/gi, 'Inspección')
      .replace(/GestiÃ[³\u00f3]?n/gi, 'Gestión')
      .replace(/LÃ[­\u00ad]?nea/gi, 'Línea')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã\u00ad/g, 'í')
      .replace(/Ãa/g, 'ía')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã /g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã /g, 'Í')
      .replace(/Ã“/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã‘/g, 'Ñ')
      .replace(/â€“/g, ' - ')
      .replace(/â€”/g, ' - ')
      .replace(/â€"/g, ' - ')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€ /g, '"')
      .replace(/Sede Central\s*[-–—?â€"“”]+\s*Lima/gi, 'Sede Central - Lima')
      .replace(/\?[\s\-]*"\s*/g, ' - ')
      .replace(/\?{2,}/g, ' - ');

    return str.replace(/\s*-\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  }

  formatearMetaTexto(meta: any, unidad?: string): string {
    if (meta === null || meta === undefined || meta === '') return '>=85%';
    let val = String(meta).trim();
    if (val.includes('%')) return val;
    const u = String(unidad || '').toLowerCase().trim();
    if (!u || u.includes('%') || u.includes('porcent')) {
      return `${val}%`;
    }
    if (u.includes('n') && (u.includes('m') || u.includes('mero'))) {
      return val;
    }
    return `${val} ${unidad}`;
  }

  aplicarDatosEdicion(d: any): void {
    if (!d) return;

    // 1. Resolver Sede (asegurar que exista en las opciones para que se seleccione)
    let sedeVal = this.limpiarTexto(d.sede || d.Sede || 'Todas');
    if (sedeVal) {
      const match = this.sedesOptions.find(s => s.toLowerCase() === sedeVal.toLowerCase());
      if (match) {
        sedeVal = match;
      } else {
        if (!this.sedesOptions.includes(sedeVal)) {
          this.sedesOptions.splice(this.sedesOptions.length - 1, 0, sedeVal);
        }
      }
    } else {
      sedeVal = 'Todas';
    }

    // 2. Normalizar Semáforo
    let semaVal = d.semaforo || 'En meta';
    const sLow = String(semaVal).toLowerCase();
    if (sLow.includes('meta')) semaVal = 'En meta';
    else if (sLow.includes('riesgo')) semaVal = 'En riesgo';
    else if (sLow.includes('critico') || sLow.includes('crítico')) semaVal = 'Crítico';
    else if (sLow.includes('pendiente')) semaVal = 'Pendiente';
    else semaVal = 'En meta';

    // 3. Proceso
    const procVal = this.limpiarTexto(d.proceso || d.nombre_Proceso || d.nombre_proceso || d.codigo_Proceso || 'General');

    // 4. Meta
    const metaVal = this.formatearMetaTexto(d.meta, d.unidad_Medida || d.unidad);

    // 5. Parchear formulario
    this.formulario.patchValue({
      idIndicador: d.idIndicador || d.id_Indicador || null,
      codigoIndicador: d.codigoIndicador || d.codigo || '',
      indicador: this.limpiarTexto(d.indicador || d.nombre || ''),
      tipo: this.limpiarTexto(d.tipo || 'Eficacia'),
      sede: sedeVal,
      proceso: procVal,
      norma: d.norma || 'ISO 9001:2015',
      frecuencia: d.frecuencia || 'Mensual',
      meta: metaVal,
      valor: d.valor !== undefined && d.valor !== null ? d.valor : '0%',
      periodo: d.periodo || 'Sin medición inicial',
      semaforo: semaVal,
      evidencia: d.evidencia || '',
      archivoBase64: d.archivoBase64 || '',
      obs: this.limpiarTexto(d.obs || d.comentario || '')
    }, { emitEvent: false });

    if (d.evidencia) {
      this.nombreArchivoEvidencia = d.evidencia;
    }

    // 6. Vincular indicador
    this.vincularIndicadorSeleccionado(d);
  }

  reparcharProceso(rawProc: string): void {
    if (!rawProc) return;
    const cleanProc = this.limpiarTexto(rawProc);
    const allProcs = Object.values(this.procesosGroups).flat();
    const cleanTarget = cleanProc.trim().toLowerCase();
    const cleanNoAccents = cleanProc.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

    const matched = allProcs.find(p => 
      p.trim().toLowerCase() === cleanTarget ||
      p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() === cleanNoAccents ||
      p.toLowerCase().includes(cleanTarget) ||
      cleanTarget.includes(p.toLowerCase())
    );

    if (matched) {
      this.formulario.patchValue({ proceso: matched }, { emitEvent: false });
    } else {
      if (!this.procesosGroups['Otros Procesos']) {
        this.procesosGroups['Otros Procesos'] = [];
      }
      if (!this.procesosGroups['Otros Procesos'].includes(cleanProc)) {
        this.procesosGroups['Otros Procesos'].push(cleanProc);
      }
      this.formulario.patchValue({ proceso: cleanProc }, { emitEvent: false });
    }
  }

  vincularIndicadorSeleccionado(d: any): void {
    const cod = (d.codigoIndicador || d.codigo || '').toLowerCase().trim();
    const nom = this.limpiarTexto(d.indicador || d.nombre || '').toLowerCase().trim();

    let found = this.indicadores.find(i => 
      (cod && i.codigo && i.codigo.toLowerCase().trim() === cod) ||
      (nom && i.nombre && i.nombre.toLowerCase().trim() === nom) ||
      (nom && i.nombre && i.nombre.toLowerCase().includes(nom)) ||
      (cod && i.codigo && i.codigo.toLowerCase().includes(cod))
    );

    if (!found) {
      found = {
        id: d.idIndicador || d.id,
        codigo: d.codigoIndicador || d.codigo || 'IND-2026',
        nombre: this.limpiarTexto(d.indicador || d.nombre || 'Indicador Registrado'),
        proceso: this.limpiarTexto(d.proceso || d.nombre_Proceso || 'General'),
        sede: this.limpiarTexto(d.sede || 'Todas'),
        norma: d.norma || 'ISO 9001:2015',
        frecuencia: d.frecuencia || 'Mensual',
        meta: this.formatearMetaTexto(d.meta, d.unidad_Medida || d.unidad)
      };
      this.indicadores.unshift(found);
    } else {
      found.nombre = this.limpiarTexto(found.nombre);
      found.proceso = this.limpiarTexto(found.proceso);
      found.sede = this.limpiarTexto(found.sede);
      found.meta = this.formatearMetaTexto(found.meta, found.unidad_Medida || found.unidad);
    }

    this.indicadorSeleccionado = found;
    this.formulario.patchValue({ indicador: found.nombre }, { emitEvent: false });
  }

  cargarIndicadores(): void {
    this.indicadoresService.getListadoIndicadores().subscribe({
      next: (res: any) => {
        let apiList: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          apiList = res.elements.map((item: any) => ({
            id: item.id_Indicador,
            codigo: item.codigo,
            nombre: this.limpiarTexto(item.nombre),
            proceso: this.limpiarTexto(item.nombre_Proceso || item.codigo_Proceso || 'General'),
            sede: this.limpiarTexto(item.sede || 'Todas'),
            norma: item.norma || 'ISO 9001:2015',
            frecuencia: item.frecuencia || 'Mensual',
            meta: this.formatearMetaTexto(item.meta, item.unidad_Medida)
          }));
        }

        // Combinar con los indicadores en localStorage (IND-10)
        let localList: any[] = [];
        try {
          localList = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
        } catch (e) {
          localList = [];
        }

        const map = new Map<string, any>();
        [...localList, ...apiList].forEach(ind => {
          if (ind.codigo) {
            map.set(ind.codigo.toUpperCase(), ind);
          } else if (ind.nombre) {
            map.set(ind.nombre.toUpperCase(), ind);
          }
        });

        this.indicadores = Array.from(map.values());
        if (this.indicadores.length === 0) {
          this.cargarIndicadoresLocales();
        }

        if (this.data.Accion === 'U' && this.data.Datos) {
          this.vincularIndicadorSeleccionado(this.data.Datos);
        }
      },
      error: () => {
        this.cargarIndicadoresLocales();
        if (this.data.Accion === 'U' && this.data.Datos) {
          this.vincularIndicadorSeleccionado(this.data.Datos);
        }
      }
    });
  }

  cargarIndicadoresLocales(): void {
    let local: any[] = [];
    try {
      local = JSON.parse(localStorage.getItem('precotex_indicadores') || '[]');
    } catch (e) {
      local = [];
    }

    if (local && local.length > 0) {
      this.indicadores = local;
    } else {
      this.indicadores = [
        { id: 1, codigo: 'IND-COS-001', nombre: '% Eficiencia de Costura', proceso: 'Costura', sede: 'Huachipa 1, Santa Cecilia', meta: '>=85%' },
        { id: 2, codigo: 'IND-SST-002', nombre: 'Índice de Frecuencia de Accidentes (IFA)', proceso: 'SSOMA', sede: 'Todas', meta: '<=2.5' },
        { id: 3, codigo: 'IND-CAL-003', nombre: '% Auditorías de Calidad Aprobadas', proceso: 'Gestión de Calidad', sede: 'Huachipa 1', meta: '>=95%' },
        { id: 4, codigo: 'IND-TIN-004', nombre: 'Rendimiento de Tintorería', proceso: 'Tintorería', sede: 'Santa Cecilia', meta: '>=90%' }
      ];
    }
  }

  onSelectIndicadorChange(event: any): void {
    const val = event?.target?.value || '';
    this.buscarYAutocompletar(val);
  }

  onSearchIndicadorChange(event: any): void {
    const val = event?.target?.value || '';
    this.buscarYAutocompletar(val);
  }

  buscarYAutocompletar(val: string): void {
    if (!val) {
      this.indicadorSeleccionado = null;
      return;
    }
    const clean = val.toLowerCase().trim();
    const found = this.indicadores.find(i => 
      (i.nombre && i.nombre.toLowerCase() === clean) ||
      (i.codigo && i.codigo.toLowerCase() === clean) ||
      (`${i.codigo} - ${i.nombre}`.toLowerCase() === clean) ||
      (i.nombre && clean.length >= 3 && i.nombre.toLowerCase().includes(clean)) ||
      (i.codigo && clean.length >= 3 && i.codigo.toLowerCase().includes(clean))
    );

    if (found) {
      this.indicadorSeleccionado = found;
      // IND-07 & IND-11: Jalar todas las informaciones registradas del indicador
      let sedeToSet = 'Todas';
      if (found.sede) {
        const matched = this.sedesOptions.find(s => s.toLowerCase() === found.sede.trim().toLowerCase());
        if (matched) {
          sedeToSet = matched;
        } else if (found.sede.trim() !== '') {
          // Si es una sede válida no catalogada previamente, incluirla
          if (!this.sedesOptions.includes(found.sede.trim())) {
            this.sedesOptions.splice(this.sedesOptions.length - 1, 0, found.sede.trim());
          }
          sedeToSet = found.sede.trim();
        }
      }

      this.formulario.patchValue({
        idIndicador: found.id || found.id_Indicador || null,
        codigoIndicador: found.codigo,
        indicador: found.nombre,
        tipo: found.tipo || 'Eficacia',
        sede: sedeToSet,
        proceso: found.proceso || 'SSOMA',
        norma: found.norma || 'ISO 9001:2015',
        frecuencia: found.frecuencia || 'Mensual',
        meta: found.meta ? (String(found.meta).includes('%') ? found.meta : found.meta + '%') : '>=85%'
      }, { emitEvent: false });

      // Si ya hay un valor ingresado, calcular semáforo
      const currentVal = this.formulario.get('valor')?.value;
      if (currentVal !== null && currentVal !== undefined && currentVal !== '') {
        this.autoCalcularSemaforo(currentVal);
      }
    }
  }

  autoCalcularSemaforo(valStr: any): void {
    if (valStr === null || valStr === undefined || valStr === '') return;
    const numVal = parseFloat(String(valStr).replace(/[^0-9.]/g, ''));
    if (isNaN(numVal)) return;

    const metaRaw = String(this.formulario.get('meta')?.value || '');
    const metaNum = parseFloat(metaRaw.replace(/[^0-9.]/g, '')) || 85;
    const isMenorMejor = metaRaw.includes('<') || metaRaw.toLowerCase().includes('menor');

    let res = 'Crítico';
    if (isMenorMejor) {
      if (numVal <= metaNum) {
        res = 'En meta';
      } else if (numVal <= metaNum * 1.2) {
        res = 'En riesgo';
      } else {
        res = 'Crítico';
      }
    } else {
      if (numVal >= metaNum) {
        res = 'En meta';
      } else if (numVal >= metaNum * 0.8) {
        res = 'En riesgo';
      } else {
        res = 'Crítico';
      }
    }
    this.formulario.get('semaforo')?.setValue(res, { emitEvent: false });
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onFileEvidenciaSelected(event: any): void {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Validar extensiones permitidas
    const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      this.toastr.warning('Formato no permitido. Por favor seleccione un archivo PDF, Excel, Imagen o Word.', 'Archivo no válido');
      return;
    }

    // Validar tamaño máximo (10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.toastr.warning('El archivo excede el tamaño máximo permitido de 10 MB.', 'Archivo muy pesado');
      return;
    }

    this.nombreArchivoEvidencia = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.archivoEvidenciaBase64 = reader.result as string;
      this.formulario.patchValue({
        evidencia: file.name,
        archivoBase64: this.archivoEvidenciaBase64
      });
      this.toastr.info(`Archivo "${file.name}" adjuntado como evidencia correctamente.`, 'Evidencia Adjuntada', { timeOut: 2000 });
    };
    reader.readAsDataURL(file);
  }

  onRemoveEvidencia(inputRef: HTMLInputElement): void {
    this.nombreArchivoEvidencia = '';
    this.archivoEvidenciaBase64 = '';
    if (inputRef) {
      inputRef.value = '';
    }
    this.formulario.patchValue({
      evidencia: '',
      archivoBase64: ''
    });
    this.toastr.info('Archivo de evidencia retirado.', '');
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos obligatorios (*)', 'Formulario Incompleto');
      return;
    }
    const val = { ...this.formulario.value };

    // Asegurar que codigoIndicador, idIndicador, tipo, norma y frecuencia nunca sean NULL ni vacíos
    if (this.indicadorSeleccionado) {
      val.codigoIndicador = this.indicadorSeleccionado.codigo || val.codigoIndicador;
      val.idIndicador = this.indicadorSeleccionado.id || this.indicadorSeleccionado.id_Indicador || val.idIndicador;
      val.tipo = this.indicadorSeleccionado.tipo || val.tipo || 'Eficacia';
      val.norma = this.indicadorSeleccionado.norma || val.norma || 'ISO 9001:2015';
      val.frecuencia = this.indicadorSeleccionado.frecuencia || val.frecuencia || 'Mensual';
    }

    if (!val.codigoIndicador) {
      const found = this.indicadores.find(i => 
        (i.nombre && val.indicador && i.nombre.toLowerCase() === val.indicador.toLowerCase()) ||
        (i.codigo && val.indicador && i.codigo.toLowerCase() === val.indicador.toLowerCase())
      );
      if (found) {
        val.codigoIndicador = found.codigo;
        val.idIndicador = found.id || found.id_Indicador;
        val.tipo = found.tipo || 'Eficacia';
        val.norma = found.norma || 'ISO 9001:2015';
        val.frecuencia = found.frecuencia || 'Mensual';
      } else {
        val.codigoIndicador = 'IND-' + new Date().getFullYear() + '-001';
      }
    }

    this.dialogRef.close(val);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
