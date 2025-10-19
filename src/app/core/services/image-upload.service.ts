import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';

export interface UploadedImage {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private baseUrl = 'http://localhost:3002'; // URL du serveur JSON

  constructor(private apiService: ApiService) {}

  /**
   * Upload une image et retourne l'URL générée
   * @param file Le fichier image à uploader
   * @param userId L'ID de l'utilisateur qui upload (optionnel)
   * @returns Observable<string> L'URL de l'image uploadée
   */
  uploadImage(file: File, userId?: string): Observable<string> {
    return new Observable((observer) => {
      // Validate file first
      if (!this.isValidImageFile(file)) {
        observer.error(new Error('Fichier image invalide ou trop volumineux'));
        return;
      }

      // Convert file to base64 for processing
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const base64Data = e.target?.result as string;

          // Create a blob URL for the actual image data
          const blob = new Blob([file], { type: file.type });
          const imageUrl = URL.createObjectURL(blob);

          // Créer l'objet image uploadée pour la sauvegarde locale
          const uploadedImage: UploadedImage = {
            id: Date.now(), // ID temporaire basé sur le timestamp
            filename: this.generateFilename(file.name),
            originalName: file.name,
            url: imageUrl,
            size: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString(),
            uploadedBy: userId
          };

          // Sauvegarder dans le serveur JSON pour le suivi
          this.saveUploadedImage(uploadedImage).subscribe({
            next: () => {
              observer.next(imageUrl);
              observer.complete();
            },
            error: (error) => {
              // L'upload a réussi mais la sauvegarde locale a échoué
              console.warn('Image uploaded but failed to save locally:', error);
              observer.next(imageUrl);
              observer.complete();
            }
          });
        } catch (error) {
          observer.error(new Error(`Erreur lors du traitement du fichier: ${error}`));
        }
      };

      reader.onerror = () => {
        observer.error(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Upload multiple images
   * @param files Les fichiers images à uploader
   * @param userId L'ID de l'utilisateur qui upload (optionnel)
   * @returns Observable<string[]> Les URLs des images uploadées
   */
  uploadImages(files: File[], userId?: string): Observable<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, userId).toPromise());

    return new Observable((observer) => {
      Promise.all(uploadPromises).then(
        (urls) => {
          observer.next(urls as string[]);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  /**
   * Récupérer toutes les images uploadées
   * @returns Observable<UploadedImage[]> Liste des images uploadées
   */
  getUploadedImages(): Observable<UploadedImage[]> {
    return this.apiService.get<UploadedImage[]>(`${this.baseUrl}/uploads`);
  }

  /**
   * Supprimer une image uploadée
   * @param imageId L'ID de l'image à supprimer
   * @returns Observable<void>
   */
  deleteUploadedImage(imageId: number): Observable<void> {
    return this.apiService.delete<void>(`${this.baseUrl}/uploads/${imageId}`);
  }

  /**
   * Générer une URL fictive pour l'image
   * @param originalName Nom original du fichier
   * @param size Taille du fichier
   * @returns string URL générée
   */
  private generateImageUrl(originalName: string, size: number): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    return `https://picsum.photos/400/400?random=${timestamp}&id=${randomId}`;
  }

  /**
   * Générer un nom de fichier unique
   * @param originalName Nom original du fichier
   * @returns string Nom de fichier généré
   */
  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `img_${timestamp}_${randomId}.${extension}`;
  }

  /**
   * Sauvegarder l'image uploadée dans le serveur JSON
   * @param uploadedImage L'image uploadée à sauvegarder
   * @returns Observable<UploadedImage>
   */
  private saveUploadedImage(uploadedImage: UploadedImage): Observable<UploadedImage> {
    return this.apiService.post<UploadedImage>(`${this.baseUrl}/uploads`, uploadedImage);
  }

  /**
   * Valider le type de fichier (images seulement)
   * @param file Le fichier à valider
   * @returns boolean True si le fichier est une image valide
   */
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Obtenir la taille maximale autorisée pour l'upload
   * @returns number Taille maximale en octets
   */
  getMaxFileSize(): number {
    return 5 * 1024 * 1024; // 5MB
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

  /**
   * Ouvrir la caméra avec prévisualisation
   * @returns Promise<MediaStream> Le flux vidéo de la caméra
   */
  async openCamera(): Promise<MediaStream> {
    // Vérifier si la caméra est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Caméra non disponible sur ce navigateur');
    }

    try {
      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Utiliser la caméra arrière par défaut
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      return stream;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('Aucune caméra trouvée sur cet appareil');
      } else {
        throw new Error(`Erreur d'accès à la caméra: ${error.message}`);
      }
    }
  }

  /**
   * Capturer une photo depuis un élément vidéo
   * @param videoElement L'élément vidéo source
   * @param userId L'ID de l'utilisateur qui capture (optionnel)
   * @returns Promise<string> L'URL de l'image capturée
   */
  async captureFromVideoElement(videoElement: HTMLVideoElement, userId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Créer un canvas pour capturer l'image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Définir la taille du canvas selon la vidéo
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Dessiner l'image actuelle de la vidéo sur le canvas
        context.drawImage(videoElement, 0, 0);

        // Convertir le canvas en blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Erreur lors de la capture de l\'image'));
            return;
          }

          // Créer un fichier à partir du blob
          const timestamp = Date.now();
          const file = new File([blob], `camera_capture_${timestamp}.jpg`, {
            type: 'image/jpeg',
            lastModified: timestamp
          });

          // Convertir l'Observable en Promise et gérer le résultat
          this.uploadImage(file, userId).toPromise().then(
            (imageUrl) => {
              if (imageUrl) {
                resolve(imageUrl);
              } else {
                reject(new Error('URL de l\'image non reçue'));
              }
            },
            (error) => {
              reject(error);
            }
          ).catch((error) => {
            reject(new Error(`Erreur lors de la capture: ${error.message || error}`));
          });
        }, 'image/jpeg', 0.9);
      } catch (error) {
        reject(new Error(`Erreur lors de la capture: ${error}`));
      }
    });
  }

  /**
   * Fermer un flux vidéo
   * @param stream Le flux vidéo à fermer
   */
  stopVideoStream(stream: MediaStream): void {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  /**
   * Vérifier si la caméra est disponible
   * @returns boolean True si la caméra est disponible
   */
  isCameraAvailable(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}