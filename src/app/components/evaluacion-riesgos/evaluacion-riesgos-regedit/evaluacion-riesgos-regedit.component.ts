import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface DialogData {
  Title: string;
  Accion: string;
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
  currentStep = 1;
  impactoExpanded = false;
  probabilidadExpanded = true;

  lstOrganizaciones = ['PRECOTEX'];
  lstTiposEvaluacion = [
    { codigo: 'Procesos / Departamentos', label: 'Procesos / Departamentos' },
    { codigo: 'Activos', label: 'Activos' },
    { codigo: 'Estructura Libre', label: 'Estructura Libre' }
  ];

  lstOpcionesAlta = [
    { label: 'Mostrar Categoría de Riesgo', control: 'ctrol_opt_categoria' },
    { label: 'Mostrar Fuente del Riesgo', control: 'ctrol_opt_fuente' },
    { label: 'Mostrar Causa', control: 'ctrol_opt_causa' },
    { label: 'Mostrar Consecuencia', control: 'ctrol_opt_consecuencia' },
    { label: 'Mostrar Norma con la que se relaciona el riesgo', control: 'ctrol_opt_norma' },
    { label: 'Mostrar Procesos con los que se relaciona', control: 'ctrol_opt_proceso' },
    { label: 'Mostrar Puestos con los que se relaciona', control: 'ctrol_opt_puesto' }
  ];

  lstNormasCheck = [
    { codigo: 'ISO 14001:2015', label: 'ISO 14001:2015' },
    { codigo: 'ISO 9001:2015', label: 'ISO 9001:2015' },
    { codigo: 'ISO 45001:2018', label: 'ISO 45001:2018' },
    { codigo: 'WCA', label: 'WCA' },
    { codigo: 'WRAP', label: 'WRAP' },
    { codigo: 'Otra', label: 'Otra' },
    { codigo: 'Ley Nº 29783', label: 'Ley Nº 29783' }
  ];

  lstSedesCheck = [
    { codigo: 'PRECOTEX', label: 'PRECOTEX' },
    { codigo: 'Santa Maria', label: 'Santa Maria' },
    { codigo: 'Santa Cecilia', label: 'Santa Cecilia' },
    { codigo: 'Sede Planta Lurin', label: 'Sede Planta Lurin' },
    { codigo: 'Sede Central Ate', label: 'Sede Central Ate' }
  ];

  lstProcesosCheck = [
    { codigo: 'Mantenimiento', label: 'Mantenimiento' },
    { codigo: 'Hilandería', label: 'Hilandería' },
    { codigo: 'Tintorería', label: 'Tintorería' },
    { codigo: 'Almacén', label: 'Almacén' },
    { codigo: 'Oficinas', label: 'Oficinas' }
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<EvaluacionRiesgosRegeditComponent>
  ) { }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      // Paso 1
      ctrol_denominacion: ['', Validators.required],
      ctrol_organizacion: ['PRECOTEX', Validators.required],
      ctrol_tipo: ['Estructura Libre', Validators.required],

      // Paso 2
      ctrol_criterio_eficacia: ['Método Promedio', Validators.required],
      // Opciones de alta (booleanos)
      ctrol_opt_categoria: [false],
      ctrol_opt_fuente: [false],
      ctrol_opt_causa: [false],
      ctrol_opt_consecuencia: [false],
      ctrol_opt_norma: [false],
      ctrol_opt_proceso: [false],
      ctrol_opt_puesto: [false],
      // Normas seleccionadas (objeto para checkboxes)
      ctrol_norma_14001: [false],
      ctrol_norma_9001: [false],
      ctrol_norma_45001: [false],
      ctrol_norma_wca: [false],
      ctrol_norma_wrap: [false],
      ctrol_norma_otra: [false],
      ctrol_norma_ley29783: [false],

      // Paso 3 (Sedes)
      ctrol_sede_precotex: [true],
      ctrol_sede_santamaria: [false],
      ctrol_sede_santacecilia: [false],
      ctrol_sede_lurin: [false],
      ctrol_sede_ate: [false],

      // Paso 4 (Procesos)
      ctrol_proc_manto: [false],
      ctrol_proc_hila: [false],
      ctrol_proc_tinto: [false],
      ctrol_proc_alma: [false],
      ctrol_proc_oficina: [false],

      // Paso 5 (Cuestionarios)
      ctrol_cuestionario_impacto: ['default'],
      ctrol_cuestionario_probabilidad: ['default']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.onLoadInfo();
    }
  }

  onLoadInfo(): void {
    const d = this.data.Datos;
    // Map existing structure into wizard inputs
    this.formulario.patchValue({
      ctrol_denominacion: d.denominacion,
      ctrol_tipo: d.tipo,
      ctrol_organizacion: d.organizacion
    });

    // Populate Norms checkboxes based on loaded strings
    const normasStr = d.norma || '';
    this.formulario.patchValue({
      ctrol_norma_14001: normasStr.includes('14001'),
      ctrol_norma_9001: normasStr.includes('9001'),
      ctrol_norma_45001: normasStr.includes('45001')
    });

    // Populate Sedes checkboxes based on loaded strings
    const sedesStr = d.sede || '';
    this.formulario.patchValue({
      ctrol_sede_precotex: sedesStr.includes('PRECOTEX'),
      ctrol_sede_santamaria: sedesStr.includes('Santa Maria'),
      ctrol_sede_santacecilia: sedesStr.includes('Santa Cecilia')
    });
  }

  get showProcesosStep(): boolean {
    return this.formulario.get('ctrol_tipo')?.value === 'Procesos / Departamentos';
  }

  onContinuar(): void {
    // Validate current step
    if (this.currentStep === 1) {
      const den = this.formulario.get('ctrol_denominacion')?.value;
      const org = this.formulario.get('ctrol_organizacion')?.value;
      if (!den || !org) {
        this.toastr.warning('Por favor, complete la denominación y organización.', 'Validación');
        return;
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      // Check that at least one norm checkbox is checked
      const f = this.formulario.value;
      const someNormChecked = f.ctrol_norma_14001 || f.ctrol_norma_9001 || f.ctrol_norma_45001 ||
                              f.ctrol_norma_wca || f.ctrol_norma_wrap || f.ctrol_norma_otra || f.ctrol_norma_ley29783;
      if (!someNormChecked) {
        this.toastr.warning('Debe seleccionar al menos una Norma/Objetivo.', 'Validación');
        return;
      }
      this.currentStep = 3;
    } else if (this.currentStep === 3) {
      // Determine if we go to Step 4 (Procesos) or directly to Step 5 (Cuestionarios)
      if (this.showProcesosStep) {
        this.currentStep = 4;
      } else {
        this.currentStep = 5;
      }
    } else if (this.currentStep === 4) {
      // If we are in Procesos step, check that some process is checked
      const f = this.formulario.value;
      const someProcChecked = f.ctrol_proc_manto || f.ctrol_proc_hila || f.ctrol_proc_tinto || f.ctrol_proc_alma || f.ctrol_proc_oficina;
      if (!someProcChecked) {
        this.toastr.warning('Debe seleccionar al menos un Proceso / Departamento.', 'Validación');
        return;
      }
      this.currentStep = 5;
    }
  }

  onAtras(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    } else if (this.currentStep === 3) {
      this.currentStep = 2;
    } else if (this.currentStep === 4) {
      this.currentStep = 3;
    } else if (this.currentStep === 5) {
      if (this.showProcesosStep) {
        this.currentStep = 4;
      } else {
        this.currentStep = 3;
      }
    }
  }

  onSave(): void {
    const f = this.formulario.value;

    // Build the lists of selected Normas
    const normasSelected: string[] = [];
    if (f.ctrol_norma_14001) normasSelected.push('ISO 14001:2015');
    if (f.ctrol_norma_9001) normasSelected.push('ISO 9001:2015');
    if (f.ctrol_norma_45001) normasSelected.push('ISO 45001:2018');
    if (f.ctrol_norma_wca) normasSelected.push('WCA');
    if (f.ctrol_norma_wrap) normasSelected.push('WRAP');
    if (f.ctrol_norma_otra) normasSelected.push('Otra');
    if (f.ctrol_norma_ley29783) normasSelected.push('Ley Nº 29783');

    // Build the lists of selected Sedes
    const sedesSelected: string[] = [];
    if (f.ctrol_sede_precotex) sedesSelected.push('PRECOTEX');
    if (f.ctrol_sede_santamaria) sedesSelected.push('Santa Maria');
    if (f.ctrol_sede_santacecilia) sedesSelected.push('Santa Cecilia');
    if (f.ctrol_sede_lurin) sedesSelected.push('Sede Planta Lurin');
    if (f.ctrol_sede_ate) sedesSelected.push('Sede Central Ate');

    this.toastr.success('Evaluación de Riesgo guardada con éxito.', 'Éxito');
    this.dialogRef.close({
      denominacion: f.ctrol_denominacion,
      tipo: f.ctrol_tipo,
      estado: this.data.Accion === 'U' && this.data.Datos ? this.data.Datos.estado : 'En Evaluación',
      fechaAprobacion: this.data.Accion === 'U' && this.data.Datos ? this.data.Datos.fechaAprobacion : '',
      organizacion: f.ctrol_organizacion,
      sede: sedesSelected.join('\n') || 'PRECOTEX',
      norma: normasSelected.join('\n') || 'ISO 45001:2018'
    });
  }

  onClose(): void {
    this.dialogRef.close(null);
  }
}
