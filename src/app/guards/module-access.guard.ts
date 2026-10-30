import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermisosService } from '../services/permisos.service';
import { ToastrService } from 'ngx-toastr';

/**
 * Guard funcional (Angular 19) que protege las rutas de cada módulo
 * verificando si el usuario o su puesto tienen acceso permitido ('Ver' o 'Editar')
 * o si se encuentra denegado ('Sin acceso').
 */
export const moduleAccessGuard: CanActivateFn = (route, state) => {
  const permisosService = inject(PermisosService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const moduloKey = (route.data && route.data['modulo']) ? route.data['modulo'] : '';
  if (!moduloKey) {
    return true;
  }

  const access = permisosService.getModuloAccess(moduloKey);
  if (access !== 'Sin acceso') {
    return true;
  }

  toastr.error('No tiene permisos para acceder a este módulo.', 'Acceso Denegado');
  router.navigate(['/principal']);
  return false;
};
