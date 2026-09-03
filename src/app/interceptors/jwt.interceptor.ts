import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { GlobalVariable } from '../VarGlobals';

/**
 * Interceptor funcional (Angular 19) que inyecta automáticamente 
 * el encabezado Authorization: Bearer <token> en cada petición HTTP hacia el Backend.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Verificar si la petición es hacia el backend de seguridad
  const isApiRequest = req.url.includes(GlobalVariable.baseUrlBackEnd) || req.url.includes('/api/');

  if (token && isApiRequest) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
