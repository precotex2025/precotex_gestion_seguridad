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
  selector: 'app-medicion-objetivos-regedit',
  standalone: false,
  templateUrl: './medicion-objetivos-regedit.component.html',
  styleUrls: ['./medicion-objetivos-regedit.component.css']
})
export class MedicionObjetivosRegeditComponent implements OnInit {

  formulario!: FormGroup;
  objetivos: any[] = [];

  frecuenciasOptions = ['Mensual', 'Trimestral', 'Semestral'];
  semaforosOptions = ['En meta', 'En riesgo', 'Crítico'];

  procesosGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<MedicionObjetivosRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
      }
    });
    this.cargarObjetivos();

    this.formulario = this.fb.group({
      objetivo: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      frecuencia: ['Mensual', Validators.required],
      meta: ['', Validators.required],
      valor: ['', Validators.required],
      periodo: ['', Validators.required],
      semaforo: ['En meta', Validators.required],
      obs: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
    }

    // Auto-patch metadata fields when selected objective changes
    this.formulario.get('objetivo')?.valueChanges.subscribe(val => {
      const selected = this.objetivos.find(o => o.objetivo === val);
      if (selected) {
        this.formulario.patchValue({
          proceso: selected.proceso,
          frecuencia: selected.frecuencia,
          meta: selected.meta
        });
      }
    });
  }

  cargarObjetivos(): void {
    const local = localStorage.getItem('precotex_objetivos');
    if (local) {
      this.objetivos = JSON.parse(local);
    }
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
