import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../model/user';
import { LoginRequest } from '../model/login-request';
import { SignupRequest } from '../model/signup-request';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = 'http://localhost:8080/api/v1/auth'; // <-- Cambiado a tu backend real
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false); // Inicializar como false por defecto

  constructor(private http: HttpClient) {
    // No verificar inmediatamente, mantener como false hasta login exitoso
  }

  private hasValidSession(): boolean {
    // Verificación más estricta de sesión válida
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Verificar que el usuario tenga propiedades mínimas necesarias
        return !!(user && user.id && user.username);
      } catch (error) {
        // Si hay error parsing, limpiar datos corruptos
        localStorage.removeItem('user');
        return false;
      }
    }
    return false;
  }

  checkInitialAuthState(): void {
    console.log('AuthService: Checking initial auth state');
    // Solo verificar si hay datos de usuario válidos
    const userData = localStorage.getItem('user');
    console.log('AuthService: User data from localStorage:', userData);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.id) { // Verificar que el usuario tenga datos completos
          console.log('AuthService: Valid user found, setting authenticated to true');
          this.isAuthenticatedSubject.next(true);
          return;
        }
      } catch (error) {
        console.log('AuthService: Error parsing user data, clearing localStorage');
        // Si hay error, limpiar y mantener como false
        localStorage.removeItem('user');
      }
    }
    // Por defecto, mantener como false
    console.log('AuthService: No valid user, setting authenticated to false');
    this.isAuthenticatedSubject.next(false);
  }

  login(req: LoginRequest): Observable<User> {
    console.log('[LOGIN] Enviando al backend:', req);
    return this.http.post<User>(`${this.API_URL}/signin`, req);
  }

  signup(req: SignupRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/signup`, req); // <-- No User tipado
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('user');
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  setAuthenticated(value: boolean): void {
    console.log('AuthService: Setting authenticated to', value);
    this.isAuthenticatedSubject.next(value);
  }

  logout(): void {
    localStorage.removeItem('user');
    this.setAuthenticated(false);
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        // Si hay error, limpiar datos corruptos
        localStorage.removeItem('user');
        this.setAuthenticated(false);
        return null;
      }
    }
    return null;
  }
}
