import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

import { DocumentacionPersonasRegeditComponent } from './documentacion-personas-regedit/documentacion-personas-regedit.component';

import { OrganizacionService } from '../../services/organizacion.service';
import { SedesService } from '../../services/sedes.service';
import { PuestosService } from '../../services/puestos.service';
import { MaeTabService } from '../../services/mae-tab.service';

interface combo {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-documentacion-personas',
  standalone: false,
  templateUrl: './documentacion-personas.component.html',
  styleUrl: './documentacion-personas.component.css'
})
export class DocumentacionPersonasComponent implements OnInit {
  formulario!: FormGroup;

  lstOrganizacion: combo[] = [];
  lstSedes: combo[] = [];
  lstPuestos: combo[] = [];
  
  lstUsuarios: combo[] = [];
  lstTipos: combo[] = [];
  lstEstadosDoc: combo[] = [];
  lstEstadosRev: combo[] = [];

  // Indicator Counters
  countPendientesValidacion: number = 0;
  countDocumentosVencidos: number = 0;
  countPendientesAceptacion: number = 0;
  countPendientesRecepcion: number = 0;

  displayedColumns: string[] = [
    'datos',
    'alerta_vencimiento',
    'persona',
    'tipo',
    'nombre_documento',
    'requiere_validacion',
    'fecha_requerimiento',
    'clasificacion',
    'estado_solicitud',
    'proximo_requerimiento',
    'acciones'
  ];  
  dataSource = new MatTableDataSource<any>();

  constructor(
    private formBuilder: FormBuilder,
    private SpinnerService: NgxSpinnerService,
    private serviceOrganizacion: OrganizacionService,
    private serviceSede: SedesService,
    private servicePuesto: PuestosService,
    private serviceMaeTab: MaeTabService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_documento: [''],
      ctrol_puesto: [''],
      ctrol_usuario: [''],
      ctrol_alta_desde: [null],
      ctrol_alta_hasta: [null],
      ctrol_tipo: [''],
      ctrol_organizacion: [''],
      ctrol_sede: [''],
      ctrol_estado_documento: [''],
      ctrol_estado_revision: ['']
    });

    this.onComboOrganizacion();
    this.onComboPuestos();
  }

  onBuscar() {
    this.onListado();
  }

  onListado() {
    this.SpinnerService.show();
    
    // Simulate loading data and updating indicators
    setTimeout(() => {
      // Simulate counts based on some mock inputs
      const docVal = this.formulario.get('ctrol_documento')?.value;
      
      if (docVal && docVal.trim() !== '') {
        // If there's an active query, we show some simulated results
        this.countPendientesValidacion = 3;
        this.countDocumentosVencidos = 1;
        this.countPendientesAceptacion = 4;
        this.countPendientesRecepcion = 2;
        this.dataSource.data = [
          { 
            datos: 'Info', 
            alerta_vencimiento: '30 días', 
            persona: 'Juan Pérez', 
            tipo: 'Contrato', 
            nombre_documento: 'Contrato Laboral', 
            requiere_validacion: 'Sí',
            fecha_requerimiento: '01/01/2026',
            clasificacion: 'Confidencial',
            estado_solicitud: 'Pendiente',
            proximo_requerimiento: '01/01/2027'
          }
        ];
        this.toastr.success('Resultados encontrados', '', { timeOut: 2000 });
      } else {
        // Default/Reset to 0 or mock baseline
        this.countPendientesValidacion = 0;
        this.countDocumentosVencidos = 0;
        this.countPendientesAceptacion = 0;
        this.countPendientesRecepcion = 0;
        this.dataSource.data = [];
        this.toastr.info('Búsqueda completada, sin registros pendientes.', '', { timeOut: 2500 });
      }
      
      this.SpinnerService.hide();
    }, 500);
  }

  onComboOrganizacion() {
    this.lstOrganizacion = [];
    this.serviceOrganizacion.getComboOrganizacion().subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstOrganizacion = response.elements;
        }
      },
      error: (err) => console.error('Error loading organizaciones', err)
    });
  }

  onComboSedes(sCodOrganizacion: string) {
    this.lstSedes = [];
    if (!sCodOrganizacion) return;
    
    this.SpinnerService.show();
    this.serviceSede.getComboSedes(sCodOrganizacion).subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstSedes = response.elements;
        }
        this.SpinnerService.hide();
      },
      error: (err) => {
        console.error('Error loading sedes', err);
        this.SpinnerService.hide();
      }
    });
  }

  onComboPuestos() {
    this.lstPuestos = [];
    this.servicePuesto.getListadoPuesto('', '', '').subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstPuestos = response.elements.map((el: any) => ({
            codigo: el.codigo_Puesto,
            descripcion: el.denominacion
          }));
        }
      },
      error: (err) => console.error('Error loading puestos', err)
    });
  }

  onChangeOrga(event: any) {
    const valor = event.value;
    this.formulario.get('ctrol_sede')?.setValue('');
    this.onComboSedes(valor);
  }

  onAgregar() {
    let dialogRef = this.dialog.open(DocumentacionPersonasRegeditComponent, {
      width: '85vw',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "Registra nuevo documento",
         Accion : "I",
         Datos  : null
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });      
  }

  onEditar(item: any) {
    let dialogRef = this.dialog.open(DocumentacionPersonasRegeditComponent, {
      width: '85vw',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      panelClass: 'my-class',
      data: {
         Title  : "Edita documento",
         Accion : "U",
         Datos  : item
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.onListado();
    });
  }

  onEliminar(item: any) {
    console.log('Eliminar:', item);
  }
}
