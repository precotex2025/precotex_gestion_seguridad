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

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch:'full' },
  // { path: "root",   component: AppComponent },
  { path: "login", component: LoginComponent }, 

  //Layout Principal pes
  {
    path: "principal", component : LayoutComponent, children: [
      { path: "normas"      , component: NormasComponent },
      { path: "organizacion", component: OrganizacionComponent },
      { path: "puestos", component: PuestosComponent },
      { path: "documentosControlados", component: DocumentosControladosComponent },
      { path: "documentosNoControlados", component: DocumentosNoControladosComponent },
      { path: "mntoSedes/:codigoOrganizacion"    , component: MntoSedesComponent },
      { path: "mntoProcesos/:codigoOrganizacion"    , component: MntoProcesosComponent },
      { path: "usuariosPersonas", component: UsuariosPersonasComponent },
      { path: "documentacionPersonas", component: DocumentacionPersonasComponent },
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
