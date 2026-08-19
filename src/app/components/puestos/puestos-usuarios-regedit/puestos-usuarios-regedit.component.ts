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
      ctrol_email: ['', [Validators.required, Validators.email]],
      ctrol_password: ['Precotex2026!', Validators.required],
      ctrol_nivel: ['Operativo', Validators.required],
      ctrol_permisos: ['Lectura', Validators.required],
      ctrol_estado: ['Activo', Validators.required],
      ctrol_enviar_credenciales: [true]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        ctrol_puesto: this.data.Datos.puesto,
        ctrol_proceso: this.data.Datos.proceso,
        ctrol_usuario: this.data.Datos.usuario || '',
        ctrol_email: this.data.Datos.email || (this.data.Datos.usuario ? (this.data.Datos.usuario.toLowerCase().replace(/\s+/g, '.') + '@precotexperu.com') : ''),
        ctrol_password: this.data.Datos.password || 'Precotex2026!',
        ctrol_nivel: this.data.Datos.nivel,
        ctrol_permisos: this.data.Datos.permisos,
        ctrol_estado: this.data.Datos.estado,
        ctrol_enviar_credenciales: false
      });
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor ingrese todos los campos obligatorios y un correo electrónico válido.', 'PUE-02: Formulario Incompleto', { timeOut: 3000 });
      return;
    }

    const val = this.formulario.value;
    if (val.ctrol_enviar_credenciales && val.ctrol_email) {
      this.toastr.success(`Credenciales de usuario y contraseña notificadas exitosamente a ${val.ctrol_email}.`, 'PUE-02: Envío Automático de Credenciales', { timeOut: 3500 });
    }

    this.dialogRef.close(val);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
