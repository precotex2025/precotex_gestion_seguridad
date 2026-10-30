import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NormasComponent } from './components/normas/normas.component';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { OrganizacionComponent } from './components/organizacion/organizacion.component';
import { MntoProcesosComponent } from './components/mnto-procesos/mnto-procesos.component';
import { MntoSedesComponent } from './components/mnto-sedes/mnto-sedes.component';
import { PuestosComponent } from './components/puestos/puestos.component';
import { DocumentosControladosComponent } from './components/documentos-controlados/documentos-controlados.component';
import { UsuariosPersonasComponent } from './components/usuarios-personas/usuarios-personas.component';
import { DocumentacionPersonasComponent } from './components/documentacion-personas/documentacion-personas.component';
import { PrincipalComponent } from './components/principal/principal.component';
import { DocumentosNoControladosComponent } from './components/documentos-no-controlados/documentos-no-controlados.component';
import { RegistrosPendientesComponent } from './components/registros-pendientes/registros-pendientes.component';
import { PlanificacionObjetivosComponent } from './components/planificacion-objetivos/planificacion-objetivos.component';
import { MisDocumentosComponent } from './components/mis-documentos/mis-documentos.component';
import { EvaluacionesPuntualesComponent } from './components/evaluaciones-puntuales/evaluaciones-puntuales.component';
import { CampusVirtualComponent } from './components/campus-virtual/campus-virtual.component';
import { AccionesCorrectivasComponent } from './components/acciones-correctivas/acciones-correctivas.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { VerificacionAccesosComponent } from './components/verificacion-accesos/verificacion-accesos.component';
import { LogAccesosComponent } from './components/log-accesos/log-accesos.component';
import { MapaPermisosComponent } from './components/mapa-permisos/mapa-permisos.component';
import { ConfiguracionPuestosComponent } from './components/configuracion-puestos/configuracion-puestos.component';
import { MedicionesPendientesComponent } from './components/mediciones-pendientes/mediciones-pendientes.component';
import { EvaluacionRiesgosComponent } from './components/evaluacion-riesgos/evaluacion-riesgos.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuditoriasComponent } from './components/auditorias/auditorias.component';
import { PortafolioMejoraComponent } from './components/portafolio-mejora/portafolio-mejora.component';
import { ReqLegalComponent } from './components/req-legal/req-legal.component';
import { AyudaComponent } from './components/ayuda/ayuda.component';
import { ProveedoresComponent } from './components/proveedores/proveedores.component';
import { ProgramaAnualComponent } from './components/auditorias/programa-anual/programa-anual.component';
import { MedicionIndicadoresComponent } from './components/analytics/medicion-indicadores/medicion-indicadores.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { moduleAccessGuard } from './guards/module-access.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch:'full' },
  // { path: "root",   component: AppComponent },
  { path: "login", component: LoginComponent }, 
  //Layout Principal
  {
    path: "principal",
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "", component: DashboardComponent }, 
      { path: "dashboard", component: DashboardComponent },
      { path: "normas"      , component: NormasComponent, canActivate: [moduleAccessGuard], data: { modulo: 'organizacion' } },
      { path: "organizacion", component: OrganizacionComponent, canActivate: [moduleAccessGuard], data: { modulo: 'organizacion' } },
      { path: "puestos", component: PuestosComponent, canActivate: [adminGuard] },
      { path: "documentosControlados", component: DocumentosControladosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'documentacion' } },
      { path: "documentosNoControlados", component: DocumentosNoControladosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'documentacion' } },
      { path: "registrosPendientes", component: RegistrosPendientesComponent, canActivate: [moduleAccessGuard], data: { modulo: 'documentacion' } },
      { path: "mntoSedes/:codigoOrganizacion"    , component: MntoSedesComponent, canActivate: [moduleAccessGuard], data: { modulo: 'organizacion' } },
      { path: "mntoProcesos/:codigoOrganizacion"    , component: MntoProcesosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'organizacion' } },
      { path: "usuariosPersonas", component: UsuariosPersonasComponent },
      { path: "documentacionPersonas", component: DocumentacionPersonasComponent },
      { path: "planificacionObjetivos", component: PlanificacionObjetivosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'objetivos' } },
      { path: "misDocumentos", component: MisDocumentosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'documentacion' } },
      { path: "evaluacionesPuntuales", component: EvaluacionesPuntualesComponent },
      { path: "campusVirtual", component: CampusVirtualComponent },
      { path: "accionesCorrectivas", component: AccionesCorrectivasComponent, canActivate: [moduleAccessGuard], data: { modulo: 'noconf' } },
      { path: "accionesCorrectivas/acciones-correctivas", component: AccionesCorrectivasComponent, canActivate: [moduleAccessGuard], data: { modulo: 'noconf' } },
      { path: "analytics", component: AnalyticsComponent, canActivate: [moduleAccessGuard], data: { modulo: 'indicadores' } },
      { path: "analytics/medicion", component: MedicionIndicadoresComponent, canActivate: [moduleAccessGuard], data: { modulo: 'indicadores' } },
      { path: "verificacionAccesos", component: VerificacionAccesosComponent, canActivate: [adminGuard] },
      { path: "logAccesos", component: LogAccesosComponent, canActivate: [adminGuard] },
      { path: "mapaPermisos", component: MapaPermisosComponent, canActivate: [adminGuard] },
      { path: "configuracionPuestos", component: ConfiguracionPuestosComponent, canActivate: [adminGuard] },
      { path: "medicionesPendientes", component: MedicionesPendientesComponent, canActivate: [moduleAccessGuard], data: { modulo: 'objetivos' } },
      { path: "evaluacionRiesgos", component: EvaluacionRiesgosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'riesgos' } },
      { path: "evaluacionRiesgos/identificacion-evaluacion", component: EvaluacionRiesgosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'riesgos' } },
      { path: "evaluacionRiesgos/seguimiento-controles", component: EvaluacionRiesgosComponent, canActivate: [moduleAccessGuard], data: { modulo: 'riesgos' } },
      { path: "auditorias", component: AuditoriasComponent, canActivate: [moduleAccessGuard], data: { modulo: 'auditorias' } },
      { path: "auditorias/ejecucion-resultados", component: AuditoriasComponent, canActivate: [moduleAccessGuard], data: { modulo: 'auditorias' } },
      { path: "auditorias/programa-anual", component: ProgramaAnualComponent, canActivate: [moduleAccessGuard], data: { modulo: 'auditorias' } },
      { path: "portafolioMejora", component: PortafolioMejoraComponent, canActivate: [moduleAccessGuard], data: { modulo: 'mejora' } },
      { path: "reqLegal", component: ReqLegalComponent, canActivate: [moduleAccessGuard], data: { modulo: 'legal' } },
      { path: "reqLegal/matriz", component: ReqLegalComponent, canActivate: [moduleAccessGuard], data: { modulo: 'legal' } },
      { path: "proveedores", component: ProveedoresComponent, canActivate: [moduleAccessGuard], data: { modulo: 'proveedores' } },
      { path: "ayuda", component: AyudaComponent }
    ]
  },

  
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
// export const routing = RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' });
