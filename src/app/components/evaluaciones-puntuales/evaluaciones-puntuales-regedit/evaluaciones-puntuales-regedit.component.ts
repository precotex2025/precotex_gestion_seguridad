import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

interface Combo {
  codigo: string;
  descripcion: string;
}

interface PersonaMock {
  id: number;
  nombre: string;
  puesto: string;
  pais: string;
  organizacion: string;
  sede: string;
}

@Component({
  selector: 'app-evaluaciones-puntuales-regedit',
  standalone: false,
  templateUrl: './evaluaciones-puntuales-regedit.component.html',
  styleUrls: ['./evaluaciones-puntuales-regedit.component.css']
})
export class EvaluacionesPuntualesRegeditComponent implements OnInit {
  formulario!: FormGroup;

  lstPuestos: Combo[] = [
    { codigo: '', descripcion: 'Cualquier Puesto' },
    { codigo: '01', descripcion: 'Supervisor de Planta' },
    { codigo: '02', descripcion: 'Gerente de Administración' },
    { codigo: '03', descripcion: 'Operario de Producción' }
  ];

  lstPaises: Combo[] = [
    { codigo: '', descripcion: 'Selecciona' },
    { codigo: 'PE', descripcion: 'Perú' },
    { codigo: 'CH', descripcion: 'Chile' },
    { codigo: 'CO', descripcion: 'Colombia' }
  ];

  lstOrganizaciones: Combo[] = [
    { codigo: '', descripcion: 'Cualquier Organización' },
    { codigo: '01', descripcion: 'Precotex S.A.' },
    { codigo: '02', descripcion: 'SST Corporativo' }
  ];

  lstSedes: Combo[] = [
    { codigo: '', descripcion: 'Cualquier Sede' },
    { codigo: '01', descripcion: 'Planta Ate' },
    { codigo: '02', descripcion: 'Planta Ica' },
    { codigo: '03', descripcion: 'Oficina Central' }
  ];

  allPersonas: PersonaMock[] = [
    { id: 1, nombre: 'Max Soria', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 2, nombre: 'Miguel Angel Rojas Veliz', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 3, nombre: 'Milagros Salvador', puesto: '03', pais: 'PE', organizacion: '01', sede: '02' },
    { id: 4, nombre: 'NANCY AGUILAR RODRIGUEZ', puesto: '01', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 5, nombre: 'Nixon Davila', puesto: '03', pais: 'PE', organizacion: '01', sede: '03' },
    { id: 6, nombre: 'Ricardo Diaz', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 7, nombre: 'Ricardo Muñante', puesto: '03', pais: 'PE', organizacion: '01', sede: '02' },
    { id: 8, nombre: 'Rodolfo Gerstein', puesto: '02', pais: 'PE', organizacion: '02', sede: '03' },
    { id: 9, nombre: 'Rommel Solis', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 10, nombre: 'RONY GUSTAVO VILLALVA VELARDE', puesto: '01', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 11, nombre: 'ROSARIO VELA ALVARADO', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 12, nombre: 'Sayda Huaranga', puesto: '03', pais: 'PE', organizacion: '01', sede: '02' },
    { id: 13, nombre: 'Teresa Villalva', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 14, nombre: 'Vanesa Arriaga', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' },
    { id: 15, nombre: 'William Villalva', puesto: '03', pais: 'PE', organizacion: '01', sede: '01' }
  ];

  leftPersonas: PersonaMock[] = [];
  rightPersonas: PersonaMock[] = [];

  selectedLeftIds: number[] = [];
  selectedRightIds: number[] = [];

  // Nuevas listas para tablas A, B, C y carta
  lstDocumentosA: string[] = [];
  lstDocumentosB: string[] = [];
  lstCuestionariosC: string[] = [];
  cartaComunicacion: string = 'Estimado Colaborador:\n\nSe le convoca a participar en la Evaluación de Clima Laboral 2026. Su participación es muy importante para nosotros.\n\nAtentamente,\nPrevención de Riesgos';

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<EvaluacionesPuntualesRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      ctrol_titulo: ['', Validators.required],
      ctrol_fecha_limite: [null],
      ctrol_puesto: [''],
      ctrol_pais: [''],
      ctrol_organizacion: [''],
      ctrol_sede: ['']
    });

    // Carga inicial
    this.leftPersonas = [...this.allPersonas];

    if (this.data && this.data.Accion === 'U' && this.data.Datos) {
      // Si fuera edición, pero por ahora solo implementamos creación
      const d = this.data.Datos;
      this.formulario.patchValue({
        ctrol_titulo: d.denominacion,
        ctrol_fecha_limite: d.fechaLimite ? new Date(d.fechaLimite) : null
      });
    }
  }

  onFiltrar(): void {
    const puesto = this.formulario.get('ctrol_puesto')?.value;
    const pais = this.formulario.get('ctrol_pais')?.value;
    const organizacion = this.formulario.get('ctrol_organizacion')?.value;
    const sede = this.formulario.get('ctrol_sede')?.value;

    let filterList = this.allPersonas;

    if (puesto) {
      filterList = filterList.filter(p => p.puesto === puesto);
    }
    if (pais) {
      filterList = filterList.filter(p => p.pais === pais);
    }
    if (organizacion) {
      filterList = filterList.filter(p => p.organizacion === organizacion);
    }
    if (sede) {
      filterList = filterList.filter(p => p.sede === sede);
    }

    // Excluir los que ya están en la derecha
    const rightIds = this.rightPersonas.map(r => r.id);
    this.leftPersonas = filterList.filter(p => !rightIds.includes(p.id));
    
    this.toastr.success('Filtros aplicados a la lista disponible', 'Filtrar');
  }

  onSelectLeftChange(event: any): void {
    // Convertir opciones seleccionadas nativas en ids numéricos
    const options = event.target.options;
    const values: number[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(Number(options[i].value));
      }
    }
    this.selectedLeftIds = values;
  }

  onSelectRightChange(event: any): void {
    const options = event.target.options;
    const values: number[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(Number(options[i].value));
      }
    }
    this.selectedRightIds = values;
  }

  onMoveRight(): void {
    if (this.selectedLeftIds.length === 0) return;

    const toMove = this.leftPersonas.filter(p => this.selectedLeftIds.includes(p.id));
    this.rightPersonas = [...this.rightPersonas, ...toMove];
    this.leftPersonas = this.leftPersonas.filter(p => !this.selectedLeftIds.includes(p.id));
    
    this.selectedLeftIds = [];
  }

  onMoveLeft(): void {
    if (this.selectedRightIds.length === 0) return;

    const toMove = this.rightPersonas.filter(p => this.selectedRightIds.includes(p.id));
    this.leftPersonas = [...this.leftPersonas, ...toMove];
    this.rightPersonas = this.rightPersonas.filter(p => !this.selectedRightIds.includes(p.id));

    this.selectedRightIds = [];
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.toastr.warning('Por favor ingrese los campos obligatorios (*)', 'Validación');
      return;
    }

    if (this.rightPersonas.length === 0) {
      this.toastr.warning('Debe asignar al menos una persona a la evaluación', 'Validación');
      return;
    }

    const formValues = this.formulario.value;
    this.dialogRef.close({
      guardar: true,
      valores: {
        ctrol_titulo: formValues.ctrol_titulo,
        ctrol_fecha_limite: formValues.ctrol_fecha_limite,
        destinatarios: this.rightPersonas.map(p => p.nombre)
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close({ guardar: false });
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
        if (!value) {
          return '¡Debes escribir un nombre!';
        }
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
        if (!value) {
          return '¡Debes escribir un nombre!';
        }
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
      inputPlaceholder: 'Ej. Cuestionario de Sintomatología COVID-19...',
      showCancelButton: true,
      confirmButtonText: 'Solicitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c00000',
      cancelButtonColor: '#757575',
      inputValidator: (value) => {
        if (!value) {
          return '¡Debes escribir un nombre!';
        }
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
}
