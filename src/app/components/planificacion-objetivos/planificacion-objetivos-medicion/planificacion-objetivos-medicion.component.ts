import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { ObjetivosService } from '../../../services/objetivos.service';

interface data {
  Title: string;
}

@Component({
  selector: 'app-planificacion-objetivos-medicion',
  standalone: false,
  templateUrl: './planificacion-objetivos-medicion.component.html',
  styleUrl: './planificacion-objetivos-medicion.component.css'
})
export class PlanificacionObjetivosMedicionComponent implements OnInit {
  formulario!: FormGroup;
  dataSource = new MatTableDataSource<any>();

  displayedColumns: string[] = [
    'desactivar',
    'editar',
    'objetivo',
    'req_medic_seg_perio',
    'frecuencia',
    'cum-obj',
    'norma',
    'tipo-objetivo',
    'valores',
    'inicio',
    'fin'
  ];

  lstMeses = [
    { codigo: 'todos', descripcion: 'Todos' },
    { codigo: '01', descripcion: 'Enero' },
    { codigo: '02', descripcion: 'Febrero' },
    { codigo: '03', descripcion: 'Marzo' },
    { codigo: '04', descripcion: 'Abril' },
    { codigo: '05', descripcion: 'Mayo' },
    { codigo: '06', descripcion: 'Junio' },
    { codigo: '07', descripcion: 'Julio' },
    { codigo: '08', descripcion: 'Agosto' },
    { codigo: '09', descripcion: 'Setiembre' },
    { codigo: '10', descripcion: 'Octubre' },
    { codigo: '11', descripcion: 'Noviembre' },
    { codigo: '12', descripcion: 'Diciembre' }
  ];

  lstAnios = [
    { codigo: '2026', descripcion: '2026' },
    { codigo: '2025', descripcion: '2025' },
    { codigo: '2024', descripcion: '2024' }
  ];

  lstOrganizaciones = [
    { codigo: '01', descripcion: 'Organización Precotex S.A.C.' }
  ];

  lstSedes = [
    { codigo: '01', descripcion: 'Sede Central - Ate' },
    { codigo: '02', descripcion: 'Sede Planta - Lurin' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PlanificacionObjetivosMedicionComponent>,
    private objetivosService: ObjetivosService
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_mes: ['todos'],
      ctrol_anio: ['2026'],
      ctrol_frecuencia: [''],
      ctrol_tipo_objetivo: [''],
      ctrol_fecha_inicio: [''],
      ctrol_fecha_fin: [''],
      ctrol_organizacion: [''],
      ctrol_sede: [''],
      ctrol_puesto_responsable: [''],
      ctrol_proceso: [''],
      ctrol_subproceso: [''],
      ctrol_subproceso_n2: [''],
      ctrol_norma: [''],
      ctrol_resultado: ['']
    });

    this.onListar();
  }

  onListar() {
    this.objetivosService.getListadoObjetivoMediciones().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          const mapped = res.elements.map((item: any) => ({
            id: item.id_Obj_Medicion,
            objetivo: item.nombre_Objetivo || item.codigo_Objetivo,
            reqMedicionSegPeriodico: 'Sí',
            frecuencia: 'Mensual',
            cumplimiento: item.valor !== null && item.valor !== undefined ? item.valor.toString() + '%' : '0%',
            norma: 'ISO 9001:2015',
            tipoObjetivo: 'Estratégico',
            valores: 'Meta: ' + (item.meta || '0'),
            fechaInicio: '01/01/2026',
            fechaFin: '31/12/2026'
          }));
          this.dataSource.data = mapped;
        } else {
          this.dataSource.data = [];
        }
      },
      error: (err) => {
        console.error('Error al listar mediciones de objetivos:', err);
        this.dataSource.data = [];
      }
    });
  }

  onFiltrar() {
    this.onListar();
    this.toastr.success('Filtros aplicados correctamente.', 'Éxito');
  }

  onClose() {
    this.dialogRef.close();
  }

  onEdit(row: any) {
    this.toastr.info(`Visualizando/Editando medición para: "${row.objetivo}"`, 'Información');
  }

  onDelete(row: any) {
    const payload = {
      Accion: 'D',
      Id_Obj_Medicion: row.id,
      Usuario_Registro: 'SISTEMAS'
    };

    this.objetivosService.postProcesoMntoObjetivoMedicion(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Medición eliminada correctamente.', 'Éxito');
          this.onListar();
        }
      }
    });
  }
}
