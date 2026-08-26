import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

interface ViewDialogData {
  item: any;
}

@Component({
  selector: 'app-req-legal-detail',
  standalone: false,
  templateUrl: './req-legal-detail.component.html',
  styleUrls: ['./req-legal-detail.component.css']
})
export class ReqLegalDetailComponent implements OnInit {
  item: any;

  constructor(
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: ViewDialogData,
    public dialogRef: MatDialogRef<ReqLegalDetailComponent>
  ) {}

  ngOnInit(): void {
    this.item = this.data?.item || {};
  }

  getEstadoClass(st: string): string {
    switch (st) {
      case 'Cumple': return 'val-cumple';
      case 'En proceso': return 'val-proceso';
      case 'No cumple': return 'val-nocumple';
      default: return '';
    }
  }

  onDescargar(): void {
    const file = this.item.evidencia || this.item.evidenciadoc;
    if (file) {
      this.toastr.success(`Descargando evidencia: '${file}'`, 'Descargar Archivo');
    } else {
      this.toastr.warning('Este registro no tiene un archivo adjunto.', 'Sin Archivo');
    }
  }

  onEditar(): void {
    this.dialogRef.close({ action: 'edit', item: this.item });
  }

  onCerrar(): void {
    this.dialogRef.close(null);
  }
}
