import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-niveles-riesgo-modal',
  standalone: false,
  templateUrl: './niveles-riesgo-modal.component.html',
  styleUrls: ['./niveles-riesgo-modal.component.css']
})
export class NivelesRiesgoModalComponent implements OnInit {

  seleccionNivel: '3' | '5' = '3';

  constructor(
    public dialogRef: MatDialogRef<NivelesRiesgoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    if (this.data && this.data.nivelActual) {
      this.seleccionNivel = this.data.nivelActual;
    }
  }

  onSelectNivel(nivel: '3' | '5'): void {
    this.seleccionNivel = nivel;
  }

  onGuardar(): void {
    this.dialogRef.close({
      nivel: this.seleccionNivel
    });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }

}
