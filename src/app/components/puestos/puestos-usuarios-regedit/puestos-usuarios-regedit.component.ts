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
  selector: 'app-puestos-usuarios-regedit',
  standalone: false,
  templateUrl: './puestos-usuarios-regedit.component.html',
  styleUrls: ['./puestos-usuarios-regedit.component.css']
})
export class PuestosUsuariosRegeditComponent implements OnInit {
  formulario!: FormGroup;

  procesosGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PuestosUsuariosRegeditComponent>,
    private procesosService: ProcesosService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
      }
    });
    this.formulario = this.fb.group({
      ctrol_puesto: ['', Validators.required],
      ctrol_proceso: ['', Validators.required],
      ctrol_usuario: [''],
      ctrol_nivel: ['Operativo', Validators.required],
      ctrol_permisos: ['Lectura', Validators.required],
      ctrol_estado: ['Activo', Validators.required]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        ctrol_puesto: this.data.Datos.puesto,
        ctrol_proceso: this.data.Datos.proceso,
        ctrol_usuario: this.data.Datos.usuario || '',
        ctrol_nivel: this.data.Datos.nivel,
        ctrol_permisos: this.data.Datos.permisos,
        ctrol_estado: this.data.Datos.estado
      });
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor llene todos los campos obligatorios.', '', { timeOut: 2000 });
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
