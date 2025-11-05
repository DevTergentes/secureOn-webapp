import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../model/user';
import { LoginRequest } from '../model/login-request';
import { SignupRequest } from '../model/signup-request';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = 'http://localhost:8080/api/v1/auth'; // <-- Cambiado a tu backend real
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidSession()); // Verificar sesión inmediatamente

  constructor(private http: HttpClient) {
    // La verificación ya se hace en la inicialización del BehaviorSubject
  }

  private hasValidSession(): boolean {
    // Verificación síncrona al momento de crear el servicio
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return !!user; // Si hay datos válidos, retorna true
      } catch (error) {
        // Si hay error parsing, limpiar datos corruptos
        localStorage.removeItem('user');
        return false;
      }
    }
    return false;
  }

  checkInitialAuthState(): void {
    // Esta función ya no es necesaria, pero la mantengo para compatibilidad
    // La verificación se hace automáticamente en hasValidSession()
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
