import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-nueva-tarea-modal',
  standalone: false,
  templateUrl: './nueva-tarea-modal.component.html',
  styleUrls: ['./nueva-tarea-modal.component.css']
})
export class NuevaTareaModalComponent implements OnInit {
  formulario!: FormGroup;

  lstPuestos = [
    { codigo: 'Jefe de Mantenimiento', descripcion: 'Jefe de Mantenimiento' },
    { codigo: 'Jefe de RRHH', descripcion: 'Jefe de RRHH' },
    { codigo: 'Supervisor de SST', descripcion: 'Supervisor de SST' },
    { codigo: 'Comité de SST', descripcion: 'Comité de SST' },
    { codigo: 'Gerente de Planta', descripcion: 'Gerente de Planta' }
  ];

  lstPersonas = [
    { codigo: 'Cristian Quispe', descripcion: 'Cristian Quispe' },
    { codigo: 'Ana Torres', descripcion: 'Ana Torres' },
    { codigo: 'Carlos Chamaya', descripcion: 'Carlos Chamaya' },
    { codigo: 'Maria Javier Castillo Reynoso', descripcion: 'Maria Javier Castillo Reynoso' },
    { codigo: 'Hans Flores', descripcion: 'Hans Flores' }
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<NuevaTareaModalComponent>
  ) { }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      ctrol_tarea: ['', Validators.required],
      ctrol_fecha_inicio: ['', Validators.required],
      ctrol_fecha_fin: ['', Validators.required],
      ctrol_puesto: ['', Validators.required],
      ctrol_persona: ['', Validators.required],
      ctrol_observaciones: ['']
    });
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete todos los campos obligatorios (*).', 'Validación');
      return;
    }

    const val = this.formulario.value;
    this.toastr.success('Acción / Tarea planificada con éxito.', 'Éxito');
    this.dialogRef.close({
      tarea: val.ctrol_tarea,
      fechaInicio: val.ctrol_fecha_inicio,
      fechaFin: val.ctrol_fecha_fin,
      cargo: val.ctrol_puesto,
      responsable: val.ctrol_persona,
      observaciones: val.ctrol_observaciones
    });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
