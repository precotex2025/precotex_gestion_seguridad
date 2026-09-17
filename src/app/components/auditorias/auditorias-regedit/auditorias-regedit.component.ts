import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuditoriasService } from '../../../services/auditorias.service';
import { ProcesosService } from '../../../services/procesos.service';

interface data {
  Title          : string;
  Accion         : string;
  Datos          : any;
  AuditoriasList?: any[];
}

@Component({
  selector: 'app-auditorias-regedit',
  standalone: false,
  templateUrl: './auditorias-regedit.component.html',
  styleUrl: './auditorias-regedit.component.css'
})
export class AuditoriasRegeditComponent implements OnInit {

  formulario!: FormGroup;
  objectKeys = Object.keys;

  sedesList: string[] = [
    'Santa Maria',
    'Santa Cecilia',
    'Santa Rosa',
    'Huachipa 1',
    'Huachipa 2',
    'Huachipa 3',
    'Independencia 1',
    'Independencia 2',
    'Todas las sedes'
  ];

  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'Estratégicos': [
      'Gestión de la Dirección',
      'Organización y Métodos',
      'Gestión de la Calidad y Certificaciones'
    ],
    'Operativos / Cadena de Valor': [
      'Desarrollo de Producto / Diseño',
      'Comercial / Ventas',
      'Planeamiento y Control de la Producción (PCP)',
      'Compras y Abastecimiento',
      'Hilandería',
      'Tejeduría',
      'Tintorería y Acabados Tela',
      'Corte',
      'Costura',
      'Estampado y Bordado',
      'Acabados Prenda / Empaque',
      'Aseguramiento de la Calidad Manufactura',
      'Despacho y Exportaciones'
    ],
    'De Apoyo': [
      'Gestión Humana y Nómina',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Mantenimiento e Infraestructura',
      'Tecnologías de la Información (Sistemas)',
      'Control Patrimonial y Almacenes',
      'Administración, Contabilidad y Finanzas',
      'Legal y Cumplimiento',
      'Auditoría Interna'
    ]
  };

  constructor(
    private formBuilder       : FormBuilder,
    private SpinnerService    : NgxSpinnerService,
    private toastr            : ToastrService,
    private matSnackBar       : MatSnackBar,
    private auditoriasService : AuditoriasService,
    private procesosService   : ProcesosService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<AuditoriasRegeditComponent>,
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.PROCESOS_GROUPS = { ...this.PROCESOS_GROUPS, ...groups };
        }
      }
    });

    this.formulario = this.formBuilder.group({
      ctrol_codigo      : [''],
      ctrol_tipo        : ['Interna'],
      ctrol_norma       : ['ISO 9001:2015'],
      ctrol_norma_otra  : [''],
      ctrol_responsable : [''],
      ctrol_sedes       : [[]],
      ctrol_areas       : [[]],
      ctrol_inicio      : [''],
      ctrol_fin         : [''],
      ctrol_frecuencia  : ['Anual'],
      ctrol_estado      : ['Programada'],
      ctrol_alcance     : [''],
    });

    this.formulario.get('ctrol_codigo')?.disable();

    if (this.data.Accion === 'U') {
      this.onLoadInfo();
    } else {
      this.generarCodigoSecuencial();
    }

    // Escuchar cambios de Tipo (Interna / Externa / Cliente) para actualizar prefijo dinámicamente manteniendo la secuencia
    this.formulario.get('ctrol_tipo')?.valueChanges.subscribe((nuevoTipo) => {
      if (this.data.Accion === 'I') {
        const currentCode = String(this.formulario.get('ctrol_codigo')?.value || '').trim();
        const tipoCode = nuevoTipo === 'Externa' ? 'EXT' : (nuevoTipo === 'Cliente' ? 'CLI' : 'INT');
        if (currentCode && /^AUD-(?:INT|EXT|CLI)-\d+-\d+$/i.test(currentCode)) {
          const updatedCode = currentCode.replace(/^AUD-(?:INT|EXT|CLI)/i, `AUD-${tipoCode}`);
          this.formulario.get('ctrol_codigo')?.setValue(updatedCode);
        } else {
          this.generarCodigoSecuencial();
        }
      }
    });
  }

  generarCodigoSecuencial(): void {
    const sTipo = String(this.formulario.get('ctrol_tipo')?.value || 'Interna').trim();
    const year = new Date().getFullYear();
    const tipoCode = sTipo === 'Externa' ? 'EXT' : (sTipo === 'Cliente' ? 'CLI' : 'INT');

    if (this.data.AuditoriasList && Array.isArray(this.data.AuditoriasList) && this.data.AuditoriasList.length > 0) {
      this.procesarCodigoConLista(this.data.AuditoriasList, tipoCode, year);
    } else {
      this.auditoriasService.getListadoAuditorias('').subscribe({
        next: (res: any) => {
          const list = res?.elements || res?.data || (Array.isArray(res) ? res : []);
          this.procesarCodigoConLista(list, tipoCode, year);
        },
        error: () => {
          this.formulario.get('ctrol_codigo')?.setValue(`AUD-${tipoCode}-${year}-001`);
        }
      });
    }
  }

  private procesarCodigoConLista(list: any[], tipoCode: string, year: number): void {
    const existingNums: number[] = [];

    list.forEach((item: any) => {
      const code = String(item.codigo_Auditoria || item.Codigo_Auditoria || item.codigo || item.Codigo || item.auditoria || '').trim();
      const match = code.match(/AUD-(?:INT|EXT|CLI)-\d+-(\d+)/i) || code.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > 0) {
          existingNums.push(num);
        }
      }
    });

    let nextSeq = 1;
    if (existingNums.length > 0) {
      nextSeq = Math.max(...existingNums) + 1;
    } else if (list.length > 0) {
      nextSeq = list.length + 1;
    }

    const sCodigo = `AUD-${tipoCode}-${year}-${String(nextSeq).padStart(3, '0')}`;
    this.formulario.get('ctrol_codigo')?.setValue(sCodigo);
  }

  onLoadInfo(): void {
    const d = this.data.Datos;
    this.formulario.get('ctrol_codigo')?.setValue(d.codigo_Auditoria || '');
    this.formulario.get('ctrol_tipo')?.setValue(d.tipo || 'Interna');
    
    const normasStandard = ['ISO 9001:2015', 'ISO 45001:2018', 'ISO 14001:2015', 'OCS', 'BASC', 'WRAP', 'GOTS', 'GRS', 'OEKO-TEX'];
    const loadedNorma = d.norma || 'ISO 9001:2015';
    if (normasStandard.includes(loadedNorma)) {
      this.formulario.get('ctrol_norma')?.setValue(loadedNorma);
      this.formulario.get('ctrol_norma_otra')?.setValue('');
    } else {
      this.formulario.get('ctrol_norma')?.setValue('Otro');
      this.formulario.get('ctrol_norma_otra')?.setValue(loadedNorma);
    }

    this.formulario.get('ctrol_responsable')?.setValue(d.responsable || '');

    // Cargar sedes múltiples (AUD-05)
    const loadedSedes = d.sedes || d.sede || '';
    if (typeof loadedSedes === 'string') {
      const arrSedes = loadedSedes.split(',').map((s: string) => s.trim()).filter((s: string) => !!s);
      this.formulario.get('ctrol_sedes')?.setValue(arrSedes);
    } else if (Array.isArray(loadedSedes)) {
      this.formulario.get('ctrol_sedes')?.setValue(loadedSedes);
    } else {
      this.formulario.get('ctrol_sedes')?.setValue([]);
    }

    // Cargar áreas múltiples (AUD-05)
    const loadedAreas = d.areas || d.area || '';
    if (typeof loadedAreas === 'string') {
      const arrAreas = loadedAreas.split(',').map((a: string) => a.trim()).filter((a: string) => !!a);
      this.formulario.get('ctrol_areas')?.setValue(arrAreas);
    } else if (Array.isArray(loadedAreas)) {
      this.formulario.get('ctrol_areas')?.setValue(loadedAreas);
    } else {
      this.formulario.get('ctrol_areas')?.setValue([]);
    }

    this.formulario.get('ctrol_inicio')?.setValue(d.inicio || '');
    this.formulario.get('ctrol_fin')?.setValue(d.fin || '');
    this.formulario.get('ctrol_frecuencia')?.setValue(d.frecuencia || 'Anual');
    this.formulario.get('ctrol_estado')?.setValue(d.estado || 'Programada');
    this.formulario.get('ctrol_alcance')?.setValue(d.alcance || '');
  }

  onSave(): void {
    const sTipo        = String(this.formulario.get('ctrol_tipo')?.value        || 'Interna').trim();
    let sNorma         = String(this.formulario.get('ctrol_norma')?.value       || '').trim();
    const sNormaOtra   = String(this.formulario.get('ctrol_norma_otra')?.value  || '').trim();

    if (sNorma === 'Otro') {
      if (!sNormaOtra) {
        this.matSnackBar.open('¡Ingrese el nombre de la norma auditada...!', 'Cerrar', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 1500,
        });
        return;
      }
      sNorma = sNormaOtra;
    }

    const sResponsable = String(this.formulario.get('ctrol_responsable')?.value || '').trim();

    const rawSedes     = this.formulario.get('ctrol_sedes')?.value;
    const sSedes       = Array.isArray(rawSedes) ? rawSedes.join(', ') : String(rawSedes || '').trim();

    const rawAreas     = this.formulario.get('ctrol_areas')?.value;
    const sAreas       = Array.isArray(rawAreas) ? rawAreas.join(', ') : String(rawAreas || '').trim();

    const sInicio      = String(this.formulario.get('ctrol_inicio')?.value      || '').trim();
    const sFin         = String(this.formulario.get('ctrol_fin')?.value         || '').trim();
    const sFrecuencia  = String(this.formulario.get('ctrol_frecuencia')?.value  || 'Anual').trim();
    const sEstado      = String(this.formulario.get('ctrol_estado')?.value      || 'Programada').trim();
    const sAlcance     = String(this.formulario.get('ctrol_alcance')?.value     || '').trim();

    if (!sResponsable) {
      this.matSnackBar.open('¡Ingrese el nombre del responsable...!', 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    if (!sSedes) {
      this.matSnackBar.open('¡Seleccione al menos una sede participante...!', 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    if (!sAreas) {
      this.matSnackBar.open('¡Seleccione al menos un proceso / área participante...!', 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    const sTitle = this.data.Accion === 'I' ? 'Registrar' : 'Actualizar';

    Swal.fire({
      title: '¿Desea ' + sTitle.toLowerCase() + ' la auditoría?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        let sCodigo = String(this.formulario.getRawValue().ctrol_codigo || '').trim();
        if (this.data.Accion === 'I' && !sCodigo) {
          const year = new Date().getFullYear();
          const tipoCode = sTipo === 'Externa' ? 'EXT' : (sTipo === 'Cliente' ? 'CLI' : 'INT');
          sCodigo = `AUD-${tipoCode}-${year}-001`;
        }

        const requestData = {
          Accion: this.data.Accion,
          Id_Auditoria: this.data.Datos?.id_Auditoria || this.data.Datos?.id || null,
          Id: this.data.Datos?.id_Auditoria || this.data.Datos?.id || null,
          Codigo_Auditoria: sCodigo,
          Tipo: sTipo,
          Norma: sNorma,
          Responsable: sResponsable,
          Sede: sSedes,
          Sedes: sSedes,
          Sede_Auditoria: sSedes,
          Sedes_Participantes: sSedes,
          Area: sAreas,
          Areas: sAreas,
          Proceso: sAreas,
          Procesos: sAreas,
          Fecha_Inicio: sInicio || null,
          Fecha_Fin: sFin || null,
          Frecuencia: sFrecuencia,
          Alcance: sAlcance,
          Estado: sEstado,
          Cod_Usuario: 'SISTEMAS'
        };

        this.auditoriasService.postProcesoMntoAuditoria(requestData).subscribe({
          next: (res: any) => {
            this.toastr.success(res.message || 'Auditoría guardada en la BD con éxito.', '', { timeOut: 2500 });
            this.dialogRef.close(true);
          },
          error: (err: any) => {
            const msg = err?.error?.message || err?.error?.Message || 'Error al guardar auditoría en la BD';
            this.toastr.error(msg, '', { timeOut: 3000 });
          }
        });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
