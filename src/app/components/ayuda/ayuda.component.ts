import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AyudaService } from '../../services/ayuda.service';

interface Manual {
  id: number;
  codigo?: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  autor: string;
  fecha: string;
  version: string;
  color: string;
  icono: string;
  archivo?: string;
  descargas: number;
}

interface Faq {
  id: number;
  pregunta: string;
  respuesta: string;
}

@Component({
  selector: 'app-ayuda',
  standalone: false,
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.css']
})
export class AyudaComponent implements OnInit {
  searchText: string = '';
  manuales: Manual[] = [];

  faqs: Faq[] = [
    {
      id: 1,
      pregunta: '¿Quién puede registrar una No Conformidad?',
      respuesta: 'Según la política, Jefaturas y Gerencia registran NC de su proceso; Certificaciones emite las NC formales. El código (NC-INT-AAAA-NNN) se genera automáticamente.'
    },
    {
      id: 2,
      pregunta: '¿Cómo subo mi 5W-2H al Portafolio?',
      respuesta: 'Ve a Portafolio de Mejora → "Registrar iniciativa" → selecciona sede, proceso y herramienta 5W-2H → sube el archivo Excel oficial.'
    },
    {
      id: 3,
      pregunta: '¿Por qué el botón "Verificar cierre" está bloqueado?',
      respuesta: 'Porque la NC aún no tiene acciones correctivas completadas. Registra las acciones en el módulo de Acciones correctivas primero.'
    },
    {
      id: 4,
      pregunta: '¿Qué significa que un documento esté "Por vencer"?',
      respuesta: 'Su fecha de vigencia vence en menos de 30 días. El responsable recibirá una alerta para actualizarlo antes de que quede obsoleto.'
    },
    {
      id: 5,
      pregunta: '¿Cómo cambio los permisos de un usuario?',
      respuesta: 'En Puestos → Permisos por módulo puedes ajustar el acceso por módulo, y el detalle por contenido y acción de cada persona.'
    }
  ];

  filteredFaqs: Faq[] = [];
  manualesDescargados: any[] = [];

  preguntasBuscadas = [
    { pregunta: '¿Cómo cierro una NC?', busquedas: 47 },
    { pregunta: '¿Cómo subo mi 5W-2H?', busquedas: 39 },
    { pregunta: '¿Qué significa "Por vencer"?', busquedas: 26 }
  ];

  constructor(
    private toastr: ToastrService,
    private ayudaService: AyudaService
  ) {}

  ngOnInit(): void {
    this.filteredFaqs = [...this.faqs];
    this.onListadoManuales();
  }

  onListadoManuales(): void {
    this.ayudaService.getListadoManuales().subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          this.manuales = res.elements.map((item: any) => ({
            id: item.id_Manual,
            codigo: item.codigo,
            titulo: item.titulo,
            subtitulo: item.subtitulo || 'Guía de Usuario',
            descripcion: item.descripcion || '',
            autor: item.autor || 'O&M',
            fecha: item.fecha_Publicacion || 'Julio 2025',
            version: item.version || 'v1.0',
            color: item.color || '#7c6cf0',
            icono: item.icono || 'menu_book',
            archivo: item.archivo || '',
            descargas: item.descargas || 0
          }));
        } else {
          this.manuales = [];
        }
        this.updateStatsDescargas();
      },
      error: (err) => {
        console.error('Error al cargar manuales desde BD:', err);
        this.toastr.error('Error al cargar manuales desde la base de datos.', 'Error BD');
      }
    });
  }

  updateStatsDescargas(): void {
    if (!this.manuales || this.manuales.length === 0) {
      this.manualesDescargados = [];
      return;
    }

    const sorted = [...this.manuales].sort((a, b) => b.descargas - a.descargas);
    const maxVal = Math.max(...sorted.map(m => m.descargas), 1);

    this.manualesDescargados = sorted.slice(0, 4).map(m => ({
      nombre: m.titulo,
      cantidad: m.descargas,
      max: maxVal,
      color: m.color
    }));
  }

  onSearchChange(): void {
    const q = this.searchText.trim().toLowerCase();
    if (!q) {
      this.filteredFaqs = [...this.faqs];
      return;
    }
    this.filteredFaqs = this.faqs.filter(f =>
      f.pregunta.toLowerCase().includes(q) ||
      f.respuesta.toLowerCase().includes(q)
    );
  }

  onDescargarManual(m: Manual): void {
    // Incrementar contador en BD SQL Server
    const payload = {
      Accion: 'INC',
      Id_Manual: m.id,
      Codigo: m.codigo,
      Archivo: m.archivo
    };

    this.ayudaService.postManualMnto(payload).subscribe({
      next: () => {
        m.descargas = (m.descargas || 0) + 1;
        this.updateStatsDescargas();
      }
    });

    if (m.archivo) {
      const downloadUrl = this.ayudaService.getDownloadUrl(m.archivo);
      window.open(downloadUrl, '_blank');
      this.toastr.info(`Descargando manual: ${m.titulo}`, 'Descarga BD');
    } else {
      this.toastr.info(`Descarga de muestra para ${m.titulo}`, 'Simulación');
    }
  }

  onSubirManual(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const rawTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ');
      const titleClean = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      // 1. Subir archivo PDF físicamente al servidor
      this.ayudaService.uploadManual(file).subscribe({
        next: (upRes: any) => {
          if (upRes && upRes.success) {
            const fileName = upRes.fileName;

            // 2. Registrar manual en la base de datos SQL Server
            const payload = {
              Accion: 'I',
              Titulo: titleClean,
              Subtitulo: 'Manual de Usuario · O&M',
              Descripcion: `Guía y documentación técnica oficial de ${titleClean}.`,
              Autor: 'Organización y Métodos',
              Fecha_Publicacion: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
              Version: 'v1.0',
              Color: '#7c6cf0',
              Icono: 'picture_as_pdf',
              Archivo: fileName,
              Usuario_Registro: 'SISTEMAS'
            };

            this.ayudaService.postManualMnto(payload).subscribe({
              next: (apiRes: any) => {
                if (apiRes && apiRes.success) {
                  this.toastr.success(`Manual "${titleClean}" subido y guardado en la BD.`, 'Guardado en BD');
                  this.onListadoManuales();
                } else {
                  this.toastr.error(apiRes?.message || 'Error al guardar manual en BD.', 'Error BD');
                }
              },
              error: (err) => {
                this.toastr.error(err.error?.message || err.message, 'Error Servidor');
              }
            });
          } else {
            this.toastr.error(upRes?.message || 'Error al subir archivo PDF.', 'Error Archivo');
          }
        },
        error: (err) => {
          this.toastr.error('No se pudo subir el archivo PDF al servidor.', 'Error Servidor');
        }
      });
    };
    input.click();
  }

  onContactarOyM(): void {
    window.location.href = 'mailto:organizacionymetodos@precotex.pe?subject=Consulta%20Portal%20SIG%20Precotex';
  }

  onReportarSistemas(): void {
    this.toastr.success('Reporte enviado a Soporte de Sistemas.', 'Ticket Generado');
  }
}
