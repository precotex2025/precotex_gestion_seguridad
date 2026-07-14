import { Component } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';

const ELEMENT_DATA = [
  { codigo_Puesto: 'REG-001', denominacion: 'Operador de Montacargas', organizacion: 'Precotex', sede: 'Planta Principal', nivelRiesgo: 'Alto', flg_Activo: 'True' },
  { codigo_Puesto: 'REG-002', denominacion: 'Técnico de Mantenimiento', organizacion: 'Precotex', sede: 'Almacén Central', nivelRiesgo: 'Medio', flg_Activo: 'True' },
  { codigo_Puesto: 'REG-003', denominacion: 'Asistente Administrativo', organizacion: 'Precotex', sede: 'Sede Administrativa', nivelRiesgo: 'Bajo', flg_Activo: 'False' },
];

@Component({
  selector: 'app-registros-pendientes',
  standalone: false,
  templateUrl: './registros-pendientes.component.html',
  styleUrl: './registros-pendientes.component.css'
})
export class RegistrosPendientesComponent {
  
  displayedColumns: string[] = ['codigo', 'denominacion', 'organizacion', 'sede', 'nivel', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>(ELEMENT_DATA); // Data de prueba para que se visualice la tabla

  constructor() {}

  onEditar(elemento: any) {
    console.log('Editar', elemento);
  }

  onEliminar(elemento: any) {
    console.log('Eliminar', elemento);
  }
}
