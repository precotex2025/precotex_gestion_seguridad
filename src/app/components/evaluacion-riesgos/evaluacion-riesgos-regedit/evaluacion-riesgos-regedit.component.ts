import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U' | 'V'
  NextCodigo?: string;
  Datos: any;
}

@Component({
  selector: 'app-evaluacion-riesgos-regedit',
  standalone: false,
  templateUrl: './evaluacion-riesgos-regedit.component.html',
  styleUrls: ['./evaluacion-riesgos-regedit.component.css']
})
export class EvaluacionRiesgosRegeditComponent implements OnInit {
  formulario!: FormGroup;

  readonly sedesOptions: string[] = [
    'Santa Maria',
    'Santa Cecilia',
    'Santa Rosa',
    'Huachipa 1',
    'Huachipa 2',
    'Huachipa 3',
    'Independencia 1',
    'Independencia 2',
    'Todas'
  ]; // RIE-09
  readonly periodosOptions = ['2026', '2025', '2024', '2023']; // RIE-09
  readonly tiposOptions = ['Seguridad', 'Calidad', 'Ambiental', 'Operativo']; // RIE-04
  readonly clausulasOptions = [
    '6.1.1 Acciones para abordar riesgos y oportunidades',
    '6.1.2 Identificación de peligros y evaluación de los riesgos (IPERC)',
    '6.1.3 Determinación de los requisitos legales y otros requisitos',
    '6.1.4 Planificación de acciones',
    '8.1 Planificación y control operacional',
    '8.2 Preparación y respuesta ante emergencias',
    '9.1 Seguimiento, medición, análisis y evaluación del desempeño',
    '10.2 Incidentes, no conformidades y acciones correctivas'
  ]; // RIE-10

  get cleanTitle(): string {
    if (this.data?.Accion === 'I') return 'Declarar Nuevo Riesgo IPERC';
    if (this.data?.Accion === 'V') return 'Visualizar Riesgo IPERC';
    return 'Editar Registro de Riesgo IPERC';
  }

  getNivelBadgeClass(nivel?: string): string {
    const val = (nivel || '').toLowerCase();
    if (val.includes('alto')) return 'nivel-badge-alto';
    if (val.includes('medio')) return 'nivel-badge-medio';
    return 'nivel-badge-bajo';
  }
  
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

  readonly nivelesOptions = ['Alto', 'Medio', 'Bajo'];
  readonly estadosOptions = ['Controlado', 'En seguimiento', 'Sin control'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<EvaluacionRiesgosRegeditComponent>,
    private procesosService: ProcesosService
  ) { }

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = { ...this.procesosGroups, ...groups };
        }
      },
      error: () => {}
    });

    this.formulario = this.fb.group({
      codigo: [{ value: '', disabled: true }, Validators.required],
      periodo: [new Date().getFullYear().toString(), Validators.required], // RIE-09
      sede: ['Santa Maria', Validators.required],                           // RIE-09
      tipo: ['Seguridad', Validators.required],
      clausula: ['6.1.2 Identificación de peligros y evaluación de los riesgos (IPERC)', Validators.required], // RIE-10
      descbrief: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      causaprobable: [''],                                                 // RIE-11
      consecuenciapotencial: [''],                                         // RIE-11
      probabilidad: [3, Validators.required], // 1 a 5
      impacto: [3, Validators.required],     // 1 a 5
      nivel: [{ value: 'Medio', disabled: true }, Validators.required],  // RIE-12: Auto-calculado bloqueado
      responsable: ['', Validators.required],
      revision: [new Date().toISOString().substring(0, 10)], // RIE-17: Valor inicial por defecto
      estado: ['Sin control'],                               // RIE-18: Nace inicialmente como 'Sin control'
      medidacontrol: [''],
      archivoEvidencia: ['']                                 // Subir documento de sustento / Matriz IPERC
    });

    // RIE-12: Cálculo automático de nivel de riesgo residual (Probabilidad x Impacto)
    const calcularNivel = () => {
      const p = parseInt(this.formulario.get('probabilidad')?.value || 3, 10);
      const i = parseInt(this.formulario.get('impacto')?.value || 3, 10);
      const score = p * i;
      let nuevoNivel = 'Bajo';
      if (score >= 15) nuevoNivel = 'Alto';
      else if (score >= 8) nuevoNivel = 'Medio';

      if (this.formulario.get('nivel')?.value !== nuevoNivel) {
        this.formulario.get('nivel')?.setValue(nuevoNivel, { emitEvent: false });
      }
    };

    this.formulario.get('probabilidad')?.valueChanges.subscribe(() => calcularNivel());
    this.formulario.get('impacto')?.valueChanges.subscribe(() => calcularNivel());

    if (this.data.Accion === 'I') {
      const autoCod = this.data.NextCodigo || 'RSG-2026-001';
      this.formulario.patchValue({ codigo: autoCod });
    } else if ((this.data.Accion === 'U' || this.data.Accion === 'V') && this.data.Datos) {
      const nomArch = this.data.Datos.archivoEvidencia || this.data.Datos.evidencia || '';
      this.nombreArchivoEvidencia = nomArch;
      this.formulario.patchValue({
        codigo: this.data.Datos.codigo,
        periodo: this.data.Datos.periodo || new Date().getFullYear().toString(),
        sede: this.data.Datos.sede || 'Santa Maria',
        tipo: this.data.Datos.tipo,
        clausula: this.data.Datos.clausula || '6.1.2 Identificación de peligros y evaluación de los riesgos (IPERC)',
        descbrief: this.data.Datos.descbrief,
        proceso: this.data.Datos.proceso,
        causaprobable: this.data.Datos.causaprobable || '',
        consecuenciapotencial: this.data.Datos.consecuenciapotencial || '',
        probabilidad: this.data.Datos.probabilidad || 3,
        impacto: this.data.Datos.impacto || 3,
        nivel: this.data.Datos.nivel || 'Medio',
        responsable: this.data.Datos.responsable,
        revision: this.data.Datos.revision,
        estado: this.data.Datos.estado,
        medidacontrol: this.data.Datos.medidacontrol || '',
        archivoEvidencia: nomArch
      });
      if (this.data.Accion === 'V') {
        this.formulario.disable();
      }
    }
  }

  nombreArchivoEvidencia: string = '';
  isDragging: boolean = false;

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  procesarArchivo(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.toastr.warning('El archivo supera el límite permitido de 10 MB.', 'Archivo muy pesado');
      return;
    }
    this.nombreArchivoEvidencia = file.name;
    this.formulario.patchValue({ archivoEvidencia: file.name });
    this.toastr.success(`Documento "${file.name}" adjuntado correctamente`, 'Archivo cargado', { timeOut: 2500 });
  }

  onRemoveFile(event?: Event): void {
    if (event) event.stopPropagation();
    this.nombreArchivoEvidencia = '';
    this.formulario.patchValue({ archivoEvidencia: '' });
  }

  readonly probRows = [5, 4, 3, 2, 1]; // Filas de 5 a 1
  readonly impCols = [1, 2, 3, 4, 5];  // Columnas de 1 a 5

  // RIE-13: Selección interactiva al hacer clic en cualquier celda de la matriz 5x5
  seleccionarCeldaMatriz(prob: number, impacto: number): void {
    if (this.data.Accion === 'V') return;
    this.formulario.patchValue({
      probabilidad: prob,
      impacto: impacto
    });
  }

  isCeldaSeleccionada(prob: number, impacto: number): boolean {
    const currentP = parseInt(this.formulario.get('probabilidad')?.value || 3, 10);
    const currentI = parseInt(this.formulario.get('impacto')?.value || 3, 10);
    return currentP === prob && currentI === impacto;
  }

  getCeldaColorMatriz(prob: number, impacto: number): string {
    const score = prob * impacto;
    if (score >= 15) return 'rgba(239, 68, 68, 0.45)';  // Alto (Red)
    if (score >= 8)  return 'rgba(245, 158, 11, 0.45)'; // Medio (Amber)
    return 'rgba(34, 197, 94, 0.45)';                  // Bajo (Green)
  }

  getScoreCalculado(): number {
    const p = parseInt(this.formulario.get('probabilidad')?.value || 3, 10);
    const i = parseInt(this.formulario.get('impacto')?.value || 3, 10);
    return p * i;
  }

  getProcesosKeys(): string[] {
    return Object.keys(this.procesosGroups);
  }

  // RIE-12: Estilos dinámicos para la insignia de nivel autocalculado
  getNivelBg(nivel?: string): string {
    const val = (nivel || '').toLowerCase();
    if (val.includes('alto')) return 'rgba(239, 68, 68, 0.25)';
    if (val.includes('medio')) return 'rgba(245, 158, 11, 0.25)';
    return 'rgba(34, 197, 94, 0.25)';
  }

  getNivelColor(nivel?: string): string {
    const val = (nivel || '').toLowerCase();
    if (val.includes('alto')) return '#f87171';
    if (val.includes('medio')) return '#fbbf24';
    return '#4ade80';
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor, rellene todos los campos obligatorios.', 'Formulario Inválido');
      return;
    }
    this.dialogRef.close(this.formulario.getRawValue());
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
