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
  selector: 'app-medicion-regedit',
  standalone: false,
  templateUrl: './medicion-regedit.component.html',
  styleUrls: ['./medicion-regedit.component.css']
})
export class MedicionRegeditComponent implements OnInit {

  formulario!: FormGroup;
  indicadores: any[] = [];
  
  sedesOptions = ['Huachipa 1', 'Huachipa 2', 'Independencia', 'Santa Cecilia', 'Todas'];
  semaforosOptions = ['En meta', 'En riesgo', 'Crítico'];

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
    public dialogRef: MatDialogRef<MedicionRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data
  ) {}

  ngOnInit(): void {
    this.cargarIndicadores();

    this.formulario = this.fb.group({
      indicador: ['', Validators.required],
      sede: ['Todas', Validators.required],
      proceso: ['SSOMA', Validators.required],
      meta: ['', Validators.required],
      valor: ['', Validators.required],
      periodo: ['', Validators.required],
      semaforo: ['En meta', Validators.required],
      obs: ['']
    });

    if (this.data.Accion === 'U' && this.data.Datos) {
      this.formulario.patchValue(this.data.Datos);
    }

    // Auto-fill process and target when indicator changes
    this.formulario.get('indicador')?.valueChanges.subscribe(val => {
      const selected = this.indicadores.find(i => i.nombre === val);
      if (selected) {
        this.formulario.patchValue({
          proceso: selected.proceso,
          meta: selected.meta
        });
      }
    });
  }

  cargarIndicadores(): void {
    const local = localStorage.getItem('precotex_indicadores');
    if (local) {
      this.indicadores = JSON.parse(local);
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
