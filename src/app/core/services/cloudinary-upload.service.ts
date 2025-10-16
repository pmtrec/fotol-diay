import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryUploadService {
  private readonly cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

  constructor(private http: HttpClient) {}

  /**
   * Upload une image vers Cloudinary
   * @param file Le fichier image à uploader
   * @returns Observable<CloudinaryUploadResult> Le résultat de l'upload
   */
  uploadImage(file: File): Observable<CloudinaryUploadResult> {
    // Validation du fichier
    if (!this.isValidImageFile(file)) {
      return throwError(() => new Error('Fichier image invalide ou trop volumineux'));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', environment.cloudinary.uploadPreset);
    formData.append('folder', 'produits');

    return this.http.post<CloudinaryUploadResult>(this.cloudinaryUrl, formData)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de l\'upload vers Cloudinary:', error);
          if (error.status === 401) {
            return throwError(() => new Error('Configuration Cloudinary invalide'));
          } else if (error.status === 413) {
            return throwError(() => new Error('Fichier trop volumineux'));
          } else if (error.status === 0) {
            return throwError(() => new Error('Erreur de connexion réseau'));
          } else {
            return throwError(() => new Error(`Erreur serveur: ${error.message || 'Erreur inconnue'}`));
          }
        }),
        map(result => {
          if (!result.secure_url) {
            throw new Error('Réponse invalide de Cloudinary');
          }
          return result;
        })
      );
  }

  /**
   * Valider le type de fichier (images seulement)
   * @param file Le fichier à valider
   * @returns boolean True si le fichier est une image valide
   */
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB pour Cloudinary

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Obtenir la taille maximale autorisée pour l'upload
   * @returns number Taille maximale en octets
   */
  getMaxFileSize(): number {
    return 10 * 1024 * 1024; // 10MB
  }

  /**
   * Formater la taille du fichier pour l'affichage
   * @param bytes Taille en octets
   * @returns string Taille formatée
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}