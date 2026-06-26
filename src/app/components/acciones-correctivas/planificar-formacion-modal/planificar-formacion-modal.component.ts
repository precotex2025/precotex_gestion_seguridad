import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-planificar-formacion-modal',
  standalone: false,
  templateUrl: './planificar-formacion-modal.component.html',
  styleUrls: ['./planificar-formacion-modal.component.css']
})
export class PlanificarFormacionModalComponent implements OnInit {

  formulario!: FormGroup;

  // Tabs / Radios
  tipoAccion: 'nueva' | 'catalogo' = 'nueva';
  responsableTipo: 'yo' | 'usuario' | 'puesto' = 'yo';
  fechaImparticionTipo: 'fechas' | 'rango' = 'fechas';

  // Opciones
  metodologiasOptions = ['Presencial', 'Online', 'Mixta'];
  tiposFormacionOptions = ['Inducción', 'Capacitación Básica', 'Especialización', 'Simulacro'];
  estadosOptions = ['Planificada', 'En Curso', 'Realizada', 'Anulada'];

  // Transfer list
  sedesDisponibles: string[] = ['PRECOTEX 1', 'PRECOTEX 2', 'PRECOTEX 3', 'Santa Cecilia', 'Santa María'];
  sedesSeleccionadas: string[] = [];
  selectedDisponible: string = '';
  selectedSeleccionada: string = '';

  // Custom Datepicker
  mostrarCalendarioPopup = false;
  fechaImparticionTexto = '12/03/2026';
  selectedDay = 12;
  currentYear = 2026;
  currentMonth = 2; // 2 es Marzo (0-indexed)
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  daysGrid: (number | null)[] = [];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<PlanificarFormacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      accionFormativa: ['', Validators.required],
      metodologia: ['Selecciona', Validators.required],
      tipoFormacion: ['Selecciona', Validators.required],
      estado: ['Planificada', Validators.required],
      duracionPrevista: [''],
      duracionReal: [''],
      numeroAsistentes: [''],
      objetivos: [''],
      destinatarios: [''],
      actividades: [''],
      formadores: [''],
      observaciones: [''],
      temario: ['']
    });

    this.generarCalendario();
  }

  generarCalendario(): void {
    this.daysGrid = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay(); // Domingo es 0
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    // Rellenar espacios vacíos al principio
    for (let i = 0; i < firstDayIndex; i++) {
      this.daysGrid.push(null);
    }

    // Agregar los números de días
    for (let day = 1; day <= totalDays; day++) {
      this.daysGrid.push(day);
    }
  }

  toggleCalendario(): void {
    this.mostrarCalendarioPopup = !this.mostrarCalendarioPopup;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generarCalendario();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generarCalendario();
  }

  selectDia(day: number | null): void {
    if (!day) return;
    this.selectedDay = day;
    const formattedMonth = (this.currentMonth + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    this.fechaImparticionTexto = `${formattedDay}/${formattedMonth}/${this.currentYear}`;
    this.mostrarCalendarioPopup = false;
  }

  selectDisponible(sede: string): void {
    this.selectedDisponible = sede;
  }

  selectSeleccionada(sede: string): void {
    this.selectedSeleccionada = sede;
  }

  transferRight(): void {
    if (this.selectedDisponible) {
      this.sedesSeleccionadas.push(this.selectedDisponible);
      this.sedesDisponibles = this.sedesDisponibles.filter(s => s !== this.selectedDisponible);
      this.selectedDisponible = '';
    }
  }

  transferLeft(): void {
    if (this.selectedSeleccionada) {
      this.sedesDisponibles.push(this.selectedSeleccionada);
      this.sedesSeleccionadas = this.sedesSeleccionadas.filter(s => s !== this.selectedSeleccionada);
      this.selectedSeleccionada = '';
    }
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor complete los campos obligatorios (*)', 'Formulario Incompleto');
      return;
    }
    const dataSave = {
      ...this.formulario.value,
      selectedDate: this.fechaImparticionTexto,
      sedes: this.sedesSeleccionadas,
      tipoAccion: this.tipoAccion,
      responsableTipo: this.responsableTipo,
      fechaImparticionTipo: this.fechaImparticionTipo
    };
    this.dialogRef.close(dataSave);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
