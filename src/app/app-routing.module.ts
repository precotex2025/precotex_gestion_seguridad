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
import { PlaceholderComponent } from './components/placeholder/placeholder.component';


const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch:'full' },
  // { path: "root",   component: AppComponent },
  { path: "login", component: LoginComponent }, 

  //Layout Principal pes
  {
    path: "principal", component : LayoutComponent, children: [
      { path: ''             , component: DashboardComponent },
      { path: "normas"      , component: NormasComponent },
      { path: "organizacion", component: OrganizacionComponent },
      { path: "puestos", component: PuestosComponent },
      { path: "documentosControlados", component: DocumentosControladosComponent },
      { path: "documentosNoControlados", component: DocumentosNoControladosComponent },
      { path: "registrosPendientes", component: RegistrosPendientesComponent },
      { path: "mntoSedes/:codigoOrganizacion"    , component: MntoSedesComponent },
      { path: "mntoProcesos/:codigoOrganizacion"    , component: MntoProcesosComponent },
      { path: "usuariosPersonas", component: UsuariosPersonasComponent },
      { path: "documentacionPersonas", component: DocumentacionPersonasComponent },
      { path: "planificacionObjetivos", component: PlanificacionObjetivosComponent },
      { path: "misDocumentos", component: MisDocumentosComponent },
      { path: "evaluacionesPuntuales", component: EvaluacionesPuntualesComponent },
      { path: "campusVirtual", component: CampusVirtualComponent },
      { path: "accionesCorrectivas", component: AccionesCorrectivasComponent },
      { path: "analytics", component: AnalyticsComponent },
      { path: "verificacionAccesos", component: VerificacionAccesosComponent },
      { path: "logAccesos", component: LogAccesosComponent },
      { path: "mapaPermisos", component: MapaPermisosComponent },
      { path: "configuracionPuestos", component: ConfiguracionPuestosComponent },
      { path: "medicionesPendientes", component: MedicionesPendientesComponent },
      { path: "evaluacionRiesgos", component: EvaluacionRiesgosComponent },
      { path: "auditorias", component: PlaceholderComponent },
      { path: "portafolioMejora", component: PlaceholderComponent },
      { path: "reqLegal", component: PlaceholderComponent },
      { path: "ayuda", component: PlaceholderComponent }
    ]
  },

  
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
// export const routing = RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' });
