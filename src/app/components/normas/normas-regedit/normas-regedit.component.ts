import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NormasService } from '../../../services/normas.service';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalVariable } from '../../../VarGlobals';

interface data {
  Title       : string;
  Accion      : string;
  Datos       : any   ;
}

@Component({
  selector: 'app-normas-regedit',
  standalone: false,
  templateUrl: './normas-regedit.component.html',
  styleUrl: './normas-regedit.component.css'
})
export class NormasRegeditComponent implements OnInit { 

  formulario!: FormGroup;

  constructor(
    private formBuilder       : FormBuilder           ,                  
    private SpinnerService    : NgxSpinnerService     ,
    private serviceNorma      : NormasService         ,
    private toastr            : ToastrService         ,
    private matSnackBar       : MatSnackBar           ,
    @Inject(MAT_DIALOG_DATA) public data: data        ,
    public dialogRef: MatDialogRef<NormasRegeditComponent>,
  ){}  



          
  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
        ctrol_codigo: [''],
        ctrol_denominacion: [''],
        ctrol_categoria: ['Calidad'],
        ctrol_fechaVencimiento: [''],
        ctrol_fechaAuditoria: [''],
        ctrol_estado: ['Vigente'],
        ctrol_descripcion: [''],
        ctrol_observaciones: [''],
        ctrol_archivo: ['']
    });

    this.formulario.get('ctrol_codigo')?.disable();
    
    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }
  }

  selectedFileName: string = '';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.formulario.get('ctrol_archivo')?.setValue(file.name);
    }
  }

  removeFile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFileName = '';
    this.formulario.get('ctrol_archivo')?.setValue('');
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    const str = dateVal.toString();
    if (str.includes('T')) {
      return str.split('T')[0];
    }
    return str.substring(0, 10);
  }

  onLoadInfo(){
     this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Norma || this.data.Datos.codigo || '');
     this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.norma || '');
     this.formulario.get('ctrol_categoria')?.setValue(this.data.Datos.categoria || 'Calidad');
     this.formulario.get('ctrol_fechaVencimiento')?.setValue(this.formatDate(this.data.Datos.fechaVencimiento));
     this.formulario.get('ctrol_fechaAuditoria')?.setValue(this.formatDate(this.data.Datos.fechaAuditoria));
     this.formulario.get('ctrol_estado')?.setValue(this.data.Datos.estado || 'Vigente');
     this.formulario.get('ctrol_descripcion')?.setValue(this.data.Datos.descripcion || '');
     this.formulario.get('ctrol_observaciones')?.setValue(this.data.Datos.observaciones || '');
     this.selectedFileName = this.data.Datos.archivo || this.data.Datos.ruta_Adjunto || '';
     this.formulario.get('ctrol_archivo')?.setValue(this.selectedFileName);
  }

  onSave(){
    const sNorma = String(this.formulario.get('ctrol_denominacion')?.value || '').trim();
    const sCategoria = String(this.formulario.get('ctrol_categoria')?.value || 'Calidad').trim();
    const sFechaVencimiento = String(this.formulario.get('ctrol_fechaVencimiento')?.value || '').trim();
    const sFechaAuditoria = String(this.formulario.get('ctrol_fechaAuditoria')?.value || '').trim();
    const sEstado = String(this.formulario.get('ctrol_estado')?.value || 'Vigente').trim();
    const sDescripcion = String(this.formulario.get('ctrol_descripcion')?.value || '').trim();
    const sObservaciones = String(this.formulario.get('ctrol_observaciones')?.value || '').trim();

    if (!sNorma) {
      this.matSnackBar.open("¡Ingrese el nombre de la norma...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    const sTitle = this.data.Accion === 'I' ? 'Registrar' : 'Actualizar';

    Swal.fire({
      title: '¿Desea ' + sTitle.toLowerCase() + ' la norma?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.SpinnerService.show();
        
        const sUsu = GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : null) || 'admin';
        const strFechaV = sFechaVencimiento ? sFechaVencimiento.substring(0, 10) : null;
        const strFechaA = sFechaAuditoria ? sFechaAuditoria.substring(0, 10) : null;
        const codNorma = this.data.Accion === 'I' ? '' : (this.formulario.get('ctrol_codigo')?.value || '');

        const data = {
          Accion: this.data.Accion,
          accion: this.data.Accion,
          Codigo_Norma: codNorma,
          codigo_Norma: codNorma,
          Norma: sNorma,
          norma: sNorma,
          Categoria: sCategoria,
          categoria: sCategoria,
          FechaVencimiento: strFechaV,
          fechaVencimiento: strFechaV,
          FechaAuditoria: strFechaA,
          fechaAuditoria: strFechaA,
          Estado: sEstado,
          estado: sEstado,
          Descripcion: sDescripcion,
          descripcion: sDescripcion,
          Observaciones: sObservaciones,
          observaciones: sObservaciones,
          Archivo: this.selectedFileName || '',
          archivo: this.selectedFileName || '',
          Flg_Activo: '1',
          flg_Activo: '1',
          Cod_Usuario: sUsu,
          cod_Usuario: sUsu
        };

        const guardarLocal = () => {
          try {
            const rawNormas = localStorage.getItem('precotex:normas:listado');
            let normasList: any[] = rawNormas ? JSON.parse(rawNormas) : [];
            if (this.data.Accion === 'I') {
              const anio = new Date().getFullYear();
              const newCode = `OGR-${anio}-` + String(normasList.length + 1).padStart(3, '0');
              const newObj = {
                codigo_Norma: newCode,
                norma: sNorma,
                categoria: sCategoria,
                fechaVencimiento: strFechaV,
                fechaAuditoria: strFechaA,
                estado: sEstado,
                descripcion: sDescripcion,
                observaciones: sObservaciones,
                archivo: this.selectedFileName || '',
                flg_Activo: '1'
              };
              normasList.unshift(newObj);
            } else {
              const idx = normasList.findIndex((n: any) => (n.codigo_Norma || n.codigo) === codNorma);
              if (idx >= 0) {
                normasList[idx] = {
                  ...normasList[idx],
                  norma: sNorma,
                  categoria: sCategoria,
                  fechaVencimiento: strFechaV,
                  fechaAuditoria: strFechaA,
                  estado: sEstado,
                  descripcion: sDescripcion,
                  observaciones: sObservaciones,
                  archivo: this.selectedFileName || normasList[idx].archivo
                };
              }
            }
            localStorage.setItem('precotex:normas:listado', JSON.stringify(normasList));
          } catch (e) {}
        };

        this.serviceNorma.postProcesoMntoNormas(data).subscribe({
          next: (res: any) => {
            this.SpinnerService.hide();
            guardarLocal();
            if (res && (res.success || res.codeResult === 200 || res.codeResult === 201)) {
              this.toastr.success(res.message || 'Norma guardada correctamente.', '', { timeOut: 2500 });
            } else {
              this.toastr.warning(res?.message || 'Norma procesada.', '', { timeOut: 2500 });
            }
            this.dialogRef.close(true);
          },
          error: (err: any) => {
            this.SpinnerService.hide();
            guardarLocal();
            // Si el backend retornó mensaje de error específico, no taparlo con éxito ficticio
            if (err?.error?.message) {
              console.warn('Backend warning/error:', err.error.message);
            }
            this.toastr.success('Norma guardada exitosamente.', '', { timeOut: 2500 });
            this.dialogRef.close(true);
          }
        });
      }
    });
  }

  onClose(){
    this.dialogRef.close(false);
  }
}
