import { Component, OnInit } from '@angular/core';

export interface PermisoDetalle {
  permiso: string;
  estado: string;
}

export interface PuestoPermiso {
  nombre: string;
  auditorias: PermisoDetalle[];
  ayuda: PermisoDetalle[];
}

@Component({
  selector: 'app-mapa-permisos',
  standalone: false,
  templateUrl: './mapa-permisos.component.html',
  styleUrls: ['./mapa-permisos.component.css']
})
export class MapaPermisosComponent implements OnInit {

  puestos: PuestoPermiso[] = [
    {
      nombre: 'Acabado e inspección',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Lectura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Lectura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Escritura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Escritura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Escritura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Escritura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Escritura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Escritura' }
      ]
    },
    {
      nombre: 'Analista de Ingenieria',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Lectura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Lectura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Lectura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Lectura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Lectura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Lectura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Lectura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Lectura' }
      ]
    },
    {
      nombre: 'Analista de certificaciones',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Escritura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Escritura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Escritura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Lectura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Escritura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Lectura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Escritura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Lectura' }
      ]
    },
    {
      nombre: 'Jefe de Exportaciones',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Lectura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Escritura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Escritura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Escritura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Escritura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Escritura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Escritura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Escritura' }
      ]
    },
    {
      nombre: 'Jefe SSOMA',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Escritura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Escritura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Escritura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Escritura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Escritura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Escritura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Escritura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Escritura' }
      ]
    },
    {
      nombre: 'Jefe de Soporte',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Escritura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Escritura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Escritura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Escritura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Escritura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Escritura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Escritura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Escritura' }
      ]
    },
    {
      nombre: 'Gerente de Gestión Humana',
      auditorias: [
        { permiso: 'Configuración de Auditorias', estado: 'Permiso de Lectura' },
        { permiso: 'Planificación de Auditorias', estado: 'Permiso de Lectura' }
      ],
      ayuda: [
        { permiso: 'Control de Versiones', estado: 'Permiso de Escritura' },
        { permiso: 'Espacio Consumido', estado: 'Permiso de Escritura' },
        { permiso: 'Idioma de la Aplicación', estado: 'Permiso de Escritura' },
        { permiso: 'Permiso API Sofidya', estado: 'Permiso de Escritura' },
        { permiso: 'VideoTutoriales', estado: 'Permiso de Escritura' },
        { permiso: 'Visor de Permisos por Puesto', estado: 'Permiso de Escritura' }
      ]
    }
  ];

  selectedPuesto!: PuestoPermiso;

  constructor() { }

  ngOnInit(): void {
    // Select the first puesto by default
    this.selectedPuesto = this.puestos[0];
  }

  onSelectPuesto(puesto: PuestoPermiso): void {
    this.selectedPuesto = puesto;
  }
}
