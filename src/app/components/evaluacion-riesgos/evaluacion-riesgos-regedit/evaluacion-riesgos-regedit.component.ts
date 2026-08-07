import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U'
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

  readonly tiposOptions = ['Seguridad', 'Calidad', 'Ambiental', 'Operativo']; // RIE-04
  
  procesosGroups: { [key: string]: string[] } = {};

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
        this.procesosGroups = groups;
      }
    });

    this.formulario = this.fb.group({
      codigo: ['', Validators.required],
      tipo: ['Seguridad', Validators.required],
      descbrief: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      probabilidad: [3, Validators.required], // 1 a 5
      impacto: [3, Validators.required],     // 1 a 5
      nivel: ['Medio', Validators.required],  // Auto-calculado
      responsable: ['', Validators.required],
      revision: ['', Validators.required],
      estado: ['En seguimiento', Validators.required],
      medidacontrol: ['']
    });

    // RIE-01: Cálculo automático de nivel de riesgo residual al modificar probabilidad o impacto
    this.formulario.valueChanges.subscribe(vals => {
      const p = parseInt(vals.probabilidad || 3, 10);
      const i = parseInt(vals.impacto || 3, 10);
      const score = p * i;
      let nuevoNivel = 'Bajo';
      if (score >= 15) nuevoNivel = 'Alto';
      else if (score >= 8) nuevoNivel = 'Medio';

      if (this.formulario.get('nivel')?.value !== nuevoNivel) {
        this.formulario.get('nivel')?.setValue(nuevoNivel, { emitEvent: false });
      }
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        codigo: this.data.Datos.codigo,
        tipo: this.data.Datos.tipo,
        descbrief: this.data.Datos.descbrief,
        proceso: this.data.Datos.proceso,
        probabilidad: this.data.Datos.probabilidad || 3,
        impacto: this.data.Datos.impacto || 3,
        nivel: this.data.Datos.nivel || 'Medio',
        responsable: this.data.Datos.responsable,
        revision: this.data.Datos.revision,
        estado: this.data.Datos.estado,
        medidacontrol: this.data.Datos.medidacontrol || ''
      });
    }
  }

  getProcesosKeys(): string[] {
    return Object.keys(this.procesosGroups);
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor, rellene todos los campos obligatorios.', 'Formulario Inválido');
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
