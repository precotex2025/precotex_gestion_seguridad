import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NormasService } from '../../../services/normas.service';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';

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
        ctrol_descripcion: ['']
    });

    this.formulario.get('ctrol_codigo')?.disable();
    
    if (this.data.Accion === 'U'){
      this.onLoadInfo();
    }
  }

  onLoadInfo(){
     this.formulario.get('ctrol_codigo')?.setValue(this.data.Datos.codigo_Norma!);
     this.formulario.get('ctrol_denominacion')?.setValue(this.data.Datos.norma!);
     this.formulario.get('ctrol_categoria')?.setValue(this.data.Datos.categoria || 'Calidad');
     this.formulario.get('ctrol_fechaVencimiento')?.setValue(this.data.Datos.fechaVencimiento || '');
     this.formulario.get('ctrol_fechaAuditoria')?.setValue(this.data.Datos.fechaAuditoria || '');
     this.formulario.get('ctrol_estado')?.setValue(this.data.Datos.estado || 'Vigente');
     this.formulario.get('ctrol_descripcion')?.setValue(this.data.Datos.descripcion!);
  }

  onSave(){
    const sNorma = String(this.formulario.get('ctrol_denominacion')?.value || '').trim();
    const sCategoria = String(this.formulario.get('ctrol_categoria')?.value || 'Calidad').trim();
    const sFechaVencimiento = String(this.formulario.get('ctrol_fechaVencimiento')?.value || '').trim();
    const sFechaAuditoria = String(this.formulario.get('ctrol_fechaAuditoria')?.value || '').trim();
    const sEstado = String(this.formulario.get('ctrol_estado')?.value || 'Vigente').trim();
    const sDescripcion = String(this.formulario.get('ctrol_descripcion')?.value || '').trim();

    if (!sNorma) {
      this.matSnackBar.open("¡Ingrese el nombre de la norma...!", 'Cerrar', {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 1500,
      });
      return;
    }

    const localNormas = localStorage.getItem('precotex_normas') || '[]';
    let normas = JSON.parse(localNormas);

    const sTitle = this.data.Accion === 'I' ? 'Registrar' : 'Actualizar';

    Swal.fire({
      title: '¿Desea ' + sTitle.toLowerCase() + ' norma?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.data.Accion === 'I') {
          // Generate a custom code N-00X
          const newIdNum = normas.length > 0 ? (Math.max(...normas.map((n: any) => {
            const numPart = parseInt(n.codigo_Norma.replace('N-', ''));
            return isNaN(numPart) ? 0 : numPart;
          })) + 1) : 1;
          const newCode = 'N-' + String(newIdNum).padStart(3, '0');

          const newNorma = {
            codigo_Norma: newCode,
            norma: sNorma,
            categoria: sCategoria,
            fechaVencimiento: sFechaVencimiento,
            fechaAuditoria: sFechaAuditoria,
            estado: sEstado,
            descripcion: sDescripcion,
            flg_Activo: 'True'
          };
          normas.push(newNorma);
        } else {
          const sCodigoNorma = this.formulario.get('ctrol_codigo')?.value;
          const idx = normas.findIndex((n: any) => n.codigo_Norma === sCodigoNorma);
          if (idx !== -1) {
            normas[idx] = {
              ...normas[idx],
              norma: sNorma,
              categoria: sCategoria,
              fechaVencimiento: sFechaVencimiento,
              fechaAuditoria: sFechaAuditoria,
              estado: sEstado,
              descripcion: sDescripcion
            };
          }
        }

        localStorage.setItem('precotex_normas', JSON.stringify(normas));
        this.toastr.success('Norma guardada correctamente.', '', {
          timeOut: 2500,
        });
        this.dialogRef.close(true);
      }
    });
  }

  onClose(){
    this.dialogRef.close(false);
  }
}

