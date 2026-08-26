import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface DialogData {
  Title: string;
  Accion: string;
  EsMatriz?: boolean;
  Datos: any;
}

@Component({
  selector: 'app-req-legal-regedit',
  standalone: false,
  templateUrl: './req-legal-regedit.component.html',
  styleUrls: ['./req-legal-regedit.component.css']
})
export class ReqLegalRegeditComponent implements OnInit {
  formulario!: FormGroup;

  carpetasPorAreaGrouped: { area: string; items: string[] }[] = [
    {
      area: 'SSOMA',
      items: [
        'Formación y capacitaciones',
        'Comité de SST',
        'IPERC',
        'Exámenes médicos ocupacionales',
        'Registros y monitoreos',
        'Mapa de riesgo',
        'Mapa de evacuación',
        'Gestión ambiental',
        'Extintores',
        'Trabajos de alto riesgo',
        'Respuesta ante emergencia',
        'Investigación de accidentes',
        'Requisitos legales SST'
      ]
    },
    {
      area: 'GESTIÓN HUMANA',
      items: [
        'Documentación de ingreso',
        'Contratos y planillas',
        'Reglamento interno de trabajo'
      ]
    },
    {
      area: 'MANTENIMIENTO',
      items: [
        'Certificados de operatividad',
        'Pozo a tierra',
        'Sistema contra incendios'
      ]
    },
    {
      area: 'ADMINISTRACIÓN Y FINANZAS',
      items: [
        'Obligaciones tributarias (SUNAT)',
        'Libros electrónicos',
        'Facturación electrónica',
        'Licencias y permisos municipales'
      ]
    },
    {
      area: 'COMERCIO EXTERIOR',
      items: [
        'Documentación aduanera',
        'Certificados de origen',
        'Drawback / regímenes'
      ]
    },
    {
      area: 'SOPORTE / SISTEMAS',
      items: [
        'Protección de datos personales',
        'Licencias de software',
        'Facturación electrónica (TI)'
      ]
    }
  ];

  tipos = [
    'Ley',
    'Decreto Supremo',
    'Resolución',
    'Registro / Acta',
    'Programa',
    'Licencia / Permiso',
    'Certificado',
    'Norma técnica'
  ];

  entidades = [
    'MINTRA',
    'SUNAFIL',
    'MINAM',
    'OEFA',
    'ANA',
    'SUNAT',
    'INDECOPI',
    'PRODUCE',
    'Municipalidad',
    'Interno'
  ];

  frecuencias = [
    'Única vez',
    'Mensual',
    'Trimestral',
    'Semestral',
    'Anual',
    '≤1 año',
    '≤2 años'
  ];

  estados = ['Cumple', 'En proceso', 'No cumple'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<ReqLegalRegeditComponent>
  ) {}

  ngOnInit(): void {
    const item = this.data?.Datos || {};

    let amb = item.tema || item.ambito || 'Formación y capacitaciones';
    
    // Verificar si el valor existe en carpetasPorAreaGrouped
    const exists = this.carpetasPorAreaGrouped.some(g => g.items.includes(amb));
    if (!exists && amb) {
      this.carpetasPorAreaGrouped[0].items.unshift(amb);
    }

    let tip = item.tipo || 'Ley';
    if (tip && !this.tipos.includes(tip)) {
      this.tipos.unshift(tip);
    }

    let ent = item.entidad || 'MINTRA';
    if (ent && !this.entidades.includes(ent)) {
      this.entidades.unshift(ent);
    }

    let frec = item.frecuencia || 'Anual';
    if (frec && !this.frecuencias.includes(frec)) {
      this.frecuencias.unshift(frec);
    }

    let est = item.estado || 'En proceso';
    if (est && !this.estados.includes(est)) {
      this.estados.unshift(est);
    }

    this.formulario = this.fb.group({
      id: [item.id || 0],
      item: [item.item || ''],
      requisito: [item.requisito || item.norma || '', [Validators.required]],
      tema: [amb],
      ambito: [amb, [Validators.required]],
      tipo: [tip],
      norma: [item.norma || ''],
      articulo: [item.articulo || ''],
      entidad: [ent, [Validators.required]],
      obligacion: [item.obligacion || item.requisito || ''],
      evidenciadoc: [item.evidenciadoc || ''],
      estado: [est, [Validators.required]],
      responsable: [item.responsable || ''],
      frecuencia: [frec],
      evaluacion: [item.evaluacion || ''],
      proxeval: [item.proxeval || ''],
      vencimiento: [item.vencimiento || ''],
      observaciones: [item.observaciones || ''],
      evidencia: [item.evidencia || '']
    });
  }

  onArchivoNormaSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.formulario.patchValue({ evidencia: file.name });
      this.toastr.success(`Evidencia '${file.name}' adjuntada correctamente.`, 'Archivo Adjunto');
    }
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor llene los campos requeridos (Título/Requisito, Carpetas por Área y Estado).', 'Campos Requeridos');
      return;
    }
    const val = this.formulario.value;
    val.tema = val.ambito; // sincronizar tema con carpeta seleccionada
    this.dialogRef.close(val);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
