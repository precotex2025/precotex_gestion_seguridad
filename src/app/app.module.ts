import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';

/* PrimeNG */
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule as PrimeTooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { KnobModule } from 'primeng/knob';

import { provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table'; 
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card'; 
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule} from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';


import { NormasComponent } from './components/normas/normas.component';
import { NormasRegeditComponent } from './components/normas/normas-regedit/normas-regedit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { MatButtonModule } from '@angular/material/button';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToastrModule } from 'ngx-toastr';
import { BreadCrumbComponent } from './components/bread-crumb/bread-crumb.component';
import { OrganizacionComponent } from './components/organizacion/organizacion.component';
import { OrganizacionRegeditComponent } from './components/organizacion/organizacion-regedit/organizacion-regedit.component';
import { MntoSedesComponent } from './components/mnto-sedes/mnto-sedes.component';
import { MntoProcesosComponent } from './components/mnto-procesos/mnto-procesos.component';
import { SedesRegeditComponent } from './components/mnto-sedes/sedes-regedit/sedes-regedit.component';
import { ProcesosRegeditComponent } from './components/mnto-procesos/procesos-regedit/procesos-regedit.component';
import { PuestosComponent } from './components/puestos/puestos.component';
import { PuestosUsuariosRegeditComponent } from './components/puestos/puestos-usuarios-regedit/puestos-usuarios-regedit.component';
import { DocumentosControladosComponent } from './components/documentos-controlados/documentos-controlados.component';
import { DocumentosNoControladosComponent } from './components/documentos-no-controlados/documentos-no-controlados.component';
import { DocumentosControladosRegeditComponent } from './components/documentos-controlados/documentos-controlados-regedit/documentos-controlados-regedit.component';
import { UsuariosPersonasComponent } from './components/usuarios-personas/usuarios-personas.component';
import { UsuariosPersonasRegeditComponent } from './components/usuarios-personas/usuarios-personas-regedit/usuarios-personas-regedit.component';
import { DocumentacionPersonasComponent } from './components/documentacion-personas/documentacion-personas.component';
import { DocumentacionPersonasRegeditComponent } from './components/documentacion-personas/documentacion-personas-regedit/documentacion-personas-regedit.component';
import { PrincipalComponent } from './components/principal/principal.component';
import { DocumentacionPersonasPlanesComponent } from './components/documentacion-personas/documentacion-personas-planes/documentacion-personas-planes.component';
import { DocumentacionPersonasPlanesRegeditComponent } from './components/documentacion-personas/documentacion-personas-planes/documentacion-personas-planes-regedit/documentacion-personas-planes-regedit.component';
import { MisDocumentosComponent } from './components/mis-documentos/mis-documentos.component';
import { EvaluacionesPuntualesComponent } from './components/evaluaciones-puntuales/evaluaciones-puntuales.component';
import { EvaluacionesPuntualesRegeditComponent } from './components/evaluaciones-puntuales/evaluaciones-puntuales-regedit/evaluaciones-puntuales-regedit.component';
import { CampusVirtualComponent } from './components/campus-virtual/campus-virtual.component';
import { AccionesCorrectivasComponent } from './components/acciones-correctivas/acciones-correctivas.component';
import { PlanificarFormacionModalComponent } from './components/acciones-correctivas/planificar-formacion-modal/planificar-formacion-modal.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { VerificacionAccesosComponent } from './components/verificacion-accesos/verificacion-accesos.component';
import { NuevaRevisionModalComponent } from './components/verificacion-accesos/nueva-revision-modal/nueva-revision-modal.component';
import { LogAccesosComponent } from './components/log-accesos/log-accesos.component';
import { MapaPermisosComponent } from './components/mapa-permisos/mapa-permisos.component';
import { ConfiguracionPuestosComponent } from './components/configuracion-puestos/configuracion-puestos.component';
import { NivelesRiesgoModalComponent } from './components/configuracion-puestos/niveles-riesgo-modal/niveles-riesgo-modal.component';




import { MatCheckboxModule } from '@angular/material/checkbox';
import { DocumentosNoControladosRegeditCarpetaComponent } from './components/documentos-no-controlados-regedit-carpeta/documentos-no-controlados-regedit-carpeta.component';
import { RegistrosPendientesComponent } from './components/registros-pendientes/registros-pendientes.component';
import { PlanificacionObjetivosComponent } from './components/planificacion-objetivos/planificacion-objetivos.component';
import { PlanificacionObjetivosRegeditComponent } from './components/planificacion-objetivos/planificacion-objetivos-regedit/planificacion-objetivos-regedit.component';
import { PlanificacionObjetivosMedicionComponent } from './components/planificacion-objetivos/planificacion-objetivos-medicion/planificacion-objetivos-medicion.component';
import { NuevaTareaModalComponent } from './components/planificacion-objetivos/nueva-tarea-modal/nueva-tarea-modal.component';
import { MedicionesPendientesComponent } from './components/mediciones-pendientes/mediciones-pendientes.component';
import { EvaluacionRiesgosComponent } from './components/evaluacion-riesgos/evaluacion-riesgos.component';
import { EvaluacionRiesgosRegeditComponent } from './components/evaluacion-riesgos/evaluacion-riesgos-regedit/evaluacion-riesgos-regedit.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlaceholderComponent } from './components/placeholder/placeholder.component';
import { AuditoriasComponent } from './components/auditorias/auditorias.component';
import { AuditoriasRegeditComponent } from './components/auditorias/auditorias-regedit/auditorias-regedit.component';
import { ProgramaAnualComponent } from './components/auditorias/programa-anual/programa-anual.component';
import { AnalyticsRegeditComponent } from './components/analytics/analytics-regedit/analytics-regedit.component';
import { MedicionIndicadoresComponent } from './components/analytics/medicion-indicadores/medicion-indicadores.component';
import { MedicionRegeditComponent } from './components/analytics/medicion-indicadores/medicion-regedit/medicion-regedit.component';
import { MedicionObjetivosRegeditComponent } from './components/planificacion-objetivos/medicion-objetivos-regedit/medicion-objetivos-regedit.component';
import { PortafolioMejoraComponent } from './components/portafolio-mejora/portafolio-mejora.component';
import { PortafolioMejoraRegeditComponent } from './components/portafolio-mejora/portafolio-mejora-regedit/portafolio-mejora-regedit.component';
import { ReqLegalComponent } from './components/req-legal/req-legal.component';
import { ReqLegalRegeditComponent } from './components/req-legal/req-legal-regedit/req-legal-regedit.component';

@NgModule({
  declarations: [
    AppComponent,
    NormasComponent,
    NormasRegeditComponent,
    OrganizacionComponent,
    LoginComponent,
    LayoutComponent,
    BreadCrumbComponent,
    OrganizacionRegeditComponent,
    MntoSedesComponent,
    MntoProcesosComponent,
    SedesRegeditComponent,
    ProcesosRegeditComponent,
    PuestosComponent,
    PuestosUsuariosRegeditComponent,
    DocumentosControladosComponent,
    DocumentosNoControladosComponent,
    DocumentosControladosRegeditComponent,
    UsuariosPersonasComponent,
    UsuariosPersonasRegeditComponent,
    DocumentacionPersonasComponent,
    DocumentacionPersonasRegeditComponent,
    PrincipalComponent,
    DocumentosNoControladosRegeditCarpetaComponent,
    DocumentacionPersonasPlanesComponent,
    DocumentacionPersonasPlanesRegeditComponent,
    MisDocumentosComponent,
    EvaluacionesPuntualesComponent,
    EvaluacionesPuntualesRegeditComponent,
    CampusVirtualComponent,
    AccionesCorrectivasComponent,
    PlanificarFormacionModalComponent,
    AnalyticsComponent,
    VerificacionAccesosComponent,
    NuevaRevisionModalComponent,
    LogAccesosComponent,
    MapaPermisosComponent,
    ConfiguracionPuestosComponent,
    NivelesRiesgoModalComponent,
    RegistrosPendientesComponent,
    PlanificacionObjetivosComponent,
    PlanificacionObjetivosRegeditComponent,
    PlanificacionObjetivosMedicionComponent,
    NuevaTareaModalComponent,
    MedicionesPendientesComponent,
    EvaluacionRiesgosComponent,
    EvaluacionRiesgosRegeditComponent,
    DashboardComponent,
    PlaceholderComponent,
    AuditoriasComponent,
    AuditoriasRegeditComponent,
    ProgramaAnualComponent,
    AnalyticsRegeditComponent,
    MedicionIndicadoresComponent,
    MedicionRegeditComponent,
    MedicionObjetivosRegeditComponent,
    PortafolioMejoraComponent,
    PortafolioMejoraRegeditComponent,
    ReqLegalComponent,
    ReqLegalRegeditComponent
  ],
  imports: [
    BrowserModule     ,
    AppRoutingModule  ,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    NgxSpinnerModule,
    MatToolbarModule,
    MatCardModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSortModule,
    MatCheckboxModule,
    MatTooltipModule,
    CommonModule,
    ToastrModule.forRoot(),
    /* PrimeNG Modules */
    ChartModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    PrimeTooltipModule,
    AvatarModule,
    ProgressBarModule,
    KnobModule
  ],
  providers: [
    provideHttpClient(),
    provideNativeDateAdapter(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false
        }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

