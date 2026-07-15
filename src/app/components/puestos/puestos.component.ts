import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-puestos',
  standalone: false,
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit {
  formulario!: FormGroup;
  showForm: boolean = false;
  isEditing: boolean = false;
  editingId: string | null = null;
  puestosList: any[] = [];
  searchText: string = '';

  stats = { total: 0, activo: 0, sinConfig: 0 };

  displayedColumns: string[] = [
    'puesto',
    'proceso',
    'usuario',
    'nivel',
    'permisos',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  procesosGroups = {
    'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
    'Auditoría Interna (AIO)': ['Auditoría Interna'],
    'Control Patrimonial (CPT)': ['Control Patrimonial'],
    'Ingeniería y Mejora Continua (IMC)': ['Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
    'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
    'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitaciones y Desarrollo', 'Comunicaciones', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
    'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
    'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Consumos'],
    'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Aseguramiento de Calidad Textil', 'Lavandería'],
    'Balance de Materia (BM)': ['Balance de Materia'],
    'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
    'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
    'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas'],
    'Gerencia General (GG)': ['Comercial Exportación de Telas', 'Comercial Venta Local Textil', 'Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
  };

  accesosList = [
    { n: 'Carlos Ríos', rol: 'Ger. Producción', acc: 'editó documento', t: 'hoy 09:14', c: 'blue' },
    { n: 'Ana Torres', rol: 'Jefe SSOMA', acc: 'leyó doc. seguridad', t: 'hoy 08:52', c: 'green' },
    { n: 'Rosa Chávez', rol: 'Coord. Logística', acc: 'inicio de sesión', t: 'hoy 08:30', c: 'amber' },
    { n: 'Luis Mamani', rol: 'Sup. Calidad', acc: 'descargó reporte', t: 'ayer 17:44', c: 'violet' },
    { n: 'Pedro Salas', rol: 'Analista Riesgos', acc: 'modificó matriz', t: 'ayer 16:10', c: 'blue' },
    { n: 'Ana Torres', rol: 'Jefe SSOMA', acc: 'inicio de sesión', t: 'ayer 08:05', c: 'green' }
  ];

  actividadList = [
    { n: 'Carlos Ríos', count: 24, percent: 100, c: 'green' },
    { n: 'Ana Torres', count: 18, percent: 75, c: 'blue' },
    { n: 'Pedro Salas', count: 15, percent: 62, c: 'purple' },
    { n: 'Luis Mamani', count: 9, percent: 37, c: 'amber' },
    { n: 'Rosa Chávez', count: 4, percent: 16, c: 'red' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      ctrol_puesto: ['', Validators.required],
      ctrol_proceso: ['', Validators.required],
      ctrol_usuario: [''],
      ctrol_nivel: ['Operativo', Validators.required],
      ctrol_permisos: ['Lectura', Validators.required],
      ctrol_estado: ['Activo', Validators.required]
    });

    this.onListado();
  }

  onListado() {
    try {
      const localData = localStorage.getItem('precotex_puestos_usuarios');
      if (localData) {
        this.puestosList = JSON.parse(localData);
      } else {
        // Seed default mock items
        this.puestosList = [
          {
            id: 'p-1',
            puesto: 'Gerente de Producción',
            proceso: 'Corte',
            usuario: 'Carlos Ríos',
            nivel: 'Gerencial',
            permisos: 'Lectura + descarga + modificar',
            estado: 'Activo'
          },
          {
            id: 'p-2',
            puesto: 'Jefe de SSOMA',
            proceso: 'SSOMA',
            usuario: 'Ana Torres',
            nivel: 'Jefatura',
            permisos: 'Lectura + descarga + modificar',
            estado: 'Activo'
          },
          {
            id: 'p-3',
            puesto: 'Asistente de Costura',
            proceso: 'Costura',
            usuario: '',
            nivel: 'Operativo',
            permisos: 'Lectura',
            estado: 'Sin permisos config.'
          }
        ];
        localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
      }

      // Calculate stats based on full list
      this.stats.total = this.puestosList.length;
      this.stats.activo = this.puestosList.filter(p => p.estado === 'Activo').length;
      this.stats.sinConfig = this.puestosList.filter(p => p.estado === 'Sin permisos config.').length;

      // Filter list for table source
      let filtered = [...this.puestosList];
      if (this.searchText.trim()) {
        const query = this.searchText.toLowerCase();
        filtered = filtered.filter(p => 
          p.puesto.toLowerCase().includes(query) ||
          p.proceso.toLowerCase().includes(query) ||
          (p.usuario && p.usuario.toLowerCase().includes(query)) ||
          p.nivel.toLowerCase().includes(query) ||
          p.permisos.toLowerCase().includes(query) ||
          p.estado.toLowerCase().includes(query)
        );
      }

      this.dataSource.data = filtered;

    } catch (e) {
      this.toastr.error('Error al cargar la información.', '', { timeOut: 2500 });
    }
  }

  getProcesosKeys() {
    return Object.keys(this.procesosGroups) as Array<keyof typeof this.procesosGroups>;
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.onListado();
  }

  onAgregar() {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.formulario.reset({
      ctrol_puesto: '',
      ctrol_proceso: '',
      ctrol_usuario: '',
      ctrol_nivel: 'Operativo',
      ctrol_permisos: 'Lectura',
      ctrol_estado: 'Activo'
    });
  }

  onCancelar() {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
  }

  onEditar(item: any) {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = item.id;
    this.formulario.setValue({
      ctrol_puesto: item.puesto,
      ctrol_proceso: item.proceso,
      ctrol_usuario: item.usuario || '',
      ctrol_nivel: item.nivel,
      ctrol_permisos: item.permisos,
      ctrol_estado: item.estado
    });
  }

  onGuardar() {
    if (this.formulario.invalid) {
      this.toastr.warning('Por favor llene todos los campos obligatorios.', '', { timeOut: 2000 });
      return;
    }

    const puesto = this.formulario.get('ctrol_puesto')?.value || '';
    const proceso = this.formulario.get('ctrol_proceso')?.value || '';
    const usuario = this.formulario.get('ctrol_usuario')?.value || '';
    const nivel = this.formulario.get('ctrol_nivel')?.value || '';
    const permisos = this.formulario.get('ctrol_permisos')?.value || '';
    const estado = this.formulario.get('ctrol_estado')?.value || '';

    try {
      if (this.isEditing && this.editingId) {
        const idx = this.puestosList.findIndex(p => p.id === this.editingId);
        if (idx !== -1) {
          this.puestosList[idx] = {
            ...this.puestosList[idx],
            puesto: puesto.trim(),
            proceso,
            usuario: usuario.trim(),
            nivel,
            permisos,
            estado
          };
        }
      } else {
        const newItem = {
          id: 'p-' + Date.now(),
          puesto: puesto.trim(),
          proceso,
          usuario: usuario.trim(),
          nivel,
          permisos,
          estado
        };
        this.puestosList.push(newItem);
      }

      localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
      this.onListado();

      this.toastr.success(`Registro ${this.isEditing ? 'actualizado' : 'guardado'} correctamente.`, '', {
        timeOut: 2000
      });

      this.onCancelar();

    } catch (e) {
      this.toastr.error('Error al guardar datos.', '', { timeOut: 2000 });
    }
  }

  onEliminar(item: any) {
    Swal.fire({
      title: '¿Desea eliminar el registro?, Confirme',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          this.puestosList = this.puestosList.filter(p => p.id !== item.id);
          localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(this.puestosList));
          this.onListado();
          this.toastr.success('Registro eliminado correctamente.', '', { timeOut: 2000 });
        } catch (e) {
          this.toastr.error('Error al eliminar el registro.', '', { timeOut: 2000 });
        }
      }
    });
  }

  initials(n: string): string {
    const p = (n || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] || '?').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase();
  }
}
