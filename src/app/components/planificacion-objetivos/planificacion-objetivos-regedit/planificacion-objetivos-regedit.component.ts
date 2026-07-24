import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-planificacion-objetivos-regedit',
  standalone: false,
  templateUrl: './planificacion-objetivos-regedit.component.html',
  styleUrls: ['./planificacion-objetivos-regedit.component.css']
})
export class PlanificacionObjetivosRegeditComponent implements OnInit {

  formulario!: FormGroup;

  normasOptions = ['ISO 9001:2015', 'ISO 45001:2018', 'ISO 14001:2015'];
  frecuenciasOptions = ['Mensual', 'Trimestral', 'Semestral'];
  estadosOptions = ['Planificado', 'Pendiente', 'Cumplido'];

  procesosGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PlanificacionObjetivosRegeditComponent>,
    private procesosService: ProcesosService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
      }
    });
    this.formulario = this.fb.group({
      objetivo: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      norma: ['ISO 45001:2018', Validators.required],
      indicador: ['', Validators.required],
      base: [''],
      meta: ['', Validators.required],
      frecuencia: ['Mensual', Validators.required],
      estado: ['Planificado', Validators.required],
      desc: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onSave() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete todos los campos obligatorios (*).', 'Validación');
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onClose() {
    this.dialogRef.close(null);
  }
}
