// base.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BaseService } from './base.service';

describe('BaseService', () => {
  let service: BaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],   // 👈 módulo de prueba para HttpClient
      providers: [BaseService],
    });

    service   = TestBed.inject(BaseService);
    httpMock  = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getServices() debe hacer GET a /services', () => {
    service.getServices().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/secureon/v1/services');
    expect(req.request.method).toBe('GET');
    req.flush([]);        // respuesta simulada
  });
});
