import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { AyudaService } from '../../services/ayuda.service';
import { GlobalVariable } from '../../VarGlobals';

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
  get sUsuario(): string {
    return (
      GlobalVariable.vusu ||
      (typeof localStorage !== 'undefined' ? (localStorage.getItem('vusu') || localStorage.getItem('precotex:usuario:nombre')) : '') ||
      'admin'
    ).trim();
  }
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
  ) { }

  formatFechaDMY(val: any): string {
    if (!val || val === '—' || val === 'undefined') return '—';
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
            .map((item: any) => {
              let rawVersion = item.version || 'v1.0';
              let rawVigencia = item.fecha_Vigencia || item.vigencia || '';
              if (rawVersion.includes('|')) {
                const parts = rawVersion.split('|');
                rawVersion = parts[0] || 'v1.0';
                if (!rawVigencia && parts[1]) {
                  rawVigencia = parts[1];
                }
              }

              return {
                id: item.id_Manual,
                codigo: item.codigo,
                titulo: item.titulo,
                subtitulo: item.subtitulo || item.tipo_Documento || 'Manual de usuario',
                tipoDocumento: item.tipo_Documento || item.subtitulo || 'Manual de usuario',
                fechaVigencia: this.formatFechaDMY(rawVigencia),
                usuarioRegistro: item.usuario_Registro || item.autor || 'SISTEMAS',
                descripcion: item.descripcion || '',
                autor: item.autor || 'O&M',
                fecha: this.formatFechaDMY(item.fecha_Publicacion || new Date()),
                version: rawVersion,
                color: item.color || '#7c6cf0',
                icono: item.icono || 'menu_book',
                archivo: item.archivo || '',
                descargas: item.descargas || 0,
                flg_Activo: item.flg_Activo
              };
            });
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
    // CDA-05: Si no se tiene registrado un archivo para el manual, advertir amigablemente
    if (!m.archivo || !m.archivo.trim()) {
      Swal.fire({
        title: 'Documento no registrado',
        html: `Actualmente <strong>no se tiene registrado ningún documento</strong> para el manual <em>"${m.titulo}"</em>.<br><br><span style="font-size:12px;color:#64748b;">Puede adjuntar el documento oficial utilizando el botón <strong>"Subir manual"</strong>.</span>`,
        icon: 'info',
        confirmButtonColor: '#7c6cf0',
        confirmButtonText: 'Entendido'
      });
      this.toastr.warning('No se tiene registrado ningún documento para este manual.', 'Documento no disponible');
      return;
    }

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

    this.toastr.info(`Preparando descarga de "${m.titulo}"...`, 'Centro de Ayuda', { timeOut: 2000 });

    this.ayudaService.downloadManualBlob(m.archivo).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = m.archivo || `${m.titulo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastr.success(`Documento "${m.titulo}" descargado correctamente.`, 'Descarga Exitosa');
      },
      error: (err) => {
        console.warn('Error al descargar documento:', err);
        Swal.fire({
          title: 'Documento no registrado',
          html: `Actualmente <strong>no se tiene registrado ningún documento</strong> en el servidor para el manual <em>"${m.titulo}"</em>.<br><br><span style="font-size:12px;color:#64748b;">Por favor comuníquese con el área de Organización & Métodos o suba el archivo mediante <strong>"Subir manual"</strong>.</span>`,
          icon: 'warning',
          confirmButtonColor: '#7c6cf0',
          confirmButtonText: 'Aceptar'
        });
        this.toastr.warning('No se tiene registrado ningún documento en el servidor para este manual.', 'Documento no disponible');
      }
    });
  }

  onSubirManual(): void {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const dateVigenciaDefault = nextYear.toISOString().slice(0, 10);
    const usuarioActual = this.sUsuario;

    Swal.fire({
      width: '660px',
      background: '#ffffff',
      showCloseButton: true,
      customClass: {
        popup: 'custom-swal-ayuda-subir',
        confirmButton: 'swal-ayuda-btn-confirm',
        cancelButton: 'swal-ayuda-btn-cancel'
      },
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: `
        <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span>Subir Documento</span>
      `,
      cancelButtonText: 'Cancelar',
      html: `
        <div class="ayuda-modal-header">
          <div class="ayuda-modal-header-left">
            <div class="ayuda-modal-icon-badge">
              <svg style="width:24px;height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <div>
              <h3 class="ayuda-modal-title">Subir Documento de Ayuda / Manual</h3>
              <p class="ayuda-modal-subtitle">Centro de Ayuda • Publicación Oficial SIG Precotex</p>
            </div>
          </div>
          <div class="ayuda-modal-header-right">
            <span class="ayuda-modal-badge">CDA-01</span>
          </div>
        </div>

        <div>
          <!-- Input oculto de archivo -->
          <input type="file" id="swal-manual-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display: none;">

          <!-- Zona Drag & Drop -->
          <div id="swal-manual-dropzone" class="ayuda-dropzone-container">
            <div class="ayuda-dropzone-icon">
              <svg style="width:24px;height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div class="ayuda-dropzone-title">Seleccionar o arrastrar archivo aquí <span class="ayuda-label-required">*</span></div>
            <div class="ayuda-dropzone-sub">Haz clic para buscar en tu equipo o suelta el documento en esta área</div>
            <div class="ayuda-dropzone-pills">
              <span class="ayuda-dropzone-pill">PDF (.pdf)</span>
              <span class="ayuda-dropzone-pill">Word (.docx)</span>
              <span class="ayuda-dropzone-pill">Excel (.xlsx)</span>
              <span class="ayuda-dropzone-pill">Hasta 50 MB</span>
            </div>
          </div>

          <!-- Card de Archivo Seleccionado (Oculto inicialmente) -->
          <div id="swal-manual-file-preview" class="ayuda-file-preview-card" style="display: none;">
            <div class="ayuda-file-preview-left">
              <div class="ayuda-file-preview-icon">
                <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </div>
              <div>
                <div id="swal-manual-file-name" class="ayuda-file-preview-name">archivo.pdf</div>
                <div id="swal-manual-file-size" class="ayuda-file-preview-size">0 KB</div>
              </div>
            </div>
            <button type="button" id="swal-manual-btn-change" class="ayuda-file-preview-btn-change">
              Cambiar archivo
            </button>
          </div>

          <!-- Fila 1: Tipo de Documento y Fecha de Vigencia -->
          <div class="ayuda-form-grid-2">
            <div class="ayuda-form-group mb-0">
              <label class="ayuda-label" for="swal-manual-tipo">
                <svg style="width:14px;height:14px;color:#6366f1;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>Tipo de Documento <span class="ayuda-label-required">*</span></span>
              </label>
              <select id="swal-manual-tipo" class="ayuda-select">
                <option value="Manual de usuario" selected>Manual de usuario</option>
                <option value="Guías rápidas">Guías rápidas</option>
                <option value="Preguntas frecuentes">Preguntas frecuentes</option>
                <option value="Glosario">Glosario</option>
              </select>
            </div>

            <div class="ayuda-form-group mb-0">
              <label class="ayuda-label" for="swal-manual-vigencia">
                <svg style="width:14px;height:14px;color:#6366f1;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Fecha de Vigencia <span class="ayuda-label-required">*</span></span>
              </label>
              <input type="date" id="swal-manual-vigencia" value="${dateVigenciaDefault}" class="ayuda-input">
            </div>
          </div>

          <!-- Fila 2: Título del Documento -->
          <div class="ayuda-form-group">
            <label class="ayuda-label" for="swal-manual-titulo">
              <svg style="width:14px;height:14px;color:#6366f1;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="9" x2="20" y2="9"></line>
                <line x1="4" y1="15" x2="20" y2="15"></line>
                <line x1="10" y1="3" x2="8" y2="21"></line>
                <line x1="16" y1="3" x2="14" y2="21"></line>
              </svg>
              <span>Título del Documento / Manual <span class="ayuda-label-required">*</span></span>
            </label>
            <input type="text" id="swal-manual-titulo" placeholder="Ej: Manual del Sistema de Gestión de Seguridad ISO 45001" class="ayuda-input">
          </div>

          <!-- Fila 3: Descripción o Resumen -->
          <div class="ayuda-form-group">
            <label class="ayuda-label" for="swal-manual-desc">
              <svg style="width:14px;height:14px;color:#6366f1;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="7" y2="18"></line>
              </svg>
              <span>Descripción o Resumen (Opcional)</span>
            </label>
            <textarea id="swal-manual-desc" rows="2" placeholder="Breve resumen del contenido y alcance del documento..." class="ayuda-textarea"></textarea>
          </div>

          <!-- Fila 4: Área / Autor Responsable (NO EDITABLE / SOLO LECTURA) -->
          <div class="ayuda-form-group mb-0">
            <label class="ayuda-label" for="swal-manual-autor">
              <svg style="width:14px;height:14px;color:#6366f1;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Área / Autor Responsable</span>
            </label>
            <div class="ayuda-input-wrapper">
              <span class="ayuda-input-icon">
                <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </span>
              <input type="text" id="swal-manual-autor" value="${usuarioActual}" readonly tabindex="-1"
                     class="ayuda-input has-icon ayuda-input-readonly"
                     placeholder="Usuario responsable...">
              <span class="ayuda-badge-readonly" title="Campo bloqueado para auditoría SIG">
                <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Solo lectura</span>
              </span>
            </div>
            <div class="ayuda-input-hint">
              <svg style="width:12px;height:12px;color:#10b981;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Registrado con tu usuario de sesión: <strong>${usuarioActual}</strong> (asignado automáticamente)</span>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const fileInput = document.getElementById('swal-manual-file') as HTMLInputElement;
        const dropzone = document.getElementById('swal-manual-dropzone');
        const previewCard = document.getElementById('swal-manual-file-preview');
        const fileNameEl = document.getElementById('swal-manual-file-name');
        const fileSizeEl = document.getElementById('swal-manual-file-size');
        const btnChange = document.getElementById('swal-manual-btn-change');
        const titleInput = document.getElementById('swal-manual-titulo') as HTMLInputElement;

        const handleFileSelected = (file: File) => {
          if (!file) return;

          if (dropzone) dropzone.style.display = 'none';
          if (previewCard) previewCard.style.display = 'flex';
          if (fileNameEl) fileNameEl.textContent = file.name;

          const sizeKb = file.size / 1024;
          const sizeText = sizeKb >= 1024
            ? `${(sizeKb / 1024).toFixed(2)} MB`
            : `${sizeKb.toFixed(1)} KB`;
          if (fileSizeEl) fileSizeEl.textContent = `${sizeText} • Listo para registrar`;

          if (titleInput && !titleInput.value.trim()) {
            const rawTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
            titleInput.value = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
          }
        };

        dropzone?.addEventListener('click', () => fileInput?.click());
        btnChange?.addEventListener('click', () => fileInput?.click());

        fileInput?.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            handleFileSelected(fileInput.files[0]);
          }
        });

        if (dropzone) {
          ['dragenter', 'dragover'].forEach(evtName => {
            dropzone.addEventListener(evtName, (e) => {
              e.preventDefault();
              e.stopPropagation();
              dropzone.classList.add('is-dragover');
            });
          });

          ['dragleave', 'drop'].forEach(evtName => {
            dropzone.addEventListener(evtName, (e) => {
              e.preventDefault();
              e.stopPropagation();
              dropzone.classList.remove('is-dragover');
            });
          });

          dropzone.addEventListener('drop', (e: DragEvent) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const droppedFile = e.dataTransfer.files[0];
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(droppedFile);
              fileInput.files = dataTransfer.files;
              handleFileSelected(droppedFile);
            }
          });
        }
      },
      preConfirm: () => {
        const fileInput = document.getElementById('swal-manual-file') as HTMLInputElement;
        const tipoInput = document.getElementById('swal-manual-tipo') as HTMLSelectElement;
        const titleInput = document.getElementById('swal-manual-titulo') as HTMLInputElement;
        const vigenciaInput = document.getElementById('swal-manual-vigencia') as HTMLInputElement;
        const descInput = document.getElementById('swal-manual-desc') as HTMLTextAreaElement;

        const file = fileInput?.files?.[0];
        const tipo = tipoInput?.value;
        const titulo = titleInput?.value?.trim();
        const vigencia = vigenciaInput?.value;
        const desc = descInput?.value?.trim();
        const autor = usuarioActual; // El usuario de sesión no es editable

        if (!file) {
          Swal.showValidationMessage('Por favor seleccione un archivo (PDF, Word o Excel).');
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
                Subtitulo: tipo,
                Tipo_Documento: tipo,
                Fecha_Vigencia: vigencia,
                Descripcion: desc || `Guía y documentación técnica oficial (${tipo}).`,
                Autor: autor,
                Fecha_Publicacion: new Date().toISOString().slice(0, 10),
                Version: 'v1.0',
                Color: tipo === 'Guías rápidas' ? '#3ecf8e' : (tipo === 'Preguntas frecuentes' ? '#f0b429' : (tipo === 'Glosario' ? '#38bdf8' : '#7c6cf0')),
                Icono: tipo === 'Guías rápidas' ? 'speed' : (tipo === 'Preguntas frecuentes' ? 'quiz' : (tipo === 'Glosario' ? 'auto_stories' : 'picture_as_pdf')),
                Archivo: fileName,
                Usuario_Registro: usuarioActual
              };

              this.ayudaService.postManualMnto(payload).subscribe({
                next: (apiRes: any) => {
                  if (apiRes && apiRes.success) {
                    this.toastr.success(`Documento "${titulo}" guardado con éxito (Tipo: ${tipo}, Vigencia: ${vigencia}).`, 'Guardado');
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
          <strong style="color: #5b4bd6; font-size: 14px;">📊 Reporte de Consultas Recurrentes & Capacitaciones Sugeridas </strong>
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
        this.toastr.success('Plan de capacitación corporativa generado exitosamente.', 'Reporte Exportado');
      }
    });
  }
}
