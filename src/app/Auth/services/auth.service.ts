import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../model/user';
import { LoginRequest } from '../model/login-request';
import { SignupRequest } from '../model/signup-request';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = 'http://localhost:8080/api/v1/auth'; // <-- Cambiado a tu backend real
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false); // Inicializar como false siempre

  constructor(private http: HttpClient) {
    // NO verificar automáticamente el localStorage al inicializar
    // Solo se autenticará cuando se haga login activamente
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
}
