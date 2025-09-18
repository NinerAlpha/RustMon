import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  loginWithDiscord(): void {
    window.location.href = `${environment.uDataApi}/auth/discord`;
  }

  loginWithSteam(): void {
    window.location.href = `${environment.uDataApi}/auth/steam`;
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.uDataApi}/auth/google`;
  }

  handleAuthCallback(token: string, userData: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.uDataApi}/auth/profile`);
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  provider: 'discord' | 'steam' | 'google';
  createdAt: string;
}