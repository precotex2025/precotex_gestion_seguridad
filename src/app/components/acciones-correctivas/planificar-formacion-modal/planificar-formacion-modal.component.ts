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
  selector: 'app-planificar-formacion-modal',
  standalone: false,
  templateUrl: './planificar-formacion-modal.component.html',
  styleUrls: ['./planificar-formacion-modal.component.css']
})
export class PlanificarFormacionModalComponent implements OnInit {

  formulario!: FormGroup;
  
  tiposOptions = ['Interna', 'Externa'];
  estadosOptions = ['Pendiente', 'En ejecución', 'Completada', 'Vencida'];

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
    public dialogRef: MatDialogRef<PlanificarFormacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nc: ['', Validators.required],
      tipo: ['Interna', Validators.required],
      accion: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      responsable: ['', Validators.required],
      inicio: ['', Validators.required],
      limite: ['', Validators.required],
      estado: ['Pendiente', Validators.required],
      desc: ['']
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
