import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';

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


import { NormasComponent } from './components/normas/normas.component';
import { NormasRegeditComponent } from './components/normas/normas-regedit/normas-regedit.component';
import { ReactiveFormsModule } from '@angular/forms';


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
import { PuestosRegeditComponent } from './components/puestos/puestos-regedit/puestos-regedit.component';
import { DocumentosControladosComponent } from './components/documentos-controlados/documentos-controlados.component';
import { DocumentosNoControladosComponent } from './components/documentos-no-controlados/documentos-no-controlados.component';
import { DocumentosControladosRegeditComponent } from './components/documentos-controlados/documentos-controlados-regedit/documentos-controlados-regedit.component';
import { UsuariosPersonasComponent } from './components/usuarios-personas/usuarios-personas.component';
import { DocumentacionPersonasComponent } from './components/documentacion-personas/documentacion-personas.component';
import { DocumentacionPersonasRegeditComponent } from './components/documentacion-personas/documentacion-personas-regedit/documentacion-personas-regedit.component';


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
    PuestosRegeditComponent,
    DocumentosControladosComponent,
    DocumentosNoControladosComponent,
    DocumentosControladosRegeditComponent,
    UsuariosPersonasComponent,
    DocumentacionPersonasComponent,
    DocumentacionPersonasRegeditComponent
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
    CommonModule,
    ToastrModule.forRoot()
  ],
  providers: [
    provideHttpClient(),
    provideNativeDateAdapter()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
