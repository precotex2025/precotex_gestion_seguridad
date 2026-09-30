import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  constructor(private toastr: ToastrService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Suprimir alertas intrusivas para errores 400 o endpoints auxiliares que manejan su propio flujo/fallback
        if (
          error.status === 400 ||
          request.url.includes('UP_MuestraHistorialUsuario') ||
          request.url.includes('getValidarPrimerIngreso') ||
          request.url.includes('postRegistrarUsuario') ||
          request.url.includes('getLogAccesos') ||
          request.url.includes('getTrabajadoresSpring') ||
          request.url.includes('getListadoNivelJerarquico') ||
          request.url.includes('getListadoUsuarios') ||
          request.url.includes('getListadoReqLegal') ||
          request.url.includes('postEnviarCredencialesCorreo')
        ) {
          return throwError(() => error);
        }

        let errorMessage = 'Ocurrió un error inesperado al procesar la solicitud.';

        if (error.status === 0) {
          // Error de conexión / servidor no responde
          Swal.fire({
            title: '📡 Sin Conexión con el Servidor SIG',
            html: `
              <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #cbd5e1;">
                <p>No se pudo establecer conexión con el servidor backend de Seguridad:</p>
                <p style="font-family: monospace; color: #f87171; background: rgba(239,68,68,0.1); padding: 8px; border-radius: 6px;">
                  ${error.url || 'API Backend de Precotex'}
                </p>
                <p style="font-size: 12px; color: #94a3b8;">Verifica si tu backend local C# está encendido o si la VPN/Red Precotex está activa.</p>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#6366f1'
          });
        } else if (error.status === 401 || error.status === 403) {
          this.toastr.error('Su sesión ha expirado o no cuenta con permisos para esta acción.', 'Acceso Denegado');
          this.authService.logout();
        } else if (error.status >= 500) {
          this.toastr.error('El servidor respondió con una incidencia interna. Reintente en breve.', 'Error del Servidor');
        } else if (error.status !== 400) {
          const apiMsg = error.error?.error || error.error?.Message || error.error?.message || error.error?.MessageTransac || error.error?.messageTransac || error.message || errorMessage;
          this.toastr.error(apiMsg, `Error ${error.status}`);
        }

        return throwError(() => error);
      })
    );
  }
}
