/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { SessionService } from './session.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => controller.verify());

  it('adds the persisted bearer token only to API calls', () => {
    session.establish('academic-test-token');
    http.get('/api/v1/users/me').subscribe();
    const protectedRequest = controller.expectOne('/api/v1/users/me');
    expect(protectedRequest.request.headers.get('Cache-Control')).toBe('no-cache');
    expect(protectedRequest.request.headers.get('Pragma')).toBe('no-cache');
    expect(protectedRequest.request.headers.get('Authorization')).toBe('Bearer academic-test-token');
    protectedRequest.flush({ status: 'success', data: {} });

    http.get('/assets/status.json').subscribe();
    const publicRequest = controller.expectOne('/assets/status.json');
    expect(publicRequest.request.headers.has('Authorization')).toBeFalse();
    expect(publicRequest.request.headers.has('Cache-Control')).toBeFalse();
    publicRequest.flush({});
  });
});
