import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EvaluacionRiesgosRegeditComponent } from './evaluacion-riesgos-regedit/evaluacion-riesgos-regedit.component';

export interface RiesgoItem {
  id: number;
  codigo: string;
  tipo: string;
  descbrief: string;
  proceso: string;
  nivel: string;
  estado: string; // 'Controlado' | 'En seguimiento' | 'Sin control'
  responsable: string;
  revision: string; // YYYY-MM-DD
}

@Component({
  selector: 'app-evaluacion-riesgos',
  standalone: false,
  templateUrl: './evaluacion-riesgos.component.html',
  styleUrls: ['./evaluacion-riesgos.component.css']
})
export class EvaluacionRiesgosComponent implements OnInit {
  formularioBusqueda!: FormGroup;
  riesgos: RiesgoItem[] = [];
  riesgosFiltrados: RiesgoItem[] = [];

  cantTotal = 0;
  cantControlado = 0;
  cantEnSeguimiento = 0;
  cantSinControl = 0;

  readonly tiposOptions = ['Seguridad', 'Calidad', 'Ambiental'];
  readonly procesosOptions = [
    'Sistemas', 'Servicios Compartidos', 'Recursos Humanos', 'Finanzas', 'SSOMA',
    'Corte', 'Costura', 'Tintorería'
  ];
  readonly nivelesOptions = ['Alto', 'Medio', 'Bajo'];
  readonly estadosOptions = ['Controlado', 'En seguimiento', 'Sin control'];

  private readonly STORAGE_KEY = 'precotex_riesgos_declarados';

  private readonly seedData: RiesgoItem[] = [
    {
      id: 1,
      codigo: 'RSG-2025-012',
      tipo: 'Seguridad',
      descbrief: 'Falla eléctrica en planta de corte por sobrecarga',
      proceso: 'Corte',
      nivel: 'Alto',
      estado: 'Sin control',
      responsable: 'Luis Mamani',
      revision: '2025-08-01'
    },
    {
      id: 2,
      codigo: 'RSG-2025-025',
      tipo: 'Calidad',
      descbrief: 'Variabilidad de tallas en costura',
      proceso: 'Costura',
      nivel: 'Medio',
      estado: 'Controlado',
      responsable: 'Rosa Chávez',
      revision: '2025-07-10'
    },
    {
      id: 3,
      codigo: 'RSG-2025-031',
      tipo: 'Ambiental',
      descbrief: 'Derrame de químicos en tintorería',
      proceso: 'Tintorería',
      nivel: 'Medio',
      estado: 'En seguimiento',
      responsable: 'Pedro Salas',
      revision: '2025-09-05'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.formularioBusqueda = this.fb.group({
      termino: [''],
      tipo: [''],
      proceso: [''],
      estado: ['']
    });

    this.cargarDatos();
  }

  cargarDatos(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        this.riesgos = JSON.parse(raw);
      } catch (e) {
        this.riesgos = [...this.seedData];
        this.guardarEnStorage();
      }
    } else {
      this.riesgos = [...this.seedData];
      this.guardarEnStorage();
    }
    this.actualizarContadores();
    this.riesgosFiltrados = [...this.riesgos];
  }

  guardarEnStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.riesgos));
  }

  actualizarContadores(): void {
    this.cantTotal = this.riesgos.length;
    this.cantControlado = this.riesgos.filter(r => r.estado === 'Controlado').length;
    this.cantEnSeguimiento = this.riesgos.filter(r => r.estado === 'En seguimiento').length;
    this.cantSinControl = this.riesgos.filter(r => r.estado === 'Sin control').length;
  }

  onBuscar(): void {
    const filters = this.formularioBusqueda.value;
    const term = (filters.termino || '').toLowerCase().trim();

    this.riesgosFiltrados = this.riesgos.filter(item => {
      if (term) {
        const cod = (item.codigo || '').toLowerCase();
        const desc = (item.descbrief || '').toLowerCase();
        const resp = (item.responsable || '').toLowerCase();
        if (
          !cod.includes(term) &&
          !desc.includes(term) &&
          !resp.includes(term)
        ) {
          return false;
        }
      }
      if (filters.tipo && item.tipo !== filters.tipo) return false;
      if (filters.proceso && item.proceso !== filters.proceso) return false;
      if (filters.estado && item.estado !== filters.estado) return false;
      return true;
    });
  }

  onAgregar(): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Declarar Riesgo',
        Accion: 'I',
        Datos: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const nuevoId = this.riesgos.length > 0 ? Math.max(...this.riesgos.map(r => r.id)) + 1 : 1;
        const nuevoItem: RiesgoItem = {
          id: nuevoId,
          ...result
        };
        this.riesgos.push(nuevoItem);
        this.guardarEnStorage();
        this.actualizarContadores();
        this.onBuscar();
        this.toastr.success('Riesgo declarado correctamente.', 'Registrado');
      }
    });
  }

  onEdit(item: RiesgoItem): void {
    const dialogRef = this.dialog.open(EvaluacionRiesgosRegeditComponent, {
      width: '1150px',
      maxWidth: '95vw',
      panelClass: 'custom-large-dialog',
      disableClose: true,
      data: {
        Title: 'Editar Riesgo Declarado',
        Accion: 'U',
        Datos: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.riesgos.findIndex(r => r.id === item.id);
        if (index !== -1) {
          this.riesgos[index] = {
            id: item.id,
            ...result
          };
          this.guardarEnStorage();
          this.actualizarContadores();
          this.onBuscar();
          this.toastr.success('Riesgo declarado actualizado.', 'Actualizado');
        }
      }
    });
  }

  onDelete(item: RiesgoItem): void {
    if (confirm(`¿Está seguro de eliminar el riesgo con código "${item.codigo}"?`)) {
      this.riesgos = this.riesgos.filter(r => r.id !== item.id);
      this.guardarEnStorage();
      this.actualizarContadores();
      this.onBuscar();
      this.toastr.warning(`Riesgo "${item.codigo}" eliminado.`, 'Eliminado');
    }
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '--';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
  }

  getEstadoClass(est: string): string {
    switch ((est || '').toLowerCase()) {
      case 'controlado':
        return 'status-green';
      case 'en seguimiento':
        return 'status-amber';
      default:
        return 'status-red';
    }
  }
}
