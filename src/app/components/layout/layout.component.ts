import { Component, ViewChild, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { GlobalVariable } from '../../VarGlobals';
import { filter } from 'rxjs/operators';
import { PuestosService } from '../../services/puestos.service';
import { PermisosService } from '../../services/permisos.service';
import { ToastrService } from 'ngx-toastr';
import { HeaderTitleService, HeaderTitleInfo } from '../../services/header-title.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  userName: string = GlobalVariable.vusu || 'Administrador';
  isMobile: boolean = false;

  currentUrl: string = '';
  currentModule: string = '';
  activeModule: any = null;
  activeSublink: string = '';

  permisosUsuario: { [modulo: string]: string } = {};
  puestoUsuario: string = '';

  // Sidebar Filter Search
  sidebarFilterText: string = '';

  matchesSidebar(label: string): boolean {
    if (!this.sidebarFilterText || !this.sidebarFilterText.trim()) return true;
    return label.toLowerCase().includes(this.sidebarFilterText.toLowerCase().trim());
  }

  private resizeListener!: () => void;

  isServerOnline: boolean = true;
  private statusInterval: any;

  // OP-1: Atajos de Teclado Globales (Ctrl+B, Ctrl+K, Esc)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl + B o Ctrl + K -> Buscar
    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'b' || event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      const searchBox = document.querySelector('.inline-search-input, .buscador-input, .glass-search-input, #globalSearchInput') as HTMLInputElement;
      if (searchBox) {
        searchBox.focus();
        this.toastr.info('Buscador Enfocado (Atajo Ctrl+B)', 'Teclado SIG', { timeOut: 1500 });
      }
    }

    // Esc -> Cerrar modales o desplegables
    if (event.key === 'Escape') {
      const closeButtons = document.querySelectorAll('.btn-close-banner, .btn-ghost-sm, .mat-dialog-close');
      closeButtons.forEach((btn: any) => btn.click && btn.click());
    }
  }

  onImgError(event: any): void {
    if (event && event.target) {
      const currentSrc = event.target.src || '';
      if (!currentSrc.includes('logo.jpg') || currentSrc.includes('assets/')) {
        event.target.src = 'logo.jpg';
      }
    }
  }

  private titleSubscription?: Subscription;

  constructor(
    public router: Router,
    private puestosService: PuestosService,
    private permisosService: PermisosService,
    private toastr: ToastrService,
    private headerTitleService: HeaderTitleService
  ) { }

  ngOnInit(): void {
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      this.resizeListener = () => this.checkScreenSize();
      window.addEventListener('resize', this.resizeListener);
    }

    // OP-2: Monitoreo de conexión en vivo con el servidor
    this.checkServerConnection();
    if (typeof window !== 'undefined') {
      this.statusInterval = setInterval(() => this.checkServerConnection(), 15000);
    }

    // Cargar permisos del usuario activo
    this.loadUserPermissions();

    // PUE-01: Registrar ingreso activo a la plataforma para el usuario de sesión
    this.registrarIngresoSesionPlataforma();

    // Suscripción dinámica para actualizar el encabezado de pantalla (ej. carpetas de Documentación)
    this.titleSubscription = this.headerTitleService.title$.subscribe((info: HeaderTitleInfo | null) => {
      if (this.currentModule === 'Documentación' && this.activeModule) {
        if (info && info.title) {
          this.activeModule.title = info.title;
          if (info.breadcrumb) {
            this.activeModule.breadcrumb = info.breadcrumb;
          }
        } else {
          this.activeModule.title = 'Documentación';
          this.activeModule.breadcrumb = 'Documentación · Control Documental';
        }
      }
    });

    // Initialize layout module header
    this.updateHeaderConfig(this.router.url);

    // Track navigation to update layout header dynamically
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateHeaderConfig(event.urlAfterRedirects || event.url);
    });
  }

  checkServerConnection(): void {
    if (typeof navigator !== 'undefined') {
      this.isServerOnline = navigator.onLine;
    }
  }

  ngOnDestroy(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.titleSubscription) {
      this.titleSubscription.unsubscribe();
    }
  }

  updateHeaderConfig(url: string): void {
    this.currentUrl = url;

    console.log('[updateHeaderConfig] URL:', url, '| isAdmin:', this.isAdmin(), '| vCod_Rol:', GlobalVariable.vCod_Rol);

    const moduloKey = this.getModuloKeyByUrl(url);
    console.log('[updateHeaderConfig] moduloKey:', JSON.stringify(moduloKey), '| hasAccess:', moduloKey ? this.hasAccess(moduloKey) : 'N/A (no key)');
    console.log('[updateHeaderConfig] permisosUsuario:', JSON.stringify(this.permisosUsuario));

    // Solo bloquear si los permisos ya se cargaron y hasAccess devuelve false
    const permisosCargados = this.permisosUsuario && Object.keys(this.permisosUsuario).length > 0;
    if (moduloKey && permisosCargados && !this.hasAccess(moduloKey)) {
      console.log('[updateHeaderConfig] >>> BLOQUEADO por hasAccess. moduloKey:', moduloKey);
      this.toastr.error('No tiene permisos para acceder a este módulo.', 'Acceso Denegado');
      this.router.navigate(['/principal']);
      return;
    }

    // Bloquear acceso a Puestos y Permisos por módulo para usuarios no administradores
    if (!this.isAdmin() && (url.includes('/principal/puestos') || url.includes('/principal/mapaPermisos') || url.includes('/principal/verificacionAccesos') || url.includes('/principal/logAccesos') || url.includes('/principal/configuracionPuestos'))) {
      console.log('[updateHeaderConfig] >>> BLOQUEADO por no-admin en ruta admin:', url);
      this.toastr.error('No tiene permisos para acceder a este módulo.', 'Acceso Denegado');
      this.router.navigate(['/principal']);
      return;
    }

    if (url.includes('/principal/normas') || url.includes('/principal/organizacion') || url.includes('/principal/mntoSedes') || url.includes('/principal/mntoProcesos')) {
      this.currentModule = 'Organización';
      this.activeModule = {
        title: 'Organización',
        breadcrumb: 'Organización · Estructura',
        tabs: [
          { label: 'Gestión de Normas y certificaciones', route: '/principal/normas' },
          { label: 'Estructura organizacional', route: '/principal/organizacion' }
        ]
      };
      this.activeSublink = url.includes('/principal/normas') ? '/principal/normas' : '/principal/organizacion';
    } else if (url.includes('/principal/puestos') || url.includes('/principal/usuariosPersonas') || url.includes('/principal/documentacionPersonas') || url.includes('/principal/misDocumentos') || url.includes('/principal/evaluacionesPuntuales') || url.includes('/principal/campusVirtual') || url.includes('/principal/mapaPermisos') || url.includes('/principal/verificacionAccesos') || url.includes('/principal/logAccesos') || url.includes('/principal/configuracionPuestos')) {
      this.currentModule = 'Puestos';
      const isPermissions = url.includes('/principal/mapaPermisos') || url.includes('/principal/verificacionAccesos') || url.includes('/principal/logAccesos') || url.includes('/principal/configuracionPuestos');

      // Solo admin ve la pestaña "Permisos por módulo"
      const tabs: any[] = [
        { id: 'puestos-usuarios', label: 'Puestos y usuarios', route: '/principal/puestos' }
      ];
      if (this.isAdmin()) {
        tabs.push({ id: 'permisos', label: 'Permisos por módulo', route: '/principal/mapaPermisos' });
      }

      this.activeModule = {
        title: 'Puestos',
        breadcrumb: 'Puestos · Usuarios y permisos',
        activeTab: isPermissions ? 'permisos' : 'puestos-usuarios',
        tabs: tabs
      };

      if (url.includes('/principal/puestos')) this.activeSublink = '/principal/puestos';
      else if (url.includes('/principal/usuariosPersonas')) this.activeSublink = '/principal/usuariosPersonas';
      else if (url.includes('/principal/documentacionPersonas')) this.activeSublink = '/principal/documentacionPersonas';
      else if (url.includes('/principal/misDocumentos')) this.activeSublink = '/principal/misDocumentos';
      else if (url.includes('/principal/evaluacionesPuntuales')) this.activeSublink = '/principal/evaluacionesPuntuales';
      else if (url.includes('/principal/campusVirtual')) this.activeSublink = '/principal/campusVirtual';
      else if (url.includes('/principal/mapaPermisos')) this.activeSublink = '/principal/mapaPermisos';
      else if (url.includes('/principal/verificacionAccesos')) this.activeSublink = '/principal/verificacionAccesos';
      else if (url.includes('/principal/logAccesos')) this.activeSublink = '/principal/logAccesos';
      else if (url.includes('/principal/configuracionPuestos')) this.activeSublink = '/principal/configuracionPuestos';
      else this.activeSublink = url;

    } else if (url.includes('/principal/documentosControlados') || url.includes('/principal/documentosNoControlados') || url.includes('/principal/registrosPendientes')) {
      this.currentModule = 'Documentación';
      
      let title = 'Documentación';
      let breadcrumb = 'Documentación · Control Documental';

      const currentHeader = this.headerTitleService.getCurrentTitle();
      if (currentHeader && currentHeader.title) {
        title = currentHeader.title;
        breadcrumb = currentHeader.breadcrumb || breadcrumb;
      } else if (typeof localStorage !== 'undefined') {
        const savedFilter = localStorage.getItem('precotex:pref:docs_activeFilter');
        if (savedFilter && savedFilter !== '__all__') {
          if (savedFilter.startsWith('macro:')) {
            const macro = savedFilter.substring(6);
            title = macro;
            breadcrumb = `Documentación · ${macro}`;
          } else if (savedFilter.startsWith('folder:')) {
            const parts = savedFilter.substring(7).split('|');
            const proc = parts[0];
            const fType = parts[1] || '';
            title = fType ? `${proc} — ${fType}` : proc;
            breadcrumb = fType ? `Documentación · ${proc} · ${fType}` : `Documentación · ${proc}`;
          } else {
            title = savedFilter;
            breadcrumb = `Documentación · ${savedFilter}`;
          }
        }
      }

      this.activeModule = {
        title: title,
        breadcrumb: breadcrumb,
        tabs: []
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/accionesCorrectivas')) {
      this.currentModule = 'No conformidades';
      const isAcciones = url.includes('/principal/accionesCorrectivas/acciones-correctivas');
      this.activeModule = {
        title: 'No conformidades',
        breadcrumb: 'No conformidades · Gestión de Hallazgos',
        activeTab: isAcciones ? 'acciones-correctivas' : 'declaracion-nc',
        tabs: [
          { id: 'declaracion-nc', label: 'Declaración de NC', route: '/principal/accionesCorrectivas' },
          { id: 'acciones-correctivas', label: 'Acciones correctivas', route: '/principal/accionesCorrectivas/acciones-correctivas' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/analytics')) {
      this.currentModule = 'Indicadores';
      const isMedicion = url.includes('/principal/analytics/medicion');
      this.activeModule = {
        title: 'Indicadores',
        breadcrumb: 'Indicadores · Catálogo y Mediciones',
        activeTab: isMedicion ? 'medicion' : 'alta',
        tabs: [
          { id: 'alta', label: 'Alta de Indicadores', route: '/principal/analytics' },
          { id: 'medicion', label: 'Medición de Indicadores (Dashboard)', route: '/principal/analytics/medicion' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/planificacionObjetivos') || url.includes('/principal/medicionesPendientes')) {
      this.currentModule = 'Objetivos';
      const isMediciones = url.includes('/principal/medicionesPendientes');
      this.activeModule = {
        title: 'Objetivos',
        breadcrumb: 'Objetivos · Planificación y Medición',
        activeTab: isMediciones ? 'mediciones' : 'planificacion',
        tabs: [
          { id: 'planificacion', label: 'Planificación de Objetivos', route: '/principal/planificacionObjetivos' },
          { id: 'mediciones', label: 'Medición de Objetivos', route: '/principal/medicionesPendientes' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/evaluacionRiesgos')) {
      const isSeguimiento = url.includes('seguimiento-controles');
      this.currentModule = 'Riesgos';
      this.activeModule = {
        title: 'Riesgos',
        breadcrumb: 'Riesgos · IPERC / Matriz de Riesgos',
        activeTab: isSeguimiento ? 'seguimiento-controles' : 'identificacion-evaluacion',
        tabs: [
          { id: 'identificacion-evaluacion', label: 'Identificación y evaluación', route: '/principal/evaluacionRiesgos' },
          { id: 'seguimiento-controles', label: 'Seguimiento de controles', route: '/principal/evaluacionRiesgos/seguimiento-controles' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/auditorias')) {
      this.currentModule = 'Auditorías';
      const isProgramaAnual = url.includes('/principal/auditorias/programa-anual');
      const isEjecucion = url.includes('/principal/auditorias/ejecucion-resultados');
      this.activeModule = {
        title: 'Auditorías',
        breadcrumb: 'Auditorías · Control Interno',
        activeTab: isEjecucion ? 'ejecucion-resultados' : (isProgramaAnual ? 'programa-anual' : 'auditorias'),
        tabs: [
          { id: 'auditorias', label: 'Planificación de Auditorías', route: '/principal/auditorias' },
          { id: 'ejecucion-resultados', label: 'Ejecución y Resultados', route: '/principal/auditorias/ejecucion-resultados' },
          { id: 'programa-anual', label: 'Programa anual', route: '/principal/auditorias/programa-anual' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/portafolioMejora')) {
      this.currentModule = 'Portafolio de Mejora';
      this.activeModule = {
        title: 'Portafolio de Mejora',
        breadcrumb: 'Portafolio de Mejora · Gestión de Iniciativas',
        tabs: []
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/reqLegal')) {
      const isMatriz = url.includes('/matriz');
      this.currentModule = 'Gestión Legal';
      this.activeModule = {
        title: 'Gestión Legal',
        breadcrumb: 'Gestión Legal · Normativas y Leyes',
        activeTab: isMatriz ? 'matriz' : 'documentos',
        tabs: [
          { id: 'documentos', label: 'Documentos y evidencias legales', route: '/principal/reqLegal' },
          { id: 'matriz', label: 'Matriz de requisitos legales', route: '/principal/reqLegal/matriz' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/proveedores')) {
      this.currentModule = 'Proveedores';
      this.activeModule = {
        title: 'Proveedores',
        breadcrumb: 'Proveedores y contratistas · Homologación & SST',
        tabs: []
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/ayuda')) {
      this.currentModule = 'Centro de ayuda';
      this.activeModule = {
        title: 'Centro de ayuda',
        breadcrumb: 'Centro de ayuda · Ayuda y soporte',
        tabs: []
      };
      this.activeSublink = url;
    } else {
      this.currentModule = 'Inicio';
      this.activeModule = {
        title: 'Inicio',
        breadcrumb: 'Inicio · Dashboard Principal',
        tabs: []
      };
      this.activeSublink = url;
    }
  }

  loadUserPermissions(): void {
    const userLogin = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();
    if (!userLogin) return;

    // 1. Intentar cargar desde cache local para acceso inmediato
    const cachedAccesos = localStorage.getItem('precotex:puestos:accesos');
    const cachedPuestos = localStorage.getItem('precotex:puestos:listado');

    if (cachedAccesos && cachedPuestos) {
      try {
        const accesosObj = JSON.parse(cachedAccesos);
        const puestosList = JSON.parse(cachedPuestos);
        this.processPermissions(userLogin, puestosList, accesosObj);
      } catch (e) {
        console.error('Error al parsear cache de permisos', e);
      }
    }

    // 2. Cargar en tiempo real desde la BD
    this.puestosService.getListadoPuesto('001', '', '').subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements) {
          const puestosList = res.elements.map((p: any) => ({
            codigo_Puesto: (p.codigo_Puesto || '').trim(),
            puesto: (p.denominacion || '').trim(),
            usuario: (p.puesto_Funciones || '—').trim(),
            proceso: (p.puesto_Descripcion || 'General').trim(),
            cod_Usuario: (p.cod_Usuario || '').trim().toLowerCase()
          }));

          localStorage.setItem('precotex:puestos:listado', JSON.stringify(puestosList));

          this.permisosService.getPermisosUsuarioModulo('').subscribe({
            next: (permRes: any) => {
              if (permRes && permRes.success && permRes.elements) {
                const accesosObj: any = {};
                const isPositive = (n: string) => {
                  const s = (n || '').toLowerCase().trim();
                  return s === 'editar' || s === 'ver' || s === 'lectura' || s === 'modificar';
                };

                permRes.elements.forEach((row: any) => {
                  const puestoClave = (row.codigo_Puesto_Usuario || '').trim();
                  const moduloClave = (row.modulo_Clave || '').trim();
                  const nivelAcceso = (row.nivel_Acceso || '').trim();

                  if (puestoClave) {
                    if (!accesosObj[puestoClave]) {
                      accesosObj[puestoClave] = {};
                    }
                    if (moduloClave) {
                      const cleanKey = moduloClave.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                      // Guardar clave exacta
                      accesosObj[puestoClave][moduloClave] = nivelAcceso;

                      // Guardar clave normalizada sin tildes (auditorias, organizacion, etc.)
                      // Si viene 'Sin acceso', se respeta estrictamente para evitar que 'Ver' residual prevalezca
                      const prevClean = accesosObj[puestoClave][cleanKey];
                      if (!prevClean || nivelAcceso.toLowerCase() === 'sin acceso' || prevClean.toLowerCase() !== 'sin acceso') {
                        accesosObj[puestoClave][cleanKey] = nivelAcceso;
                      }
                    }
                  }
                });

                localStorage.setItem('precotex:puestos:accesos', JSON.stringify(accesosObj));

                this.processPermissions(userLogin, puestosList, accesosObj);

                // Re-verificar la ruta actual por si los permisos cambiaron en caliente
                this.updateHeaderConfig(this.router.url);
              }
            }
          });

          // También cargar permisos finos (detalle por acción) para que los módulos los lean
          this.permisosService.getPermisosUsuarioDetalle('').subscribe({
            next: (fineRes: any) => {
              if (fineRes && fineRes.success && fineRes.elements && fineRes.elements.length > 0) {
                const accFine: any = {};
                fineRes.elements.forEach((row: any) => {
                  const uid = (row.codigo_Puesto_Usuario || '').trim();
                  if (!accFine[uid]) {
                    accFine[uid] = {};
                  }
                  const key = (row.modulo || '') + '||' + (row.contenido || '') + '||' + (row.accion || '');
                  accFine[uid][key] = row.flg_Permitido ? 1 : 0;
                });
                localStorage.setItem('precotex:puestos:accesos_fino', JSON.stringify(accFine));
                console.log('[Layout] Permisos finos cargados:', Object.keys(accFine));
              }
            }
          });
        }
      }
    });
  }

  processPermissions(userLogin: string, puestosList: any[], accesosObj: any): void {
    console.log('[Permisos] --- Inicio processPermissions ---');
    console.log('[Permisos] userLogin:', JSON.stringify(userLogin));

    // 1. Buscar puesto PRIMERO por coincidencia directa de cod_Usuario en la BD (100% exacto para todos los usuarios)
    let userPuesto = puestosList.find(p => p.cod_Usuario && p.cod_Usuario === userLogin);

    // 2. Si no se encontró por cod_Usuario, buscar por coincidencia heurística de usuario (nombre / login)
    if (!userPuesto) {
      userPuesto = puestosList.find(p => this.matchesUser(userLogin, p.usuario));
    }

    // 3. Si no se encontró, buscar por código de puesto guardado en sesión
    if (!userPuesto) {
      const storedCodPuesto = (localStorage.getItem('precotex:usuario:codigo_puesto') || '').trim();
      if (storedCodPuesto) {
        userPuesto = puestosList.find(p => p.codigo_Puesto === storedCodPuesto);
      }
    }

    // 4. Si no se encontró, buscar por puesto (denominación) guardado en sesión
    if (!userPuesto) {
      const storedPuesto = (localStorage.getItem('precotex:usuario:puesto') || '').trim().toLowerCase();
      if (storedPuesto) {
        userPuesto = puestosList.find(p => (p.puesto || '').trim().toLowerCase() === storedPuesto);
      }
    }

    // 5. Si no se encontró, buscar por nombre guardado en sesión
    if (!userPuesto) {
      const storedNombre = (localStorage.getItem('precotex:usuario:nombre') || '').trim();
      if (storedNombre) {
        userPuesto = puestosList.find(p => this.matchesUser(storedNombre, p.usuario));
      }
    }

    if (userPuesto) {
      this.puestoUsuario = userPuesto.puesto;
      const puestoName = (userPuesto.puesto || '').trim();
      const puestoCode = (userPuesto.codigo_Puesto || '').trim();
      const procesoPuesto = (userPuesto.proceso || 'General').trim();

      // Guardar el puesto, proceso/área y código asignado al usuario
      localStorage.setItem('precotex:usuario:puesto', puestoName);
      if (procesoPuesto && procesoPuesto.toLowerCase() !== 'general') {
        localStorage.setItem('precotex:usuario:proceso', procesoPuesto);
      }
      if (puestoCode) {
        localStorage.setItem('precotex:usuario:codigo_puesto', puestoCode);
      }
      console.log('[Permisos] Puesto:', puestoName, '| Proceso/Área asignado:', procesoPuesto);

      // Buscar permisos por nombre de puesto o código de puesto
      let permisos = accesosObj[puestoName] || (puestoCode ? accesosObj[puestoCode] : null);

      if (!permisos) {
        // Buscar haciendo trim y normalización case-insensitive
        const matchingKey = Object.keys(accesosObj).find(key =>
          key.trim().toLowerCase() === puestoName.toLowerCase() ||
          (puestoCode && key.trim().toLowerCase() === puestoCode.toLowerCase()) ||
          key.trim().toLowerCase() === userLogin.toLowerCase()
        );
        if (matchingKey) {
          permisos = accesosObj[matchingKey];
          console.log('[Permisos] Coincidencia encontrada. Clave BD:', JSON.stringify(matchingKey), '| Puesto:', JSON.stringify(puestoName));
        }
      }

      this.permisosUsuario = permisos || {};
      console.log('[Permisos] Usuario:', userLogin, '| Puesto:', puestoName, '| Permisos:', JSON.stringify(this.permisosUsuario));
    } else {
      this.permisosUsuario = {};
      this.puestoUsuario = '';
      console.log('[Permisos] No se encontró puesto para el usuario:', userLogin);
      console.log('[Permisos] Usuarios disponibles en puestos:', puestosList.map(p => ({ cod_Usuario: p.cod_Usuario, puesto: p.puesto })));
    }
  }

  matchesUser(login: string, fullName: string): boolean {
    if (!login || !fullName || fullName === '—') return false;
    const cleanLogin = (login || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanName = (fullName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    if (cleanName === cleanLogin) return true;
    if (cleanName.replace(/[^a-z0-9]/g, '') === cleanLogin.replace(/[^a-z0-9]/g, '')) return true;

    // Si tiene formato 'APELLIDOS, NOMBRES' (estándar peruano de planillas / ERP)
    if (cleanName.includes(',')) {
      const [apellidosPart, nombresPart] = cleanName.split(',').map(s => s.trim());
      const apellidos = apellidosPart.split(/\s+/).filter(Boolean);
      const nombres = (nombresPart || '').split(/\s+/).filter(Boolean);

      const primerApellido = apellidos[0] || '';
      const segundoApellido = apellidos[1] || '';

      // Probar combinaciones con cada uno de los nombres (ej. Jordan, Alexis, Mario)
      for (const nom of nombres) {
        if (!nom) continue;
        const initial = nom.charAt(0);
        // jpinedo (inicial + primer apellido)
        if (cleanLogin === initial + primerApellido) return true;
        // jordan.pinedo / jordan_pinedo / jordanpinedo
        if (cleanLogin === nom + '.' + primerApellido || cleanLogin === nom + '_' + primerApellido || cleanLogin === nom + primerApellido) return true;
        // jpinedot (inicial + primer apellido + inicial segundo apellido)
        if (segundoApellido && cleanLogin === initial + primerApellido + segundoApellido.charAt(0)) return true;
        // j.pinedo
        if (cleanLogin === initial + '.' + primerApellido) return true;
        // Login empieza con inicial del nombre y contiene el apellido
        if (cleanLogin.startsWith(initial) && cleanLogin.includes(primerApellido)) return true;
      }

      // Coincidencia directa por primer apellido
      if (cleanLogin === primerApellido) return true;
    }

    // Formato estándar 'NOMBRES APELLIDOS' o palabras sueltas
    const parts = cleanName.replace(/,/g, '').split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const initial0 = parts[0].charAt(0);
      const word1 = parts[1];
      if (cleanLogin === initial0 + word1) return true;
      if (cleanLogin === parts[0] + '.' + word1 || cleanLogin === parts[0] + word1) return true;
      if (cleanLogin.startsWith(initial0) && cleanLogin.includes(word1)) return true;

      // Orden inverso (APELLIDO NOMBRE): pinedo jordan -> jpinedo
      const lastWord = parts[parts.length - 1];
      const initialLast = lastWord.charAt(0);
      const firstWord = parts[0];
      if (cleanLogin === initialLast + firstWord) return true;
    }

    return cleanName.includes(cleanLogin);
  }

  hasAccess(moduloKey: string): boolean {
    // Perfil Administrador: si el rol del usuario es 1 (admin), puede ver todo
    const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
    if (codRol === 1) {
      return true;
    }

    if (!moduloKey) return true;

    // Si tiene permisos cargados
    if (this.permisosUsuario && Object.keys(this.permisosUsuario).length > 0) {
      const targetKey = moduloKey.toLowerCase().trim();
      const cleanTarget = targetKey.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      // Buscar si el módulo tiene nivel asignado
      let nivel: string | undefined = undefined;

      // 1. Coincidencia directa
      if (this.permisosUsuario[moduloKey] !== undefined) {
        nivel = this.permisosUsuario[moduloKey];
      } else if (this.permisosUsuario[cleanTarget] !== undefined) {
        nivel = this.permisosUsuario[cleanTarget];
      } else if (this.permisosUsuario[targetKey] !== undefined) {
        nivel = this.permisosUsuario[targetKey];
      } else {
        // Buscar por normalización de claves
        for (const [k, v] of Object.entries(this.permisosUsuario)) {
          const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (cleanK === cleanTarget || k.toLowerCase().trim() === targetKey) {
            nivel = v;
            if ((v || '').trim().toLowerCase() === 'sin acceso') {
              break;
            }
          }
        }
      }

      if (nivel !== undefined && nivel !== null) {
        const cleanNivel = (nivel || '').trim().toLowerCase();
        if (cleanNivel === 'sin acceso' || cleanNivel === 'sin permisos' || cleanNivel === 'bloqueado' || cleanNivel === '0') {
          return false;
        }
        if (cleanNivel === 'editar' || cleanNivel === 'ver' || cleanNivel === 'lectura' || cleanNivel === 'modificar') {
          return true;
        }
      }

      // Si el usuario tiene permisos configurados pero no tiene este módulo otorgado, denegar por defecto para usuarios estándar
      return false;
    }

    return true;
  }

  isAdmin(): boolean {
    return GlobalVariable.vCod_Rol === 1;
  }

  getModuloKeyByUrl(url: string): string {
    if (url.includes('/principal/documentosControlados') || url.includes('/principal/documentosNoControlados') || url.includes('/principal/registrosPendientes')) {
      return 'documentacion';
    }
    if (url.includes('/principal/auditorias')) {
      return 'auditorias';
    }
    if (url.includes('/principal/accionesCorrectivas')) {
      return 'noconf';
    }
    if (url.includes('/principal/analytics')) {
      return 'indicadores';
    }
    if (url.includes('/principal/planificacionObjetivos') || url.includes('/principal/medicionesPendientes')) {
      return 'objetivos';
    }
    if (url.includes('/principal/evaluacionRiesgos')) {
      return 'riesgos';
    }
    if (url.includes('/principal/portafolioMejora')) {
      return 'mejora';
    }
    if (url.includes('/principal/reqLegal')) {
      return 'legal';
    }
    if (url.includes('/principal/normas') || url.includes('/principal/organizacion') || url.includes('/principal/mntoSedes') || url.includes('/principal/mntoProcesos')) {
      return 'organizacion';
    }
    if (url.includes('/principal/proveedores')) {
      return 'proveedores';
    }
    return '';
  }



  private checkScreenSize(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 992;
    }
  }

  onNavListClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.isMobile && (target.closest('a') || target.closest('mat-list-item'))) {
      this.sidenav.close();
    }
  }

  private registrarIngresoSesionPlataforma(): void {
    try {
      const vusu = (GlobalVariable.vusu || localStorage.getItem('vusu') || '').trim();
      const storedNom = (localStorage.getItem('precotex:usuario:nombre') || vusu).trim();

      // Purgar en localStorage registros obsoletos y los registros del Administrador
      const rawLogs = localStorage.getItem('precotex:log:accesos');
      if (rawLogs) {
        let logsArr: any[] = JSON.parse(rawLogs);
        if (Array.isArray(logsArr)) {
          logsArr = logsArr.filter((item: any) => {
            const dtStr = (item.fechaHora || item.timestamp || '').toString();
            const uName = (item.usuario || item.nom_Usuario || item.nombre || '').toLowerCase();
            const rName = (item.puesto || item.rol || '').toLowerCase();
            if (dtStr.includes('19/08') || dtStr.includes('08-19') || (uName.includes('francisco') && dtStr.includes('11:49'))) return false;
            if (uName.includes('max soria') && (dtStr.includes('10:58') || dtStr.includes('10:54'))) return false;
            if (uName.includes('karem flores') && (dtStr.includes('09:18') || dtStr.includes('09:14'))) return false;
            if (uName.includes('luis aldana') && dtStr.includes('08:12')) return false;
            if (uName === 'admin' || uName === 'super administrador' || uName.includes('administrador') || rName === 'administrador general') return false;
            return true;
          });
          localStorage.setItem('precotex:log:accesos', JSON.stringify(logsArr.slice(0, 100)));
          localStorage.setItem('precotex:logs:accesos', JSON.stringify(logsArr.slice(0, 100)));
        }
      }

      if (!vusu) return;
      // El administrador general no se registra en el histórico
      if (vusu.toLowerCase() === 'admin' || storedNom.toLowerCase() === 'admin' || storedNom.toLowerCase().includes('administrador')) {
        return;
      }

      const sessionLogged = sessionStorage.getItem('precotex:session:logged_entry');
      if (sessionLogged) return;

      const storedPuesto = (localStorage.getItem('precotex:usuario:puesto') || 'Analista SIG').trim();
      const codRol = localStorage.getItem('vCod_Rol') || '2';

      const ahora = new Date();
      const fechaHoraStr = ahora.getFullYear() + '-' +
        String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
        String(ahora.getDate()).padStart(2, '0') + ' ' +
        ahora.toLocaleTimeString('es-PE', { hour12: false });

      const nuevoLog = {
        id: 'LOG-' + Date.now(),
        fechaHora: fechaHoraStr,
        usuario: storedNom || vusu,
        cod_Usuario: vusu,
        puesto: storedPuesto,
        rol: codRol === '1' ? 'Administrador' : 'Usuario SOMA',
        timestamp: ahora.toISOString(),
        ip: '192.168.1.36',
        estado: 'Inicio de sesión'
      };

      const freshLogs = localStorage.getItem('precotex:log:accesos');
      let currentArr: any[] = freshLogs ? JSON.parse(freshLogs) : [];
      if (!Array.isArray(currentArr)) currentArr = [];

      const cincoMinutosAtras = new Date(ahora.getTime() - 5 * 60 * 1000);
      const yaRegistrado = currentArr.some(l => {
        const sameUser = (l.usuario || '').toLowerCase() === nuevoLog.usuario.toLowerCase();
        if (!sameUser) return false;
        const lDate = l.timestamp ? new Date(l.timestamp) : (l.fechaHora ? new Date(l.fechaHora.replace(' ', 'T')) : null);
        return lDate && lDate >= cincoMinutosAtras;
      });

      if (!yaRegistrado) {
        currentArr.unshift(nuevoLog);
        localStorage.setItem('precotex:log:accesos', JSON.stringify(currentArr.slice(0, 100)));
        localStorage.setItem('precotex:logs:accesos', JSON.stringify(currentArr.slice(0, 100)));
      }

      sessionStorage.setItem('precotex:session:logged_entry', 'true');
    } catch (e) {}
  }

  onLogout(): void {
    GlobalVariable.vusu = '';
    GlobalVariable.vcodtra = '';
    GlobalVariable.vtiptra = '';
    GlobalVariable.vCod_Rol = 0;

    localStorage.removeItem('vusu');
    localStorage.removeItem('vcodtra');
    localStorage.removeItem('vtiptra');
    localStorage.removeItem('vCod_Rol');
    localStorage.removeItem('precotex:puestos:accesos');
    localStorage.removeItem('precotex:puestos:listado');
    localStorage.removeItem('precotex:puestos:accesos_fino');
    localStorage.removeItem('precotex:usuario:proceso');
    sessionStorage.removeItem('precotex:session:logged_entry');

    this.router.navigate(['/login']);
  }
}
