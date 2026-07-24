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

  readonly tiposOptions = ['Seguridad', 'Calidad', 'Ambiental'];
  
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
      nivel: ['Medio', Validators.required],
      responsable: ['', Validators.required],
      revision: ['', Validators.required],
      estado: ['En seguimiento', Validators.required],
      medidacontrol: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        codigo: this.data.Datos.codigo,
        tipo: this.data.Datos.tipo,
        descbrief: this.data.Datos.descbrief,
        proceso: this.data.Datos.proceso,
        nivel: this.data.Datos.nivel,
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
