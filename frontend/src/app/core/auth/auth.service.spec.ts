import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../api-config';
import { AuthResponse } from '../models/auth.model';
import { AuthService } from './auth.service';
import { BROWSER_STORAGE } from './browser-storage';

class FakeStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let localFake: FakeStorage;
  let sessionFake: FakeStorage;

  beforeEach(() => {
    localFake = new FakeStorage();
    sessionFake = new FakeStorage();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BROWSER_STORAGE, useValue: { local: localFake, session: sessionFake } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const sampleResponse: AuthResponse = {
    token: 'jwt-token',
    email: 'maria.keller@email.de',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  it('is not authenticated before login', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.userEmail()).toBeNull();
  });

  it('login() stores the session and exposes it via signals', async () => {
    const service = TestBed.inject(AuthService);

    const loginPromise = service.login({ email: 'maria.keller@email.de', password: 'x', rememberMe: false });
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush(sampleResponse);
    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.userEmail()).toBe('maria.keller@email.de');
    expect(service.token()).toBe('jwt-token');
  });

  it('login() with rememberMe=false stores the session in sessionStorage, not localStorage', async () => {
    const service = TestBed.inject(AuthService);

    const loginPromise = service.login({ email: 'maria.keller@email.de', password: 'x', rememberMe: false });
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush(sampleResponse);
    await loginPromise;

    expect(sessionFake.getItem('kontobuch.session')).not.toBeNull();
    expect(localFake.getItem('kontobuch.session')).toBeNull();
  });

  it('login() with rememberMe=true stores the session in localStorage, not sessionStorage', async () => {
    const service = TestBed.inject(AuthService);

    const loginPromise = service.login({ email: 'maria.keller@email.de', password: 'x', rememberMe: true });
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush(sampleResponse);
    await loginPromise;

    expect(localFake.getItem('kontobuch.session')).not.toBeNull();
    expect(sessionFake.getItem('kontobuch.session')).toBeNull();
  });

  it('logout() clears the session from both storages and signals', async () => {
    const service = TestBed.inject(AuthService);
    const loginPromise = service.login({ email: 'maria.keller@email.de', password: 'x', rememberMe: true });
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush(sampleResponse);
    await loginPromise;

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(localFake.getItem('kontobuch.session')).toBeNull();
    expect(sessionFake.getItem('kontobuch.session')).toBeNull();
  });

  it('restores a still-valid session from storage on construction', () => {
    localFake.setItem(
      'kontobuch.session',
      JSON.stringify({ token: 't', email: 'maria.keller@email.de', expiresAt: new Date(Date.now() + 60_000).toISOString() }),
    );

    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.userEmail()).toBe('maria.keller@email.de');
  });

  it('does not restore an expired session from storage', () => {
    localFake.setItem(
      'kontobuch.session',
      JSON.stringify({ token: 't', email: 'maria.keller@email.de', expiresAt: new Date(Date.now() - 60_000).toISOString() }),
    );

    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBe(false);
    expect(localFake.getItem('kontobuch.session')).toBeNull();
  });
});
