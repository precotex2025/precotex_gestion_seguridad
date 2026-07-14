import { Component, Inject, OnInit, Output, EventEmitter, Optional } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { DocumentacionPersonasPlanesRegeditComponent } from './documentacion-personas-planes-regedit/documentacion-personas-planes-regedit.component';

interface Combo {
  codigo: string;
  descripcion: string;
}

interface PlanMedicion {
  fechaAlta: string;
  denominacion: string;
  tipo: string;
  frecuencia: string;
  usuarios: number;
  caracteristicas?: string;
  reqConfirmacion?: boolean;
  reqAceptacion?: boolean;
  textoDefecto?: string;
  descripcion?: string;
  destinatarios?: string[];
  responsables?: string[];
}

@Component({
  selector: 'app-documentacion-personas-planes',
  standalone: false,
  templateUrl: './documentacion-personas-planes.component.html',
  styleUrls: ['./documentacion-personas-planes.component.css']
})
export class DocumentacionPersonasPlanesComponent implements OnInit {
  @Output() onBack = new EventEmitter<void>();

  formulario!: FormGroup;
  modoEdicion: boolean = false; // Kept for template reference compatibility
  
  lstTipos: Combo[] = [
    { codigo: '1', descripcion: 'General' },
    { codigo: '2', descripcion: 'Específico' }
  ];

  lstFrecuencias: Combo[] = [
    { codigo: 'mensual', descripcion: 'Mensual' },
    { codigo: 'trimestral', descripcion: 'Trimestral' },
    { codigo: 'anual', descripcion: 'Anual' }
  ];

  displayedColumns: string[] = [
    'gestionar',
    'fechaAlta',
    'denominacion',
    'tipo',
    'frecuencia',
    'usuarios'
  ];

  dataSourceMedicion = new MatTableDataSource<PlanMedicion>();

  // Mock initial dataset for planes matching the requested table structure
  private originalPlanes: PlanMedicion[] = [
    {
      fechaAlta: '2026-02-04 03:23:10',
      denominacion: 'AGRUPACION DEMO',
      tipo: 'General',
      frecuencia: 'Trimestral',
      usuarios: 1,
      caracteristicas: 'Características iniciales para Agrupación Demo.',
      reqConfirmacion: false,
      reqAceptacion: false,
      textoDefecto: 'Estimado Usuario: Le enviamos este documento como parte de la política de nuestra empresa.',
      descripcion: 'Descripción inicial para Agrupación Demo.',
      destinatarios: ['01', '02'],
      responsables: ['01']
    },
    {
      fechaAlta: '2026-05-12 14:10:45',
      denominacion: 'PLAN ANUAL DE SEGURIDAD Y SALUD 2026',
      tipo: 'Específico',
      frecuencia: 'Anual',
      usuarios: 5,
      caracteristicas: 'Plan de seguridad correspondiente al año 2026.',
      reqConfirmacion: true,
      reqAceptacion: true,
      textoDefecto: 'Estimado Usuario: Le enviamos este documento como parte de la política de nuestra empresa.',
      descripcion: 'Plan de salud 2026.',
      destinatarios: ['01', '03'],
      responsables: ['02', '03']
    },
    {
      fechaAlta: '2026-06-01 09:15:00',
      denominacion: 'PLAN DE SIMULACROS Y PLAN DE EMERGENCIAS',
      tipo: 'General',
      frecuencia: 'Mensual',
      usuarios: 3,
      caracteristicas: 'Simulacros de sismo e incendios programados mensualmente.',
      reqConfirmacion: false,
      reqAceptacion: true,
      textoDefecto: 'Estimado Usuario: Le enviamos este documento como parte de la política de nuestra empresa.',
      descripcion: 'Plan de emergencias y sismos.',
      destinatarios: ['02', '04'],
      responsables: ['04']
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    @Optional() private dialogRef?: MatDialogRef<DocumentacionPersonasPlanesComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_busqueda: [''],
      ctrol_tipo: [''],
      ctrol_frecuencia: ['']
    });

    this.dataSourceMedicion.data = [...this.originalPlanes];
  }

  onFiltrar(): void {
    this.spinner.show();
    setTimeout(() => {
      const busqueda = (this.formulario.get('ctrol_busqueda')?.value || '').toLowerCase().trim();
      const tipoCod = this.formulario.get('ctrol_tipo')?.value;
      const frecuenciaCod = this.formulario.get('ctrol_frecuencia')?.value;

      let filtered = this.originalPlanes;

      if (busqueda) {
        filtered = filtered.filter(p => 
          p.denominacion.toLowerCase().includes(busqueda)
        );
      }

      if (tipoCod) {
        const selectedTipoDesc = this.lstTipos.find(t => t.codigo === tipoCod)?.descripcion || '';
        filtered = filtered.filter(p => p.tipo === selectedTipoDesc);
      }

      if (frecuenciaCod) {
        const selectedFrecDesc = this.lstFrecuencias.find(f => f.codigo === frecuenciaCod)?.descripcion || '';
        filtered = filtered.filter(p => p.frecuencia === selectedFrecDesc);
      }

      this.dataSourceMedicion.data = filtered;
      this.toastr.success('Búsqueda de planes realizada', 'Filtrar');
      this.spinner.hide();
    }, 400);
  }

  onLimpiar(): void {
    this.formulario.reset({
      ctrol_busqueda: '',
      ctrol_tipo: '',
      ctrol_frecuencia: ''
    });
    this.dataSourceMedicion.data = [...this.originalPlanes];
  }

  onVerDetalle(row: PlanMedicion): void {
    this.toastr.info(`Visualizando detalles (Ficha) de: "${row.denominacion}"`, 'Ficha');
  }

  onVerMediciones(row: PlanMedicion): void {
    this.toastr.info(`Gestionando plan: "${row.denominacion}"`, 'Gestionar');
  }

  onNuevoPlan(): void {
    const dialogRef = this.dialog.open(DocumentacionPersonasPlanesRegeditComponent, {
      width: '80%',
      maxWidth: '800px',
      disableClose: true,
      data: { Accion: 'I', Datos: null }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res && res.guardar) {
        this.spinner.show();
        setTimeout(() => {
          const valores = res.valores;
          const nuevoPlan: PlanMedicion = {
            fechaAlta: new Date().toISOString().replace('T', ' ').substring(0, 19),
            denominacion: valores.ctrol_denominacion,
            tipo: valores.ctrol_tipo,
            frecuencia: valores.ctrol_frecuencia,
            usuarios: 0,
            caracteristicas: valores.ctrol_caracteristicas,
            reqConfirmacion: valores.ctrol_req_confirmacion,
            reqAceptacion: valores.ctrol_req_aceptacion,
            textoDefecto: valores.ctrol_texto_defecto,
            descripcion: valores.ctrol_descripcion,
            destinatarios: valores.ctrol_destinatarios,
            responsables: valores.ctrol_responsables
          };
          this.originalPlanes.unshift(nuevoPlan);
          this.dataSourceMedicion.data = [...this.originalPlanes];
          this.toastr.success('Nuevo plan creado exitosamente', 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }

  onEditar(row: PlanMedicion): void {
    const dialogRef = this.dialog.open(DocumentacionPersonasPlanesRegeditComponent, {
      width: '80%',
      maxWidth: '800px',
      disableClose: true,
      data: { Accion: 'U', Datos: row }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res && res.guardar) {
        this.spinner.show();
        setTimeout(() => {
          const valores = res.valores;
          row.denominacion = valores.ctrol_denominacion;
          row.tipo = valores.ctrol_tipo;
          row.frecuencia = valores.ctrol_frecuencia;
          row.caracteristicas = valores.ctrol_caracteristicas;
          row.reqConfirmacion = valores.ctrol_req_confirmacion;
          row.reqAceptacion = valores.ctrol_req_aceptacion;
          row.textoDefecto = valores.ctrol_texto_defecto;
          row.descripcion = valores.ctrol_descripcion;
          row.destinatarios = valores.ctrol_destinatarios;
          row.responsables = valores.ctrol_responsables;

          this.dataSourceMedicion.data = [...this.originalPlanes];
          this.toastr.success(`Plan "${row.denominacion}" actualizado exitosamente`, 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }

  onEliminar(row: PlanMedicion): void {
    this.spinner.show();
    setTimeout(() => {
      this.originalPlanes = this.originalPlanes.filter(p => p.denominacion !== row.denominacion);
      this.dataSourceMedicion.data = [...this.originalPlanes];
      this.toastr.success(`Plan "${row.denominacion}" eliminado de la simulación`, 'Éxito');
      this.spinner.hide();
    }, 400);
  }

  onVolver(): void {
    this.onBack.emit();
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }

  onClose(): void {
    this.onVolver();
  }
}
