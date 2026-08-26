import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-proveedores-regedit',
  standalone: false,
  templateUrl: './proveedores-regedit.component.html',
  styleUrl: './proveedores-regedit.component.css'
})
export class ProveedoresRegeditComponent implements OnInit {

  formulario!: FormGroup;

  PROCESOS_GROUPS: { [key: string]: string[] } = {
    'CALIDAD': ['Aseguramiento de Calidad Textil', 'Auditoría Interna'],
    'OPERACIONES Y PRODUCCIÓN': ['Corte', 'Costura', 'Estampado', 'Lavandería', 'Tejeduría', 'Tintorería'],
    'SSOMA Y MEDIO AMBIENTE': ['SSOMA', 'Gestión Ambiental'],
    'LOGÍSTICA Y MANTENIMIENTO': ['Almacén', 'Mantenimiento General', 'Transporte', 'Compras'],
    'ADMINISTRACIÓN': ['Sistemas', 'Recursos Humanos', 'Organización & Métodos']
  };

  tiposOptions: string[] = ['Bien', 'Servicio', 'Contratista'];
  homologacionOptions: string[] = ['Homologado', 'En evaluación', 'Observado', 'No apto'];
  desempenoOptions: string[] = ['—', 'Excelente', 'Bueno', 'Regular', 'Deficiente'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<ProveedoresRegeditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
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
