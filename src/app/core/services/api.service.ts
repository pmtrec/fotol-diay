import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Build the complete URL for API requests
   * Handles both relative endpoints and full URLs
   */
  private buildUrl(endpoint: string): string {
    // If endpoint is already a full URL, return it as-is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // For relative endpoints, ensure proper formatting
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  // GET request
  get<T>(endpoint: string): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.get<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  // POST request
  post<T>(endpoint: string, body: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.post<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  // PUT request
  put<T>(endpoint: string, body: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.put<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE request
  delete<T>(endpoint: string): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.delete<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  // PATCH request
  patch<T>(endpoint: string, body: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.patch<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  // Gestion des erreurs
  private handleError(error: HttpErrorResponse) {
    console.error('Erreur API:', error);

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      return throwError(() => new Error(`Erreur client: ${error.error.message}`));
    } else {
      // Erreur côté serveur
      let errorMessage = `Erreur serveur ${error.status}`;

      if (error.status === 0) {
        errorMessage += ': Impossible de contacter le serveur. Vérifiez que le serveur JSON est démarré.';
      } else if (error.status === 404) {
        errorMessage += ': Ressource non trouvée.';
      } else if (error.status >= 500) {
        errorMessage += ': Erreur interne du serveur.';
      } else {
        errorMessage += `: ${error.message}`;
      }

      return throwError(() => new Error(errorMessage));
    }
  }
}