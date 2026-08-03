import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { GlobalVariable } from '../../VarGlobals';
import { filter } from 'rxjs/operators';
import { PuestosService } from '../../services/puestos.service';
import { PermisosService } from '../../services/permisos.service';
import { ToastrService } from 'ngx-toastr';

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

  private resizeListener!: () => void;

  constructor(
    public router: Router,
    private puestosService: PuestosService,
    private permisosService: PermisosService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      this.resizeListener = () => this.checkScreenSize();
      window.addEventListener('resize', this.resizeListener);
    }

    // Cargar permisos del usuario activo
    this.loadUserPermissions();

    // Initialize layout module header
    this.updateHeaderConfig(this.router.url);

    // Track navigation to update layout header dynamically
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateHeaderConfig(event.urlAfterRedirects || event.url);
    });
  }

  updateHeaderConfig(url: string): void {
    this.currentUrl = url;

    const moduloKey = this.getModuloKeyByUrl(url);
    if (moduloKey && !this.hasAccess(moduloKey)) {
      this.toastr.error('No tiene permisos para acceder a este módulo.', 'Acceso Denegado');
      this.router.navigate(['/principal']);
      return;
    }

    // Bloquear acceso a Puestos y Permisos por módulo para usuarios no administradores
    if (!this.isAdmin() && (url.includes('/principal/puestos') || url.includes('/principal/mapaPermisos') || url.includes('/principal/verificacionAccesos') || url.includes('/principal/logAccesos') || url.includes('/principal/configuracionPuestos'))) {
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
          { label: 'Normas y objetivos', route: '/principal/normas' },
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
      this.activeModule = {
        title: 'Documentación',
        breadcrumb: 'Documentación · Control Documental',
        tabs: []
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/accionesCorrectivas')) {
      this.currentModule = 'No conformidades';
      this.activeModule = {
        title: 'No conformidades',
        breadcrumb: 'No conformidades · Acciones Correctivas',
        tabs: []
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/analytics')) {
      this.currentModule = 'Indicadores';
      const isMedicion = url.includes('/principal/analytics/medicion');
      this.activeModule = {
        title: 'Indicadores',
        breadcrumb: 'Indicadores · Gestión',
        activeTab: isMedicion ? 'medicion' : 'alta',
        tabs: [
          { id: 'alta', label: 'Alta de indicadores', route: '/principal/analytics' },
          { id: 'medicion', label: 'Medición de indicadores', route: '/principal/analytics/medicion' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/planificacionObjetivos') || url.includes('/principal/medicionesPendientes')) {
      this.currentModule = 'Objetivos';
      const isMedicion = url.includes('/principal/medicionesPendientes');
      this.activeModule = {
        title: 'Objetivos',
        breadcrumb: 'Objetivos · Gestión',
        activeTab: isMedicion ? 'medicion' : 'planificacion',
        tabs: [
          { id: 'planificacion', label: 'Planificación de objetivos', route: '/principal/planificacionObjetivos' },
          { id: 'medicion', label: 'Medición de objetivos', route: '/principal/medicionesPendientes' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/evaluacionRiesgos')) {
      this.currentModule = 'Riesgos';
      this.activeModule = {
        title: 'Riesgos',
        breadcrumb: 'Riesgos · IPERC',
        tabs: []
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/auditorias')) {
      this.currentModule = 'Auditorías';
      const isProgramaAnual = url.includes('/principal/auditorias/programa-anual');
      this.activeModule = {
        title: 'Auditorías',
        breadcrumb: 'Auditorías · Control Interno',
        activeTab: isProgramaAnual ? 'programa-anual' : 'auditorias',
        tabs: [
          { id: 'auditorias', label: 'Auditorías', route: '/principal/auditorias' },
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
      this.currentModule = 'Req. legal';
      this.activeModule = {
        title: 'Req. legal',
        breadcrumb: 'Req. Legal · Normativas y Leyes',
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
      this.currentModule = '';
      this.activeModule = null;
      this.activeSublink = '';
    }
  }

  loadUserPermissions(): void {
    const userLogin = (GlobalVariable.vusu || '').toLowerCase().trim();
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
            codigo_Puesto: p.codigo_Puesto,
            puesto: p.denominacion,
            usuario: p.puesto_Funciones || '—'
          }));

          localStorage.setItem('precotex:puestos:listado', JSON.stringify(puestosList));

          this.permisosService.getPermisosUsuarioModulo('').subscribe({
            next: (permRes: any) => {
              if (permRes && permRes.success && permRes.elements) {
                const accesosObj: any = {};
                permRes.elements.forEach((row: any) => {
                  if (!accesosObj[row.codigo_Puesto_Usuario]) {
                    accesosObj[row.codigo_Puesto_Usuario] = {};
                  }
                  accesosObj[row.codigo_Puesto_Usuario][row.modulo_Clave] = row.nivel_Acceso;
                });

                localStorage.setItem('precotex:puestos:accesos', JSON.stringify(accesosObj));

                this.processPermissions(userLogin, puestosList, accesosObj);
                
                // Re-verificar la ruta actual por si los permisos cambiaron en caliente
                this.updateHeaderConfig(this.router.url);
              }
            }
          });
        }
      }
    });
  }

  processPermissions(userLogin: string, puestosList: any[], accesosObj: any): void {
    const userPuesto = puestosList.find(p => this.matchesUser(userLogin, p.usuario));
    if (userPuesto) {
      this.puestoUsuario = userPuesto.puesto;
      const puestoName = (userPuesto.puesto || '').trim();
      const puestoCode = userPuesto.codigo_Puesto;

      // El Mapa de Permisos guarda con el NOMBRE del puesto como clave
      // (ej. "Analista de Seguridad"), no con el código (ej. "001").
      // Intentamos con todas las claves posibles para máxima compatibilidad.
      this.permisosUsuario = accesosObj[puestoName]
                          || accesosObj[puestoCode]
                          || {};

      console.log('[Permisos] Usuario:', userLogin, '| Puesto:', puestoName, '| Permisos:', this.permisosUsuario);
    } else {
      this.permisosUsuario = {};
      this.puestoUsuario = '';
      console.log('[Permisos] No se encontró puesto para el usuario:', userLogin);
    }
  }

  matchesUser(login: string, fullName: string): boolean {
    if (!login || !fullName || fullName === '—') return false;
    const cleanLogin = login.toLowerCase().trim();
    const cleanName = fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    if (cleanName.replace(/\s+/g, '') === cleanLogin) return true;

    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts[1];
      const initial = firstName.charAt(0);
      
      if (cleanLogin === initial + lastName) {
        return true;
      }
      
      if (cleanLogin.startsWith(initial) && cleanLogin.includes(lastName)) {
        return true;
      }
    }
    
    return cleanName.includes(cleanLogin);
  }

  hasAccess(moduloKey: string): boolean {
    // Perfil Administrador: si el rol del usuario es 1 (admin), puede ver todo
    const codRol = GlobalVariable.vCod_Rol;
    if (codRol === 1) {
      return true;
    }

    // Si tiene permisos cargados y el módulo está marcado como "Sin acceso"
    if (this.permisosUsuario[moduloKey] === 'Sin acceso') {
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
    return '';
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
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

  onLogout(): void {
    GlobalVariable.vusu = '';
    GlobalVariable.vcodtra = '';
    GlobalVariable.vtiptra = '';
    GlobalVariable.vCod_Rol = 0;

    localStorage.removeItem('vusu');
    localStorage.removeItem('vcodtra');
    localStorage.removeItem('vtiptra');
    localStorage.removeItem('vCod_Rol');

    this.router.navigate(['/login']);
  }
}
