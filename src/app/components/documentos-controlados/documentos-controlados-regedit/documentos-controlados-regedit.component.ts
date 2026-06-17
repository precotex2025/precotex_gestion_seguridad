import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-documentos-controlados-regedit',
  standalone: false,
  templateUrl: './documentos-controlados-regedit.component.html',
  styleUrls: ['./documentos-controlados-regedit.component.css']
})
export class DocumentosControladosRegeditComponent implements OnInit {
  formulario!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DocumentosControladosRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_denominacion: [''],
      ctrol_carpeta: ['ACABADO'],
      ctrol_codigo: [''],
      ctrol_version: [''],
      ctrol_tiempo_conservacion: ['5 años'],
      
      chk_iso_14001: [false],
      chk_iso_9001: [false],
      chk_otra: [false],
      chk_wrap: [false],
      chk_iso_45001: [false],
      chk_ley_28783: [false],
      chk_wca: [false],
      
      ctrol_descripcion: [''],
      ctrol_descarga_permitida: ['Descarga permitida'],
      ctrol_registros_asociados: ['No'],
      ctrol_requiere_revision: ['No']
    });
  }

  onArchivoSeleccionado(event: any) {
    // Manejar selección de archivo
  }

  onSave() {
    this.dialogRef.close(this.formulario.value);
  }

  onClose() {
    this.dialogRef.close();
  }
}
