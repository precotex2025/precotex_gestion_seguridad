import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { GlobalVariable } from '../../VarGlobals';
import { filter } from 'rxjs/operators';

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

  private resizeListener!: () => void;

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      this.resizeListener = () => this.checkScreenSize();
      window.addEventListener('resize', this.resizeListener);
    }

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
      
      this.activeModule = {
        title: 'Puestos',
        breadcrumb: 'Puestos · Usuarios y permisos',
        activeTab: isPermissions ? 'permisos' : 'puestos-usuarios',
        tabs: [
          { id: 'puestos-usuarios', label: 'Puestos y usuarios', route: '/principal/puestos' },
          { id: 'permisos', label: 'Permisos por módulo', route: '/principal/mapaPermisos' }
        ]
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
        tabs: [
          { label: 'Iniciativas', route: '/principal/portafolioMejora' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/reqLegal')) {
      this.currentModule = 'Req. legal';
      this.activeModule = {
        title: 'Req. legal',
        breadcrumb: 'Req. Legal · Normativas y Leyes',
        tabs: [
          { label: 'Requisitos Legales', route: '/principal/reqLegal' }
        ]
      };
      this.activeSublink = url;
    } else if (url.includes('/principal/ayuda')) {
      this.currentModule = 'Ayuda';
      this.activeModule = {
        title: 'Ayuda',
        breadcrumb: 'Ayuda · Soporte',
        tabs: [
          { label: 'Centro de Ayuda', route: '/principal/ayuda' }
        ]
      };
      this.activeSublink = url;
    } else {
      this.currentModule = '';
      this.activeModule = null;
      this.activeSublink = '';
    }
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
    this.router.navigate(['/login']);
  }
}
