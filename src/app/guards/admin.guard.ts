import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GlobalVariable } from '../VarGlobals';
import { ToastrService } from 'ngx-toastr';

/**
 * Guard funcional (Angular 19) que protege las rutas administrativas exclusivas
 * (Puestos, Mapa de Permisos, Verificación de Accesos, Log de Accesos, Configuración de Puestos).
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const codRol = GlobalVariable.vCod_Rol || (typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('vCod_Rol') || '0') : 0) || 0;
  const user = (GlobalVariable.vusu || (typeof localStorage !== 'undefined' ? localStorage.getItem('vusu') : '') || '').toLowerCase().trim();

  const isAdmin = codRol === 1 || user === 'admin' || user === 'super administrador';

  if (isAdmin) {
    return true;
  }

  toastr.error('No tiene permisos para acceder a este módulo. Se requieren privilegios de Administrador.', 'Acceso Denegado');
  router.navigate(['/principal']);
  return false;
};
