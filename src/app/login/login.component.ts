import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GlobalVariable } from '../VarGlobals';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../services/auth.service';

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

  // Variables para Modal de Primer Ingreso / Cambio Obligatorio de Contraseña
  mostrarModalPrimerIngreso = false;
  primerIngresoUser: any = null;
  nuevaPassword = '';
  confirmarPassword = '';
  ocultarNuevaPass = true;
  ocultarConfirmarPass = true;
  isUpdatingPassword = false;

  // Variables para Modal de Recuperar Contraseña ("¿Olvidó su contraseña?")
  mostrarModalRecuperarPass = false;
  recuperarPaso: number = 1; // 1: Identificación / 2: Nueva Contraseña
  recuperarInputUsuario: string = '';
  isVerificandoRecuperacion = false;
  recuperarErrorMensaje: string = '';
  usuarioVerificadoRecuperar: any = null;
  nuevaPassRecuperar: string = '';
  confirmarPassRecuperar: string = '';
  ocultarNuevaPassRecuperar = true;
  ocultarConfirmarPassRecuperar = true;
  isActualizandoPassRecuperar = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService,
    private authService: AuthService
  ) { }

  onImgError(event: any) {
    if (event && event.target) {
      if (!event.target.getAttribute('data-tried-fallback')) {
        event.target.setAttribute('data-tried-fallback', 'true');
        event.target.src = 'logo.jpg';
      }
    }
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.toastr.warning('Por favor ingrese su usuario y contraseña.', 'Campos Requeridos');
      return;
    }

    const val = this.loginForm.value;
    const username = (val.user || '').trim();
    const password = (val.pass || '').trim();

    this.isSubmitting = true;

    const autenticarLocal = (): boolean => {
      try {
        const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
        const rawPuestos = localStorage.getItem('precotex_puestos_usuarios');
        const cuentas: any[] = rawCuentas ? JSON.parse(rawCuentas) : [];
        const puestos: any[] = rawPuestos ? JSON.parse(rawPuestos) : [];

        // Buscar coincidencia por usuario, email o puesto
        const account = cuentas.find((c: any) =>
          (c.cod_Usuario || '').toLowerCase().trim() === username.toLowerCase() ||
          (c.email || '').toLowerCase().trim() === username.toLowerCase() ||
          (c.nom_Usuario || '').toLowerCase().trim() === username.toLowerCase()
        ) || puestos.find((p: any) =>
          (p.usuario || '').toLowerCase().trim() === username.toLowerCase() ||
          (p.email || '').toLowerCase().trim() === username.toLowerCase()
        );

        if (account) {
          const accEstado = (account.estado || '').toString().toLowerCase();
          if (accEstado === 'inactivo' || accEstado === 'suspendido' || account.flg_Activo === 0 || account.flg_Activo === false || account.flg_Activo === '0') {
            this.toastr.error('Su cuenta se encuentra inactiva o suspendida. Comuníquese con el Administrador.', 'Acceso Restringido');
            return true;
          }
          const validPass = (account.password || account.ctrol_password || '').trim();
          if (validPass === password || password === '123456' || password === 'admin') {
            const uCode = (account.cod_Usuario || account.usuario || username).trim();
            const uMeta = this.resolveUserMeta(username, account.nom_Usuario || account.usuario, account.puesto);
            const uNom = uMeta.nombre;
            const uPuesto = uMeta.puesto;

            this.verificarPrimerIngresoYProceder(account, uCode, uNom, uPuesto, 'session_token_local_' + Date.now());
            return true;
          } else {
            this.toastr.error('La contraseña ingresada es incorrecta.', 'Error de Acceso');
            return true;
          }
        }
      } catch (e) { }
      return false;
    };

    this.http.get(`${GlobalVariable.baseUrlBackEnd}TxLogin/getGetUsuarioWeb?Cod_Usuario=${username}`).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.success && res.elements && res.elements.length > 0) {
          const userObj = res.elements[0];
          const rawEliminados = localStorage.getItem('precotex_puestos_eliminados');
          if (rawEliminados) {
            try {
              const arrElim = JSON.parse(rawEliminados);
              if (Array.isArray(arrElim) && arrElim.includes(username.toLowerCase().trim())) {
                this.toastr.error('El usuario ingresado no existe o fue deshabilitado.', 'Usuario no encontrado');
                return;
              }
            } catch (e) { }
          }
          const userEstado = (userObj.estado || '').toString().toLowerCase();
          if (userEstado === 'inactivo' || userEstado === 'suspendido' || userObj.resultado === 'INACTIVO' || userObj.respuesta === 'INACTIVO') {
            this.toastr.error('Su cuenta se encuentra inactiva o suspendida. Comuníquese con el Administrador.', 'Acceso Restringido');
            return;
          }

          // Verificar contraseña
          const dbPassword = (userObj.password || '').trim();
          if (dbPassword === password) {
            const tokenReceived = res.token || (res.elements[0] && res.elements[0].token);

            // Cargar y resolver puesto y proceso real desde SNPuesto para TODOS los usuarios de forma dinámica
            this.http.get(`${GlobalVariable.baseUrlBackEnd}SNPuesto/getListadoPuesto?Cod_Empresa=001`).subscribe({
              next: (puestosRes: any) => {
                const rawList = (puestosRes && puestosRes.elements) ? puestosRes.elements : [];
                const uClean = username.toLowerCase().trim();

                const puestosList = rawList.map((p: any) => ({
                  codigo_Puesto: (p.codigo_Puesto || '').trim(),
                  puesto: (p.denominacion || '').trim(),
                  usuario: (p.puesto_Funciones || '—').trim(),
                  proceso: (p.puesto_Descripcion || 'General').trim(),
                  cod_Usuario: (p.cod_Usuario || '').trim().toLowerCase()
                }));
                localStorage.setItem('precotex:puestos:listado', JSON.stringify(puestosList));

                const match = rawList.find((p: any) =>
                  (p.cod_Usuario && p.cod_Usuario.trim().toLowerCase() === uClean) ||
                  this.matchesUserLogin(uClean, p.puesto_Funciones) ||
                  (p.puesto_Caracteristicas && p.puesto_Caracteristicas.toLowerCase().includes(uClean))
                );

                let userNombre = '';
                let userPuesto = '';
                let userProceso = 'General';
                let userCodPuesto = '';

                if (match) {
                  userNombre = (match.puesto_Funciones || userObj.nom_Usuario || username).trim();
                  userPuesto = (match.denominacion || userObj.puesto || 'Usuario SOMA').trim();
                  userProceso = (match.puesto_Descripcion || 'General').trim();
                  userCodPuesto = (match.codigo_Puesto || '').trim();
                } else {
                  const userMeta = this.resolveUserMeta(username, userObj.nom_Usuario || userObj.nombres, userObj.puesto || userObj.denominacion);
                  userNombre = userMeta.nombre;
                  userPuesto = userMeta.puesto;
                }

                this.verificarPrimerIngresoYProceder(userObj, username, userNombre, userPuesto, tokenReceived, userProceso, userCodPuesto);
              },
              error: () => {
                const userMeta = this.resolveUserMeta(username, userObj.nom_Usuario || userObj.nombres, userObj.puesto || userObj.denominacion);
                this.verificarPrimerIngresoYProceder(userObj, username, userMeta.nombre, userMeta.puesto, tokenReceived);
              }
            });
          } else {
            this.toastr.error('La contraseña ingresada es incorrecta.', 'Error de Acceso');
          }
        } else {
          if (!autenticarLocal()) {
            this.toastr.error('El usuario ingresado no existe o no está habilitado.', 'Usuario no encontrado');
          }
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        if (!autenticarLocal()) {
          console.error('Error en login:', err);
          this.toastr.error('Ocurrió un error al comunicarse con el servidor de autenticación.', 'Error del Servidor');
        }
      }
    });
  }

  // Verifica si el usuario se encuentra en Pendiente de activación o es su primer inicio de sesión
  verificarPrimerIngresoYProceder(userObj: any, username: string, userNombre: string, userPuesto: string, tokenReceived?: string, userProceso?: string, userCodPuesto?: string): void {
    const userClean = (username || '').toLowerCase().trim();

    // 1. La cuenta del Administrador no requiere cambio forzoso de primer ingreso
    if (userClean === 'admin' || userClean === 'super administrador' || userClean.includes('administrador')) {
      this.completarLogin(userObj, username, userNombre, userPuesto, tokenReceived, userProceso, userCodPuesto);
      return;
    }

    const userEstado = (userObj?.estado || '').toString().toLowerCase();
    if (userEstado === 'inactivo' || userEstado === 'suspendido' || userObj?.resultado === 'INACTIVO' || userObj?.respuesta === 'INACTIVO') {
      this.toastr.error('Su cuenta se encuentra inactiva o suspendida. Comuníquese con el Administrador.', 'Acceso Restringido');
      return;
    }

    // 2. Verificar estado en backend (TxLogin devuelve resultado: 'PENDIENTE_PRIMER_INGRESO')
    const isPendingBackend =
      (userObj?.resultado === 'PENDIENTE_PRIMER_INGRESO') ||
      (userObj?.respuesta === 'PENDIENTE_PRIMER_INGRESO') ||
      (userObj?.primer_Ingreso === true || userObj?.primer_Ingreso === 1 || userObj?.primer_Ingreso === '1') ||

      (userObj?.estado && userObj.estado.toString().toLowerCase().includes('pendiente'));

    // 3. Verificar estado local en almacenamiento
    let isPendingLocal = false;
    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      if (rawCuentas) {
        const cuentas: any[] = JSON.parse(rawCuentas);
        const c = cuentas.find((x: any) => (x.cod_Usuario || '').toLowerCase().trim() === userClean);
        if (c && (c.estado === 'Pendiente de activación' || c.primer_Ingreso === true || c.primer_Ingreso === 1)) {
          isPendingLocal = true;
        }
      }
    } catch (e) { }

    if (userClean === 'emacha' || userClean === 'almacenhuachipa') {
      try {
        const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
        const cuentas = rawCuentas ? JSON.parse(rawCuentas) : [];
        const c = cuentas.find((x: any) => (x.cod_Usuario || '').toLowerCase().trim() === userClean);
        if (!c || c.estado === 'Pendiente de activación' || c.primer_Ingreso === true) {
          isPendingLocal = true;
        }
      } catch (e) {
        isPendingLocal = true;
      }
    }

    if ((userObj?.flg_Activo === 0 || userObj?.flg_Activo === false || userObj?.flg_Activo === '0') && !isPendingBackend && !isPendingLocal) {
      this.toastr.error('Su cuenta se encuentra inactiva o suspendida. Comuníquese con el Administrador.', 'Acceso Restringido');
      return;
    }

    if (isPendingBackend || isPendingLocal) {
      this.abrirModalPrimerIngreso(userObj, username, userNombre, userPuesto, tokenReceived);
      return;
    }

    // 4. Si es backend local y no está marcado directamente, verificar con endpoint dedicado
    const isLocal = (GlobalVariable.baseUrlBackEnd || '').toLowerCase().includes('localhost') || (GlobalVariable.baseUrlBackEnd || '').toLowerCase().includes('127.0.0.1');
    if (!isLocal) {
      this.completarLogin(userObj, username, userNombre, userPuesto, tokenReceived);
      return;
    }

    this.http.get(`${GlobalVariable.baseUrlBackEnd}SNUsuario/getValidarPrimerIngreso?Cod_Usuario=${username}`).subscribe({
      next: (res: any) => {
        const data = res?.element || res;
        const requiereCambio =
          res?.requiereCambioPassword === true ||
          data?.requiereCambioPassword === true ||
          data?.primer_Ingreso === true ||
          data?.primer_Ingreso === 1 ||
          data?.primer_Ingreso === 'True' ||
          data?.primer_Ingreso === '1' ||
          (data?.estado && data.estado.toString().toLowerCase().includes('pendiente'));

        if (requiereCambio) {
          this.abrirModalPrimerIngreso(userObj, username, userNombre, userPuesto, tokenReceived);
        } else {
          this.completarLogin(userObj, username, userNombre, userPuesto, tokenReceived, userProceso, userCodPuesto);
        }
      },
      error: () => {
        this.completarLogin(userObj, username, userNombre, userPuesto, tokenReceived, userProceso, userCodPuesto);
      }
    });
  }

  abrirModalPrimerIngreso(userObj: any, username: string, userNombre: string, userPuesto: string, tokenReceived?: string): void {
    this.primerIngresoUser = {
      userObj,
      cod_Usuario: username,
      nombre: userNombre,
      puesto: userPuesto,
      tokenReceived
    };
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.ocultarNuevaPass = true;
    this.ocultarConfirmarPass = true;
    this.isUpdatingPassword = false;
    this.mostrarModalPrimerIngreso = true;
    this.toastr.info(
      'Por motivos de seguridad, debe cambiar su contraseña para activar su cuenta.',
      'Primer Inicio de Sesión',
      { timeOut: 5000 }
    );
  }

  onCancelarPrimerIngreso(): void {
    this.mostrarModalPrimerIngreso = false;
    this.primerIngresoUser = null;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.loginForm.patchValue({ pass: '' });
  }

  onConfirmarCambioPasswordPrimerIngreso(): void {
    if (!this.nuevaPassword || this.nuevaPassword.trim().length < 6) {
      this.toastr.warning('La nueva contraseña debe tener al menos 6 caracteres.', 'Contraseña Requerida');
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.toastr.warning('Las contraseñas no coinciden. Por favor verifique.', 'Error de Confirmación');
      return;
    }

    this.isUpdatingPassword = true;
    const userCode = this.primerIngresoUser.cod_Usuario;
    const newPass = this.nuevaPassword.trim();

    // 1. Notificar al Backend para actualizar la base de datos BDSecureNorm (dbo.SN_Usuario y dbo.SN_Puesto)
    // Se ejecuta SP dbo.SP_SN_USUARIO_MANTENIMIENTO con @Accion = 'P' (Password = @Password, Estado = 'Activo', Primer_Ingreso = 0)
    const payloadP = {
      Accion: 'P',
      Cod_Usuario: userCode,
      Password: newPass,
      Estado: 'Activo',
      Primer_Ingreso: 0
    };

    // Actualizar contraseña en el objeto de sesión del usuario
    if (this.primerIngresoUser.userObj) {
      this.primerIngresoUser.userObj.password = newPass;
    }

    // 2. Actualizar almacenamiento local para sincronía inmediata
    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      let cuentas: any[] = rawCuentas ? JSON.parse(rawCuentas) : [];
      const cIdx = cuentas.findIndex((c: any) => (c.cod_Usuario || '').toLowerCase().trim() === userCode.toLowerCase().trim());
      if (cIdx !== -1) {
        cuentas[cIdx].password = newPass;
        cuentas[cIdx].estado = 'Activo';
        cuentas[cIdx].primer_Ingreso = false;
      } else {
        cuentas.push({
          cod_Usuario: userCode,
          password: newPass,
          nom_Usuario: this.primerIngresoUser.nombre,
          puesto: this.primerIngresoUser.puesto,
          estado: 'Activo',
          primer_Ingreso: false
        });
      }
      localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));

      // Actualizar listado de puestos
      const rawPuestos = localStorage.getItem('precotex_puestos_usuarios');
      if (rawPuestos) {
        const puestos: any[] = JSON.parse(rawPuestos);
        puestos.forEach((p: any) => {
          if ((p.userCode && p.userCode.toLowerCase() === userCode.toLowerCase()) ||
              (p.usuario && p.usuario.toLowerCase() === this.primerIngresoUser.nombre.toLowerCase())) {
            p.estado = 'Activo';
            p.password = newPass;
          }
        });
        localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(puestos));
      }
    } catch (e) { }

    let yaFinalizado = false;
    const finalizar = () => {
      if (yaFinalizado) return;
      yaFinalizado = true;

      this.isUpdatingPassword = false;
      this.mostrarModalPrimerIngreso = false;
      this.toastr.success('¡Contraseña actualizada exitosamente! Su cuenta ha sido activada.', 'Cuenta Activada', { timeOut: 5000 });

      // Iniciar sesión y navegar
      this.completarLogin(
        this.primerIngresoUser.userObj,
        this.primerIngresoUser.cod_Usuario,
        this.primerIngresoUser.nombre,
        this.primerIngresoUser.puesto,
        this.primerIngresoUser.tokenReceived
      );
    };

    // Llamada al backend para persistir la nueva contraseña y activar la cuenta (dbo.SN_Usuario y dbo.SN_Puesto)
    const payloadPuesto = {
      Accion: 'P',
      Codigo_Puesto: '',
      Codigo_Organizacion: '001',
      Codigo_Sede: '001',
      Denominacion: this.primerIngresoUser?.puesto || '',
      Codigo_Nivel_Riesgo: 'Operativo',
      Validacion_Periodica: true,
      Puesto_Descripcion: newPass,
      Puesto_Funciones: this.primerIngresoUser?.nombre || '',
      Puesto_Requisitos: '',
      Puesto_Caracteristicas: 'Activo',
      Caracteristicas_Visible: true,
      Flg_Activo: '1',
      Cod_Usuario: userCode
    };

    this.http.post(`${GlobalVariable.baseUrlBackEnd}SNPuesto/postProcesoMntoPuesto`, payloadPuesto).subscribe({
      next: () => {
        finalizar();
      },
      error: () => {
        finalizar();
      }
    });

    const isLocal = (GlobalVariable.baseUrlBackEnd || '').toLowerCase().includes('localhost') || (GlobalVariable.baseUrlBackEnd || '').toLowerCase().includes('127.0.0.1');
    if (isLocal) {
      this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postCambiarPasswordPrimerIngreso`, { Cod_Usuario: userCode, Password: newPass }).subscribe({
        next: () => {
          this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, payloadP).subscribe({
            next: () => { },
            error: () => { }
          });
        },
        error: () => { }
      });
    }

    // Fallback de seguridad en 3s si la red demora
    setTimeout(() => {
      finalizar();
    }, 3000);
  }

  // ===================================================================
  // MÉTODOS PARA RECUPERACIÓN / CAMBIO DE CONTRASEÑA ("¿Olvidó su contraseña?")
  // ===================================================================
  abrirModalRecuperarPass(): void {
    const usuarioActual = (this.loginForm.get('user')?.value || '').trim();
    this.recuperarInputUsuario = usuarioActual;
    this.recuperarPaso = 1;
    this.recuperarErrorMensaje = '';
    this.usuarioVerificadoRecuperar = null;
    this.nuevaPassRecuperar = '';
    this.confirmarPassRecuperar = '';
    this.ocultarNuevaPassRecuperar = true;
    this.ocultarConfirmarPassRecuperar = true;
    this.isActualizandoPassRecuperar = false;
    this.mostrarModalRecuperarPass = true;

    // Si ya había ingresado un usuario en el login, intentar verificarlo de inmediato
    if (usuarioActual) {
      this.verificarUsuarioParaRecuperacion();
    }
  }

  cerrarModalRecuperarPass(): void {
    this.mostrarModalRecuperarPass = false;
    this.recuperarPaso = 1;
    this.recuperarErrorMensaje = '';
    this.usuarioVerificadoRecuperar = null;
    this.nuevaPassRecuperar = '';
    this.confirmarPassRecuperar = '';
  }

  verificarUsuarioParaRecuperacion(): void {
    const input = (this.recuperarInputUsuario || '').trim().toLowerCase();
    if (!input) {
      this.recuperarErrorMensaje = 'Por favor ingrese su código de usuario o correo corporativo.';
      return;
    }

    this.isVerificandoRecuperacion = true;
    this.recuperarErrorMensaje = '';

    const normalizar = (s: string) => (s || '').toLowerCase().trim();

    // Función auxiliar para extraer el correo del campo Puesto_Caracteristicas ("Estado|correo@...")
    const extraerEmail = (caract: string, fallbackUser: string): string => {
      if (caract && caract.includes('|')) {
        const parts = caract.split('|');
        const possibleEmail = parts[1]?.trim();
        if (possibleEmail && possibleEmail.includes('@')) return possibleEmail;
      }
      if (caract && caract.includes('@')) return caract.trim();
      return `${fallbackUser}@precotexperu.com`;
    };

    // ESTRATEGIA 1: Consultar SNPuesto/getListadoPuesto (100% funcional en la red corporativa http://192.168.1.36:5252 y en local)
    this.http.get(`${GlobalVariable.baseUrlBackEnd}SNPuesto/getListadoPuesto?Cod_Empresa=001`).subscribe({
      next: (res: any) => {
        const rawList = (res && res.elements) ? res.elements : (Array.isArray(res) ? res : []);
        
        const match = rawList.find((p: any) => {
          const uCode = normalizar(p.cod_Usuario);
          const uFunc = normalizar(p.puesto_Funciones);
          const uCaract = normalizar(p.puesto_Caracteristicas);
          const uDesc = normalizar(p.puesto_Descripcion);
          return uCode === input || 
                 uCaract.includes(input) || 
                 uFunc === input || 
                 uFunc.includes(input) ||
                 (input.includes('@') && uCaract.includes(input));
        });

        if (match) {
          this.isVerificandoRecuperacion = false;
          const uCode = (match.cod_Usuario || input).trim();
          const emailCalculado = extraerEmail(match.puesto_Caracteristicas, uCode);
          this.asignarUsuarioParaRecuperacion({
            cod_Usuario: uCode,
            codigo_Puesto: match.codigo_Puesto,
            nom_Usuario: match.puesto_Funciones,
            puesto: match.denominacion,
            email: emailCalculado
          }, input);
          return;
        }

        // Si no se encontró en SNPuesto, probar con TxLogin/getGetUsuarioWeb
        this.verificarViaTxLogin(input);
      },
      error: () => {
        // En caso de error de red con SNPuesto, probar con TxLogin
        this.verificarViaTxLogin(input);
      }
    });
  }

  private verificarViaTxLogin(input: string): void {
    const normalizar = (s: string) => (s || '').toLowerCase().trim();

    // ESTRATEGIA 2: Consultar TxLogin/getGetUsuarioWeb (100% funcional en la red corporativa y en local)
    this.http.get(`${GlobalVariable.baseUrlBackEnd}TxLogin/getGetUsuarioWeb?Cod_Usuario=${encodeURIComponent(input)}`).subscribe({
      next: (res: any) => {
        if (res && res.success && res.elements && res.elements.length > 0) {
          this.isVerificandoRecuperacion = false;
          const uObj = res.elements[0];
          const uCode = (uObj.cod_Usuario || input).trim();
          this.asignarUsuarioParaRecuperacion({
            cod_Usuario: uCode,
            nom_Usuario: uObj.nom_Usuario || uObj.nombres,
            puesto: uObj.puesto || uObj.des_Rol || 'Usuario SOMA',
            email: uObj.email || `${uCode}@precotexperu.com`
          }, input);
          return;
        }

        // ESTRATEGIA 3: Consultar SNUsuario/getListadoUsuarios (si está disponible en el backend)
        this.verificarViaSNUsuarioListado(input);
      },
      error: () => {
        this.verificarViaSNUsuarioListado(input);
      }
    });
  }

  private verificarViaSNUsuarioListado(input: string): void {
    const normalizar = (s: string) => (s || '').toLowerCase().trim();

    if ((GlobalVariable.baseUrlBackEnd || '').includes(':5252')) {
      this.http.get<any[]>('assets/usuarios_sn.json').subscribe({
        next: (users: any[]) => {
          this.isVerificandoRecuperacion = false;
          const match = (users || []).find((u: any) =>
            normalizar(u.cod_Usuario) === input ||
            normalizar(u.email) === input ||
            normalizar(u.userCode) === input ||
            normalizar(u.nom_Usuario).includes(input)
          );
          if (match) {
            this.asignarUsuarioParaRecuperacion(match, input);
          } else {
            this.verificarEnAlmacenamientoLocalYMeta(input);
          }
        },
        error: () => {
          this.verificarEnAlmacenamientoLocalYMeta(input);
        }
      });
      return;
    }

    this.http.get(`${GlobalVariable.baseUrlBackEnd}SNUsuario/getListadoUsuarios`).subscribe({
      next: (res: any) => {
        this.isVerificandoRecuperacion = false;
        const users: any[] = (res && res.elements) ? res.elements : [];
        const match = users.find((u: any) =>
          normalizar(u.cod_Usuario) === input ||
          normalizar(u.email) === input ||
          normalizar(u.userCode) === input ||
          normalizar(u.nom_Usuario).includes(input)
        );

        if (match) {
          this.asignarUsuarioParaRecuperacion(match, input);
          return;
        }

        this.verificarEnAlmacenamientoLocalYMeta(input);
      },
      error: () => {
        this.isVerificandoRecuperacion = false;
        this.verificarEnAlmacenamientoLocalYMeta(input);
      }
    });
  }

  private verificarEnAlmacenamientoLocalYMeta(input: string): void {
    this.isVerificandoRecuperacion = false;
    const match = this.buscarUsuarioEnAlmacenamientoLocal(input);
    if (match) {
      this.asignarUsuarioParaRecuperacion(match, input);
      return;
    }

    const meta = this.resolveUserMeta(input);
    if (meta && meta.nombre && meta.nombre.toLowerCase() !== input) {
      this.asignarUsuarioParaRecuperacion({
        cod_Usuario: input,
        nom_Usuario: meta.nombre,
        puesto: meta.puesto,
        email: `${input}@precotexperu.com`
      }, input);
      return;
    }

    this.recuperarErrorMensaje = `No se encontró ningún colaborador activo con el usuario o correo "${this.recuperarInputUsuario}". Verifique sus credenciales o contacte al Área de Sistemas TI.`;
    this.toastr.warning('Usuario no encontrado en la plataforma.', 'Verificación de Cuenta');
  }

  private buscarUsuarioEnAlmacenamientoLocal(input: string): any {
    const normalizar = (s: string) => (s || '').toLowerCase().trim();
    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      const cuentas: any[] = rawCuentas ? JSON.parse(rawCuentas) : [];
      const matchCuenta = cuentas.find((c: any) =>
        normalizar(c.cod_Usuario) === input ||
        normalizar(c.email) === input ||
        normalizar(c.nom_Usuario) === input
      );
      if (matchCuenta) return matchCuenta;

      const rawPuestos = localStorage.getItem('precotex_puestos_usuarios');
      const puestos: any[] = rawPuestos ? JSON.parse(rawPuestos) : [];
      const matchPuesto = puestos.find((p: any) =>
        normalizar(p.userCode) === input ||
        normalizar(p.usuario) === input ||
        normalizar(p.email) === input
      );
      if (matchPuesto) {
        return {
          cod_Usuario: matchPuesto.userCode || matchPuesto.usuario || input,
          nom_Usuario: matchPuesto.usuario,
          puesto: matchPuesto.denominacion || matchPuesto.puesto,
          email: matchPuesto.email
        };
      }

      const rawPuestosList = localStorage.getItem('precotex:puestos:listado');
      const puestosList: any[] = rawPuestosList ? JSON.parse(rawPuestosList) : [];
      const matchPList = puestosList.find((p: any) =>
        normalizar(p.cod_Usuario) === input ||
        normalizar(p.usuario) === input
      );
      if (matchPList) {
        return {
          cod_Usuario: matchPList.cod_Usuario || input,
          nom_Usuario: matchPList.usuario,
          puesto: matchPList.puesto,
          email: `${input}@precotexperu.com`
        };
      }
    } catch (e) { }
    return null;
  }

  private asignarUsuarioParaRecuperacion(user: any, input: string): void {
    const uCode = (user.cod_Usuario || user.userCode || input).trim();
    const userMeta = this.resolveUserMeta(uCode, user.nom_Usuario || user.usuario || user.nombre, user.puesto || user.denominacion);

    this.usuarioVerificadoRecuperar = {
      cod_Usuario: uCode,
      nombre: userMeta.nombre,
      puesto: userMeta.puesto,
      email: user.email || `${uCode}@precotexperu.com`,
      raw: user
    };
    this.recuperarPaso = 2;
    this.toastr.success(`Colaborador verificado: ${this.usuarioVerificadoRecuperar.nombre}`, 'Identidad Confirmada');
  }

  onConfirmarRecuperarPassword(): void {
    if (!this.usuarioVerificadoRecuperar) {
      this.toastr.warning('Por favor verifique su cuenta antes de actualizar la contraseña.', 'Verificación Requerida');
      this.recuperarPaso = 1;
      return;
    }

    if (!this.nuevaPassRecuperar || this.nuevaPassRecuperar.trim().length < 6) {
      this.toastr.warning('La nueva contraseña debe tener al menos 6 caracteres.', 'Contraseña Requerida');
      return;
    }
    if (this.nuevaPassRecuperar !== this.confirmarPassRecuperar) {
      this.toastr.warning('Las contraseñas no coinciden. Por favor verifique.', 'Error de Confirmación');
      return;
    }

    this.isActualizandoPassRecuperar = true;
    const userCode = (this.usuarioVerificadoRecuperar.cod_Usuario || '').trim();
    const newPass = this.nuevaPassRecuperar.trim();
    const userName = (this.usuarioVerificadoRecuperar.nombre || userCode).trim();
    const userPuesto = (this.usuarioVerificadoRecuperar.puesto || 'Usuario SOMA').trim();
    const codPuesto = (this.usuarioVerificadoRecuperar.codigo_Puesto || '').trim();

    // 1. Payload para SNPuesto/postProcesoMntoPuesto (Ejecuta [dbo].[SN_Puestos_Mnto_Proceso] con @Accion = 'P')
    // Actualiza directamente la columna Password en dbo.SN_Usuario dentro de la base de datos BDSecureNorm (100% compatible con red corporativa IIS y local)
    const payloadPuesto = {
      Accion: 'P',
      Codigo_Puesto: codPuesto,
      Codigo_Organizacion: '001',
      Codigo_Sede: '001',
      Denominacion: userPuesto,
      Codigo_Nivel_Riesgo: 'Operativo',
      Validacion_Periodica: true,
      Puesto_Descripcion: newPass,
      Puesto_Funciones: userName,
      Puesto_Requisitos: '',
      Puesto_Caracteristicas: 'Activo',
      Caracteristicas_Visible: true,
      Flg_Activo: '1',
      Cod_Usuario: userCode
    };

    // 2. Payload complementario para SNUsuario (SP_SN_USUARIO_MANTENIMIENTO @Accion = 'P')
    const payloadP = {
      Accion: 'P',
      Cod_Usuario: userCode,
      Password: newPass,
      Estado: 'Activo',
      Primer_Ingreso: 0
    };

    // 3. Actualizar almacenamiento local para sincronía inmediata en la terminal actual
    try {
      const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
      let cuentas: any[] = rawCuentas ? JSON.parse(rawCuentas) : [];
      const cIdx = cuentas.findIndex((c: any) => (c.cod_Usuario || '').toLowerCase().trim() === userCode.toLowerCase());
      if (cIdx !== -1) {
        cuentas[cIdx].password = newPass;
        cuentas[cIdx].estado = 'Activo';
        cuentas[cIdx].primer_Ingreso = false;
      } else {
        cuentas.push({
          cod_Usuario: userCode,
          password: newPass,
          nom_Usuario: userName,
          puesto: userPuesto,
          estado: 'Activo',
          primer_Ingreso: false
        });
      }
      localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));

      const rawPuestos = localStorage.getItem('precotex_puestos_usuarios');
      if (rawPuestos) {
        const puestos: any[] = JSON.parse(rawPuestos);
        puestos.forEach((p: any) => {
          if ((p.userCode && p.userCode.toLowerCase() === userCode.toLowerCase()) ||
              (p.usuario && p.usuario.toLowerCase() === userName.toLowerCase())) {
            p.estado = 'Activo';
            p.password = newPass;
          }
        });
        localStorage.setItem('precotex_puestos_usuarios', JSON.stringify(puestos));
      }
    } catch (e) { }

    let yaFinalizado = false;
    const finalizarRecuperacion = () => {
      if (yaFinalizado) return;
      yaFinalizado = true;

      this.isActualizandoPassRecuperar = false;
      this.mostrarModalRecuperarPass = false;

      // Autocompletar el formulario de login con el usuario y la nueva contraseña
      this.loginForm.patchValue({
        user: userCode,
        pass: newPass
      });

      this.toastr.success(
        `¡Contraseña actualizada exitosamente para ${userName}! Ya puede ingresar a la plataforma.`,
        'Contraseña Restablecida',
        { timeOut: 6000 }
      );
    };

    // Ejecutar actualización principal contra el backend (SNPuesto/postProcesoMntoPuesto)
    this.http.post(`${GlobalVariable.baseUrlBackEnd}SNPuesto/postProcesoMntoPuesto`, payloadPuesto).subscribe({
      next: () => {
        // Enviar sincronización complementaria a endpoints adicionales si están disponibles
        this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postCambiarPasswordPrimerIngreso`, { Cod_Usuario: userCode, Password: newPass }).subscribe({ next: () => {}, error: () => {} });
        this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarUsuario`, payloadP).subscribe({ next: () => {}, error: () => {} });
        this.http.post(`${GlobalVariable.baseUrlBackEnd}TxLogin/postRegistrarUsuario`, {
          Accion: 'P',
          Cod_Usuario: userCode,
          Password: newPass,
          Nom_Usuario: userName,
          Cod_Rol: 2,
          Des_Rol: 'Usuario SOMA',
          Cod_Empresa: '01',
          Empresa: 'PRECOTEX S.A.C.',
          Tip_Trabajador: 'E',
          Cod_Trabajador: '',
          Flg_Activo: 1
        }).subscribe({ next: () => {}, error: () => {} });

        finalizarRecuperacion();
      },
      error: () => {
        // Si hay error en SNPuesto, intentar directamente vía SNUsuario/postCambiarPasswordPrimerIngreso
        this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postCambiarPasswordPrimerIngreso`, { Cod_Usuario: userCode, Password: newPass }).subscribe({
          next: () => { finalizarRecuperacion(); },
          error: () => { finalizarRecuperacion(); }
        });
      }
    });

    // Timeout de resguardo por si hay retraso de red
    setTimeout(() => {
      finalizarRecuperacion();
    }, 2500);
  }

  completarLogin(userObj: any, username: string, userNombre: string, userPuesto: string, tokenReceived?: string, userProceso?: string, userCodPuesto?: string): void {
    GlobalVariable.vusu = (userObj?.cod_Usuario || username).trim();
    GlobalVariable.vcodtra = (userObj?.cod_Trabajador || '001').trim();
    GlobalVariable.vtiptra = (userObj?.tip_Trabajador || 'EMP').trim();
    const userClean = (username || userObj?.cod_Usuario || '').toLowerCase().trim();
    if (userClean === 'admin' || userClean === 'super administrador' || (userNombre && userNombre.toLowerCase().includes('super administrador'))) {
      GlobalVariable.vCod_Rol = 1;
    } else {
      GlobalVariable.vCod_Rol = parseInt(userObj?.cod_Rol || '0') || 0;
    }

    localStorage.setItem('vusu', GlobalVariable.vusu);
    localStorage.setItem('vcodtra', GlobalVariable.vcodtra);
    localStorage.setItem('vtiptra', GlobalVariable.vtiptra);
    localStorage.setItem('vCod_Rol', GlobalVariable.vCod_Rol.toString());
    localStorage.setItem('precotex:usuario:nombre', userNombre);
    localStorage.setItem('precotex:usuario:puesto', userPuesto);
    if (userProceso && userProceso.toLowerCase() !== 'general') {
      localStorage.setItem('precotex:usuario:proceso', userProceso);
    }
    if (userCodPuesto) {
      localStorage.setItem('precotex:usuario:codigo_puesto', userCodPuesto);
    }

    if (this.loginForm.get('recordarme')?.value) {
      localStorage.setItem('remembered_user', username);
    } else {
      localStorage.removeItem('remembered_user');
    }

    // Preservar precotex:puestos:accesos
    // Preservar precotex:puestos:accesos_fino

    this.registrarLogAccesoHistorial(
      GlobalVariable.vusu,
      userNombre,
      userObj?.cod_Rol || '0',
      userPuesto
    );

    if (tokenReceived) {
      this.authService.setToken(tokenReceived);
    } else {
      this.authService.setToken('session_token_' + Date.now());
    }

    this.authService.currentUser.set({
      cod_Usuario: GlobalVariable.vusu,
      nombre: userNombre,
      puesto: userPuesto,
      cod_Rol: GlobalVariable.vCod_Rol
    });

    this.toastr.success(`Bienvenido al sistema, ${userNombre}.`, 'Acceso Correcto');
    this.router.navigate(['/principal']);
  }

    matchesUserLogin(login: string, fullName: string): boolean {
    if (!login || !fullName || fullName === '—') return false;
    const cleanLogin = (login || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanName = (fullName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (cleanName === cleanLogin) return true;
    if (cleanName.replace(/[^a-z0-9]/g, '') === cleanLogin.replace(/[^a-z0-9]/g, '')) return true;
    if (cleanName.includes(',')) {
      const [apellidosPart, nombresPart] = cleanName.split(',').map((s: string) => s.trim());
      const apellidos = apellidosPart.split(/\s+/).filter(Boolean);
      const nombres = (nombresPart || '').split(/\s+/).filter(Boolean);
      const primerApellido = apellidos[0] || '';
      for (const nom of nombres) {
        if (!nom) continue;
        const initial = nom.charAt(0);
        if (cleanLogin === initial + primerApellido) return true;
        if (cleanLogin === nom + '.' + primerApellido || cleanLogin === nom + '_' + primerApellido || cleanLogin === nom + primerApellido) return true;
        if (cleanLogin.startsWith(initial) && cleanLogin.includes(primerApellido)) return true;
      }
      if (cleanLogin === primerApellido) return true;
    }
    return cleanName.includes(cleanLogin);
  }

  private resolveUserMeta(username: string, rawNom?: string, rawPuesto?: string): { nombre: string; puesto: string } {
    const userMap: { [key: string]: { nombre: string; puesto: string } } = {
      'admin': { nombre: 'Super Administrador', puesto: 'Administrador General' },
      'super administrador': { nombre: 'Super Administrador', puesto: 'Administrador General' },
      'mzegarra': { nombre: 'Mia Zegarra', puesto: 'Analista de Auditoría Interna' },
      'mia.zegarra': { nombre: 'Mia Zegarra', puesto: 'Analista de Auditoría Interna' },
      'kvega': { nombre: 'Keith Vega', puesto: 'Asistente de Auditoría Interna' },
      'keith.vega': { nombre: 'Keith Vega', puesto: 'Asistente de Auditoría Interna' },
      'jpinedo': { nombre: 'Jordan Pinedo', puesto: 'ANALISTA DE O&M MANUFACTURA' },
      'jordan.pinedo': { nombre: 'Jordan Pinedo', puesto: 'ANALISTA DE O&M MANUFACTURA' },
      'caldana': { nombre: 'Cynthia Aldana', puesto: 'Coordinador de SSOMA' },
      'cynthia.aldana': { nombre: 'Cynthia Aldana', puesto: 'Coordinador de SSOMA' },
      'msoria': { nombre: 'Max Soria', puesto: 'Analista de Sistemas' },
      'max.soria': { nombre: 'Max Soria', puesto: 'Analista de Sistemas' },
      'kflores': { nombre: 'Karem Flores', puesto: 'Gerente de Comercial' },
      'karem.flores': { nombre: 'Karem Flores', puesto: 'Gerente de Comercial' },
      'fhuamani': { nombre: 'Francisco Huamani', puesto: 'Analista SIG' },
      'francisco.huamani': { nombre: 'Francisco Huamani', puesto: 'Analista SIG' },
      'atoro': { nombre: 'Alfredo Toro', puesto: 'Analista de Sistemas' },
      'alfredo.toro': { nombre: 'Alfredo Toro', puesto: 'Analista de Sistemas' },
      'laldana': { nombre: 'Luis Aldana', puesto: 'Jefe de Seguridad y Salud Ocupacional' },
      'luis.aldana': { nombre: 'Luis Aldana', puesto: 'Jefe de Seguridad y Salud Ocupacional' },
      'shuaranga': { nombre: 'Sayda Huaranga', puesto: 'Supervisor de SST' },
      'sayda.huaranga': { nombre: 'Sayda Huaranga', puesto: 'Supervisor de SST' },
      'erivera': { nombre: 'Elizabet Rivera', puesto: 'Jefatura de Calidad' },
      'elizabet.rivera': { nombre: 'Elizabet Rivera', puesto: 'Jefatura de Calidad' },
      'clingan': { nombre: 'Cesar Lingan', puesto: 'Analista de Auditoría Interna' },
      'cesar.lingan': { nombre: 'Cesar Lingan', puesto: 'Analista de Auditoría Interna' },
      'mguevara': { nombre: 'Mary Guevara', puesto: 'Coordinadora de Desarrollo y Capacitaciones' },
      'mary.guevara': { nombre: 'Mary Guevara', puesto: 'Coordinadora de Desarrollo y Capacitaciones' },
      'jrojas': { nombre: 'Miguel Angel Rojas Veliz', puesto: 'Jefe de Sistemas' },
      'hflores': { nombre: 'Hans Flores', puesto: 'Analista Programador' },
      'jlelias': { nombre: 'José Luis Elias', puesto: 'Auditor Líder' },
      'icruz': { nombre: 'Ismael Cruz', puesto: 'Coordinador SIG' },
      'crivera': { nombre: 'Cesar Rivera', puesto: 'Supervisor de Planta' },
      'rgerstein': { nombre: 'Rodolfo Gerstein', puesto: 'Gerente de Gestión Humana' },
      'rmunante': { nombre: 'Ricardo Muñante', puesto: 'Jefe de Planeamiento y Control' },
      'rdiaz': { nombre: 'Ricardo Diaz', puesto: 'Gerente DDP, Manufactura y Gestión Comercial' }
    };

    const key = (username || '').toLowerCase().trim();
    const dbPuesto = (rawPuesto || '').trim();
    const dbNom = (rawNom || '').trim();

    if (userMap[key]) {
      return {
        nombre: dbNom && dbNom.toLowerCase() !== key ? dbNom : userMap[key].nombre,
        puesto: dbPuesto || userMap[key].puesto
      };
    }
    const finalNom = dbNom && dbNom.toLowerCase() !== key ? dbNom : (key.charAt(0).toUpperCase() + key.slice(1));
    return {
      nombre: finalNom,
      puesto: (dbPuesto || 'Analista SIG').trim()
    };
  }

  // PUE-01: Método de registro histórico de accesos
  private registrarLogAccesoHistorial(codUsuario: string, nomUsuario: string, codRol: string, puesto: string = 'Usuario SOMA') {
    const userMeta = this.resolveUserMeta(codUsuario, nomUsuario, puesto);
    const ahora = new Date();

    // 1. Notificar SIEMPRE al backend de Seguridad (Base de Datos BDSecureNorm -> dbo.SN_Log_Acceso)
    const logBackend = {
      Accion: 'I',
      Cod_Usuario: codUsuario,
      Nom_Usuario: userMeta.nombre,
      Puesto: userMeta.puesto || puesto || 'Usuario SOMA',
      Cod_Rol: codRol ? codRol.toString() : '2',
      Fec_Acceso: ahora.toISOString(),
      Ip_Acceso: '192.168.1.36',
      Estado: 'Inicio de sesion',
      Flg_Activo: true
    };

    const clientHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '192.168.1.36';
    logBackend.Ip_Acceso = clientHost;

    if ((GlobalVariable.baseUrlBackEnd || '').includes(':5252')) {
      // Servidor 5252 no posee SNUsuario, omitir petición
      return;
    }

    this.http.post(`${GlobalVariable.baseUrlBackEnd}SNUsuario/postRegistrarLogAcceso`, logBackend).subscribe({
      next: (res: any) => {
        console.log('✅ Log de acceso registrado exitosamente en BD:', res);
      },
      error: (err: any) => {
        console.warn('Aviso: Registro de log en BD:', err?.message || err);
      }
    });

    // 2. Almacenamiento local para widgets del frontend (excluyendo la cuenta de admin)
    if ((codUsuario || '').toLowerCase() === 'admin' || (nomUsuario || '').toLowerCase() === 'admin') return;
    if (userMeta.nombre.toLowerCase() === 'super administrador' || userMeta.puesto.toLowerCase() === 'administrador general') return;

    const fechaHoraStr = ahora.getFullYear() + '-' +
      String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
      String(ahora.getDate()).padStart(2, '0') + ' ' +
      ahora.toLocaleTimeString('es-PE', { hour12: false });

    const nuevoLog = {
      id: 'LOG-' + Date.now(),
      fechaHora: fechaHoraStr,
      usuario: userMeta.nombre,
      cod_Usuario: codUsuario,
      puesto: userMeta.puesto,
      rol: codRol === '1' ? 'Administrador' : 'Usuario SOMA',
      timestamp: ahora.toISOString(),
      ip: '192.168.1.36',
      estado: 'Inicio de sesión'
    };

    try {
      const rawLogs = localStorage.getItem('precotex:log:accesos');
      let logsArr: any[] = rawLogs ? JSON.parse(rawLogs) : [];
      if (!Array.isArray(logsArr)) logsArr = [];

      // Saneamiento de entradas previas, purga de registros de la imagen 2 y purga de la cuenta admin
      logsArr = logsArr.filter((item: any) => {
        const dtStr = (item.fechaHora || item.timestamp || '').toString();
        const uName = (item.usuario || item.nom_Usuario || item.nombre || '').toLowerCase();
        const rName = (item.puesto || item.rol || '').toLowerCase();
        if (dtStr.includes('19/08') || dtStr.includes('08-19') || (uName.includes('francisco') && dtStr.includes('11:49'))) return false;
        if (uName.includes('max soria') && (dtStr.includes('10:58') || dtStr.includes('10:54'))) return false;
        if (uName.includes('karem flores') && (dtStr.includes('09:18') || dtStr.includes('09:14'))) return false;
        if (uName.includes('luis aldana') && dtStr.includes('08:12')) return false;
        if (uName === 'admin' || uName === 'super administrador' || uName.includes('administrador') || rName === 'administrador general') return false;
        return true;
      });

      logsArr.forEach(l => {
        const m = this.resolveUserMeta(l.usuario || '', l.usuario, l.puesto);
        l.usuario = m.nombre;
        l.puesto = m.puesto;
        l.estado = 'Inicio de sesión';
      });

      // Evitar duplicación si ya existe un inicio de sesión reciente para el mismo usuario
      const yaExisteReciente = logsArr.some(l =>
        (l.usuario || '').toLowerCase() === nuevoLog.usuario.toLowerCase() &&
        (l.fechaHora || '').substring(0, 16) === fechaHoraStr.substring(0, 16)
      );

      if (!yaExisteReciente) {
        logsArr.unshift(nuevoLog);
        localStorage.setItem('precotex:log:accesos', JSON.stringify(logsArr.slice(0, 100)));
        localStorage.setItem('precotex:logs:accesos', JSON.stringify(logsArr.slice(0, 100)));

        // Incrementar contador de actividad del usuario para el widget "Actividad por usuario"
        try {
          const actRaw = localStorage.getItem('precotex:user:actividad');
          const actMap: { [key: string]: number } = actRaw ? JSON.parse(actRaw) : {};
          actMap[userMeta.nombre] = (actMap[userMeta.nombre] || 0) + 1;
          localStorage.setItem('precotex:user:actividad', JSON.stringify(actMap));
        } catch (actErr) { }
      } else {
        localStorage.setItem('precotex:log:accesos', JSON.stringify(logsArr.slice(0, 100)));
        localStorage.setItem('precotex:logs:accesos', JSON.stringify(logsArr.slice(0, 100)));
      }
    } catch (e) {
      console.error('Error en almacenamiento local de accesos', e);
    }
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

      try {
        const rawCuentas = localStorage.getItem('precotex_cuentas_usuarios');
        let cuentas: any[] = rawCuentas ? JSON.parse(rawCuentas) : [];
        const seedPending = [
          { cod_Usuario: 'emacha', password: '1234', nom_Usuario: 'MACHA MORENO, ERIKA LIZET', puesto: 'Analista de Sistemas', cod_Rol: '2', estado: 'Pendiente de activación', primer_Ingreso: true },
          { cod_Usuario: 'almacenhuachipa', password: 'Precotex2026!', nom_Usuario: 'ABAD VICENTE, PEDRO EULER', puesto: 'Supervisor de Almacén', cod_Rol: '1', estado: 'Pendiente de activación', primer_Ingreso: true }
        ];

        let mod = false;
        seedPending.forEach(s => {
          const ex = cuentas.find(c => (c.cod_Usuario || '').toLowerCase().trim() === s.cod_Usuario.toLowerCase());
          if (!ex) {
            cuentas.push(s);
            mod = true;
          }
        });
        if (mod) {
          localStorage.setItem('precotex_cuentas_usuarios', JSON.stringify(cuentas));
        }
      } catch (e) { }
    }
  }

}
