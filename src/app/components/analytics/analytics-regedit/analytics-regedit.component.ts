import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface data {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-analytics-regedit',
  standalone: false,
  templateUrl: './analytics-regedit.component.html',
  styleUrls: ['./analytics-regedit.component.css']
})
export class AnalyticsRegeditComponent implements OnInit {

  formulario!: FormGroup;

  tiposOptions = ['Eficacia', 'Eficiencia', 'Efectividad'];
  normasOptions = ['ISO 9001:2015', 'ISO 45001:2018', 'ISO 14001:2015'];
  estadosOptions = ['Activo', 'Inactivo'];
  sedesOptions = ['Sede Central — Lima', 'Sede Ate', 'Sede San Juan', 'Sede Chorrillos', 'Todas'];
  frecuenciasOptions = ['Diario', 'Semanal', 'Mensual', 'Trimestral'];
  fuentesOptions = ['Reporte de producción', 'Reporte de calidad', 'Reporte SSOMA', 'Sistema ERP', 'Registro manual'];
  unidadesOptions = ['Porcentaje (%)', 'Número', 'Días', 'kWh', 'Soles'];
  tipometasOptions = ['Mayor o igual (≥)', 'Menor o igual (≤)', 'Igual (=)'];
  sentidosOptions = ['↑ Sube es bueno', '↓ Baja es bueno'];

  procesosGroups = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitaciones y Desarrollo', 'Comunicaciones', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Aseguramiento de Calidad Textil', 'Lavandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas'],
    'Gerencia General (GG)': ['Comercial Exportación de Telas', 'Comercial Venta Local Textil', 'Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<AnalyticsRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      tipo: ['Eficacia', Validators.required],
      norma: ['ISO 9001:2015', Validators.required],
      responsable: ['', Validators.required],
      respmed: ['', Validators.required],
      estado: ['Activo', Validators.required],
      sede: ['Todas', Validators.required],
      proceso: ['SSOMA', Validators.required],
      areasacc: [''],
      inicio: ['', Validators.required],
      fin: ['', Validators.required],
      frecuencia: ['Mensual', Validators.required],
      fuente: ['Reporte de producción', Validators.required],
      formula: ['', Validators.required],
      unidad: ['Porcentaje (%)', Validators.required],
      base: [''],
      meta: ['', Validators.required],
      tipometa: ['Mayor o igual (≥)', Validators.required],
      sentido: ['↑ Sube es bueno', Validators.required]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos obligatorios (*)', 'Formulario Incompleto');
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
