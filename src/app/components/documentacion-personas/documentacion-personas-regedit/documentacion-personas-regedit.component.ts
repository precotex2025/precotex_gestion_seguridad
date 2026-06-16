import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

interface Combo {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-documentacion-personas-regedit',
  standalone: false,
  templateUrl: './documentacion-personas-regedit.component.html',
  styleUrls: ['./documentacion-personas-regedit.component.css']
})
export class DocumentacionPersonasRegeditComponent implements OnInit {
  formulario!: FormGroup;
  lstSedes: Combo[] = [
    { codigo: '01', descripcion: 'Sede Central' },
    { codigo: '02', descripcion: 'Sede Norte' }
  ];
  lstPuestos: Combo[] = [
    { codigo: '01', descripcion: 'Gerente' },
    { codigo: '02', descripcion: 'Analista' }
  ];
  lstTipos: Combo[] = [
    { codigo: '1', descripcion: 'Comunicado' },
    { codigo: '2', descripcion: 'Política' },
    { codigo: '3', descripcion: 'Procedimiento' }
  ];

  lstPersonasDisponibles: any[] = [];
  lstPersonasSeleccionadas: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DocumentacionPersonasRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_denominacion: ['', Validators.required],
      
      // Filtros de búsqueda de destinatarios
      ctrol_busqueda_persona: [''],
      ctrol_busqueda_sede: [''],
      ctrol_busqueda_puesto: [''],

      // Selecciones
      ctrol_destinatarios_disponibles: [[]],
      ctrol_destinatarios_seleccionados: [[]],

      // Tipo de Documento
      ctrol_tipo: ['', Validators.required],

      // Opciones de acción
      ctrol_accion_doc: ['ENTREGAR', Validators.required],
      ctrol_disponible_mis_doc: [true, Validators.required],

      // Descripciones
      ctrol_descripcion: [''],
      ctrol_caracteristicas: [''],

      // Confirmaciones
      ctrol_req_confirmacion: [false],
      ctrol_req_aceptacion: [false],

      // Texto comunicación
      ctrol_texto_comunicacion: ['Estimado Usuario: Le enviamos este correo como parte de la política de nuestra empresa.']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      // Poblar datos si es edición
      this.formulario.patchValue({
        ctrol_denominacion: this.data.Datos.documento || '',
        ctrol_tipo: this.data.Datos.tipo || ''
      });
    }
  }

  onBuscarDestinatarios(): void {
    // Mock data for available recipients
    this.lstPersonasDisponibles = [
      { id: 1, nombre: 'Juan Pérez' },
      { id: 2, nombre: 'María González' },
      { id: 3, nombre: 'Carlos Ruiz' }
    ];
  }

  onMoverADerecha(): void {
    const seleccionados = this.formulario.get('ctrol_destinatarios_disponibles')?.value || [];
    if (seleccionados.length === 0) return;

    this.lstPersonasSeleccionadas.push(...seleccionados);
    this.lstPersonasDisponibles = this.lstPersonasDisponibles.filter(p => !seleccionados.includes(p));
    this.formulario.get('ctrol_destinatarios_disponibles')?.setValue([]);
  }

  onMoverAIzquierda(): void {
    const seleccionados = this.formulario.get('ctrol_destinatarios_seleccionados')?.value || [];
    if (seleccionados.length === 0) return;

    this.lstPersonasDisponibles.push(...seleccionados);
    this.lstPersonasSeleccionadas = this.lstPersonasSeleccionadas.filter(p => !seleccionados.includes(p));
    this.formulario.get('ctrol_destinatarios_seleccionados')?.setValue([]);
  }

  onArchivoSeleccionado(event: any): void {
    // Lógica para manejar el archivo seleccionado
    const file = event.target.files[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name);
    }
  }

  onSave(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete todos los campos obligatorios (*)', 'Atención');
      return;
    }

    // Aquí iría la llamada al servicio para guardar
    this.spinner.show();
    setTimeout(() => {
      this.spinner.hide();
      this.toastr.success('Documento guardado correctamente', 'Éxito');
      this.dialogRef.close(true);
    }, 1000);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
