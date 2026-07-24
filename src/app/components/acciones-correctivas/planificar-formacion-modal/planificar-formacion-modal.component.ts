import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { AuditoriasService } from '../../../services/auditorias.service';

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

  procesosGroups: { [key: string]: string[] } = {};
  auditoriasList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<PlanificarFormacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: data,
    private procesosService: ProcesosService,
    private auditoriasService: AuditoriasService
  ) {}

  ngOnInit(): void {
    this.procesosService.getProcesosAgrupados().subscribe({
      next: (groups: any) => {
        this.procesosGroups = groups;
      }
    });

    this.auditoriasService.getListadoAuditorias().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.auditoriasList = res.elements;
        }
      },
      error: (err) => {
        console.error('Error al cargar auditorías para desplegable:', err);
      }
    });

    this.formulario = this.fb.group({
      nc: ['', Validators.required],
      tipo: ['Interna', Validators.required],
      accion: ['', Validators.required],
      proceso: ['SSOMA', Validators.required],
      responsable: ['', Validators.required],
      inicio: ['', Validators.required],
      limite: ['', Validators.required],
      estado: ['Pendiente', Validators.required],
      codigoAuditoria: [''],
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
