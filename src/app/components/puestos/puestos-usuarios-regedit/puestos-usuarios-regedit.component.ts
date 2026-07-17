import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U'
  Datos: any;
}

@Component({
  selector: 'app-puestos-usuarios-regedit',
  standalone: false,
  templateUrl: './puestos-usuarios-regedit.component.html',
  styleUrls: ['./puestos-usuarios-regedit.component.css']
})
export class PuestosUsuariosRegeditComponent implements OnInit {
  formulario!: FormGroup;

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
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PuestosUsuariosRegeditComponent>
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      ctrol_puesto: ['', Validators.required],
      ctrol_proceso: ['', Validators.required],
      ctrol_usuario: [''],
      ctrol_nivel: ['Operativo', Validators.required],
      ctrol_permisos: ['Lectura', Validators.required],
      ctrol_estado: ['Activo', Validators.required]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        ctrol_puesto: this.data.Datos.puesto,
        ctrol_proceso: this.data.Datos.proceso,
        ctrol_usuario: this.data.Datos.usuario || '',
        ctrol_nivel: this.data.Datos.nivel,
        ctrol_permisos: this.data.Datos.permisos,
        ctrol_estado: this.data.Datos.estado
      });
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  onGuardar() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor llene todos los campos obligatorios.', '', { timeOut: 2000 });
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
