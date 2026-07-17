import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface DialogData {
  Title: string;
  Accion: string;
  Datos: any;
}

@Component({
  selector: 'app-portafolio-mejora-regedit',
  standalone: false,
  templateUrl: './portafolio-mejora-regedit.component.html',
  styleUrls: ['./portafolio-mejora-regedit.component.css']
})
export class PortafolioMejoraRegeditComponent implements OnInit {
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

  sedes = ['Huachipa 1', 'Huachipa 2', 'Santa Cecilia', 'Independencia'];
  herramientas = ['5W-2H', 'ACR', 'Iniciativa'];
  provenientes = ['—', 'Incidente', 'Queja', 'Oport. mejora', 'Auditoría'];
  estados = ['Cerrado', 'En proceso', 'Vencido'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PortafolioMejoraRegeditComponent>
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      titulo: ['', Validators.required],
      proceso: ['Sistemas', Validators.required],
      sede: ['Huachipa 1', Validators.required],
      herramienta: ['5W-2H', Validators.required],
      proveniente: ['—', Validators.required],
      apertura: ['', Validators.required],
      limite: ['', Validators.required],
      estado: ['En proceso', Validators.required]
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue({
        titulo: this.data.Datos.titulo,
        proceso: this.data.Datos.proceso,
        sede: this.data.Datos.sede,
        herramienta: this.data.Datos.herramienta,
        proveniente: this.data.Datos.proveniente,
        apertura: this.data.Datos.apertura,
        limite: this.data.Datos.limite,
        estado: this.data.Datos.estado
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
