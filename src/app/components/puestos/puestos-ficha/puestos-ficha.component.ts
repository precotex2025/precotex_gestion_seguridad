import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface data {
  Puesto: any;
}

@Component({
  selector: 'app-puestos-ficha',
  standalone: false,
  templateUrl: './puestos-ficha.component.html',
  styleUrl: './puestos-ficha.component.css'
})
export class PuestosFichaComponent implements OnInit {
  puesto: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PuestosFichaComponent>
  ) {}

  ngOnInit(): void {
    this.puesto = this.data.Puesto;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
