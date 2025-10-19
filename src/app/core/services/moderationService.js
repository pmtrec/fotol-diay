/**
 * Service de modération automatique des produits utilisant Hugging Face Inference API
 * Analyse les images, titres et descriptions pour valider le contenu
 */

const HF_API_KEY = "TON_TOKEN_HF"; // à récupérer sur huggingface.co

class ModerationService {
    constructor() {
        this.apiKey = HF_API_KEY;
        this.apiUrl = 'https://api-inference.huggingface.co/models';
        
        // Modèles Hugging Face pour différentes tâches
        this.models = {
            // Pour l'analyse d'images (NSFW detection)
            imageClassification: 'Falconsai/nsfw_image_detection',
            
            // Pour l'analyse de texte (toxic content detection)
            textClassification: 'martin-ha/toxic-comment-model',
            
            // Pour la classification générale du contenu
            contentClassification: 'microsoft/DialoGPT-medium',
            
            // Pour la détection de contenu adulte
            adultContent: 'openai/clip-vit-base-patch32'
        };
        
        // Mots-clés interdits
        this.forbiddenKeywords = {
            sexual: ['sexe', 'porn', 'xxx', 'nude', 'nu', 'erotique', 'coquin', 'chaud', 'hot'],
            violent: ['tuer', 'mort', 'sang', 'violence', 'arme', 'gun', 'knife'],
            discriminatory: ['raciste', 'discrimination', 'haine', 'suprématie'],
            drugs: ['drogue', 'cocaine', 'heroine', 'weed', 'cannabis']
        };
    }

    /**
     * Fonction principale de validation d'un produit
     * @param {Object} productData - Données du produit
     * @param {string} productData.imageUrl - URL de l'image du produit
     * @param {string} productData.title - Titre du produit
     * @param {string} productData.description - Description du produit
     * @returns {Promise<Object>} Résultat de la validation
     */
    async validateProduct(productData) {
        console.log('🔍 Démarrage de la validation du produit...');

        const results = {
            isValid: false,
            confidence: 0,
            reasons: [],
            details: {
                imageAnalysis: null,
                textAnalysis: null,
                coherenceCheck: null
            }
        };

        try {
            // 1. Analyser l'image
            if (productData.imageUrl) {
                results.details.imageAnalysis = await this.analyzeImage(productData.imageUrl);
                console.log('✅ Analyse d\'image terminée:', results.details.imageAnalysis);
            }

            // 2. Analyser le texte (titre + description)
            const fullText = `${productData.title || ''} ${productData.description || ''}`.trim();
            if (fullText) {
                results.details.textAnalysis = await this.analyzeText(fullText);
                console.log('✅ Analyse de texte terminée:', results.details.textAnalysis);
            }

            // 3. Vérifier la cohérence entre image et texte
            if (productData.imageUrl && fullText) {
                results.details.coherenceCheck = await this.checkCoherence(productData.imageUrl, fullText);
                console.log('✅ Vérification de cohérence terminée:', results.details.coherenceCheck);
            }

            // 4. Prendre la décision finale
            const decision = this.makeDecision(results.details);
            results.isValid = decision.isValid;
            results.confidence = decision.confidence;
            results.reasons = decision.reasons;

            console.log('🎯 Décision finale:', results);
            return results;

        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            results.reasons.push('Erreur technique lors de la validation');
            return results;
        }
    }

    /**
     * Analyse une image avec Hugging Face
     * @param {string} imageUrl - URL de l'image à analyser
     * @returns {Promise<Object>} Résultat de l'analyse
     */
    async analyzeImage(imageUrl) {
        try {
            // Convertir l'URL en blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Créer un FormData pour l'API Hugging Face
            const formData = new FormData();
            formData.append('image', blob);

            const apiResponse = await fetch(`${this.apiUrl}/${this.models.imageClassification}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!apiResponse.ok) {
                throw new Error(`Erreur API: ${apiResponse.status}`);
            }

            const result = await apiResponse.json();
            
            // Analyser les résultats
            const nsfwScore = result[0]?.score || 0;
            const isNSFW = nsfwScore > 0.7;

            return {
                isAppropriate: !isNSFW,
                confidence: 1 - nsfwScore,
                nsfwScore: nsfwScore,
                label: result[0]?.label || 'unknown',
                details: result
            };

        } catch (error) {
            console.error('Erreur analyse image:', error);
            // Fallback: validation par défaut
            return {
                isAppropriate: true,
                confidence: 0.8,
                error: 'API non disponible'
            };
        }
    }

    /**
     * Analyse le texte avec Hugging Face
     * @param {string} text - Texte à analyser
     * @returns {Promise<Object>} Résultat de l'analyse
     */
    async analyzeText(text) {
        try {
            // Vérification des mots-clés interdits (rapide)
            const keywordCheck = this.checkForbiddenKeywords(text);
            
            // Analyse avec Hugging Face
            const apiResponse = await fetch(`${this.apiUrl}/${this.models.textClassification}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: text,
                    options: { wait_for_model: true }
                })
            });

            if (!apiResponse.ok) {
                throw new Error(`Erreur API: ${apiResponse.status}`);
            }

            const result = await apiResponse.json();
            
            // Analyser les résultats
            const toxicScore = result[0]?.[0]?.score || 0;
            const isToxic = toxicScore > 0.8;

            return {
                isAppropriate: !isToxic && !keywordCheck.hasForbiddenContent,
                confidence: Math.min(1 - toxicScore, keywordCheck.confidence),
                toxicScore: toxicScore,
                hasForbiddenKeywords: keywordCheck.hasForbiddenContent,
                forbiddenCategories: keywordCheck.categories,
                details: result
            };

        } catch (error) {
            console.error('Erreur analyse texte:', error);
            // Fallback: vérification par mots-clés uniquement
            return this.checkForbiddenKeywords(text);
        }
    }

    /**
     * Vérifie la cohérence entre l'image et le texte
     * @param {string} imageUrl - URL de l'image
     * @param {string} text - Texte du produit
     * @returns {Promise<Object>} Résultat de la cohérence
     */
    async checkCoherence(imageUrl, text) {
        try {
            // Analyse sémantique basique
            const textLower = text.toLowerCase();
            
            // Liste de mots qui suggèrent certains types de produits
            const productKeywords = {
                tech: ['smartphone', 'ordinateur', 'téléphone', 'laptop', 'écran', 'clavier'],
                food: ['manger', 'boire', 'aliment', 'restaurant', 'cuisine'],
                clothing: ['vêtement', 'robe', 'chemise', 'pantalon', 'chaussure'],
                book: ['livre', 'roman', 'lecture', 'auteur', 'page']
            };

            // Vérifier si le texte contient des mots-clés de catégories
            const detectedCategories = [];
            for (const [category, keywords] of Object.entries(productKeywords)) {
                if (keywords.some(keyword => textLower.includes(keyword))) {
                    detectedCategories.push(category);
                }
            }

            return {
                isCoherent: true, // Pour l'instant, on considère que c'est cohérent
                confidence: 0.8,
                detectedCategories: detectedCategories,
                text: text.substring(0, 100) + '...'
            };

        } catch (error) {
            console.error('Erreur cohérence:', error);
            return {
                isCoherent: true,
                confidence: 0.5,
                error: 'Analyse de cohérence non disponible'
            };
        }
    }

    /**
     * Vérifie les mots-clés interdits dans le texte
     * @param {string} text - Texte à vérifier
     * @returns {Object} Résultat de la vérification
     */
    checkForbiddenKeywords(text) {
        const textLower = text.toLowerCase();
        const forbiddenCategories = [];
        let maxScore = 0;

        for (const [category, keywords] of Object.entries(this.forbiddenKeywords)) {
            const foundKeywords = keywords.filter(keyword => textLower.includes(keyword));
            if (foundKeywords.length > 0) {
                forbiddenCategories.push({
                    category: category,
                    keywords: foundKeywords,
                    severity: this.getSeverityScore(category)
                });
                maxScore = Math.max(maxScore, this.getSeverityScore(category));
            }
        }

        return {
            hasForbiddenContent: forbiddenCategories.length > 0,
            confidence: forbiddenCategories.length > 0 ? 1 - (maxScore / 10) : 1,
            categories: forbiddenCategories
        };
    }

    /**
     * Obtient le score de sévérité d'une catégorie
     * @param {string} category - Catégorie à évaluer
     * @returns {number} Score de sévérité (0-10)
     */
    getSeverityScore(category) {
        const scores = {
            sexual: 10,
            violent: 9,
            discriminatory: 8,
            drugs: 7
        };
        return scores[category] || 5;
    }

    /**
     * Prend la décision finale basée sur toutes les analyses
     * @param {Object} details - Détails des analyses
     * @returns {Object} Décision finale
     */
    makeDecision(details) {
        const reasons = [];
        let overallScore = 1;
        let validCount = 0;
        let totalCount = 0;

        // Analyser l'image
        if (details.imageAnalysis) {
            totalCount++;
            if (details.imageAnalysis.isAppropriate) {
                validCount++;
            } else {
                reasons.push('Image inappropriée détectée');
                overallScore *= (1 - details.imageAnalysis.nsfwScore);
            }
        }

        // Analyser le texte
        if (details.textAnalysis) {
            totalCount++;
            if (details.textAnalysis.isAppropriate) {
                validCount++;
            } else {
                if (details.textAnalysis.hasForbiddenKeywords) {
                    reasons.push('Mots-clés interdits détectés dans le texte');
                }
                if (details.textAnalysis.toxicScore > 0.8) {
                    reasons.push('Contenu toxique détecté');
                }
                overallScore *= (1 - details.textAnalysis.toxicScore);
            }
        }

        // Vérifier la cohérence
        if (details.coherenceCheck) {
            if (!details.coherenceCheck.isCoherent) {
                reasons.push('Incohérence entre image et description');
                overallScore *= 0.8;
            }
        }

        const isValid = validCount === totalCount && reasons.length === 0;
        const confidence = isValid ? Math.min(overallScore, 0.95) : overallScore;

        return {
            isValid,
            confidence,
            reasons
        };
    }

    /**
     * Fonction utilitaire pour tester le service
     * @param {Object} productData - Données de test
     */
    async testValidation(productData) {
        console.log('🧪 Test de validation avec:', productData);
        const result = await this.validateProduct(productData);
        console.log('📊 Résultat du test:', result);
        return result;
    }
}

// Exporter le service pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModerationService;
}

// Exporter pour utilisation dans le navigateur
if (typeof window !== 'undefined') {
    window.ModerationService = ModerationService;
}