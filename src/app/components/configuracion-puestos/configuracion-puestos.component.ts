import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NivelesRiesgoModalComponent } from './niveles-riesgo-modal/niveles-riesgo-modal.component';

@Component({
  selector: 'app-configuracion-puestos',
  standalone: false,
  templateUrl: './configuracion-puestos.component.html',
  styleUrls: ['./configuracion-puestos.component.css']
})
export class ConfiguracionPuestosComponent implements OnInit {

  opcionSeleccionada: string = '';
  nivelesRiesgoConfigurados: string = '3 Niveles (Alto / Medio / Bajo)';

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
  }

  onNivelesRiesgo(): void {
    this.opcionSeleccionada = 'Niveles Riesgo';
    
    const dialogRef = this.dialog.open(NivelesRiesgoModalComponent, {
      width: '90%',
      maxWidth: '850px',
      disableClose: false,
      data: {
        nivelActual: this.nivelesRiesgoConfigurados.startsWith('3') ? '3' : '5'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.nivel === '3') {
          this.nivelesRiesgoConfigurados = '3 Niveles (Alto / Medio / Bajo)';
        } else {
          this.nivelesRiesgoConfigurados = '5 Niveles (Extremo / Alto / Moderado / Bajo / Muy Bajo)';
        }
        this.toastr.success(`Configuración guardada: ${this.nivelesRiesgoConfigurados}`, 'Guardado con éxito');
      }
    });
  }

  onSeleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada = opcion;
    this.toastr.info(`Has seleccionado: ${opcion}`, 'Configuración');
  }

}
