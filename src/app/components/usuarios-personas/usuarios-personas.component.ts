import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { OrganizacionService } from '../../services/organizacion.service';
import { SedesService } from '../../services/sedes.service';
import { PuestosService } from '../../services/puestos.service';
import { MaeTabService } from '../../services/mae-tab.service';
import { UsuariosPersonasRegeditComponent } from './usuarios-personas-regedit/usuarios-personas-regedit.component';

interface combo {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-usuarios-personas',
  standalone: false,
  templateUrl: './usuarios-personas.component.html',
  styleUrl: './usuarios-personas.component.css'
})
export class UsuariosPersonasComponent implements OnInit {
  formulario!: FormGroup;
  lstOrganizacion: combo[] = [];
  lstSedes: combo[] = [];
  lstPuestos: combo[] = [];
  lstNivelRiesgo: combo[] = [];

  displayedColumns: string[] = [
    'activo'                ,
    'nombre'                ,
    'apellidos'             ,
    'email'                 ,
    'teléfono'              ,
    'sede'                  ,
    'puesto'                ,
    'proxima'               ,
    'estado_evaluacion'     ,
    'prox-evalución-plant'  ,
    'acc-evaluación-act' ,
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  // Mock data representing database rows (populated with two test records by default)
  mockPersonas: any[] = [
    {
      codigo_Persona: 'P001',
      nombre: 'Luis',
      apellidos: 'Aldana',
      nombreCompleto: 'Luis Aldana',
      email: 'laldana@precotex.com.pe',
      telefono: '987654321',
      codigo_Organizacion: '01',
      organizacion: 'Precotex S.A.C.',
      codigo_Sede: '01',
      sede: 'Sede Central - Ate',
      codigo_Puesto: '01',
      puesto: 'Jefe de Seguridad y Salud Ocupacional',
      codigo_Nivel_Riesgo: 'ALTO',
      nivelRiesgo: 'ALTO',
      flg_Activo: 'True',
      es_admin: 'Sí',
      proxima: '24/12/2026',
      estado_evaluacion: 'True',
      proxima_evaluacion_plan: '24/06/2027',
      permisos: {}
    },
    {
      codigo_Persona: 'P002',
      nombre: 'Sayda',
      apellidos: 'Huaranga',
      nombreCompleto: 'Sayda Huaranga',
      email: 'shuaranga@precotex.com.pe',
      telefono: '912345678',
      codigo_Organizacion: '01',
      organizacion: 'Precotex S.A.C.',
      codigo_Sede: '02',
      sede: 'Sede Planta - Lurin',
      codigo_Puesto: '02',
      puesto: 'Supervisor de SST',
      codigo_Nivel_Riesgo: 'MEDIO',
      nivelRiesgo: 'MEDIO',
      flg_Activo: 'True',
      es_admin: 'No',
      proxima: '15/10/2026',
      estado_evaluacion: 'True',
      proxima_evaluacion_plan: '15/04/2027',
      permisos: {}
    }
  ];

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
      ctrol_organizacion: [''],
      ctrol_sede: [''],
      ctrol_puesto: [''],
      ctrol_nombre_apellido: [''],
      ctrol_nivel: [''],
      ctrol_ordenar: ['nombreCompleto']
    });

    this.onComboOrganizacion();
    this.onComboPuestos();
    this.onComboNivelRiesgo();
    this.onListado();
  }

  onBuscar() {
    this.onListado();
  }

  onListado() {
    this.SpinnerService.show();
    setTimeout(() => {
      const sOrgaNizacion = this.formulario.get('ctrol_organizacion')?.value || '';
      const sSede = this.formulario.get('ctrol_sede')?.value || '';
      const sPuesto = this.formulario.get('ctrol_puesto')?.value || '';
      const sNombre = (this.formulario.get('ctrol_nombre_apellido')?.value || '').toLowerCase().trim();
      const sNivel = this.formulario.get('ctrol_nivel')?.value || '';
      const sOrdenar = this.formulario.get('ctrol_ordenar')?.value || 'nombreCompleto';

      let filtered = [...this.mockPersonas];

      if (sOrgaNizacion) {
        filtered = filtered.filter(p => p.codigo_Organizacion === sOrgaNizacion);
      }
      if (sSede) {
        filtered = filtered.filter(p => p.codigo_Sede === sSede);
      }
      if (sPuesto) {
        // Filters mock based on selected dropdown
        const selectedPuesto = this.lstPuestos.find(p => p.codigo === sPuesto);
        if (selectedPuesto) {
          filtered = filtered.filter(p => p.puesto.toLowerCase() === selectedPuesto.descripcion.toLowerCase());
        }
      }
      if (sNombre) {
        filtered = filtered.filter(p => p.nombreCompleto.toLowerCase().includes(sNombre));
      }
      if (sNivel) {
        filtered = filtered.filter(p => p.codigo_Nivel_Riesgo === sNivel);
      }

      // Sort results
      filtered.sort((a: any, b: any) => {
        if (a[sOrdenar] < b[sOrdenar]) return -1;
        if (a[sOrdenar] > b[sOrdenar]) return 1;
        return 0;
      });

      this.dataSource.data = filtered;
      this.SpinnerService.hide();
    }, 400);
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

  onComboNivelRiesgo() {
    this.lstNivelRiesgo = [];
    this.serviceMaeTab.getListaMaeTab('TIPO_NIVEL_RIESGO').subscribe({
      next: (response: any) => {
        if (response.success && response.totalElements > 0) {
          this.lstNivelRiesgo = response.elements;
        }
      },
      error: (err) => console.error('Error loading nivel de riesgo', err)
    });
  }

  onChangeOrga(event: any) {
    const valor = event.value;
    this.formulario.get('ctrol_sede')?.setValue('');
    this.onComboSedes(valor);
  }

  onAgregar() {
    const sOrgaNizacion = this.formulario.get('ctrol_organizacion')?.value || '';
    let dialogRef = this.dialog.open(UsuariosPersonasRegeditComponent, {
      width: '75vw',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: {
        Title: 'Registrar nuevo usuario/persona',
        Accion: 'I',
        Datos: {
          codigo_Organizacion: sOrgaNizacion
        }
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.mockPersonas.push(result);
        this.onListado();
      }
    });
  }

  onEditar(item: any) {
    let dialogRef = this.dialog.open(UsuariosPersonasRegeditComponent, {
      width: '75vw',
      height: '90vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      data: {
        Title: 'Editar usuario/persona',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const index = this.mockPersonas.findIndex(p => p.codigo_Persona === item.codigo_Persona);
        if (index !== -1) {
          this.mockPersonas[index] = result;
        }
        this.onListado();
      }
    });
  }

  onEliminar(item: any) {
    Swal.fire({
      title: '¿Desea eliminar la persona?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mockPersonas = this.mockPersonas.filter(p => p.codigo_Persona !== item.codigo_Persona);
        this.toastr.success('Persona eliminada correctamente', '', { timeOut: 2500 });
        this.onListado();
      }
    });
  }

  onExportar() {
    this.toastr.info('Exportando listado de personas a Excel...', '', { timeOut: 2500 });
  }

  onImportar() {
    this.toastr.info('Importando archivo de personas...', '', { timeOut: 2500 });
  }
}
