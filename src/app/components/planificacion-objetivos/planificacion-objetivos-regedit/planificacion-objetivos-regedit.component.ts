import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-planificacion-objetivos-regedit',
  standalone: false,
  templateUrl: './planificacion-objetivos-regedit.component.html',
  styleUrl: './planificacion-objetivos-regedit.component.css'
})
export class PlanificacionObjetivosRegeditComponent implements OnInit {
  formulario!: FormGroup;
  activeTab: 'datos' | 'procesos' = 'datos';
  selectedFileName = '';

  lstOrganizacion = [
    { codigo: '01', descripcion: 'Organización Precotex S.A.C.' }
  ];

  lstSedes = [
    { codigo: '01', descripcion: 'Sede Central - Ate' },
    { codigo: '02', descripcion: 'Sede Planta - Lurin' }
  ];

  lstTareas = [
    {
      accion: 'Elaborar matriz IPERC',
      inicio: '01/01/2026',
      fin: '15/01/2026',
      responsable: 'Supervisor de SST'
    },
    {
      accion: 'Ejecutar simulacro de sismo',
      inicio: '10/03/2026',
      fin: '10/03/2026',
      responsable: 'Comité de SST'
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PlanificacionObjetivosRegeditComponent>
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_denominacion: ['', Validators.required],
      ctrol_cargar_anteriores: [false],
      ctrol_organizacion: ['', Validators.required],
      ctrol_sede: ['', Validators.required],
      ctrol_norma_14001: [false],
      ctrol_norma_9001: [false],
      ctrol_norma_45001: [false],
      ctrol_norma_wca: [false],
      ctrol_norma_wrap: [false],
      ctrol_norma_otra: [false],
      ctrol_norma_ley29783: [false],
      ctrol_fecha_inicio: ['', Validators.required],
      ctrol_fecha_fin: ['', Validators.required],
      ctrol_primera_medicion_inicio: ['si', Validators.required],
      ctrol_sin_fecha_fin: [false],
      ctrol_resultado_si_no: [false],
      ctrol_resultado_texto: [false],
      ctrol_resultado_numerico: [false],
      ctrol_requiere_mediciones: ['si', Validators.required],
      ctrol_frecuencia_medicion: [''],
      ctrol_cumplir_objetivos_parciales: ['si', Validators.required],
      ctrol_resp_seg_yo: [false],
      ctrol_resp_seg_usuario: [false],
      ctrol_resp_seg_puesto: [false],
      ctrol_resp_med_yo: [false],
      ctrol_resp_med_usuario: [false],
      ctrol_resp_med_puesto: [false],
      ctrol_resultados_visibles: [''],
      ctrol_fuente_datos: [''],
      ctrol_descripcion_tareas: [''],
      ctrol_recursos_requeridos: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.onLoadInfo();
    }
  }

  onLoadInfo() {
    const d = this.data.Datos;
    this.formulario.patchValue({
      ctrol_denominacion: d.objetivo,
      ctrol_organizacion: '01',
      ctrol_fecha_inicio: d.fechaInicio,
      ctrol_fecha_fin: d.fechaFin
    });
  }

  onSave() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete todos los campos obligatorios (*).', 'Validación');
      return;
    }
    this.toastr.success('Cambios guardados correctamente.', 'Éxito');
    this.dialogRef.close(this.formulario.value);
  }

  onClose() {
    this.dialogRef.close();
  }

  onNuevaTarea() {
    this.toastr.info('Abriendo diálogo para agregar nueva acción/tarea...', 'Información');
  }

  onEditarTarea(task: any) {
    this.toastr.info(`Editando tarea: "${task.accion}"`, 'Información');
  }

  onEliminarTarea(task: any) {
    this.lstTareas = this.lstTareas.filter(t => t !== task);
    this.toastr.success('Tarea eliminada de la planificación.', 'Éxito');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.toastr.success(`Archivo "${file.name}" seleccionado.`, 'Éxito');
    }
  }
}
