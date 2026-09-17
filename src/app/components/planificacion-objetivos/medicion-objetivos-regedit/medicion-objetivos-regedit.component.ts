import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { ObjetivosService } from '../../../services/objetivos.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-medicion-objetivos-regedit',
  standalone: false,
  templateUrl: './medicion-objetivos-regedit.component.html',
  styleUrls: ['./medicion-objetivos-regedit.component.css']
})
export class MedicionObjetivosRegeditComponent implements OnInit {

  formulario!: FormGroup;
  objetivos: any[] = [];
  objetivoSeleccionado: any = null;
  nombreArchivoEvidencia: string = '';

  frecuenciasOptions = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];
  semaforosOptions = ['En meta', 'En riesgo', 'Crítico'];

  procesosGroups: { [key: string]: string[] } = {};

  get cleanTitle(): string {
    if (this.data?.Title) {
      return this.data.Title.replace(/[.:]+/g, ' ').trim();
    }
    return this.data?.Accion === 'I' ? 'Registrar Medición de Objetivo' : 'Editar Medición de Objetivo';
  }

  getSemaforoClass(sem: string): string {
    if (!sem) return 'sem-meta';
    const s = sem.toLowerCase();
    if (s.includes('crítico') || s.includes('critico') || s.includes('rojo')) return 'sem-critico';
    if (s.includes('riesgo') || s.includes('amarillo')) return 'sem-riesgo';
    return 'sem-meta';
  }

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<MedicionObjetivosRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService,
    private objetivosService: ObjetivosService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = groups;
        }
      }
    });

    this.formulario = this.fb.group({
      id: [null],
      idObjetivo: [null],
      codigoObjetivo: [''],
      objetivo: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      norma: ['ISO 9001:2015'],
      indicador: [''],
      frecuencia: ['Mensual', Validators.required],
      meta: ['', Validators.required],
      valor: ['', Validators.required],
      periodo: ['2026-Q1', Validators.required],
      semaforo: ['En meta', Validators.required],
      evidencia: [''],
      archivoEvidencia: [''],
      obs: ['']
    });

    this.cargarObjetivos();

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
      this.nombreArchivoEvidencia = this.data.Datos.evidencia || this.data.Datos.archivoEvidencia || '';
      this.buscarYAutocompletar(this.data.Datos.objetivo || this.data.Datos.codigoObjetivo || '');
    }

    // Calcular semáforo en tiempo real al ingresar el valor
    this.formulario.get('valor')?.valueChanges.subscribe(val => {
      this.autoCalcularSemaforo(val);
    });
  }

  cargarObjetivos(): void {
    this.objetivosService.getListadoObjetivos().subscribe({
      next: (res: any) => {
        let apiList: any[] = [];
        if (res && res.success && res.elements && res.elements.length > 0) {
          apiList = res.elements.map((item: any) => ({
            id: item.id_Objetivo || item.id,
            codigo: item.codigo,
            objetivo: item.nombre || item.objetivo,
            proceso: item.proceso || 'SSOMA',
            norma: item.norma || 'ISO 9001:2015',
            indicador: item.indicador || '% Cumplimiento',
            frecuencia: item.frecuencia || 'Mensual',
            meta: item.meta !== null && item.meta !== undefined ? `${item.meta}%` : '100%',
            metaNumerica: item.meta || 100
          }));
        }

        // Combinar con localStorage
        let local: any[] = [];
        try {
          local = JSON.parse(localStorage.getItem('precotex_objetivos') || '[]');
        } catch (e) {
          local = [];
        }

        const map = new Map<string, any>();
        [...apiList, ...local].forEach(o => {
          const key = (o.codigo || '') + (o.objetivo || o.nombre || '');
          if (key && !map.has(key)) {
            map.set(key, o);
          }
        });

        if (map.size === 0) {
          // Fallback objetivos demo
          const seeds = [
            { id: 1, codigo: 'OBJ-2026-001', objetivo: 'Reducir el índice de accidentabilidad laboral en todas las sedes', proceso: 'SSOMA', norma: 'ISO 45001:2018', indicador: 'IFA', frecuencia: 'Mensual', meta: '1.5%', metaNumerica: 1.5 },
            { id: 2, codigo: 'OBJ-2026-002', objetivo: 'Optimizar la eficiencia productiva en Tintorería y acabados', proceso: 'Tintorería', norma: 'ISO 9001:2015', indicador: '% Rendimiento', frecuencia: 'Mensual', meta: '92%', metaNumerica: 92 },
            { id: 3, codigo: 'OBJ-2026-003', objetivo: 'Cumplimiento del programa de auditorías internas del SIG', proceso: 'Gestión de Calidad', norma: 'ISO 9001:2015', indicador: '% Auditorías', frecuencia: 'Trimestral', meta: '95%', metaNumerica: 95 }
          ];
          seeds.forEach(s => map.set(s.codigo, s));
        }

        this.objetivos = Array.from(map.values());

        if (this.formulario.get('objetivo')?.value) {
          this.buscarYAutocompletar(this.formulario.get('objetivo')?.value);
        }
      },
      error: () => {
        // Fallback objetivos demo
        this.objetivos = [
          { id: 1, codigo: 'OBJ-2026-001', objetivo: 'Reducir el índice de accidentabilidad laboral en todas las sedes', proceso: 'SSOMA', norma: 'ISO 45001:2018', indicador: 'IFA', frecuencia: 'Mensual', meta: '1.5%', metaNumerica: 1.5 },
          { id: 2, codigo: 'OBJ-2026-002', objetivo: 'Optimizar la eficiencia productiva en Tintorería y acabados', proceso: 'Tintorería', norma: 'ISO 9001:2015', indicador: '% Rendimiento', frecuencia: 'Mensual', meta: '92%', metaNumerica: 92 },
          { id: 3, codigo: 'OBJ-2026-003', objetivo: 'Cumplimiento del programa de auditorías internas del SIG', proceso: 'Gestión de Calidad', norma: 'ISO 9001:2015', indicador: '% Auditorías', frecuencia: 'Trimestral', meta: '95%', metaNumerica: 95 }
        ];
      }
    });
  }

  onSelectObjetivoChange(event: any): void {
    const val = event?.target?.value || '';
    this.buscarYAutocompletar(val);
  }

  onSearchObjetivoChange(event: any): void {
    const val = event?.target?.value || '';
    this.buscarYAutocompletar(val);
  }

  buscarYAutocompletar(val: string): void {
    if (!val) {
      this.objetivoSeleccionado = null;
      return;
    }
    const clean = val.toLowerCase().trim();
    const found = this.objetivos.find(o => 
      (o.objetivo && o.objetivo.toLowerCase() === clean) ||
      (o.nombre && o.nombre.toLowerCase() === clean) ||
      (o.codigo && o.codigo.toLowerCase() === clean) ||
      (`${o.codigo} - ${o.objetivo || o.nombre}`.toLowerCase() === clean) ||
      (o.objetivo && clean.length >= 3 && o.objetivo.toLowerCase().includes(clean)) ||
      (o.codigo && clean.length >= 3 && o.codigo.toLowerCase().includes(clean))
    );

    if (found) {
      this.objetivoSeleccionado = found;
      this.formulario.patchValue({
        idObjetivo: found.id,
        codigoObjetivo: found.codigo,
        objetivo: found.objetivo || found.nombre,
        proceso: found.proceso || 'SSOMA',
        norma: found.norma || 'ISO 9001:2015',
        indicador: found.indicador || '',
        frecuencia: found.frecuencia || 'Mensual',
        meta: found.meta || '100%'
      }, { emitEvent: false });
    }
  }

  autoCalcularSemaforo(val: any): void {
    if (!val) return;
    const numVal = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
    const metaStr = this.formulario.get('meta')?.value || '100';
    const numMeta = parseFloat(String(metaStr).replace(/[^0-9.]/g, '')) || 100;

    let sem = 'En meta';
    if (numMeta > 0) {
      const pct = (numVal / numMeta) * 100;
      if (pct >= 90) sem = 'En meta';
      else if (pct >= 75) sem = 'En riesgo';
      else sem = 'Crítico';
    }
    this.formulario.patchValue({ semaforo: sem }, { emitEvent: false });
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onFileEvidenciaSelected(event: any): void {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastr.warning('El archivo supera el límite máximo permitido de 10MB.', 'Archivo muy pesado');
        return;
      }
      this.nombreArchivoEvidencia = file.name;
      this.formulario.patchValue({
        evidencia: file.name,
        archivoEvidencia: file.name
      });
      this.toastr.info(`Archivo "${file.name}" adjuntado como evidencia.`, 'Evidencia Adjuntada', { timeOut: 2500 });
    }
  }

  onRemoveEvidencia(fileInput?: HTMLInputElement): void {
    this.nombreArchivoEvidencia = '';
    this.formulario.patchValue({
      evidencia: '',
      archivoEvidencia: ''
    });
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos obligatorios (*)', 'Formulario Incompleto');
      return;
    }
    const val = { ...this.formulario.getRawValue() };
    if (!val.codigoObjetivo && this.objetivoSeleccionado) {
      val.codigoObjetivo = this.objetivoSeleccionado.codigo;
      val.idObjetivo = this.objetivoSeleccionado.id;
    }
    this.dialogRef.close(val);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
