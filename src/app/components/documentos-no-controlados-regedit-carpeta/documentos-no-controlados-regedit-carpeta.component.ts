import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-documentos-no-controlados-regedit-carpeta',
  standalone: false,
  templateUrl: './documentos-no-controlados-regedit-carpeta.component.html',
  styleUrl: './documentos-no-controlados-regedit-carpeta.component.css'
})
export class DocumentosNoControladosRegeditCarpetaComponent implements OnInit {

  formulario!: FormGroup;

  lstPuestosPrecotex = [
    'Acabado e Inspección',
    'Analista de certificaciones',
    'Analista de Ingeniería'
  ];

  lstPuestosSantaMaria = [
    'Analista OYM',
    'Comercial',
    'Coordinadora de Logistica',
    'Digitadora Aseguramiento de Calidad',
    'Jefe de Calidad Estampado Bordado',
    'Jefe de Exportaciones'
  ];

  constructor(
    public dialogRef: MatDialogRef<DocumentosNoControladosRegeditCarpetaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_denominacion: [''],
      ctrol_subcarpeta: ['Nueva carpeta raiz en la biblioteca'],
      ctrol_notas: [''],
      
      // Permisos por defecto
      def_lectura: ['No'],
      def_edicion: ['No'],
      def_revision: ['No'],
      def_aprobacion: ['No']
    });

    // Inicializar controles para puestos PRECOTEX
    this.lstPuestosPrecotex.forEach((puesto, i) => {
      this.formulario.addControl('precotex_lec_' + i, this.formBuilder.control('No'));
      this.formulario.addControl('precotex_edi_' + i, this.formBuilder.control('No'));
      this.formulario.addControl('precotex_rev_' + i, this.formBuilder.control('No'));
      this.formulario.addControl('precotex_apr_' + i, this.formBuilder.control('No'));
    });

    // Inicializar controles para puestos Santa María
    this.lstPuestosSantaMaria.forEach((puesto, i) => {
      this.formulario.addControl('stamaria_lec_' + i, this.formBuilder.control('No'));
      this.formulario.addControl('stamaria_edi_' + i, this.formBuilder.control('No'));
      this.formulario.addControl('stamaria_rev_' + i, this.formBuilder.control('No'));
      this.formulario.addControl('stamaria_apr_' + i, this.formBuilder.control('No'));
    });
  }

  onSave() {
    this.toastr.success('Carpeta creada con éxito', 'Éxito');
    this.dialogRef.close(true);
  }

  onClose() {
    this.dialogRef.close(false);
  }
}
