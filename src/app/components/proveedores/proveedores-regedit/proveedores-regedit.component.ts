import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';

@Component({
  selector: 'app-proveedores-regedit',
  standalone: false,
  templateUrl: './proveedores-regedit.component.html',
  styleUrl: './proveedores-regedit.component.css'
})
export class ProveedoresRegeditComponent implements OnInit {

  formulario!: FormGroup;

  // PROCESOS GRUPOS OFICIALES PRECOTEX (14 Macroprocesos + Balance de Materia, Finanzas y Consumos)
  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Ingeniería', 'Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitación', 'Comunicaciones', 'Desarrollo Organizacional', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Producción Textil', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Laboratorio de Calidad Textil', 'Aseguramiento de la Calidad Textil', 'Lavandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas', 'Comercial Exportación de Telas', 'Comercial Venta Local Textil'],
    'Gerencia General (GG)': ['Directorio', 'Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };

  tiposOptions: string[] = ['Bien', 'Servicio', 'Contratista'];
  homologacionOptions: string[] = ['Homologado', 'En evaluación', 'Observado', 'No apto'];
  desempenoOptions: string[] = ['—', 'Excelente', 'Bueno', 'Regular', 'Deficiente'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private procesosService: ProcesosService,
    public dialogRef: MatDialogRef<ProveedoresRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        if (groups && Object.keys(groups).length > 0) {
          this.PROCESOS_GROUPS = groups;
        }
      }
    });

    const item = this.data?.Datos || {};

    this.formulario = this.fb.group({
      id: [item.id || 0],
      razon: [item.razon || '', [Validators.required]],
      ruc: [item.ruc || '', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      tipo: [item.tipo || 'Bien', [Validators.required]],
      proceso: [item.proceso || 'Almacén', [Validators.required]],
      contacto: [item.contacto || ''],
      homologacion: [item.homologacion || 'En evaluación', [Validators.required]],
      desempeno: [item.desempeno || 'Bueno'],
      evaluacion: [item.evaluacion || ''],
      reeval: [item.reeval || ''],
      sctr: [item.sctr || ''],
      induccion: [item.induccion || ''],
      iperc: [item.iperc || ''],
      seguro: [item.seguro || '']
    });
  }

  get isContratista(): boolean {
    return this.formulario.get('tipo')?.value === 'Contratista';
  }

  getProcesosKeys(): string[] {
    return Object.keys(this.PROCESOS_GROUPS);
  }

  onSave(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos requeridos (Razón Social y RUC válido de 11 dígitos).', 'Campos Incompletos');
      return;
    }

    const val = this.formulario.value;
    this.dialogRef.close(val);
  }

  onClose(): void {
    this.dialogRef.close(null);
  }
}
