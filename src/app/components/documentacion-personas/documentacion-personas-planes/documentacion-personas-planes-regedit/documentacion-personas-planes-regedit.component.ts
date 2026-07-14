import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

interface Combo {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-documentacion-personas-planes-regedit',
  standalone: false,
  templateUrl: './documentacion-personas-planes-regedit.component.html',
  styleUrls: ['./documentacion-personas-planes-regedit.component.css']
})
export class DocumentacionPersonasPlanesRegeditComponent implements OnInit {
  formulario!: FormGroup;

  lstPersonas: Combo[] = [
    { codigo: '01', descripcion: 'Juan Pérez' },
    { codigo: '02', descripcion: 'María González' },
    { codigo: '03', descripcion: 'Carlos Ruiz' },
    { codigo: '04', descripcion: 'Ana Loli' }
  ];

  lstResponsables: Combo[] = [
    { codigo: '01', descripcion: 'Luis Wong' },
    { codigo: '02', descripcion: 'Sofía Alva' },
    { codigo: '03', descripcion: 'Felipe Castro' },
    { codigo: '04', descripcion: 'Lucía Rivas' }
  ];

  // Listas para subsecciones A, B, C
  lstDocumentosA: string[] = [];
  lstDocumentosB: string[] = [];
  lstCuestionariosC: string[] = [];
  cartaComunicacion: string = 'Estimado Colaborador:\n\nLe comunicamos que se ha generado un nuevo Plan de Gestión Documental en el sistema. Por favor, revise los documentos adjuntos y proceda según corresponda.\n\nAtentamente,\nGestión Documental';

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<DocumentacionPersonasPlanesRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_denominacion: ['', Validators.required],
      ctrol_frecuencia: ['', Validators.required],
      ctrol_tipo: ['', Validators.required],
      ctrol_destinatarios: [[], Validators.required],
      ctrol_responsables: [[], Validators.required],
      ctrol_descripcion: [''],
      ctrol_caracteristicas: [''],
      ctrol_req_confirmacion: [false],
      ctrol_req_aceptacion: [false],
      ctrol_texto_defecto: ['Estimado Usuario: Le enviamos este documento como parte de la política de nuestra empresa.']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      const d = this.data.Datos;
      this.formulario.patchValue({
        ctrol_denominacion: d.denominacion || '',
        ctrol_frecuencia: d.frecuencia || '',
        ctrol_tipo: d.tipo || '',
        ctrol_destinatarios: d.destinatarios || [],
        ctrol_responsables: d.responsables || [],
        ctrol_descripcion: d.descripcion || '',
        ctrol_caracteristicas: d.caracteristicas || '',
        ctrol_req_confirmacion: d.reqConfirmacion || false,
        ctrol_req_aceptacion: d.reqAceptacion || false,
        ctrol_texto_defecto: d.textoDefecto || 'Estimado Usuario: Le enviamos este documento como parte de la política de nuestra empresa.'
      });
    }
  }

  onSolicitarA(): void {
    Swal.fire({
      title: 'Solicitar Documento (Sección A)',
      text: 'Ingrese el nombre del documento o información puntual a solicitar:',
      input: 'text',
      inputPlaceholder: 'Ej. Declaración Jurada de Domicilio...',
      showCancelButton: true,
      confirmButtonText: 'Solicitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c00000',
      cancelButtonColor: '#757575',
      inputValidator: (value) => {
        if (!value) return '¡Debes escribir un nombre!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.lstDocumentosA.push(result.value);
        this.toastr.success(`Documento "${result.value}" añadido a la sección A`, 'Éxito');
      }
    });
  }

  onSolicitarB(): void {
    Swal.fire({
      title: 'Solicitar Documento (Sección B)',
      text: 'Ingrese el nombre del documento a facilitar por la Organización:',
      input: 'text',
      inputPlaceholder: 'Ej. Manual de Funciones de SST...',
      showCancelButton: true,
      confirmButtonText: 'Solicitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c00000',
      cancelButtonColor: '#757575',
      inputValidator: (value) => {
        if (!value) return '¡Debes escribir un nombre!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.lstDocumentosB.push(result.value);
        this.toastr.success(`Documento "${result.value}" añadido a la sección B`, 'Éxito');
      }
    });
  }

  onSolicitarC(): void {
    Swal.fire({
      title: 'Solicitar Cuestionario (Sección C)',
      text: 'Ingrese el nombre del cuestionario a cumplimentar por el Personal:',
      input: 'text',
      inputPlaceholder: 'Ej. Cuestionario de Conocimientos de SST...',
      showCancelButton: true,
      confirmButtonText: 'Solicitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c00000',
      cancelButtonColor: '#757575',
      inputValidator: (value) => {
        if (!value) return '¡Debes escribir un nombre!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.lstCuestionariosC.push(result.value);
        this.toastr.success(`Cuestionario "${result.value}" añadido a la sección C`, 'Éxito');
      }
    });
  }

  onVerEditarCarta(): void {
    Swal.fire({
      title: 'Carta de Comunicación (*)',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p style="margin-bottom: 8px;"><strong>Editar texto de la comunicación:</strong></p>
          <textarea id="swal-carta-texto" class="swal2-textarea" style="width: 90%; height: 160px; font-size: 13px; margin: 0 auto; box-sizing: border-box;" placeholder="Ingrese el texto de la carta de comunicación...">${this.cartaComunicacion}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c00000',
      cancelButtonColor: '#757575',
      preConfirm: () => {
        const text = (document.getElementById('swal-carta-texto') as HTMLTextAreaElement).value;
        if (!text) {
          Swal.showValidationMessage('El texto de la comunicación no puede estar vacío');
        }
        return text;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.cartaComunicacion = result.value;
        this.toastr.success('Carta de comunicación actualizada', 'Éxito');
      }
    });
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      return;
    }
    this.dialogRef.close({
      guardar: true,
      valores: this.formulario.value
    });
  }

  onCancelar(): void {
    this.dialogRef.close({ guardar: false });
  }
}
