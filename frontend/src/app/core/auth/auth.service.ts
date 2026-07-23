import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { BROWSER_STORAGE } from './browser-storage';

interface StoredSession {
  token: string;
  email: string;
  expiresAt: string;
}

const STORAGE_KEY = 'kontobuch.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BROWSER_STORAGE);

  private readonly session = signal<StoredSession | null>(this.restoreSession());

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly userEmail = computed(() => this.session()?.email ?? null);
  readonly token = computed(() => this.session()?.token ?? null);

  async login(request: LoginRequest): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, request),
    );
    this.setSession(response, request.rememberMe);
  }

  async register(request: RegisterRequest): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, request),
    );
    this.setSession(response, false);
  }

  logout(): void {
    this.storage.local.removeItem(STORAGE_KEY);
    this.storage.session.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private setSession(response: AuthResponse, remember: boolean): void {
    const stored: StoredSession = {
      token: response.token,
      email: response.email,
      expiresAt: response.expiresAt,
    };

    // Only one storage should ever hold the session at a time.
    (remember ? this.storage.session : this.storage.local).removeItem(STORAGE_KEY);
    (remember ? this.storage.local : this.storage.session).setItem(STORAGE_KEY, JSON.stringify(stored));

    this.session.set(stored);
  }

  private restoreSession(): StoredSession | null {
    const raw = this.storage.local.getItem(STORAGE_KEY) ?? this.storage.session.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        this.storage.local.removeItem(STORAGE_KEY);
        this.storage.session.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
