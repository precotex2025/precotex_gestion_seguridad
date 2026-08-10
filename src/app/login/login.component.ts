import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GlobalVariable } from '../VarGlobals';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  hide = true;
  login_activo: boolean = true;
  ocultarPassword = true;  
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder, 
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  onLogin() {
    if (this.loginForm.invalid) {
      this.toastr.warning('Por favor ingrese su usuario y contraseña.', 'Campos Requeridos');
      return;
    }

    const val = this.loginForm.value;
    const username = (val.user || '').trim();
    const password = (val.pass || '').trim();

    this.isSubmitting = true;

    this.http.get(`${GlobalVariable.baseUrlBackEnd}TxLogin/getGetUsuarioWeb?Cod_Usuario=${username}`).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.success && res.elements && res.elements.length > 0) {
          const userObj = res.elements[0];
          
          // Verificar contraseña
          const dbPassword = (userObj.password || '').trim();
          if (dbPassword === password) {
            // Guardar en variables globales
            GlobalVariable.vusu = (userObj.cod_Usuario || '').trim();
            GlobalVariable.vcodtra = (userObj.cod_Trabajador || '').trim();
            GlobalVariable.vtiptra = (userObj.tip_Trabajador || '').trim();
            GlobalVariable.vCod_Rol = parseInt(userObj.cod_Rol || '0') || 0;

            // Guardar sesión en localStorage para persistencia
            localStorage.setItem('vusu', GlobalVariable.vusu);
            localStorage.setItem('vcodtra', GlobalVariable.vcodtra);
            localStorage.setItem('vtiptra', GlobalVariable.vtiptra);
            localStorage.setItem('vCod_Rol', GlobalVariable.vCod_Rol.toString());

            // Gestionar Recordarme
            if (val.recordarme) {
              localStorage.setItem('remembered_user', username);
            } else {
              localStorage.removeItem('remembered_user');
            }

            // Limpiar cache de permisos anterior
            localStorage.removeItem('precotex:puestos:accesos');
            localStorage.removeItem('precotex:puestos:listado');
            localStorage.removeItem('precotex:puestos:accesos_fino');
            localStorage.removeItem('precotex:usuario:proceso');

            // PUE-01: Registrar siempre la fecha, hora y usuario en el Histórico de Ingresos
            this.registrarLogAccesoHistorial(
              GlobalVariable.vusu,
              userObj.nom_Usuario || userObj.nombres || username,
              userObj.cod_Rol || '0'
            );

            this.toastr.success(`Bienvenido al sistema, ${GlobalVariable.vusu}.`, 'Acceso Correcto');
            this.router.navigate(['/principal']);
          } else {
            this.toastr.error('La contraseña ingresada es incorrecta.', 'Error de Acceso');
          }
        } else {
          this.toastr.error('El usuario ingresado no existe o no está habilitado.', 'Usuario no encontrado');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error en login:', err);
        this.toastr.error('Ocurrió un error al comunicarse con el servidor de autenticación.', 'Error del Servidor');
      }
    });
  }

  // PUE-01: Método de registro histórico de accesos
  private registrarLogAccesoHistorial(codUsuario: string, nomUsuario: string, codRol: string) {
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleDateString('es-PE') + ' ' + ahora.toLocaleTimeString('es-PE');

    const nuevoLog = {
      id: 'LOG-' + Date.now(),
      usuario: codUsuario,
      nombre: nomUsuario || codUsuario,
      rol: codRol === '1' ? 'Administrador' : 'Usuario SOMA',
      fechaHora: fechaHoraStr,
      timestamp: ahora.toISOString(),
      ip: '192.168.1.36',
      estado: 'Ingreso Exitoso'
    };

    // 1. Guardar localmente para disponibilidad inmediata
    try {
      const rawLogs = localStorage.getItem('precotex:logs:accesos');
      const logsArr: any[] = rawLogs ? JSON.parse(rawLogs) : [];
      logsArr.unshift(nuevoLog);
      localStorage.setItem('precotex:logs:accesos', JSON.stringify(logsArr.slice(0, 100)));
    } catch (e) {
      console.error('Error en almacenamiento local de accesos', e);
    }

    // 2. Notificar al backend de Seguridad
    const logBackend = {
      Accion: 'I',
      Cod_Usuario: codUsuario,
      Nom_Usuario: nomUsuario,
      Cod_Rol: codRol,
      Fec_Acceso: ahora.toISOString(),
      Flg_Activo: true
    };
    this.http.post(`${GlobalVariable.baseUrlBackEnd}TxLogin/postRegistrarLogAcceso`, logBackend).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  ngOnInit(): void {
    this.login_activo = true;
    this.loginForm = this.formBuilder.group({
      user: ['', Validators.required],
      pass: ['', Validators.required],
      recordarme: [false]
    });    

    if (typeof window !== 'undefined') {
      const rememberedUser = localStorage.getItem('remembered_user');
      if (rememberedUser) {
        this.loginForm.patchValue({
          user: rememberedUser,
          recordarme: true
        });
      }
    }
  }

}
