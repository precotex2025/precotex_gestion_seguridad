import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-planificacion-objetivos-regedit',
  standalone: false,
  templateUrl: './planificacion-objetivos-regedit.component.html',
  styleUrls: ['./planificacion-objetivos-regedit.component.css']
})
export class PlanificacionObjetivosRegeditComponent implements OnInit {

  formulario!: FormGroup;

  normasOptions = ['ISO 9001:2015', 'ISO 45001:2018', 'ISO 14001:2015'];
  frecuenciasOptions = ['Mensual', 'Trimestral', 'Semestral'];
  estadosOptions = ['Planificado', 'Pendiente', 'Cumplido'];

  procesosGroups: { [key: string]: string[] } = {
    'Gerencia General (GG)': [
      'Sistema de Gestión General',
      'Gestión Estratégica',
      'Proyectos Gerenciales',
      'Desarrollo de Negocios',
      'Alianzas Estratégicas',
      'Comercial Exportación de Telas',
      'Comercial Venta Local Textil'
    ],
    'Gestión Comercial (GCOM)': [
      'Desarrollo de Producto',
      'Desarrollo de Estampado y Bordado',
      'Desarrollo Textil',
      'Comercial Exportación de Prendas'
    ],
    'Planeamiento y Control de la Producción (PCP)': [
      'PCP Textil',
      'PCP Manufactura',
      'PCP Estampado y Bordado'
    ],
    'Logística (LOG)': [
      'Almacén',
      'Comercio Exterior',
      'Logística',
      'Transporte'
    ],
    'Balance de Materia (BM)': [
      'Balance de Materia'
    ],
    'Operaciones Textil (OPT)': [
      'Hilandería',
      'Tejeduría',
      'Tintorería',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Aseguramiento de Calidad Textil',
      'Lavandería'
    ],
    'Operaciones Manufactura (OPM)': [
      'Corte',
      'Costura',
      'Inspección',
      'Acabados',
      'Aseguramiento de la Calidad Manufactura',
      'Consumos'
    ],
    'Servicio de Estampado y Bordado (SEB)': [
      'Estampado',
      'Bordado',
      'Calidad Estampado y Bordado',
      'Planeamiento y Programación de la Producción E&B'
    ],
    'Gestión Humana (GGHH)': [
      'Gestión Humana',
      'Administración de Personal',
      'Capacitaciones y Desarrollo',
      'Comunicaciones',
      'Bienestar Social',
      'Selección de Personal'
    ],
    'Administración y Finanzas (AFC)': [
      'Administración',
      'Finanzas',
      'Contabilidad y Costos',
      'Tesorería'
    ],
    'Ingeniería y Mejora Continua (IMC)': [
      'Organización y Métodos',
      'Mejora Continua',
      'Investigación, Desarrollo e Innovación',
      'Certificaciones'
    ],
    'Control Patrimonial (CPT)': [
      'Control Patrimonial'
    ],
    'Auditoría Interna (AIO)': [
      'Auditoría Interna'
    ],
    'Soporte (SOP)': [
      'Tecnologías de la Información (Sistemas)',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Seguridad Patrimonial',
      'Mantenimiento e Infraestructura'
    ]
  };

  get cleanTitle(): string {
    if (!this.data?.Title) return this.data?.Accion === 'U' ? 'Editar Objetivo SIG' : 'Registrar Objetivo SIG';
    return this.data.Title.replace(/[.:]+/g, ' ').trim();
  }

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PlanificacionObjetivosRegeditComponent>,
    private procesosService: ProcesosService
  ) {}

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
      .replace(/â€“/g, ' - ')
      .replace(/â€”/g, ' - ')
      .replace(/â€"/g, ' - ')
      .replace(/\?[\s\-]*"\s*/g, ' - ')
      .replace(/\?{2,}/g, ' - ');
    return str.replace(/\s*-\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  }

  formatDateForInput(val: any): string {
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
  }

  getAvanceNumber(): number {
    const val = parseFloat(String(this.formulario?.get('avance')?.value || 0));
    if (isNaN(val)) return 0;
    return Math.min(Math.max(val, 0), 100);
  }

  getAvanceColor(): string {
    const n = this.getAvanceNumber();
    if (n >= 85) return '#10b981'; // Esmeralda
    if (n >= 50) return '#6366f1'; // Índigo
    if (n >= 25) return '#f59e0b'; // Ámbar
    return '#ef4444'; // Rosa/Rojo
  }

  getStatusBadgeClass(estado: string): string {
    if (!estado) return 'status-planificado';
    const s = estado.toLowerCase();
    if (s.includes('cumplido') || s.includes('completado')) return 'status-cumplido';
    if (s.includes('proceso') || s.includes('curso') || s.includes('riesgo')) return 'status-proceso';
    return 'status-planificado';
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      id: [null],
      codigo: [''],
      objetivo: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      norma: ['ISO 45001:2018', Validators.required],
      periodo: ['2026', Validators.required],
      responsableProceso: ['', Validators.required],
      fechaInicio: [''],
      fechaFin: [''],
      responsableSeguimiento: ['', Validators.required],
      medioVerificacion: [''],
      indicador: ['', Validators.required],
      formulaCalculo: [''],
      unidadMedida: ['%'],
      base: [''],
      meta: ['100%', Validators.required],
      avance: [0, [Validators.min(0), Validators.max(100)]],
      frecuencia: ['Mensual', Validators.required],
      estado: ['Planificado', Validators.required],
      desc: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      const d = { ...this.data.Datos };
      this.formulario.patchValue({
        id: d.id,
        codigo: d.codigo || '',
        objetivo: this.limpiarTexto(d.objetivo || d.nombre || ''),
        proceso: this.limpiarTexto(d.proceso || 'SSOMA'),
        norma: d.norma || 'ISO 45001:2018',
        periodo: d.periodo || '2026',
        responsableProceso: this.limpiarTexto(d.responsableProceso || ''),
        fechaInicio: this.formatDateForInput(d.fechaInicio || d.fec_Inicio || d.fecha_Inicio),
        fechaFin: this.formatDateForInput(d.fechaFin || d.fec_Fin || d.fecha_Fin),
        responsableSeguimiento: this.limpiarTexto(d.responsableSeguimiento || ''),
        medioVerificacion: this.limpiarTexto(d.medioVerificacion || ''),
        indicador: this.limpiarTexto(d.indicador || ''),
        formulaCalculo: d.formulaCalculo || d.formula || '',
        unidadMedida: d.unidadMedida || d.unidad || '%',
        base: d.base || d.lineaBase || '',
        meta: d.meta ? (String(d.meta).includes('%') ? d.meta : d.meta + '%') : '100%',
        avance: d.avance !== undefined && d.avance !== null ? d.avance : (d.porcentajeAvance !== undefined ? d.porcentajeAvance : 0),
        frecuencia: d.frecuencia || 'Mensual',
        estado: d.estado || 'Planificado',
        desc: this.limpiarTexto(d.desc || d.descripcion || d.estrategia || '')
      });
    }

    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = { ...this.procesosGroups, ...groups };
          if (this.data.Accion === 'U' && this.data.Datos) {
            const rawP = this.limpiarTexto(this.data.Datos.proceso);
            if (rawP) {
              const all = Object.values(this.procesosGroups).flat();
              const found = all.find(p => p.toLowerCase().trim() === rawP.toLowerCase().trim());
              if (found) {
                this.formulario.patchValue({ proceso: found });
              }
            }
          }
        }
      },
      error: () => {}
    });
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onSave() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete todos los campos obligatorios (*).', 'Validación');
      return;
    }
    const val = { ...this.formulario.value };
    val.objetivo = this.limpiarTexto(val.objetivo);
    val.proceso = this.limpiarTexto(val.proceso);
    val.responsableProceso = this.limpiarTexto(val.responsableProceso);
    val.responsableSeguimiento = this.limpiarTexto(val.responsableSeguimiento);
    val.medioVerificacion = this.limpiarTexto(val.medioVerificacion);
    val.indicador = this.limpiarTexto(val.indicador);
    val.desc = this.limpiarTexto(val.desc);
    this.dialogRef.close(val);
  }

  onClose() {
    this.dialogRef.close(null);
  }
}
