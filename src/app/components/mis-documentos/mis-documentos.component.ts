import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

interface DocumentoUsuario {
  id: number;
  clasificacion: string;
  estadoSolicitud: string; // 'PENDIENTE', 'COMPLETADO', 'RECHAZADO'
  nombreDocumento: string;
  requeridoPor: string;
  tipoDocumento: string;
  fechaAlta: string; // YYYY-MM-DD
  accionRequerida: string; // 'LECTURA', 'ACEPTACION', 'NINGUNA'
}

@Component({
  selector: 'app-mis-documentos',
  standalone: false,
  templateUrl: './mis-documentos.component.html',
  styleUrls: ['./mis-documentos.component.css']
})
export class MisDocumentosComponent implements OnInit {
  formulario!: FormGroup;
  dataSource = new MatTableDataSource<DocumentoUsuario>();
  displayedColumns: string[] = [
    'ver_gestionar',
    'clasificacion',
    'estado_solicitud',
    'nombre_documento',
    'requerido_por',
    'tipo_documento',
    'fecha_alta'
  ];

  public originalDocs: DocumentoUsuario[] = [
    {
      id: 1,
      clasificacion: 'Controlado',
      estadoSolicitud: 'PENDIENTE',
      nombreDocumento: 'POLITICA DE SEGURIDAD Y SALUD EN EL TRABAJO 2026',
      requeridoPor: 'Prevención de Riesgos',
      tipoDocumento: 'Política',
      fechaAlta: '2026-06-20',
      accionRequerida: 'LECTURA'
    },
    {
      id: 2,
      clasificacion: 'No Controlado',
      estadoSolicitud: 'PENDIENTE',
      nombreDocumento: 'MANUAL DE EMERGENCIAS Y PLAN DE SIMULACROS',
      requeridoPor: 'Comité de SST',
      tipoDocumento: 'Procedimiento',
      fechaAlta: '2026-06-22',
      accionRequerida: 'ACEPTACION'
    },
    {
      id: 3,
      clasificacion: 'Confidencial',
      estadoSolicitud: 'COMPLETADO',
      nombreDocumento: 'REGLAMENTO INTERNO DE SEGURIDAD 2026',
      requeridoPor: 'Recursos Humanos',
      tipoDocumento: 'Manual',
      fechaAlta: '2026-05-15',
      accionRequerida: 'LECTURA'
    },
    {
      id: 4,
      clasificacion: 'Controlado',
      estadoSolicitud: 'PENDIENTE',
      nombreDocumento: 'INSTRUCCIONES DE USO DE EQUIPOS DE PROTECCIÓN',
      requeridoPor: 'Supervisor SST',
      tipoDocumento: 'Instrucción',
      fechaAlta: '2026-06-23',
      accionRequerida: 'LECTURA'
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_busqueda: [''],
      ctrol_tipo: [''],
      ctrol_fecha_desde: [null],
      ctrol_fecha_hasta: [null],
      ctrol_clasificacion: ['']
    });

    this.dataSource.data = [...this.originalDocs];
  }

  onFiltrar(): void {
    this.spinner.show();
    setTimeout(() => {
      const busqueda = (this.formulario.get('ctrol_busqueda')?.value || '').toLowerCase().trim();
      const tipo = this.formulario.get('ctrol_tipo')?.value || '';
      const clasificacion = this.formulario.get('ctrol_clasificacion')?.value || '';
      const fechaDesdeVal = this.formulario.get('ctrol_fecha_desde')?.value;
      const fechaHastaVal = this.formulario.get('ctrol_fecha_hasta')?.value;

      let filtered = this.originalDocs;

      if (busqueda) {
        filtered = filtered.filter(d => 
          d.nombreDocumento.toLowerCase().includes(busqueda)
        );
      }

      if (tipo) {
        filtered = filtered.filter(d => d.tipoDocumento === tipo);
      }

      if (clasificacion) {
        filtered = filtered.filter(d => d.clasificacion === clasificacion);
      }

      if (fechaDesdeVal) {
        const desde = new Date(fechaDesdeVal);
        desde.setHours(0, 0, 0, 0);
        filtered = filtered.filter(d => {
          const docDate = new Date(d.fechaAlta);
          docDate.setHours(0, 0, 0, 0);
          return docDate >= desde;
        });
      }

      if (fechaHastaVal) {
        const hasta = new Date(fechaHastaVal);
        hasta.setHours(23, 59, 59, 999);
        filtered = filtered.filter(d => {
          const docDate = new Date(d.fechaAlta);
          docDate.setHours(0, 0, 0, 0);
          return docDate <= hasta;
        });
      }

      this.dataSource.data = filtered;
      this.toastr.success('Filtros aplicados', 'Filtrar');
      this.spinner.hide();
    }, 400);
  }

  onLimpiar(): void {
    this.formulario.reset({
      ctrol_busqueda: '',
      ctrol_tipo: '',
      ctrol_fecha_desde: null,
      ctrol_fecha_hasta: null,
      ctrol_clasificacion: ''
    });
    this.dataSource.data = [...this.originalDocs];
  }

  onConfirmarLectura(doc: DocumentoUsuario): void {
    Swal.fire({
      title: '¿Confirmar Lectura?',
      text: `¿Declaras haber leído y entendido el documento "${doc.nombreDocumento}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        setTimeout(() => {
          doc.estadoSolicitud = 'COMPLETADO';
          this.dataSource.data = [...this.originalDocs];
          this.toastr.success('Lectura confirmada exitosamente', 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }

  onAceptarRechazar(doc: DocumentoUsuario, aceptar: boolean): void {
    const accionStr = aceptar ? 'Aceptar' : 'Rechazar';
    Swal.fire({
      title: `¿${accionStr} Documento?`,
      text: `¿Deseas ${accionStr.toLowerCase()} los términos del documento "${doc.nombreDocumento}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: aceptar ? '#2e7d32' : '#c00000',
      cancelButtonColor: '#757575',
      confirmButtonText: aceptar ? 'Aceptar' : 'Rechazar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        setTimeout(() => {
          doc.estadoSolicitud = aceptar ? 'COMPLETADO' : 'RECHAZADO';
          this.dataSource.data = [...this.originalDocs];
          this.toastr.success(`Documento ${aceptar ? 'aceptado' : 'rechazado'} correctamente`, 'Éxito');
          this.spinner.hide();
        }, 400);
      }
    });
  }
}
