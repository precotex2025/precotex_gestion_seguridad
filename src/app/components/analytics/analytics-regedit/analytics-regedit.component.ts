import { Component, Inject, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { SedesService } from '../../../services/sedes.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-analytics-regedit',
  standalone: false,
  templateUrl: './analytics-regedit.component.html',
  styleUrls: ['./analytics-regedit.component.css']
})
export class AnalyticsRegeditComponent implements OnInit {

  formulario!: FormGroup;

  tiposOptions = ['Eficacia', 'Eficiencia', 'Efectividad'];
  normasOptions = ['ISO 9001:2015', 'ISO 45001:2018', 'ISO 14001:2015'];
  estadosOptions = ['Activo', 'Inactivo'];
  frecuenciasOptions = ['Diario', 'Semanal', 'Mensual', 'Trimestral'];
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

  previousSedeSelection: string[] = ['Todas'];
  
  // IND-05: Fuente de datos seleccionable y digitable
  fuentesOptions: string[] = [
    'Reporte de producción',
    'Reporte de calidad',
    'Reporte SSOMA',
    'Sistema ERP',
    'Registro manual',
    'Informe de Auditoría Interna',
    'Parte Diario de Mantenimiento',
    'Checklist de Operaciones',
    'Matriz IPERC',
    'Registro de Asistencia y Capacitación',
    'Hojas de Control en Planta',
    'Sistema de Control de Calidad (QMS)'
  ];

  fuentesSugeridasRapidas: string[] = [
    'Reporte de producción',
    'Reporte SSOMA',
    'Sistema ERP',
    'Registro manual',
    'Checklist de Operaciones',
    'Informe de Auditoría Interna'
  ];

  mostrarDropdownFuentes: boolean = false;
  mostrarAyudaTipo: boolean = false;
  fuentesFiltradas: string[] = [];
  unidadesOptions = ['Porcentaje (%)', 'Número', 'Días', 'kWh', 'Soles'];
  tipometasOptions = ['Mayor o igual (≥)', 'Menor o igual (≤)', 'Igual (=)'];
  sentidosOptions = ['↑ Sube es bueno', '↓ Baja es bueno'];

  procesosGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<AnalyticsRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService,
    private sedesService: SedesService
  ) {}

  ngOnInit(): void {
    // Cargar sedes activas de la base de datos
    this.sedesService.getListadoSedes('001', '1').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const listS = res.elements
            .map((s: any) => (s.denominacion || '').trim())
            .filter((s: string) => s.length > 0);
          listS.forEach((s: string) => {
            if (!this.sedesOptions.some(opt => opt.toLowerCase() === s.toLowerCase())) {
              this.sedesOptions.splice(this.sedesOptions.length - 1, 0, s);
            }
          });
        }
      },
      error: () => {}
    });

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
        if (this.data.Accion === 'U' && this.data.Datos) {
          const rawProc = this.data.Datos.proceso || this.data.Datos.nombre_proceso || this.data.Datos.Nombre_Proceso || this.data.Datos.codigo_proceso || this.data.Datos.Codigo_Proceso;
          if (rawProc) {
            this.formulario.patchValue({ proceso: rawProc });
          }
        }
      }
    });

    this.formulario = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      tipo: ['Eficacia', Validators.required],
      norma: ['ISO 9001:2015', Validators.required],
      responsable: ['', Validators.required],
      respmed: ['', Validators.required],
      estado: ['Activo', Validators.required],
      sede: [['Todas'], Validators.required],
      proceso: ['SSOMA', Validators.required],
      areasacc: [''],
      inicio: ['', Validators.required],
      fin: [''],
      esConstante: [true],
      frecuencia: ['Mensual', Validators.required],
      fuente: ['Reporte de producción', Validators.required],
      formula: ['', Validators.required],
      unidad: ['Porcentaje (%)', Validators.required],
      base: [''],
      meta: ['', Validators.required],
      tipometa: ['Mayor o igual (≥)', Validators.required],
      sentido: ['↑ Sube es bueno', Validators.required]
    });

    this.fuentesFiltradas = [...this.fuentesOptions];

    if (this.data.Accion === 'I') {
      const autoCode = this.data.Datos?.codigo || `IND-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const hoy = new Date().toISOString().substring(0, 10);
      this.previousSedeSelection = ['Todas'];
      this.formulario.patchValue({ 
        codigo: autoCode,
        sede: ['Todas'],
        tipo: 'Eficacia',
        norma: 'ISO 9001:2015',
        estado: 'Activo',
        proceso: 'SSOMA',
        frecuencia: 'Mensual',
        unidad: 'Porcentaje (%)',
        tipometa: 'Mayor o igual (≥)',
        sentido: '↑ Sube es bueno',
        fuente: 'Reporte de producción',
        inicio: hoy,
        fin: '',
        esConstante: true
      });
      this.formulario.get('fin')?.disable();
    } else if (this.data.Accion === 'U' && this.data.Datos) {
      const d = { ...this.data.Datos };

      // Parse sedes múltiples
      let sedeVal: string[] = ['Todas'];
      const rawSede = d.sede || d.Sede || d.areasacc || d.areas_acceso || d.Areas_Acceso;
      if (typeof rawSede === 'string' && rawSede.trim() !== '') {
        const parts = rawSede.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        const specific = parts.filter((s: string) => s.toLowerCase() !== 'todas');
        sedeVal = specific.length > 0 ? specific : ['Todas'];
      } else if (Array.isArray(rawSede)) {
        const specific = rawSede.filter((s: string) => s && s.trim().toLowerCase() !== 'todas');
        sedeVal = specific.length > 0 ? specific : ['Todas'];
      }

      // Asegurar que las sedes existan en sedesOptions
      sedeVal.forEach(s => {
        if (!this.sedesOptions.some(opt => opt.toLowerCase() === s.toLowerCase())) {
          this.sedesOptions.splice(this.sedesOptions.length - 1, 0, s);
        }
      });
      this.previousSedeSelection = [...sedeVal];

      // Helper para formatear fechas a YYYY-MM-DD
      const formatDateForInput = (val: any) => {
        if (!val) return '';
        if (val instanceof Date && !isNaN(val.getTime())) {
          const y = val.getFullYear();
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
        const str = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.substring(0, 10);
        }
        const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmyMatch) {
          const day = dmyMatch[1].padStart(2, '0');
          const month = dmyMatch[2].padStart(2, '0');
          const year = dmyMatch[3];
          return `${year}-${month}-${day}`;
        }
        return '';
      };

      // Normalizar sentido
      let sentidoVal = d.sentido || d.Sentido || '↑ Sube es bueno';
      if (String(sentidoVal).toLowerCase().includes('sube') || String(sentidoVal).toLowerCase().includes('creciente')) {
        sentidoVal = '↑ Sube es bueno';
      } else if (String(sentidoVal).toLowerCase().includes('baja') || String(sentidoVal).toLowerCase().includes('decreciente')) {
        sentidoVal = '↓ Baja es bueno';
      }

      // Normalizar tipometa
      let tipometaVal = d.tipometa || d.tipo_meta || d.Tipo_Meta || 'Mayor o igual (≥)';
      if (String(tipometaVal).includes('Mayor') || String(tipometaVal).includes('>=')) {
        tipometaVal = 'Mayor o igual (≥)';
      } else if (String(tipometaVal).includes('Menor') || String(tipometaVal).includes('<=')) {
        tipometaVal = 'Menor o igual (≤)';
      } else if (String(tipometaVal).includes('Igual') || String(tipometaVal).includes('=')) {
        tipometaVal = 'Igual (=)';
      }

      // Normalizar unidad
      let unidadVal = d.unidad || d.unidad_medida || d.Unidad_Medida || 'Porcentaje (%)';
      if (String(unidadVal).includes('%') || String(unidadVal).toLowerCase().includes('porcent')) {
        unidadVal = 'Porcentaje (%)';
      } else if (String(unidadVal).toLowerCase().includes('d') && String(unidadVal).toLowerCase().includes('as')) {
        unidadVal = 'Días';
      } else if (String(unidadVal).toLowerCase().includes('sol')) {
        unidadVal = 'Soles';
      } else if (String(unidadVal).toLowerCase().includes('kwh')) {
        unidadVal = 'kWh';
      } else if (String(unidadVal).toLowerCase().includes('n') && String(unidadVal).toLowerCase().includes('m')) {
        unidadVal = 'Número';
      }

      const rawFin = d.fin || d.fecha_fin || d.Fecha_Fin || d.fec_fin || d.Fec_Fin;
      const parsedFin = formatDateForInput(rawFin);
      const isConstante = !parsedFin || parsedFin.trim() === '';

      this.formulario.patchValue({
        codigo: d.codigo || d.Codigo || '',
        nombre: d.nombre || d.Nombre || '',
        tipo: d.tipo || d.Tipo || 'Eficacia',
        norma: d.norma || d.Norma || 'ISO 9001:2015',
        responsable: d.responsable || d.Responsable || '',
        respmed: d.respmed || d.resp_medicion || d.Resp_Medicion || '',
        estado: d.estado || d.Estado || 'Activo',
        sede: sedeVal,
        proceso: d.proceso || d.nombre_proceso || d.Nombre_Proceso || d.codigo_proceso || d.Codigo_Proceso || 'SSOMA',
        areasacc: d.areasacc || d.areas_acceso || d.Areas_Acceso || '',
        inicio: formatDateForInput(d.inicio || d.fecha_inicio || d.Fecha_Inicio || d.fec_inicio || d.Fec_Inicio),
        fin: parsedFin,
        esConstante: isConstante,
        frecuencia: d.frecuencia || d.Frecuencia || 'Mensual',
        fuente: d.fuente || d.fuente_datos || d.Fuente_Datos || 'Reporte de producción',
        formula: d.formula || d.Formula || '',
        unidad: unidadVal,
        base: d.base || d.linea_base || d.Linea_Base || '',
        meta: d.meta !== undefined && d.meta !== null ? d.meta : (d.Meta !== undefined && d.Meta !== null ? d.Meta : ''),
        tipometa: tipometaVal,
        sentido: sentidoVal
      });

      if (isConstante) {
        this.formulario.get('fin')?.disable();
      } else {
        this.formulario.get('fin')?.enable();
      }
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  // ===================================================================
  // IND-05: MÉTODOS DEL COMBOBOX (SELECCIONABLE Y DIGITABLE)
  // ===================================================================
  toggleDropdownFuentes(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.mostrarDropdownFuentes = !this.mostrarDropdownFuentes;
    if (this.mostrarDropdownFuentes) {
      this.filtrarFuentes(this.formulario.get('fuente')?.value || '');
    }
  }

  abrirDropdownFuentes(): void {
    this.mostrarDropdownFuentes = true;
    this.filtrarFuentes(this.formulario.get('fuente')?.value || '');
  }

  cerrarDropdownFuentes(): void {
    setTimeout(() => {
      this.mostrarDropdownFuentes = false;
    }, 200);
  }

  seleccionarFuente(opcion: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.formulario.get('fuente')?.setValue(opcion);
    this.formulario.get('fuente')?.markAsDirty();
    this.mostrarDropdownFuentes = false;
  }

  filtrarFuentes(termino: string): void {
    if (!termino || termino.trim() === '') {
      this.fuentesFiltradas = [...this.fuentesOptions];
    } else {
      const termLower = termino.toLowerCase().trim();
      this.fuentesFiltradas = this.fuentesOptions.filter(opt =>
        opt.toLowerCase().includes(termLower)
      );
    }
  }

  onFuenteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtrarFuentes(input.value);
    this.mostrarDropdownFuentes = true;
  }

  limpiarFuente(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.formulario.get('fuente')?.setValue('');
    this.filtrarFuentes('');
    this.mostrarDropdownFuentes = true;
  }

  toggleAyudaTipo(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.mostrarAyudaTipo = !this.mostrarAyudaTipo;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.combobox-fuente-container')) {
      this.mostrarDropdownFuentes = false;
    }
    if (!target.closest('.btn-help-tipo') && !target.closest('.guia-tipo-box')) {
      this.mostrarAyudaTipo = false;
    }
  }

  onSedeSelectionChange(event: any): void {
    const current: string[] = event.value || [];
    const prev = this.previousSedeSelection || [];

    let updated: string[] = [];

    const hadTodas = prev.includes('Todas');
    const hasTodas = current.includes('Todas');

    if (!hadTodas && hasTodas) {
      // Usuario seleccionó explícitamente "Todas" -> desmarcar todas las sedes específicas
      updated = ['Todas'];
    } else if (hadTodas && hasTodas && current.length > 1) {
      // "Todas" estaba marcado y el usuario seleccionó una sede específica -> desmarcar "Todas"
      updated = current.filter(s => s !== 'Todas');
    } else if (hadTodas && !hasTodas) {
      // Usuario desmarcó "Todas"
      updated = current.filter(s => s !== 'Todas');
    } else {
      // Conmutación normal de sedes específicas
      updated = current.filter(s => s !== 'Todas');
    }

    if (updated.length === 0) {
      // Si el usuario desmarca todo, vuelve por defecto a ['Todas']
      updated = ['Todas'];
    }

    this.previousSedeSelection = [...updated];
    this.formulario.get('sede')?.setValue(updated, { emitEvent: false });
  }

  onToggleConstante(event: any): void {
    const isChecked = event && event.target ? event.target.checked : !!event;
    if (isChecked) {
      this.formulario.get('fin')?.setValue('');
      this.formulario.get('fin')?.disable();
    } else {
      this.formulario.get('fin')?.enable();
    }
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos obligatorios (*)', 'Formulario Incompleto');
      return;
    }
    const val = { ...this.formulario.getRawValue() };
    if (val.esConstante || !val.fin || String(val.fin).trim() === '') {
      val.fin = null;
    }
    if (Array.isArray(val.sede)) {
      const specificSedes = val.sede.filter((s: string) => s && s.trim().toLowerCase() !== 'todas');
      val.sede = specificSedes.length > 0 ? specificSedes.join(', ') : 'Todas';
    } else if (typeof val.sede === 'string' && val.sede.trim() !== '') {
      val.sede = val.sede.trim();
    } else {
      val.sede = 'Todas';
    }
    this.dialogRef.close(val);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
