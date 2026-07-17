import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface DialogData {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-req-legal-regedit',
  standalone: false,
  templateUrl: './req-legal-regedit.component.html',
  styleUrls: ['./req-legal-regedit.component.css']
})
export class ReqLegalRegeditComponent implements OnInit {
  formulario!: FormGroup;

  ambitos = ['Laboral', 'Seguridad y salud (SST)', 'Ambiental', 'Tributario', 'Sectorial textil', 'Municipal'];
  tipos = ['Ley', 'Decreto Supremo', 'Resolución', 'Ordenanza', 'Licencia / Permiso', 'Norma técnica'];
  entidades = ['MINTRA', 'SUNAFIL', 'MINAM', 'OEFA', 'ANA', 'SUNAT', 'INDECOPI', 'PRODUCE', 'Municipalidad'];
  estados = ['Cumple', 'En proceso', 'No cumple'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<ReqLegalRegeditComponent>
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      requisito: ['', Validators.required],
      ambito: ['Seguridad y salud (SST)', Validators.required],
      tipo: ['Ley', Validators.required],
      norma: [''],
      entidad: ['MINTRA', Validators.required],
      obligacion: [''],
      estado: ['Cumple', Validators.required],
      responsable: [''],
      evaluacion: [''],
      proxeval: [''],
      vencimiento: [''],
      evidencia: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        requisito: this.data.Datos.requisito,
        ambito: this.data.Datos.ambito,
        tipo: this.data.Datos.tipo,
        norma: this.data.Datos.norma,
        entidad: this.data.Datos.entidad,
        obligacion: this.data.Datos.obligacion,
        estado: this.data.Datos.estado,
        responsable: this.data.Datos.responsable,
        evaluacion: this.data.Datos.evaluacion,
        proxeval: this.data.Datos.proxeval,
        vencimiento: this.data.Datos.vencimiento,
        evidencia: this.data.Datos.evidencia
      });
    }
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
