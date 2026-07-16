import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

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
  
  readonly procesosGroups: { [key: string]: string[] } = {
    'Administrativo / Soporte': ['Sistemas', 'Servicios Compartidos', 'Recursos Humanos', 'Finanzas', 'SSOMA'],
    'Operaciones / Producción': ['Operaciones', 'Comercial', 'Calidad', 'Logística', 'Corte', 'Costura', 'Tintorería']
  };

  readonly nivelesOptions = ['Alto', 'Medio', 'Bajo'];
  readonly estadosOptions = ['Controlado', 'En seguimiento', 'Sin control'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<EvaluacionRiesgosRegeditComponent>
  ) { }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      codigo: ['', Validators.required],
      tipo: ['Seguridad', Validators.required],
      descbrief: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      nivel: ['Medio', Validators.required],
      responsable: ['', Validators.required],
      revision: ['', Validators.required],
      estado: ['En seguimiento', Validators.required]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
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
