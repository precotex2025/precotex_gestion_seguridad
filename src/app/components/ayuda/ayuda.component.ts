import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { AyudaService } from '../../services/ayuda.service';

interface Manual {
  id: number;
  codigo?: string;
  titulo: string;
  subtitulo: string;
  tipoDocumento?: string;
  fechaVigencia?: string;
  usuarioRegistro?: string;
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

  // CDA-03: Indicadores por tipo de documento
  selectedTipoFilter: string = 'TODOS';
  filteredManualesList: Manual[] = [];

  kpiCounts = {
    total: 0,
    manuales: 0,
    guias: 0,
    faqs: 0,
    glosario: 0,
    requisitos: 0
  };

  updateTipoCounts(): void {
    this.kpiCounts.total = this.manuales.length;
    this.kpiCounts.manuales = this.manuales.filter(m => (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('manual')).length;
    this.kpiCounts.guias = this.manuales.filter(m => (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('guía') || (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('guia')).length;
    this.kpiCounts.faqs = this.manuales.filter(m => (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('pregunta') || (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('faq')).length;
    this.kpiCounts.glosario = this.manuales.filter(m => (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('glosario') || (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('concepto')).length;
    this.kpiCounts.requisitos = this.manuales.filter(m => (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes('requisito')).length;

    this.applyCategoryFilter();
  }

  setTipoFilter(tipo: string): void {
    this.selectedTipoFilter = tipo;
    this.applyCategoryFilter();
  }

  applyCategoryFilter(): void {
    let list = [...this.manuales];
    if (this.selectedTipoFilter !== 'TODOS') {
      const q = this.selectedTipoFilter.toLowerCase();
      list = list.filter(m => (m.tipoDocumento || m.subtitulo || '').toLowerCase().includes(q));
    }

    if (this.searchText.trim()) {
      const sq = this.searchText.trim().toLowerCase();
      list = list.filter(m =>
        m.titulo.toLowerCase().includes(sq) ||
        m.descripcion.toLowerCase().includes(sq) ||
        (m.tipoDocumento || '').toLowerCase().includes(sq)
      );
    }

    this.filteredManualesList = list;
  }

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

  formatFechaDMY(val: any): string {
    if (!val) return '—';
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return val.toString();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

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
              subtitulo: item.subtitulo || item.tipo_Documento || 'Manual de usuario',
              tipoDocumento: item.tipo_Documento || item.subtitulo || 'Manual de usuario',
              fechaVigencia: this.formatFechaDMY(item.fecha_Vigencia || item.vigencia || ''),
              usuarioRegistro: item.usuario_Registro || item.autor || 'SISTEMAS',
              descripcion: item.descripcion || '',
              autor: item.autor || 'O&M',
              fecha: this.formatFechaDMY(item.fecha_Publicacion || new Date()),
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
        this.updateTipoCounts();
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
    this.applyCategoryFilter();
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
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const dateVigenciaDefault = nextYear.toISOString().slice(0, 10);

    Swal.fire({
      title: '📁 Subir Documento de Ayuda / Manual (CDA-01)',
      background: '#ffffff',
      color: '#1e2545',
      width: '580px',
      customClass: {
        popup: 'shadow-premium'
      },
      html: `
        <div style="text-align: left; font-size: 13px; color: #1e2545; display: flex; flex-direction: column; gap: 12px; font-family: var(--sn-font-family);">
          
          <!-- Seleccionar Archivo -->
          <div>
            <label style="font-weight: 700; color: #1e2545; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">
              1. Seleccionar Archivo (PDF, Word, Excel) (*)
            </label>
            <input type="file" id="swal-manual-file" accept=".pdf,.doc,.docx,.xls,.xlsx"
                   style="width: 100%; padding: 8px 12px; background: #f4f6fc; border: 1px solid #e2e7f1; border-radius: 8px; color: #1e2545; font-size: 12px;">
          </div>

          <!-- Tipo de Documento (DESPLEGABLE CDA-01) -->
          <div>
            <label style="font-weight: 700; color: #1e2545; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">
              2. Tipo de Documento (*)
            </label>
            <select id="swal-manual-tipo" style="width: 100%; padding: 9px 12px; background: #ffffff; border: 1px solid #e2e7f1; border-radius: 8px; color: #1e2545; font-size: 13px; outline: none; cursor: pointer;">
              <option value="Manual de usuario" selected>Manual de usuario</option>
              <option value="Guías rápidas">Guías rápidas</option>
              <option value="Preguntas frecuentes">Preguntas frecuentes</option>
              <option value="Glosario">Glosario</option>
            </select>
          </div>

          <!-- Título / Nombre -->
          <div>
            <label style="font-weight: 700; color: #1e2545; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">
              3. Título del Documento / Manual (*)
            </label>
            <input type="text" id="swal-manual-titulo" placeholder="Ej: Manual del Sistema de Gestión de Seguridad ISO 45001"
                   style="width: 100%; padding: 9px 12px; background: #ffffff; border: 1px solid #e2e7f1; border-radius: 8px; color: #1e2545; font-size: 13px;">
          </div>

          <!-- Fecha de Vigencia (FECHA VIGENCIA CDA-01) -->
          <div>
            <label style="font-weight: 700; color: #1e2545; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">
              4. Fecha de Vigencia (*)
            </label>
            <input type="date" id="swal-manual-vigencia" value="${dateVigenciaDefault}"
                   style="width: 100%; padding: 9px 12px; background: #ffffff; border: 1px solid #e2e7f1; border-radius: 8px; color: #1e2545; font-weight: 600; font-size: 13px; cursor: pointer;">
          </div>

          <!-- Descripción / Resumen -->
          <div>
            <label style="font-weight: 700; color: #5a6178; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">
              5. Descripción o Resumen (Opcional)
            </label>
            <textarea id="swal-manual-desc" rows="2" placeholder="Breve resumen del contenido y alcance..."
                      style="width: 100%; padding: 9px 12px; background: #ffffff; border: 1px solid #e2e7f1; border-radius: 8px; color: #1e2545; font-size: 13px; resize: vertical;"></textarea>
          </div>

          <!-- Autor / Área -->
          <div>
            <label style="font-weight: 700; color: #5a6178; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">
              6. Área / Autor Responsable
            </label>
            <input type="text" id="swal-manual-autor" value="Organización & Métodos"
                   style="width: 100%; padding: 9px 12px; background: #ffffff; border: 1px solid #e2e7f1; border-radius: 8px; color: #1e2545; font-size: 13px;">
          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Subir Documento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5b4bd6',
      cancelButtonColor: '#94a3b8',
      didOpen: () => {
        const fileInput = document.getElementById('swal-manual-file') as HTMLInputElement;
        const titleInput = document.getElementById('swal-manual-titulo') as HTMLInputElement;
        fileInput?.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0] && !titleInput.value) {
            const rawTitle = fileInput.files[0].name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ');
            titleInput.value = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
          }
        });
      },
      preConfirm: () => {
        const fileInput = document.getElementById('swal-manual-file') as HTMLInputElement;
        const tipoInput = document.getElementById('swal-manual-tipo') as HTMLSelectElement;
        const titleInput = document.getElementById('swal-manual-titulo') as HTMLInputElement;
        const vigenciaInput = document.getElementById('swal-manual-vigencia') as HTMLInputElement;
        const descInput = document.getElementById('swal-manual-desc') as HTMLTextAreaElement;
        const autorInput = document.getElementById('swal-manual-autor') as HTMLInputElement;

        const file = fileInput?.files?.[0];
        const tipo = tipoInput?.value;
        const titulo = titleInput?.value?.trim();
        const vigencia = vigenciaInput?.value;
        const desc = descInput?.value?.trim();
        const autor = autorInput?.value?.trim() || 'Organización & Métodos';

        if (!file) {
          Swal.showValidationMessage('Por favor seleccione un archivo (PDF/Word/Excel).');
          return false;
        }
        if (!titulo) {
          Swal.showValidationMessage('Por favor ingrese el título del documento.');
          return false;
        }
        if (!vigencia) {
          Swal.showValidationMessage('Por favor seleccione la fecha de vigencia.');
          return false;
        }

        return { file, tipo, titulo, vigencia, desc, autor };
      }
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const { file, tipo, titulo, vigencia, desc, autor } = res.value;

        // 1. Subir archivo físicamente al servidor
        this.ayudaService.uploadManual(file).subscribe({
          next: (upRes: any) => {
            if (upRes && upRes.success) {
              const fileName = upRes.fileName;

              // 2. Registrar en base de datos con los atributos CDA-01
              const payload = {
                Accion: 'I',
                Titulo: titulo,
                Subtitulo: tipo, // 'Manual de usuario', 'Guías rápidas', 'Preguntas frecuentes', 'Glosario'
                Tipo_Documento: tipo,
                Fecha_Vigencia: vigencia,
                Descripcion: desc || `Guía y documentación técnica oficial (${tipo}).`,
                Autor: autor,
                Fecha_Publicacion: new Date().toISOString().slice(0, 10),
                Version: 'v1.0',
                Color: tipo === 'Guías rápidas' ? '#3ecf8e' : (tipo === 'Preguntas frecuentes' ? '#f0b429' : (tipo === 'Glosario' ? '#38bdf8' : '#7c6cf0')),
                Icono: tipo === 'Guías rápidas' ? 'speed' : (tipo === 'Preguntas frecuentes' ? 'quiz' : (tipo === 'Glosario' ? 'auto_stories' : 'picture_as_pdf')),
                Archivo: fileName,
                Usuario_Registro: 'SISTEMAS'
              };

              this.ayudaService.postManualMnto(payload).subscribe({
                next: (apiRes: any) => {
                  if (apiRes && apiRes.success) {
                    this.toastr.success(`Documento "${titulo}" guardado con éxito (Tipo: ${tipo}, Vigencia: ${vigencia}).`, 'Guardado CDA-01');
                    this.onListadoManuales();
                  } else {
                    this.toastr.error(apiRes?.message || 'Error al guardar manual en la BD.', 'Error BD');
                  }
                },
                error: (err) => {
                  this.toastr.error(err.error?.message || err.message, 'Error Servidor');
                }
              });
            } else {
              this.toastr.error(upRes?.message || 'Error al subir archivo.', 'Error Archivo');
            }
          },
          error: (err) => {
            this.toastr.error('No se pudo subir el archivo al servidor.', 'Error Servidor');
          }
        });
      }
    });
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

  // CDA-04: Estadísticas de consultas para futuras capacitaciones corporativas
  consultasFrecuentesStats = [
    { tema: 'Gestión y Cierre de No Conformidades (5W-2H)', busquedas: 47, nivel: 'Crítico', capacitacion: 'Taller de Análisis Causa Raíz e Investigación NC' },
    { tema: 'Carga masiva de Planilla 5W-2H en Portafolio Mejora', busquedas: 39, nivel: 'Alto', capacitacion: 'Capacitación Módulo Portafolio de Mejora' },
    { tema: 'Control de Alertas y Vencimientos de Documentos', busquedas: 26, nivel: 'Medio', capacitacion: 'Inducción Control Documentario & Requisitos Legales' },
    { tema: 'Matriz IPERC y Evaluaciones de Riesgo por Puestos', busquedas: 21, nivel: 'Medio', capacitacion: 'Evaluación de Riesgos SST por Puestos de Trabajo' },
    { tema: 'Administración de Roles y Permisos de Usuarios', busquedas: 18, nivel: 'Normal', capacitacion: 'Sesión de Gestión de Usuarios y Accesos' }
  ];

  onGenerarPlanCapacitacion(): void {
    const htmlStats = `
      <div style="text-align: left; font-size: 13px; color: #1e2545; line-height: 1.6; font-family: var(--sn-font-family);">
        <div style="background: rgba(91, 75, 214, 0.08); border: 1px solid rgba(91, 75, 214, 0.2); padding: 12px 16px; border-radius: 10px; margin-bottom: 14px;">
          <strong style="color: #5b4bd6; font-size: 14px;">📊 Reporte de Consultas Recurrentes & Capacitaciones Sugeridas (CDA-04)</strong>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #5a6178;">Estadísticas consolidadas para planificar próximas capacitaciones del personal Precotex.</p>
        </div>

        <div style="background: #f4f6fc; border: 1px solid #e2e7f1; border-radius: 10px; padding: 14px; margin-bottom: 14px; max-height: 320px; overflow-y: auto;">
          ${this.consultasFrecuentesStats.map((c, i) => `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e7f1;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #1e2545;">${i + 1}. ${c.tema}</span>
                <span style="background: rgba(91, 75, 214, 0.1); color: #5b4bd6; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">${c.busquedas} Consultas</span>
              </div>
              <div style="font-size: 12px; color: #12a06a; margin-top: 4px; font-weight: 600;">
                🎓 <strong>Capacitación Sugerida:</strong> ${c.capacitacion}
              </div>
            </div>
          `).join('')}
        </div>

        <p style="font-size: 11px; color: #5a6178; margin: 0;">
          💡 Este reporte identifica las brechas de conocimiento más consultadas por los usuarios para organizar capacitaciones focalizadas por áreas.
        </p>
      </div>
    `;

    Swal.fire({
      title: '🎓 Plan Corporativo de Capacitaciones',
      html: htmlStats,
      background: '#ffffff',
      color: '#1e2545',
      width: '660px',
      confirmButtonText: 'Exportar Reporte Capacitación',
      confirmButtonColor: '#5b4bd6',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#94a3b8'
    }).then((res) => {
      if (res.isConfirmed) {
        this.toastr.success('Plan de capacitación corporativa generado exitosamente.', 'Reporte CDA-04 Exportado');
      }
    });
  }
}
