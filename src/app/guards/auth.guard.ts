import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

/**
 * Guard funcional (Angular 19) que protege las rutas privadas de la aplicación.
 * Verifica la existencia y validez del token JWT o la sesión activa.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (authService.isTokenValid()) {
    return true;
  }

  toastr.warning('Debe iniciar sesión para acceder al sistema.', 'Sesión Requerida');
  authService.logout(false);
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
