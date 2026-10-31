import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);

  readonly deleting = signal<string | null>(null);

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly uploadSuccess = signal(false);

  // État du lecteur audio et gestion de mémoire
  readonly audioUrl = signal('');
  readonly currentTrack = signal<Track | null>(null);
  readonly audioLoading = signal<string | null>(null);
  readonly audioError = signal<string | null>(null);

  // Filtre par titre / recherche
  readonly searchFilter = signal('');

  readonly filteredTracks = computed(() => {
    const query = this.searchFilter().trim().toLowerCase();
    if (!query) {
      return this.tracks();
    }
    return this.tracks().filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.originalName.toLowerCase().includes(query),
    );
  });

  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  constructor() {
    this.load();
  }

  ngOnDestroy(): void {
    // Nettoyage impératif de la mémoire : révoquer l'ObjectURL finale pour éviter toute fuite
    const currentUrl = this.audioUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      console.debug('[TracksPage] ObjectURL révoquée lors de la destruction du composant (ngOnDestroy)');
    }
  }

  choose(event: Event): void {
    if (this.uploading()) return;
    this.uploadProgress.set(null);
    this.file = (event.target as HTMLInputElement).files?.[0];
    this.uploadError.set(null);
    this.uploadSuccess.set(false);
    console.debug('[TracksPage] Fichier sélectionné', this.file?.name);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchFilter.set(value);
  }

  load(): void {
    this.loading.set(true);
    this.service.list(this.page()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[TracksPage] Chargement impossible', error);
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    this.page.set(page);
    this.load();
  }

  upload(fileInput?: HTMLInputElement): void {
    if (!this.file || this.uploading()) return;
    this.uploadProgress.set(null);

    // 1. Validation de l'Upload (Sécurité côté Navigateur)
    // Bloquer si le fichier dépasse 25 Mo (25 000 000 octets) ou n'est pas un format audio
    const MAX_FILE_SIZE = 25_000_000;
    const isAudio =
      this.file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(this.file.name);

    if (this.file.size > MAX_FILE_SIZE || !isAudio) {
      this.uploadSuccess.set(false);
      if (this.file.size > MAX_FILE_SIZE) {
        this.uploadError.set(
          'Le fichier dépasse 25 Mo (25 000 000 octets). Envoi bloqué.',
        );
      } else {
        this.uploadError.set(
          "Le format du fichier n'est pas un format audio valide. Envoi bloqué.",
        );
      }
      return;
    }

    // 2. L'Expérience Utilisateur (UI/UX) de l'Upload
    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.title.disable({ emitEvent: false });
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    this.service.upload(this.file, this.title.value || this.file.name).pipe(
      finalize(() => {
        this.uploading.set(false);
        this.title.enable({ emitEvent: false });
      }),
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress.set(event.total && event.total > 0
            ? Math.min(100, Math.round(100 * event.loaded / event.total))
            : null);
          return;
        }
        // 100 % signifie que les octets sont envoyés, pas que le serveur a accepté la piste.
        if (event.type !== HttpEventType.Response) return;
        this.uploadProgress.set(100);
        console.debug('[TracksPage] Upload accepté par le serveur');
        this.uploadSuccess.set(true);
        this.uploadError.set(null);
        this.title.setValue('');
        this.file = undefined;
        if (fileInput) {
          fileInput.value = '';
        }
        this.page.set(1);
        this.load();
      },
      error: (error) => {
        console.error('[TracksPage] Envoi impossible', error.status);
        this.uploadProgress.set(null);
        this.uploading.set(false);
        this.uploadSuccess.set(false);
        const serverMessage =
          error?.error?.message ||
          "Une erreur est survenue lors de l'envoi du fichier au serveur.";
        this.uploadError.set(serverMessage);
      },
    });
  }

  play(track: Track): void {
    this.audioError.set(null);
    this.audioLoading.set(track.id);

    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        this.audioUrl.set(URL.createObjectURL(blob));
        this.currentTrack.set(track);
        this.audioLoading.set(null);
      },
      error: (error) => {
        console.error('[TracksPage] Lecture impossible', error);
        this.audioLoading.set(null);
        const message =
          error?.error?.message ||
          `Impossible de charger le fichier audio de "${track.title}". Vérifiez vos droits ou le serveur.`;
        this.audioError.set(message);
      },
    });
  }

  delete(track: Track): void {
    if (this.deleting()) return;

    if (!confirm(`Supprimer définitivement la piste "${track.title}" ?`)) {
      return;
    }

    this.deleting.set(track.id);
    this.service.delete(track.id).pipe(
      finalize(() => this.deleting.set(null)),
    ).subscribe({
      next: () => {
        console.debug('[TracksPage] Piste supprimée', track.id);
        this.removeDeletedTrack(track);
        this.snackBar.open(`Piste "${track.title}" supprimée.`, 'Fermer', {
          duration: 5000,
          panelClass: ['snackbar-success'],
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Suppression impossible', error.status);
        let message = 'Impossible de supprimer la piste. Réessayez plus tard.';
        if (error.status === 404 || error.status === 403) {
          // Le backend renvoie aussi 404 pour une piste appartenant à un autre compte.
          message = 'Cette piste a déjà été supprimée ou ne vous est pas accessible. La liste a été actualisée.';
          this.removeDeletedTrack(track);
        } else if (error.status === 401) {
          message = 'Votre session a expiré. Reconnectez-vous pour supprimer une piste.';
        } else if (error.status === 0) {
          message = 'Serveur injoignable. Vérifiez votre connexion puis réessayez.';
        }
        this.snackBar.open(message, 'Fermer', { duration: 7000 });
      },
    });
  }

  private removeDeletedTrack(track: Track): void {
    if (this.currentTrack()?.id === track.id) {
      const currentUrl = this.audioUrl();
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      this.audioUrl.set('');
      this.currentTrack.set(null);
    }
    if (this.tracks().length === 1 && this.page() > 1) {
      this.page.set(this.page() - 1);
    }
    this.load();
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 Ko';
    if (bytes >= 1_000_000) {
      return (bytes / 1_000_000).toFixed(2) + ' Mo';
    }
    return (bytes / 1_000).toFixed(1) + ' Ko';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  formatMime(mime: string): string {
    if (!mime) return 'AUDIO';
    if (mime.includes('mpeg') || mime.includes('mp3')) return 'MP3';
    if (mime.includes('wav')) return 'WAV';
    if (mime.includes('ogg')) return 'OGG';
    if (mime.includes('flac')) return 'FLAC';
    if (mime.includes('aac')) return 'AAC';
    if (mime.includes('webm')) return 'WEBM';
    return mime.replace('audio/', '').toUpperCase();
  }
}
