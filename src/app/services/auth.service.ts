import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { GlobalVariable } from '../VarGlobals';

export interface JwtPayload {
  sub?: string;
  name?: string;
  role?: string;
  exp?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'precotex_jwt_token';

  // State with Angular 19 Signals
  public currentUser = signal<any>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Obtener token de localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guardar token JWT en localStorage
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Eliminar token JWT de localStorage
   */
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * Decodificar payload de JWT sin librerías externas
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error al decodificar JWT token:', e);
      return null;
    }
  }

  /**
   * Verificar si el token actual es válido y no ha expirado
   */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      const isExpired = Date.now() >= decoded.exp * 1000;
      return !isExpired;
    }

    // Si no hay propiedad exp o es token simulado de transición, consideramos válido si existe vusu
    const storedUsu = typeof window !== 'undefined' ? localStorage.getItem('vusu') : null;
    return !!storedUsu || token.length > 10;
  }

  /**
   * Cierre de sesión y limpieza de tokens y variables
   */
  logout(redirect: boolean = true): void {
    this.removeToken();
    this.currentUser.set(null);

    // Limpiar variables de sesión
    GlobalVariable.vusu = '';
    GlobalVariable.vcodtra = '';
    GlobalVariable.vtiptra = '';
    GlobalVariable.vCod_Rol = 0;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('vusu');
      localStorage.removeItem('vcodtra');
      localStorage.removeItem('vtiptra');
      localStorage.removeItem('vCod_Rol');
      localStorage.removeItem('precotex:usuario:nombre');
      localStorage.removeItem('precotex:usuario:puesto');
    }

    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Carga inicial del usuario desde almacenamiento local
   */
  private loadUserFromStorage(): void {
    if (typeof window === 'undefined') return;

    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded) {
        this.currentUser.set(decoded);
      }
    }

    const storedUsu = localStorage.getItem('vusu');
    if (storedUsu) {
      GlobalVariable.vusu = storedUsu;
      GlobalVariable.vcodtra = localStorage.getItem('vcodtra') || '';
      GlobalVariable.vtiptra = localStorage.getItem('vtiptra') || '';
      GlobalVariable.vCod_Rol = parseInt(localStorage.getItem('vCod_Rol') || '0', 10);
      
      if (!this.currentUser()) {
        this.currentUser.set({
          cod_Usuario: storedUsu,
          nombre: localStorage.getItem('precotex:usuario:nombre') || storedUsu,
          puesto: localStorage.getItem('precotex:usuario:puesto') || ''
        });
      }
    }
  }
}
