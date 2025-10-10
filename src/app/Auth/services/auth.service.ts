import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {User} from '../model/user';
import {LoginRequest} from '../model/login-request';
import {SignupRequest} from '../model/signup-request';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = 'http://localhost:8080/api/v1/authentication'; // Cambia por tu endpoint real

  constructor(private http: HttpClient) {}

  login(req: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/sign-in`, req);
  }

  signup(req: SignupRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/sign-up`, req);
  }
}
