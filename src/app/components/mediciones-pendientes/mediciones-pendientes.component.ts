import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

interface MedicionPendiente {
  id: number;
  objetivo: string;
  fechaProgramada: string;
  frecuencia: string;
  responsable: string;
  editando?: boolean;
  nuevoValor?: string;
}

@Component({
  selector: 'app-mediciones-pendientes',
  standalone: false,
  templateUrl: './mediciones-pendientes.component.html',
  styleUrls: ['./mediciones-pendientes.component.css']
})
export class MedicionesPendientesComponent implements OnInit {

  mediciones: MedicionPendiente[] = [];

  constructor(private toastr: ToastrService) { }

  ngOnInit(): void {
    this.mediciones = [
      {
        id: 1,
        objetivo: 'Reducir el consumo de agua respecto al trimestre anterior/ Indicador: (consumo del trimestre anterior-consumo del trimestre actual)/consumo trimestre anterior*100%',
        fechaProgramada: '1/2026',
        frecuencia: 'Trimestral',
        responsable: 'José Luis Elias'
      },
      {
        id: 2,
        objetivo: 'Reducir el consumo de energía eléctrica respecto al trimestre anterior/ Indicador: (consumo del trimestre anterior-consumo del trimestre actual)/consumo trimestre anterior*100%',
        fechaProgramada: '1/2026',
        frecuencia: 'Trimestral',
        responsable: 'José Luis Elias'
      }
    ];
  }

  onVerDetalle(item: MedicionPendiente): void {
    this.toastr.info(`Frecuencia: ${item.frecuencia} | Responsable: ${item.responsable} | Programada para: ${item.fechaProgramada}`, 'Detalle del Objetivo');
  }

  guardarMedicion(item: MedicionPendiente): void {
    if (!item.nuevoValor || item.nuevoValor.trim() === '') {
      this.toastr.warning('Por favor ingrese un valor de medición válido.', 'Validación');
      return;
    }

    this.toastr.success(`Medición guardada correctamente: ${item.nuevoValor}%`, 'Éxito');
    
    // Remove the item from the pending list since it is now measured
    this.mediciones = this.mediciones.filter(m => m.id !== item.id);
  }

}
