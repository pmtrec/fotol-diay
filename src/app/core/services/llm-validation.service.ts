import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LLMValidationResult {
  isAppropriate: boolean;
  confidence: number;
  reason?: string;
  categories?: string[];
}

export interface ContentValidationRequest {
  imageUrl?: string;
  title?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LLMValidationService {
  private openAIApiUrl = 'https://api.openai.com/v1/moderations';
  private mistralApiUrl = 'https://api.mistral.ai/v1/moderations';
  private openAIApiKey = '';
  private mistralApiKey = '';

  constructor(private http: HttpClient) {
    // Récupérer les clés API depuis les variables d'environnement
    this.openAIApiKey = this.getOpenAIApiKey();
    this.mistralApiKey = this.getMistralApiKey();
  }

  /**
   * Valide le contenu d'une image et d'un texte pour détecter du contenu inapproprié
   */
  validateContent(request: ContentValidationRequest): Observable<LLMValidationResult> {
    // Essayer Mistral d'abord, puis OpenAI si Mistral n'est pas disponible
    if (this.mistralApiKey) {
      console.log('Utilisation de l\'API Mistral pour la validation');
      return this.validateWithMistral(request);
    } else if (this.openAIApiKey) {
      console.log('Utilisation de l\'API OpenAI pour la validation');
      return this.validateWithOpenAI(request);
    } else {
      console.warn('Aucune clé API configurée. Utilisation de la validation par défaut.');
      return this.getDefaultValidation();
    }
  }

  /**
   * Valide spécifiquement une image en analysant son URL
   * Note: Cette méthode nécessite une API de vision par ordinateur
   */
  validateImage(imageUrl: string): Observable<LLMValidationResult> {
    if (!this.mistralApiKey && !this.openAIApiKey) {
      console.warn('Aucune clé API configurée. Validation d\'image par défaut.');
      return this.getDefaultValidation();
    }

    // Pour l'instant, on retourne une validation par défaut
    // Dans un environnement de production, vous utiliseriez une API de vision par ordinateur
    // comme OpenAI Vision API pour analyser le contenu des images
    return this.getDefaultValidation();
  }

  /**
   * Validation avec l'API Mistral
   */
  private validateWithMistral(request: ContentValidationRequest): Observable<LLMValidationResult> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.mistralApiKey}`,
      'Content-Type': 'application/json'
    });

    // Préparer le contenu à analyser
    let contentToAnalyze = '';

    if (request.title) {
      contentToAnalyze += `Titre: ${request.title}\n`;
    }

    if (request.description) {
      contentToAnalyze += `Description: ${request.description}\n`;
    }

    const requestBody = {
      model: 'mistral-moderation',
      input: contentToAnalyze
    };

    return this.http.post<any>(this.mistralApiUrl, requestBody, { headers }).pipe(
      map(response => {
        // Adapter la réponse Mistral au format attendu
        if (response.results && response.results.length > 0) {
          const result = response.results[0];
          return {
            isAppropriate: !result.flagged,
            confidence: result.confidence || 0.8,
            reason: result.flagged ? this.getFlaggedReason(result.categories) : undefined,
            categories: result.categories ? Object.keys(result.categories).filter(key => result.categories[key]) : []
          };
        }
        return this.getDefaultValidationResult();
      }),
      catchError(error => {
        console.error('Erreur lors de la validation Mistral:', error);
        // Fallback vers OpenAI si disponible
        if (this.openAIApiKey) {
          return this.validateWithOpenAI(request);
        }
        return this.getDefaultValidation();
      })
    );
  }

  /**
   * Validation avec l'API OpenAI
   */
  private validateWithOpenAI(request: ContentValidationRequest): Observable<LLMValidationResult> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.openAIApiKey}`,
      'Content-Type': 'application/json'
    });

    // Préparer le contenu à analyser
    let contentToAnalyze = '';

    if (request.title) {
      contentToAnalyze += `Titre: ${request.title}\n`;
    }

    if (request.description) {
      contentToAnalyze += `Description: ${request.description}\n`;
    }

    const requestBody = {
      input: contentToAnalyze,
      model: 'text-moderation-latest'
    };

    return this.http.post<any>(this.openAIApiUrl, requestBody, { headers }).pipe(
      map(response => {
        if (response.results && response.results.length > 0) {
          const result = response.results[0];
          return {
            isAppropriate: !result.flagged,
            confidence: 1 - (result.category_scores?.sexual || 0),
            reason: result.flagged ? this.getFlaggedReason(result.categories) : undefined,
            categories: result.categories ? Object.keys(result.categories).filter(key => result.categories[key]) : []
          };
        }
        return this.getDefaultValidationResult();
      }),
      catchError(error => {
        console.error('Erreur lors de la validation OpenAI:', error);
        return this.getDefaultValidation();
      })
    );
  }

  /**
   * Validation par défaut quand l'API n'est pas disponible
   */
  private getDefaultValidation(): Observable<LLMValidationResult> {
    return new Observable(observer => {
      // Simulation d'une validation automatique
      setTimeout(() => {
        observer.next({
          isAppropriate: true,
          confidence: 0.8,
          reason: 'Validation automatique - API non configurée'
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Résultat par défaut pour la validation
   */
  private getDefaultValidationResult(): LLMValidationResult {
    return {
      isAppropriate: true,
      confidence: 0.8,
      reason: 'Validation automatique - API non configurée'
    };
  }

  /**
   * Récupère la clé API OpenAI depuis les variables d'environnement
   */
  private getOpenAIApiKey(): string {
    // Dans un environnement Angular, vous pouvez utiliser les variables d'environnement
    // ou un service de configuration
    return (window as any)['ENV']?.['OPENAI_API_KEY'] || '';
  }

  /**
   * Récupère la clé API Mistral depuis les variables d'environnement
   */
  private getMistralApiKey(): string {
    // Dans un environnement Angular, vous pouvez utiliser les variables d'environnement
    // ou un service de configuration
    return (window as any)['ENV']?.['MISTRAL_API_KEY'] || '';
  }

  /**
   * Extrait la raison du flag depuis les catégories
   */
  private getFlaggedReason(categories: any): string {
    const reasons = [];
    if (categories?.sexual) reasons.push('Contenu sexuel détecté');
    if (categories?.violence) reasons.push('Contenu violent détecté');
    if (categories?.hate) reasons.push('Contenu haineux détecté');
    if (categories?.harassment) reasons.push('Contenu de harcèlement détecté');

    return reasons.join(', ') || 'Contenu inapproprié détecté';
  }
}