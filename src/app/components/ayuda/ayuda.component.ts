import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
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
  flg_Activo?: boolean;
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
  expandedFaqs: { [id: number]: boolean } = {};

  toggleFaq(id: number): void {
    this.expandedFaqs[id] = !this.expandedFaqs[id];
  }

  isFaqExpanded(id: number): boolean {
    return !!this.expandedFaqs[id];
  }

  faqs: Faq[] = [
    {
      id: 1,
      pregunta: '¿Cómo se alinean las No Conformidades a la norma ISO 9001:2015?',
      respuesta: 'Según la cláusula 10.2 de ISO 9001:2015, ante una no conformidad, la organización debe evaluar la causa raíz mediante 5W-2H e implementar acciones correctivas verificables para evitar su recurrencia.'
    },
    {
      id: 2,
      pregunta: '¿Cuál es el rol de los Comités de Seguridad según la ISO 45001:2018?',
      respuesta: 'La norma ISO 45001 exige la participación activa de los trabajadores y sus representantes en la consulta y evaluación de riesgos de SST, coordinando directamente con el área SSOMA Precotex.'
    },
    {
      id: 3,
      pregunta: '¿Cómo se gestiona el control de Aspectos e Impactos Ambientales ISO 14001:2015?',
      respuesta: 'En el módulo de Documentos Controlados y Gestión Ambiental se registran los procedimientos operativos para el manejo de residuos textiles, efluentes y consumo responsable de energía.'
    },
    {
      id: 4,
      pregunta: '¿Qué significa que un documento esté "Por vencer"?',
      respuesta: 'Significa que su vigencia vence en menos de 60 días. El responsable del proceso recibirá una alerta para su revisión y actualización semestral.'
    },
    {
      id: 5,
      pregunta: '¿Cómo se solicitan nuevos permisos por Puesto?',
      respuesta: 'Los Jefes de Área pueden generar una solicitud en Puestos → Permisos por Módulo o enviar un Ticket Rápido a Soporte O&M.'
    }
  ];

  // AYU-03: Generación de ticket rápido de soporte
  ticketAsunto: string = '';
  ticketDescripcion: string = '';
  ticketPrioridad: string = 'Normal';

  onEnviarTicketRapido(): void {
    if (!this.ticketAsunto.trim() || !this.ticketDescripcion.trim()) {
      this.toastr.warning('Por favor ingrese el asunto y la descripción del problema.', 'Campos Requeridos');
      return;
    }

    const numTicket = 'TICK-' + Math.floor(100000 + Math.random() * 900000);
    const htmlConfirm = `
      <div style="text-align: left; font-size: 13px; line-height: 1.6;">
        <p style="color: #4ade80; font-weight: bold;">Ticket generado exitosamente: ${numTicket}</p>
        <p><strong>Asunto:</strong> ${this.ticketAsunto}</p>
        <p><strong>Prioridad:</strong> ${this.ticketPrioridad}</p>
        <p style="color: #94a3b8; font-size: 12px;">Se ha notificado al equipo de Organización & Métodos y Soporte Sistemas. Recibirás respuesta a tu correo corporativo.</p>
      </div>
    `;

    Swal.fire({
      title: '🎟️ Ticket Registrado (AYU-03)',
      html: htmlConfirm,
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });

    this.ticketAsunto = '';
    this.ticketDescripcion = '';
    this.toastr.success(`Ticket ${numTicket} enviado a Soporte O&M.`, 'Ticket Rápido');
  }

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
          this.manuales = res.elements
            .filter((item: any) => item.flg_Activo !== false && item.flg_Activo !== 0)
            .map((item: any) => ({
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
              descargas: item.descargas || 0,
              flg_Activo: item.flg_Activo
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

  onEliminarManual(m: Manual): void {
    if (confirm(`¿Está seguro de que desea eliminar el manual "${m.titulo}"?`)) {
      const payload = {
        Accion: 'D',
        Id_Manual: m.id
      };

      this.ayudaService.postManualMnto(payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            this.toastr.success(`Manual "${m.titulo}" eliminado correctamente.`, 'Eliminado');
            this.onListadoManuales();
          } else {
            this.toastr.error(res?.message || 'No se pudo eliminar el manual.', 'Error');
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Ocurrió un error al intentar eliminar el manual.', 'Error');
        }
      });
    }
  }

  onContactarOyM(): void {
    const email = 'privera@precotexperu.com';
    const subject = encodeURIComponent('Consulta Portal SIG Precotex');
    window.location.href = `mailto:${email}?subject=${subject}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        this.toastr.success('Abriendo Outlook. Correo copiado al portapapeles: ' + email, 'Contacto O&M');
      }).catch(() => {
        this.toastr.info('Abriendo Outlook para enviar correo a: ' + email, 'Contacto O&M');
      });
    } else {
      this.toastr.info('Abriendo Outlook para enviar correo a: ' + email, 'Contacto O&M');
    }
  }

  onReportarSistemas(): void {
  const email = 'fhuamani@precotexperu.com';
    const subject = encodeURIComponent('Reportar un problema');
    window.location.href = `mailto:${email}?subject=${subject}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        this.toastr.success('Abriendo Outlook. Correo copiado al portapapeles: ' + email, 'Contacto Sitemas');
      }).catch(() => {
        this.toastr.info('Abriendo Outlook para enviar correo a: ' + email, 'Contacto Sistemas');
      });
    } else {
      this.toastr.info('Abriendo Outlook para enviar correo a: ' + email, 'Contacto Sistemas');
    }
  }
}
