import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TrackService } from './track.service';

describe('TrackService — contrat HTTP', () => {
  let service: TrackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('transmet page et limit puis restitue la page serveur', () => {
    const page = { items: [], page: 2, limit: 5, total: 6, pages: 2 };
    let result: unknown;
    service.list(2, 5).subscribe(value => result = value);
    const request = http.expectOne('/api/tracks?page=2&limit=5');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush(page);
    expect(result).toEqual(page);
  });

  it('envoie le multipart avec audio et title et demande la progression', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    service.upload(file, 'Mon titre').subscribe();
    const request = http.expectOne('/api/tracks');
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBe(true);
    const body = request.request.body as FormData;
    expect(body.get('audio')).toBe(file);
    expect(body.get('title')).toBe('Mon titre');
    expect([...body.keys()]).toEqual(['audio', 'title']);
    request.flush({}, { status: 201, statusText: 'Created' });
  });
});
