import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuditoriasService } from '../../../services/auditorias.service';

interface data {
  Title  : string;
  Accion : string;
  Datos  : any;
}

@Component({
  selector: 'app-auditorias-regedit',
  standalone: false,
  templateUrl: './auditorias-regedit.component.html',
  styleUrl: './auditorias-regedit.component.css'
})
export class AuditoriasRegeditComponent implements OnInit {

  formulario!: FormGroup;

  constructor(
    private formBuilder       : FormBuilder,
    private SpinnerService    : NgxSpinnerService,
    private toastr            : ToastrService,
    private matSnackBar       : MatSnackBar,
    private auditoriasService : AuditoriasService,
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<AuditoriasRegeditComponent>,
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_codigo      : [''],
      ctrol_tipo        : ['Interna'],
      ctrol_norma       : ['ISO 9001:2015'],
      ctrol_responsable : [''],
      ctrol_areas       : [''],
      ctrol_inicio      : [''],
      ctrol_fin         : [''],
      ctrol_frecuencia  : ['Anual'],
      ctrol_estado      : ['Programada'],
      ctrol_alcance     : [''],
    });

    this.formulario.get('ctrol_codigo')?.disable();

    if (this.data.Accion === 'U') {
      this.onLoadInfo();
    }
  }

  onLoadInfo(): void {
    const d = this.data.Datos;
    this.formulario.get('ctrol_codigo')?.setValue(d.codigo_Auditoria || '');
    this.formulario.get('ctrol_tipo')?.setValue(d.tipo || 'Interna');
    this.formulario.get('ctrol_norma')?.setValue(d.norma || 'ISO 9001:2015');
    this.formulario.get('ctrol_responsable')?.setValue(d.responsable || '');
    this.formulario.get('ctrol_areas')?.setValue(d.areas || '');
    this.formulario.get('ctrol_inicio')?.setValue(d.inicio || '');
    this.formulario.get('ctrol_fin')?.setValue(d.fin || '');
    this.formulario.get('ctrol_frecuencia')?.setValue(d.frecuencia || 'Anual');
    this.formulario.get('ctrol_estado')?.setValue(d.estado || 'Programada');
    this.formulario.get('ctrol_alcance')?.setValue(d.alcance || '');
  }

  onSave(): void {
    const sTipo        = String(this.formulario.get('ctrol_tipo')?.value        || 'Interna').trim();
    const sNorma       = String(this.formulario.get('ctrol_norma')?.value       || '').trim();
    const sResponsable = String(this.formulario.get('ctrol_responsable')?.value || '').trim();
    const sAreas       = String(this.formulario.get('ctrol_areas')?.value       || '').trim();
    const sInicio      = String(this.formulario.get('ctrol_inicio')?.value      || '').trim();
    const sFin         = String(this.formulario.get('ctrol_fin')?.value         || '').trim();
    const sFrecuencia  = String(this.formulario.get('ctrol_frecuencia')?.value  || 'Anual').trim();
    const sEstado      = String(this.formulario.get('ctrol_estado')?.value      || 'Programada').trim();
    const sAlcance     = String(this.formulario.get('ctrol_alcance')?.value     || '').trim();

    if (!sResponsable) {
      this.matSnackBar.open('¡Ingrese el nombre del responsable...!', 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    const sTitle = this.data.Accion === 'I' ? 'Registrar' : 'Actualizar';

    Swal.fire({
      title: '¿Desea ' + sTitle.toLowerCase() + ' la auditoría?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        let sCodigo = '';
        if (this.data.Accion === 'I') {
          const year = new Date().getFullYear();
          const tipoCode = sTipo === 'Externa' ? 'EXT' : 'INT';
          const randomNum = Math.floor(Math.random() * 900) + 100;
          sCodigo = `AUD-${tipoCode}-${year}-${randomNum}`;
        } else {
          sCodigo = String(this.formulario.get('ctrol_codigo')?.value || '');
        }

        const requestData = {
          Accion: this.data.Accion,
          Codigo_Auditoria: sCodigo,
          Tipo: sTipo,
          Norma: sNorma,
          Responsable: sResponsable,
          Areas: sAreas,
          Fecha_Inicio: sInicio || null,
          Fecha_Fin: sFin || null,
          Frecuencia: sFrecuencia,
          Alcance: sAlcance,
          Estado: sEstado,
          Cod_Usuario: 'SISTEMAS'
        };

        this.auditoriasService.postProcesoMntoAuditoria(requestData).subscribe({
          next: (res: any) => {
            this.toastr.success(res.message || 'Auditoría guardada en la BD con éxito.', '', { timeOut: 2500 });
            this.dialogRef.close(true);
          },
          error: () => {
            this.toastr.error('Error al guardar auditoría en la BD', '', { timeOut: 2500 });
          }
        });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
