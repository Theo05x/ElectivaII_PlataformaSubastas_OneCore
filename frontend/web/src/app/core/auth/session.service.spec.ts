import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { UserProfile } from '../api/api.models';

const TOKEN_KEY = 'onecore.session.token';

describe('SessionService', () => {
  let session: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem(TOKEN_KEY, 'legacy-shared-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    session.establish('test-token');
  });

  afterEach(() => http.verify());

  it('keeps the session in tab-scoped storage and removes the legacy shared token', () => {
    expect(session.token).toBe('test-token');
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('test-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('clears only the current tab session on logout', () => {
    session.clear();

    expect(session.token).toBeNull();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('shares the in-flight profile request and returns its cached result', () => {
    const profile: UserProfile = {
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.com' },
      publishedAuctions: [],
      participatedAuctions: []
    };
    const received: UserProfile[] = [];

    session.loadProfile().subscribe(result => received.push(result));
    session.loadProfile().subscribe(result => received.push(result));

    const request = http.expectOne('/api/v1/users/me');
    request.flush({ status: 'success', data: profile });
    session.loadProfile().subscribe(result => received.push(result));

    expect(received).toEqual([profile, profile, profile]);
  });
});
