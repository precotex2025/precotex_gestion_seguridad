import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { AuditoriasService } from '../../../services/auditorias.service';
import { NoConformidadService } from '../../../services/no-conformidad.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
  Lista?: any[];
}

@Component({
  selector: 'app-planificar-formacion-modal',
  standalone: false,
  templateUrl: './planificar-formacion-modal.component.html',
  styleUrls: ['./planificar-formacion-modal.component.css']
})
export class PlanificarFormacionModalComponent implements OnInit {

  formulario!: FormGroup;
  
  tiposOptions = ['Interna', 'Externa'];
  estadosOptions = ['Abierta', 'En proceso', 'Cerrada', 'Fuera de plazo'];

  procesosGroups: { [key: string]: string[] } = {};
  auditoriasList: any[] = [];
  existingNcList: any[] = [];
  ncOptions: any[] = [];
  esModoManual: boolean = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<PlanificarFormacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService,
    private auditoriasService: AuditoriasService,
    private noConformidadService: NoConformidadService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
      }
    });

    this.auditoriasService.getListadoAuditorias().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.auditoriasList = res.elements;
        }
      },
      error: (err) => {
        console.error('Error al cargar auditorías para desplegable:', err);
      }
    });

    this.formulario = this.fb.group({
      nc: ['', Validators.required],
      tipo: ['Interna', Validators.required],
      accion: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      responsable: ['', Validators.required],
      inicio: ['', Validators.required],
      limite: ['', Validators.required],
      estado: ['Abierta', Validators.required],
      codigoAuditoria: [''],
      desc: ['']
    });

    // 1. Cargar opciones iniciales desde la lista proporcionada por el componente padre
    if (this.data && Array.isArray(this.data.Lista)) {
      this.populateNcOptions(this.data.Lista);
    }

    // 2. Si estamos en modo edición ('U'), poblar formulario con los datos existentes
    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
      if (this.data.Datos.nc) {
        this.populateNcOptions([this.data.Datos]);
      }
    } else if (this.data.Datos && this.data.Datos.nc) {
      // Si se pasó un NC específico en modo 'I'
      this.formulario.get('nc')?.setValue(this.data.Datos.nc);
      this.populateNcOptions([this.data.Datos]);
      this.aplicarDatosNcSeleccionada(this.data.Datos.nc);
    }

    // 3. Consultar registros de la BD (SN_No_Conformidad) para asegurar las NCs más actualizadas
    this.noConformidadService.getListadoNoConformidades().subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.elements)) {
          this.existingNcList = res.elements;
          this.populateNcOptions(res.elements);
        }
      },
      error: (err) => {
        console.warn('No se pudo cargar listado de NC desde BD, usando datos locales:', err);
      }
    });
  }

  populateNcOptions(newItems: any[]): void {
    if (!Array.isArray(newItems) || newItems.length === 0) return;

    const currentList = [...this.ncOptions];

    let storageList: any[] = [];
    try {
      const saved = localStorage.getItem('precotex:noconf:declaraciones');
      if (saved) storageList = JSON.parse(saved);
    } catch {}

    const allCombined = [...newItems, ...currentList, ...storageList];
    const map = new Map<string, any>();

    for (const item of allCombined) {
      const code = (item?.nc || item?.nC || item?.codigo || '').trim();
      if (!code) continue;
      const key = code.toUpperCase();

      const tipo = item.tipo || 'Interna';
      const proceso = item.proceso || '';
      const responsable = item.responsable || '';
      const accion = item.accion || item.hallazgo || '';
      const descripcion = item.descripcion || item.desc || '';
      const codigoAuditoria = item.codigo_Auditoria || item.codigoAuditoria || '';
      const fechaInicio = item.fecha_Inicio || item.deteccion || item.inicio || '';
      const fechaLimite = item.fecha_Limite || item.limite || '';
      const estado = item.estado || 'Abierta';

      if (!map.has(key)) {
        map.set(key, {
          nc: code,
          tipo,
          proceso,
          responsable,
          accion,
          descripcion,
          codigo_Auditoria: codigoAuditoria,
          fecha_Inicio: fechaInicio,
          fecha_Limite: fechaLimite,
          estado
        });
      } else {
        const existing = map.get(key);
        if (!existing.proceso && proceso) existing.proceso = proceso;
        if (!existing.responsable && responsable) existing.responsable = responsable;
        if (!existing.accion && accion) existing.accion = accion;
        if (!existing.descripcion && descripcion) existing.descripcion = descripcion;
        if (!existing.codigo_Auditoria && codigoAuditoria) existing.codigo_Auditoria = codigoAuditoria;
        if (!existing.fecha_Inicio && fechaInicio) existing.fecha_Inicio = fechaInicio;
        if (!existing.fecha_Limite && fechaLimite) existing.fecha_Limite = fechaLimite;
      }
    }

    this.ncOptions = Array.from(map.values());

    // Si ya había un valor en el formulario, verificar si sincronizar datos
    const currentFormNc = this.formulario.get('nc')?.value;
    if (currentFormNc) {
      const match = this.ncOptions.find(o => o.nc.toUpperCase() === currentFormNc.toUpperCase());
      if (match && this.data.Accion === 'I' && !this.formulario.get('accion')?.value) {
        this.aplicarDatosNcSeleccionada(match.nc, false);
      }
    }
  }

  formatNcOption(item: any): string {
    const code = item.nc || 'Sin código';
    const tipo = item.tipo || 'Interna';
    const proc = item.proceso ? ` (${item.proceso})` : '';
    const accion = item.accion || item.hallazgo;
    const desc = accion ? ` — ${accion.length > 45 ? accion.substring(0, 45) + '...' : accion}` : '';
    return `${code} [${tipo}]${proc}${desc}`;
  }

  toggleModoManual(): void {
    this.esModoManual = !this.esModoManual;
    if (this.esModoManual && !this.formulario.get('nc')?.value) {
      const curTipo = this.formulario.get('tipo')?.value || 'Interna';
      this.formulario.get('nc')?.setValue(this.generarSiguienteCodigo(curTipo));
    }
  }

  onNcSelected(event: any): void {
    const selectedCode = event?.target?.value || this.formulario.get('nc')?.value;
    if (!selectedCode) return;
    this.aplicarDatosNcSeleccionada(selectedCode);
  }

  onNcManualInput(): void {
    const code = this.formulario.get('nc')?.value;
    if (code) {
      const match = this.ncOptions.find(item => (item.nc || '').toUpperCase() === code.trim().toUpperCase());
      if (match) {
        this.aplicarDatosNcSeleccionada(match.nc, false);
      }
    }
  }

  aplicarDatosNcSeleccionada(ncCode: string, overwriteAccion: boolean = true): void {
    const found = this.ncOptions.find(item => (item.nc || '').toUpperCase() === ncCode.trim().toUpperCase());
    if (!found) return;

    // Sincronizar Tipo
    if (found.tipo) {
      this.formulario.get('tipo')?.setValue(found.tipo, { emitEvent: false });
    }

    // Sincronizar Proceso
    if (found.proceso) {
      this.sincronizarProceso(found.proceso);
    }

    // Sincronizar Responsable
    if (found.responsable) {
      const curResp = this.formulario.get('responsable')?.value;
      if (!curResp || curResp.startsWith('Ej.') || curResp.trim() === '') {
        this.formulario.get('responsable')?.setValue(found.responsable);
      }
    }

    // Sincronizar Auditoría Vinculada
    if (found.codigo_Auditoria) {
      this.formulario.get('codigoAuditoria')?.setValue(found.codigo_Auditoria);
    }

    // Sincronizar Fechas si están vacías
    if (found.fecha_Inicio && !this.formulario.get('inicio')?.value) {
      const fIni = typeof found.fecha_Inicio === 'string' ? found.fecha_Inicio.split('T')[0] : '';
      if (fIni) this.formulario.get('inicio')?.setValue(fIni);
    }
    if (found.fecha_Limite && !this.formulario.get('limite')?.value) {
      const fLim = typeof found.fecha_Limite === 'string' ? found.fecha_Limite.split('T')[0] : '';
      if (fLim) this.formulario.get('limite')?.setValue(fLim);
    }

    // Sincronizar Acción / Hallazgo
    const accionTexto = found.accion || found.hallazgo;
    if (accionTexto && (overwriteAccion || !this.formulario.get('accion')?.value)) {
      this.formulario.get('accion')?.setValue(accionTexto);
    }

    // Sincronizar Descripción
    const descTexto = found.descripcion || found.desc;
    if (descTexto && !this.formulario.get('desc')?.value) {
      this.formulario.get('desc')?.setValue(descTexto);
    }
  }

  sincronizarProceso(procesoNombre: string): void {
    if (!procesoNombre) return;
    const target = procesoNombre.toLowerCase().trim();
    let matchedProc = '';

    for (const group of Object.keys(this.procesosGroups)) {
      for (const p of this.procesosGroups[group]) {
        if (p.toLowerCase() === target || p.toLowerCase().includes(target) || target.includes(p.toLowerCase())) {
          matchedProc = p;
          break;
        }
      }
      if (matchedProc) break;
    }

    if (matchedProc) {
      this.formulario.get('proceso')?.setValue(matchedProc);
    } else {
      if (!this.procesosGroups['Otros']) {
        this.procesosGroups['Otros'] = [];
      }
      if (!this.procesosGroups['Otros'].includes(procesoNombre)) {
        this.procesosGroups['Otros'].push(procesoNombre);
      }
      this.formulario.get('proceso')?.setValue(procesoNombre);
    }
  }

  onTipoChange(): void {
    if (this.esModoManual && this.data.Accion !== 'U') {
      const curVal = (this.formulario.get('nc')?.value || '').trim();
      if (curVal.startsWith('NC-INT-') || curVal.startsWith('NC-EXT-')) {
        const newTipo = this.formulario.get('tipo')?.value || 'Interna';
        const newCode = this.generarSiguienteCodigo(newTipo);
        this.formulario.get('nc')?.setValue(newCode);
      }
    }
  }

  generarSiguienteCodigo(tipo: string = 'Interna'): string {
    const year = new Date().getFullYear();
    const prefix = (tipo || '').toLowerCase().includes('ext') ? 'NC-EXT' : 'NC-INT';
    const regex = new RegExp(`^${prefix}-${year}-(\\d+)`, 'i');

    let maxCorrelativo = 0;
    
    // 1. Lista pasada desde el componente padre
    const listFromData = this.data?.Lista || [];
    
    // 2. Registros de almacenamiento local
    let listFromStorage: any[] = [];
    try {
      const saved = localStorage.getItem('precotex:noconf:declaraciones');
      if (saved) listFromStorage = JSON.parse(saved);
    } catch {}

    // 3. Unir todas las fuentes
    const all = [...listFromData, ...listFromStorage, ...this.existingNcList, ...this.ncOptions];

    all.forEach((item: any) => {
      const code = item?.nc || item?.nC || item?.codigo || '';
      if (code) {
        const match = code.match(regex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxCorrelativo) {
            maxCorrelativo = num;
          }
        }
      }
    });

    const nextNum = maxCorrelativo + 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    return `${prefix}-${year}-${formattedNum}`;
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos obligatorios (*)', 'Formulario Incompleto');
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
