import { RiesgosService } from '../../../services/riesgos.service';
import { firstValueFrom } from 'rxjs';
import { Component, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
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
  @ViewChild('criteriosModalRef') criteriosModalRef?: TemplateRef<any>;
  private dialogCriteriosRef: MatDialogRef<any> | null = null;

  formulario!: FormGroup;

  readonly sedesOptions: string[] = [
    'Santa María',
    'Santa Cecilia',
    'Santa Rosa',
    'Huachipa 1',
    'Huachipa 2',
    'Huachipa 3',
    'Independencia 1',
    'Independencia 2',
    'Todas'
  ];

  readonly origenesOptions: string[] = [
    'No conformidad previa',
    'Incidente',
    'Reclamo de cliente',
    'Auditoría interna',
    'Auditoría externa',
    'Taller de procesos',
    'Revisión por la Dirección',
    'Análisis de contexto / FODA',
    'Otro'
  ];

  readonly estadosOptions: string[] = [
    'Sin control',
    'En seguimiento',
    'Controlado'
  ];

  readonly estadosOportunidadOptions: string[] = [
    'Por evaluar',
    'En seguimiento',
    'Implementada'
  ];

  readonly frecuenciasOptions: string[] = [
    'Semestral',
    'Anual',
    'Trimestral',
    'Mensual'
  ];

  readonly probCriterios: { [key: number]: string } = {
    1: 'No ha ocurrido en los últimos 3 años.',
    2: 'Ocurrió 1 vez en los últimos 1 a 3 años.',
    3: 'Ocurre varias veces al año.',
    4: 'Ocurre todos los meses.',
    5: 'Ocurre cada semana o en cada pedido / lote.'
  };

  readonly impCriterios: { [key: number]: string } = {
    1: 'Sin efecto en el producto ni en el cliente.',
    2: 'Reproceso interno de menos de 1 día.',
    3: 'Reproceso de lote o retraso interno; reclamo menor.',
    4: 'Incumple la fecha de entrega o reclamo formal; NC menor en auditoría.',
    5: 'Pérdida de pedido o cliente; NC mayor o pérdida de certificación.'
  };

  readonly detCriterios: { [key: number]: string } = {
    1: 'El sistema bloquea o el control es automático (ej. el ERP no deja avanzar).',
    2: 'Inspección al 100 % con registro.',
    3: 'Muestreo o revisión periódica con registro.',
    4: 'Control visual informal; depende de la persona.',
    5: 'No hay control; se entera el cliente o la autoridad.'
  };

  readonly probOptions = [
    { val: 1, label: '1 - Rara' },
    { val: 2, label: '2 - Improbable' },
    { val: 3, label: '3 - Posible' },
    { val: 4, label: '4 - Probable' },
    { val: 5, label: '5 - Casi segura' }
  ];

  readonly impOptions = [
    { val: 1, label: '1 - Insignificante' },
    { val: 2, label: '2 - Menor' },
    { val: 3, label: '3 - Moderado' },
    { val: 4, label: '4 - Mayor' },
    { val: 5, label: '5 - Catastrófico' }
  ];

  readonly detOptions = [
    { val: 1, label: '1 - Casi segura' },
    { val: 2, label: '2 - Alta' },
    { val: 3, label: '3 - Moderada' },
    { val: 4, label: '4 - Baja' },
    { val: 5, label: '5 - Nula' }
  ];

  procesosGroups: { [key: string]: string[] } = {
    'Operaciones Manufactura (OPM)': [
      'Corte',
      'Costura',
      'Inspección',
      'Acabados',
      'Aseguramiento de la Calidad Manufactura',
      'Consumos'
    ],
    'Operaciones Textil (OPT)': [
      'Tejeduría',
      'Tintorería',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Aseguramiento de la Calidad Textil',
      'Lavandería'
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
    'Servicio de Estampado y Bordado (SEB)': [
      'Estampado',
      'Bordado',
      'Calidad Estampado y Bordado'
    ],
    'Soporte (SOP)': [
      'Tecnologías de la Información (Sistemas)',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Seguridad Patrimonial',
      'Mantenimiento e Infraestructura'
    ]
  };

  selectedFile: File | null = null;
  nombreArchivoEvidencia: string = '';
  serverFileName: string = '';
  archivoBase64: string = '';
  isUploading: boolean = false;

  get cleanTitle(): string {
    const nat = this.formulario?.get('naturaleza')?.value;
    const term = nat === 'O' ? 'Oportunidad' : 'Riesgo';
    if (this.data?.Accion === 'I') return `Declarar ${term} de Proceso`;
    if (this.data?.Accion === 'V') return `Visualizar ${term} Declarado`;
    return `Editar ${term} Declarado`;
  }

  get isReadOnly(): boolean {
    return this.data?.Accion === 'V';
  }

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<EvaluacionRiesgosRegeditComponent>,
    private dialog: MatDialog,
    private procesosService: ProcesosService,
    private riesgosService: RiesgosService
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

    const isEditOrView = (this.data.Accion === 'U' || this.data.Accion === 'V') && this.data.Datos;
    const d = this.data.Datos || {};

    const initialNat = d.naturaleza || (d.tipo?.toLowerCase().includes('oportunidad') ? 'O' : 'R');
    const initialProb = d.probabilidad != null ? Number(d.probabilidad) : 1;
    const initialImp = d.impacto != null ? Number(d.impacto) : 1;
    const initialDet = d.deteccion != null ? Number(d.deteccion) : 3;

    this.formulario = this.fb.group({
      naturaleza: [initialNat],
      codigo: [{ value: d.codigo || this.data.NextCodigo || 'RSG-2026-001', disabled: true }, Validators.required],
      periodo: [d.periodo || '2026', Validators.required],
      tipo: [d.tipo || (initialNat === 'O' ? 'Oportunidad de proceso' : 'Riesgo de proceso'), Validators.required],
      clausula: [d.clausula || '6.1 Acciones para abordar riesgos y oportunidades', Validators.required],
      sede: [d.sede || 'Santa María', Validators.required],
      proceso: [d.proceso || 'Corte', Validators.required],
      origen: [d.origen || 'No conformidad previa', Validators.required],
      descbrief: [d.descbrief || d.descripcion_Breve || '', Validators.required],
      causaprobable: [d.causaprobable || d.causa || d.causa_Probable || '', Validators.required],
      consecuenciapotencial: [d.consecuenciapotencial || d.efecto || d.consecuencia_Potencial || '', Validators.required],
      probabilidad: [initialProb, Validators.required],
      impacto: [initialImp, Validators.required],
      deteccion: [initialDet, Validators.required],
      npr: [d.npr || (initialProb * initialImp * initialDet)],
      nivel: [d.nivel || (initialNat === 'O' ? 'Bajo' : 'Bajo'), Validators.required],
      sustentoProbabilidad: [d.sustentoProbabilidad || d.sustento_Probabilidad || ''],
      controlActual: [d.controlActual || d.control_Actual || ''],
      responsable: [d.responsable || '', Validators.required],
      estado: [d.estado || (initialNat === 'O' ? 'Por evaluar' : 'Sin control'), Validators.required],
      medidacontrol: [(d.medidacontrol || d.medida_Control || '').replace(/\|\|\|FILE:[^]*$/, '')],
      frecuenciaRevision: [d.frecuenciaRevision || d.frecuencia_Revision || 'Semestral', Validators.required],
      revision: [d.revision || d.fecha_Revision ? (d.revision || d.fecha_Revision).split('T')[0] : this.calcularFechaRevisionDefecto('Semestral')],
      archivoEvidencia: ['']
    });

    if (isEditOrView) {
      this.cargarArchivoInfo(d);
      if (this.isReadOnly) {
        this.formulario.disable();
      }
    }

    this.recalcNPR();

    // Suscripciones para recalcular NPR en tiempo real
    this.formulario.get('probabilidad')?.valueChanges.subscribe(() => this.recalcNPR());
    this.formulario.get('impacto')?.valueChanges.subscribe(() => this.recalcNPR());
    this.formulario.get('deteccion')?.valueChanges.subscribe(() => this.recalcNPR());

    this.formulario.get('frecuenciaRevision')?.valueChanges.subscribe(frec => {
      this.actualizarProximaRevision(frec);
    });

    this.formulario.get('estado')?.valueChanges.subscribe(est => {
      if (est === 'Controlado') {
        this.actualizarProximaRevision('Semestral');
      }
    });
  }

  private cargarArchivoInfo(d: any): void {
    let fileInfo = null;
    try {
      const rawMap = localStorage.getItem('precotex:riesgos:archivos_map');
      if (rawMap) {
        const map = JSON.parse(rawMap);
        fileInfo = map[d.codigo] || (d.id ? map[String(d.id)] : null);
      }
    } catch(e) {}

    const nomArch = d.archivoEvidencia || d.archivo_Sustento || d.evidencia || fileInfo?.nombre || '';
    this.nombreArchivoEvidencia = nomArch;
    this.serverFileName = d.serverFileName || fileInfo?.serverFileName || '';
    this.archivoBase64 = d.archivoBase64 || fileInfo?.base64 || '';
    this.formulario.patchValue({ archivoEvidencia: nomArch });
  }

  setNaturaleza(n: 'R' | 'O'): void {
    if (this.isReadOnly) return;
    this.formulario.patchValue({
      naturaleza: n,
      tipo: n === 'O' ? 'Oportunidad de proceso' : 'Riesgo de proceso'
    });
    this.recalcNPR();
  }

  pickMatrixCell(p: number, i: number): void {
    if (this.isReadOnly) return;
    this.formulario.patchValue({
      probabilidad: p,
      impacto: i
    });
    this.recalcNPR();
  }

  recalcNPR(): void {
    if (!this.formulario) return;
    const p = Number(this.formulario.get('probabilidad')?.value) || 1;
    const i = Number(this.formulario.get('impacto')?.value) || 1;
    const d = Number(this.formulario.get('deteccion')?.value) || 1;
    const npr = p * i * d;

    let nivel = 'Bajo';
    if (npr >= 60) {
      nivel = 'Alto';
    } else if (npr >= 25) {
      nivel = 'Medio';
    } else {
      nivel = 'Bajo';
    }

    // Regla de severidad: si Impacto = 5, el nivel mínimo es Medio
    if (i === 5 && nivel === 'Bajo') {
      nivel = 'Medio';
    }

    this.formulario.patchValue({ npr, nivel }, { emitEvent: false });
  }

  getScoreInherente(): number {
    const p = Number(this.formulario?.get('probabilidad')?.value) || 1;
    const i = Number(this.formulario?.get('impacto')?.value) || 1;
    return p * i;
  }

  getNpr(): number {
    return Number(this.formulario?.get('npr')?.value) || 1;
  }

  getProb(): number {
    return Number(this.formulario?.get('probabilidad')?.value) || 1;
  }

  getImp(): number {
    return Number(this.formulario?.get('impacto')?.value) || 1;
  }

  getDet(): number {
    return Number(this.formulario?.get('deteccion')?.value) || 1;
  }

  getNivel(): string {
    return this.formulario?.get('nivel')?.value || 'Bajo';
  }

  getNivelColor(): string {
    const n = this.getNivel();
    if (n === 'Alto') return '#dc2626';
    if (n === 'Medio') return '#d97706';
    return '#16a34a';
  }

  getNivelClass(): string {
    const n = this.getNivel();
    if (n === 'Alto') return 'npr-badge-alto';
    if (n === 'Medio') return 'npr-badge-medio';
    return 'npr-badge-bajo';
  }

  isTrivial(): boolean {
    return this.formulario?.get('impacto')?.value === 1 && this.formulario?.get('naturaleza')?.value === 'R';
  }

  isElevadoSeveridad(): boolean {
    const i = this.formulario?.get('impacto')?.value;
    const p = this.formulario?.get('probabilidad')?.value;
    const d = this.formulario?.get('deteccion')?.value;
    return i === 5 && (p * i * d) < 25;
  }

  getProbCriterioText(): string {
    const v = Number(this.formulario?.get('probabilidad')?.value) || 1;
    return this.probCriterios[v] || '';
  }

  getImpCriterioText(): string {
    const v = Number(this.formulario?.get('impacto')?.value) || 1;
    return this.impCriterios[v] || '';
  }

  getDetCriterioText(): string {
    const v = Number(this.formulario?.get('deteccion')?.value) || 1;
    return this.detCriterios[v] || '';
  }

  isArchivoObligatorio(): boolean {
    const est = this.formulario?.get('estado')?.value;
    const niv = this.getNivel();
    return est !== 'Controlado' && niv !== 'Bajo' && this.formulario?.get('naturaleza')?.value === 'R';
  }

  actualizarProximaRevision(frecuencia: string): void {
    const fecha = this.calcularFechaRevisionDefecto(frecuencia);
    this.formulario.patchValue({ revision: fecha }, { emitEvent: false });
  }

  calcularFechaRevisionDefecto(frecuencia: string): string {
    const hoy = new Date();
    let meses = 6;
    if (frecuencia === 'Mensual') meses = 1;
    else if (frecuencia === 'Trimestral') meses = 3;
    else if (frecuencia === 'Anual') meses = 12;
    hoy.setMonth(hoy.getMonth() + meses);
    return hoy.toISOString().substring(0, 10);
  }

  onAbrirCriteriosPuntuacion(): void {
    if (this.criteriosModalRef) {
      this.dialogCriteriosRef = this.dialog.open(this.criteriosModalRef, {
        width: '940px',
        maxWidth: '96vw',
        maxHeight: '90vh',
        autoFocus: false,
        panelClass: 'custom-large-dialog'
      });
    }
  }

  onCerrarCriteriosModal(): void {
    if (this.dialogCriteriosRef) {
      this.dialogCriteriosRef.close();
      this.dialogCriteriosRef = null;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastr.warning('El archivo supera el límite de 10 MB.', 'Archivo muy pesado');
      return;
    }

    this.selectedFile = file;
    this.nombreArchivoEvidencia = file.name;
    this.formulario.patchValue({ archivoEvidencia: file.name });

    const reader = new FileReader();
    reader.onload = () => {
      this.archivoBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onRemoveFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.nombreArchivoEvidencia = '';
    this.serverFileName = '';
    this.archivoBase64 = '';
    this.formulario.patchValue({ archivoEvidencia: '' });
  }

  async onGuardar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.toastr.warning('Por favor completa todos los campos requeridos con (*).', 'Formulario Incompleto');
      return;
    }

    const nat = this.formulario.get('naturaleza')?.value;
    const imp = Number(this.formulario.get('impacto')?.value);
    const det = Number(this.formulario.get('deteccion')?.value);
    const ctrlAct = (this.formulario.get('controlActual')?.value || '').trim();
    const sustP = (this.formulario.get('sustentoProbabilidad')?.value || '').trim();

    // Regla S4: Bloqueo de riesgo trivial
    if (nat === 'R' && imp === 1) {
      this.toastr.error('Riesgo trivial (Impacto 1): no se puede registrar. Si sí tiene efecto, revisa el puntaje de Impacto.', 'Regla S4 Bloqueada');
      return;
    }

    // Regla S5: Control obligatorio si D <= 2
    if (nat === 'R' && det <= 2 && !ctrlAct) {
      this.toastr.warning('Detección 1 o 2 exige especificar el campo «Control actual que lo detecta (si lo hay) y su registro».', 'Regla S5 Requerida');
      return;
    }

    // Regla de sustento de probabilidad
    if (nat === 'R' && !sustP) {
      this.toastr.warning('Es obligatorio ingresar el sustento de la probabilidad (historial de NC, incidencias o reclamos).', 'Sustento Requerido');
      return;
    }

    // Regla S6: Evidencia obligatoria si no está controlado (excepto Bajo)
    if (this.isArchivoObligatorio() && !this.nombreArchivoEvidencia && !this.selectedFile) {
      this.toastr.warning('El riesgo no está «Controlado»: adjuntar el documento de sustento es obligatorio.', 'Evidencia Obligatoria');
      return;
    }

    if (this.isUploading) return;

    let serverName = this.serverFileName;

    if (this.selectedFile) {
      this.isUploading = true;
      try {
        const uploadRes: any = await firstValueFrom(this.riesgosService.uploadArchivo(this.selectedFile));
        if (uploadRes && uploadRes.success && uploadRes.fileName) {
          serverName = uploadRes.fileName;
        }
      } catch (err) {
        console.warn('[Riesgos Regedit] Subida al servidor falló, se mantendrá en almacenamiento local:', err);
      } finally {
        this.isUploading = false;
      }
    }

    const val = this.formulario.getRawValue();
    val.causa = val.causaprobable;
    val.efecto = val.consecuenciapotencial;
    val.archivoBase64 = this.archivoBase64;
    val.archivoEvidencia = this.nombreArchivoEvidencia;
    val.serverFileName = serverName || this.nombreArchivoEvidencia;
    this.dialogRef.close(val);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
