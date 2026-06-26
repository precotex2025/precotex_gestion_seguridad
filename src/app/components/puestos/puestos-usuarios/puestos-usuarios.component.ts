import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface data {
  Puesto: any;
}

@Component({
  selector: 'app-puestos-usuarios',
  standalone: false,
  templateUrl: './puestos-usuarios.component.html',
  styleUrl: './puestos-usuarios.component.css'
})
export class PuestosUsuariosComponent implements OnInit {
  puesto: any;
  lstUsuarios: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: data,
    public dialogRef: MatDialogRef<PuestosUsuariosComponent>
  ) {}

  ngOnInit(): void {
    this.puesto = this.data.Puesto;
    this.onCargarUsuarios();
  }

  onCargarUsuarios() {
    if (this.puesto?.puesto?.includes('Acabado') || this.puesto?.denominacion?.includes('Acabado')) {
      this.lstUsuarios = ['Luis Aldana', 'Sayda Huaranga', 'Kevin Liñan'];
    } else {
      this.lstUsuarios = ['Juan Perez', 'Maria Rodriguez', 'Carlos Gomez', 'Ana Martinez'];
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
