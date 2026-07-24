import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ProcesosService } from '../../../services/procesos.service';
import { MejoraService } from '../../../services/mejora.service';

interface DialogData {
  Title: string;
  Accion: string; // 'I' | 'U'
  Datos: any;
}

export interface HerramientaOption {
  key: string;
  label: string;
  sub: string;
  color: string;
}

@Component({
  selector: 'app-portafolio-mejora-regedit',
  standalone: false,
  templateUrl: './portafolio-mejora-regedit.component.html',
  styleUrls: ['./portafolio-mejora-regedit.component.css']
})
export class PortafolioMejoraRegeditComponent implements OnInit {
  formulario!: FormGroup;

  sedes: string[] = ['Huachipa 1', 'Huachipa 2', 'Independencia', 'Santa Cecilia'];
  
  procesosPorSedeMap: { [key: string]: string[] } = {
    'Huachipa 1': ['Costura', 'Corte', 'Organización y Métodos', 'SSOMA', 'Sistemas', 'Calidad'],
    'Huachipa 2': ['Costura', 'Estampado', 'Bordado', 'Calidad Estampado y Bordado'],
    'Independencia': ['SSOMA', 'Costura', 'Mantenimiento General', 'Seguridad Patrimonial'],
    'Santa Cecilia': ['Logística', 'Almacén', 'Aseguramiento de Calidad Textil', 'Transporte']
  };

  procesosActuales: string[] = [];

  readonly herramientasOpts: HerramientaOption[] = [
    { key: '5W-2H', label: '5W-2H', sub: 'Análisis rápido', color: '#3ecf8e' },
    { key: 'ACR', label: 'ACR', sub: 'Análisis profundo', color: '#f0b429' },
    { key: 'Iniciativa', label: 'Iniciativa', sub: 'Derivada de ACR', color: '#7c6cf0' }
  ];

  herramientaSeleccionada: string = '5W-2H';
  archivoNombre: string = '';
  cargandoArchivo: boolean = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<PortafolioMejoraRegeditComponent>,
    private procesosService: ProcesosService,
    private mejoraService: MejoraService
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);

    this.formulario = this.fb.group({
      sede: ['Huachipa 1', Validators.required],
      proceso: ['Costura', Validators.required],
      herramienta: ['5W-2H', Validators.required],
      titulo: ['', Validators.required],
      apertura: ['', Validators.required],
      limite: ['', Validators.required],
      registro: [today, Validators.required],
      proveniente: ['—'],
      estado: ['En proceso', Validators.required],
      archivo: ['']
    });

    this.onSedeChange('Huachipa 1');

    if (this.data.Accion === 'U' && this.data.Datos) {
      const d = this.data.Datos;
      this.herramientaSeleccionada = d.herramienta || '5W-2H';
      this.archivoNombre = d.archivo || '';

      this.onSedeChange(d.sede || 'Huachipa 1');

      this.formulario.patchValue({
        sede: d.sede || 'Huachipa 1',
        proceso: d.proceso || 'Costura',
        herramienta: this.herramientaSeleccionada,
        titulo: d.titulo || '',
        apertura: d.apertura || '',
        limite: d.limite || '',
        registro: d.registro || today,
        proveniente: d.proveniente || '—',
        estado: d.estado || 'En proceso',
        archivo: this.archivoNombre
      });
    }
  }

  onSedeChange(sedeVal: string): void {
    const procs = this.procesosPorSedeMap[sedeVal];
    if (procs && procs.length > 0) {
      this.procesosActuales = procs;
    } else {
      this.procesosActuales = ['Costura', 'Corte', 'SSOMA', 'Sistemas', 'Logística'];
    }

    const currentProc = this.formulario?.get('proceso')?.value;
    if (!this.procesosActuales.includes(currentProc)) {
      this.formulario?.get('proceso')?.setValue(this.procesosActuales[0]);
    }
  }

  selectHerramienta(key: string): void {
    this.herramientaSeleccionada = key;
    this.formulario.get('herramienta')?.setValue(key);
  }

  onFileChange(event: any): void {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.cargandoArchivo = true;
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ');

      // Subir archivo al backend servidor
      this.mejoraService.uploadArchivo(file).subscribe({
        next: (res: any) => {
          this.cargandoArchivo = false;
          if (res && res.success) {
            this.archivoNombre = res.fileName;
            this.formulario.get('archivo')?.setValue(res.fileName);

            if (!this.formulario.get('titulo')?.value) {
              this.formulario.get('titulo')?.setValue(nameWithoutExt);
            }

            const today = new Date();
            const occ = new Date();
            occ.setDate(occ.getDate() - 3);
            const lim = new Date();
            lim.setDate(lim.getDate() + 14);

            if (!this.formulario.get('apertura')?.value) {
              this.formulario.get('apertura')?.setValue(occ.toISOString().slice(0, 10));
            }
            if (!this.formulario.get('limite')?.value) {
              this.formulario.get('limite')?.setValue(lim.toISOString().slice(0, 10));
            }

            this.toastr.success('Archivo subido al servidor correctamente.', 'Carga Exitosa');
          } else {
            this.toastr.error('Error al subir el archivo.', 'Error Carga');
          }
        },
        error: (err) => {
          this.cargandoArchivo = false;
          console.error('Error al subir archivo:', err);
          this.toastr.error('Ocurrió un error al subir el archivo al servidor.', 'Error Carga');
        }
      });
    }
  }

  onGuardar(): void {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor llene todos los campos obligatorios (*).', 'Formulario Incompleto');
      return;
    }
    this.dialogRef.close(this.formulario.value);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
