import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TracksPageComponent } from './tracks-page';
import { Track } from '../../shared/models/track.model';

const track: Track = {
  id: 'track-1', title: 'Solo test', originalName: 'solo.mp3',
  mimeType: 'audio/mpeg', size: 100, createdAt: '2026-10-08T10:00:00Z',
};
const page = { items: [track], page: 1, limit: 5, total: 1, pages: 1 };

describe('TracksPage — suppression et upload', () => {
  let fixture: ComponentFixture<TracksPageComponent>;
  let component: TracksPageComponent;
  let http: HttpTestingController;
  const snackBar = { open: vi.fn() };

  beforeEach(async () => {
    snackBar.open.mockClear();
    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatSnackBar, useValue: snackBar }],
    });
    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
    await TestBed.compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TracksPageComponent);
    component = fixture.componentInstance;
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('supprime après confirmation, bloque les doublons puis recharge la liste', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.delete(track);
    expect(component.deleting()).toBe(track.id);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.btn-delete').disabled).toBe(true);
    component.delete(track);
    const request = http.expectOne('/api/tracks/track-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne('/api/tracks?page=1&limit=5').flush({ ...page, items: [], total: 0 });
    expect(component.tracks()).toEqual([]);
    expect(component.deleting()).toBeNull();
    expect(snackBar.open).toHaveBeenCalledWith('Piste "Solo test" supprimée.', 'Fermer', expect.any(Object));
  });

  it('n’envoie aucune suppression si la confirmation est annulée', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.delete(track);
    http.expectNone('/api/tracks/track-1');
    expect(component.deleting()).toBeNull();
    expect(component.tracks()).toEqual([track]);
  });

  it('actualise une piste devenue inaccessible après une réponse 404', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.delete(track);
    http.expectOne('/api/tracks/track-1').flush({ message: 'Piste inconnue' }, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/tracks?page=1&limit=5').flush({ ...page, items: [], total: 0 });
    expect(component.deleting()).toBeNull();
    expect(component.tracks()).toEqual([]);
    expect(snackBar.open).toHaveBeenCalledWith(expect.stringContaining('déjà été supprimée ou ne vous est pas accessible'), 'Fermer', expect.any(Object));
  });

  function startUpload() {
    component.file = new File(['audio'], 'solo.mp3', { type: 'audio/mpeg' });
    component.title.setValue('Titre upload');
    component.upload();
    return http.expectOne('/api/tracks');
  }

  it('affiche la progression et attend la réponse finale avant le succès', () => {
    const request = startUpload();
    expect(request.request.method).toBe('POST');
    expect(component.uploading()).toBe(true);
    expect(component.title.disabled).toBe(true);
    component.upload();
    http.expectNone('/api/tracks');
    request.event({ type: HttpEventType.UploadProgress, loaded: 25, total: 100 });
    fixture.detectChanges();
    expect(component.uploadProgress()).toBe(25);
    expect(fixture.nativeElement.querySelector('progress').value).toBe(25);
    expect(fixture.nativeElement.querySelector('input[type=file]').disabled).toBe(true);
    request.event({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
    expect(component.uploadSuccess()).toBe(false);
    expect(component.uploading()).toBe(true);
    request.flush(track, { status: 201, statusText: 'Created' });
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
    expect(component.uploadSuccess()).toBe(true);
    expect(component.uploading()).toBe(false);
    expect(component.title.enabled).toBe(true);
    expect(component.title.value).toBe('');
    expect(component.file).toBeUndefined();
    expect(component.page()).toBe(1);
  });

  it('affiche une erreur serveur et permet de réessayer sans perdre le formulaire', () => {
    const request = startUpload();
    request.event({ type: HttpEventType.UploadProgress, loaded: 10 });
    expect(component.uploadProgress()).toBeNull();
    request.flush({ message: 'Format audio non accepté' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(component.uploading()).toBe(false);
    expect(component.uploadSuccess()).toBe(false);
    expect(component.title.enabled).toBe(true);
    expect(component.title.value).toBe('Titre upload');
    expect(component.file?.name).toBe('solo.mp3');
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Format audio non accepté');
    component.upload();
    http.expectOne('/api/tracks').flush(track, { status: 201, statusText: 'Created' });
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
    expect(component.uploadSuccess()).toBe(true);
  });
});
