import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../../services/procesos.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-medicion-regedit',
  standalone: false,
  templateUrl: './medicion-regedit.component.html',
  styleUrls: ['./medicion-regedit.component.css']
})
export class MedicionRegeditComponent implements OnInit {

  formulario!: FormGroup;
  indicadores: any[] = [];
  
  sedesOptions = ['Huachipa 1', 'Huachipa 2', 'Independencia', 'Santa Cecilia', 'Todas'];
  semaforosOptions = ['En meta', 'En riesgo', 'Crítico'];

  procesosGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<MedicionRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
      }
    });
    this.cargarIndicadores();

    this.formulario = this.fb.group({
      indicador: ['', Validators.required],
      sede: ['Todas', Validators.required],
      proceso: ['SSOMA', Validators.required],
      meta: ['', Validators.required],
      valor: ['', Validators.required],
      periodo: ['', Validators.required],
      semaforo: ['En meta', Validators.required],
      obs: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
    }

    // Auto-fill process and target when indicator changes
    this.formulario.get('indicador')?.valueChanges.subscribe(val => {
      const selected = this.indicadores.find(i => i.nombre === val);
      if (selected) {
        this.formulario.patchValue({
          proceso: selected.proceso,
          meta: selected.meta
        });
      }
    });
  }

  cargarIndicadores(): void {
    const local = localStorage.getItem('precotex_indicadores');
    if (local) {
      this.indicadores = JSON.parse(local);
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
