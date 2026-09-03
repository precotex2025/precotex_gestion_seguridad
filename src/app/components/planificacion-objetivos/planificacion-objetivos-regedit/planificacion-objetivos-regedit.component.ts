import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-planificacion-objetivos-regedit',
  standalone: false,
  templateUrl: './planificacion-objetivos-regedit.component.html',
  styleUrls: ['./planificacion-objetivos-regedit.component.css']
})
export class PlanificacionObjetivosRegeditComponent implements OnInit {

  formulario!: FormGroup;

  normasOptions = ['ISO 9001:2015', 'ISO 45001:2018', 'ISO 14001:2015'];
  frecuenciasOptions = ['Mensual', 'Trimestral', 'Semestral'];
  estadosOptions = ['Planificado', 'Pendiente', 'Cumplido'];

  procesosGroups: { [key: string]: string[] } = {
    'Gerencia General (GG)': [
      'Sistema de Gestión General',
      'Gestión Estratégica',
      'Proyectos Gerenciales',
      'Desarrollo de Negocios',
      'Alianzas Estratégicas',
      'Comercial Exportación de Telas',
      'Comercial Venta Local Textil'
    ],
    'Gestión Comercial (GCOM)': [
      'Desarrollo de Producto',
      'Desarrollo de Estampado y Bordado',
      'Desarrollo Textil',
      'Comercial Exportación de Prendas'
    ],
    'Planeamiento y Control de la Producción (PCP)': [
      'PCP Textil',
      'PCP Manufactura',
      'PCP Estampado y Bordado'
    ],
    'Logística (LOG)': [
      'Almacén',
      'Comercio Exterior',
      'Logística',
      'Transporte'
    ],
    'Balance de Materia (BM)': [
      'Balance de Materia'
    ],
    'Operaciones Textil (OPT)': [
      'Hilandería',
      'Tejeduría',
      'Tintorería',
      'Laboratorio de Color',
      'Estampado Digital',
      'Acabados Textil',
      'Aseguramiento de Calidad Textil',
      'Lavandería'
    ],
    'Operaciones Manufactura (OPM)': [
      'Corte',
      'Costura',
      'Inspección',
      'Acabados',
      'Aseguramiento de la Calidad Manufactura',
      'Consumos'
    ],
    'Servicio de Estampado y Bordado (SEB)': [
      'Estampado',
      'Bordado',
      'Calidad Estampado y Bordado',
      'Planeamiento y Programación de la Producción E&B'
    ],
    'Gestión Humana (GGHH)': [
      'Gestión Humana',
      'Administración de Personal',
      'Capacitaciones y Desarrollo',
      'Comunicaciones',
      'Bienestar Social',
      'Selección de Personal'
    ],
    'Administración y Finanzas (AFC)': [
      'Administración',
      'Finanzas',
      'Contabilidad y Costos',
      'Tesorería'
    ],
    'Ingeniería y Mejora Continua (IMC)': [
      'Organización y Métodos',
      'Mejora Continua',
      'Investigación, Desarrollo e Innovación',
      'Certificaciones'
    ],
    'Control Patrimonial (CPT)': [
      'Control Patrimonial'
    ],
    'Auditoría Interna (AIO)': [
      'Auditoría Interna'
    ],
    'Soporte (SOP)': [
      'Tecnologías de la Información (Sistemas)',
      'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)',
      'Seguridad Patrimonial',
      'Mantenimiento e Infraestructura'
    ]
  };

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PlanificacionObjetivosRegeditComponent>,
    private procesosService: ProcesosService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.procesosGroups = { ...this.procesosGroups, ...groups };
        }
      },
      error: () => {}
    });
    this.formulario = this.fb.group({
      id: [null],
      objetivo: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      norma: ['ISO 45001:2018', Validators.required],
      periodo: ['2026', Validators.required],                         // OBJ-01: Período
      responsableProceso: ['', Validators.required],                  // OBJ-01: Responsable del proceso
      fechaInicio: [''],                                              // OBJ-01: Fecha de inicio
      fechaFin: [''],                                                 // OBJ-01: Fecha de fin
      responsableSeguimiento: ['', Validators.required],              // OBJ-01: Responsable de seguimiento
      medioVerificacion: [''],                                        // OBJ-01: Medio de verificación
      indicador: ['', Validators.required],
      formulaCalculo: [''],                                           // OBJ-01: Fórmula de cálculo
      unidadMedida: ['%'],                                            // OBJ-01: Unidad de medida
      base: [''],
      meta: ['', Validators.required],
      avance: [0],                                                    // OBJ-01: Avance (%)
      frecuencia: ['Mensual', Validators.required],
      estado: ['Planificado', Validators.required],
      desc: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onSave() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete todos los campos obligatorios (*).', 'Validación');
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onClose() {
    this.dialogRef.close(null);
  }
}
