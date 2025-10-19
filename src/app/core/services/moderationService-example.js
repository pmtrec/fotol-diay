/**
 * Exemples d'utilisation du service de modération
 * Ce fichier montre comment intégrer le ModerationService dans votre application
 */

// Importer le service (ajustez le chemin selon votre structure)
// import { ModerationService } from './moderationService.js';

// Exemples de données de produits à tester
const testProducts = [
    {
        name: "Produit valide - Smartphone",
        data: {
            imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
            title: "iPhone 15 Pro Max 256GB",
            description: "Le smartphone le plus avancé avec appareil photo professionnel, écran Super Retina XDR et puce A17 Pro. Parfait pour la photographie et les jeux."
        }
    },
    {
        name: "Produit avec contenu sensible",
        data: {
            imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            title: "Produit adulte coquin",
            description: "Contenu très sexy et érotique pour adultes seulement. Parfait pour les moments chauds."
        }
    },
    {
        name: "Produit avec mots interdits",
        data: {
            imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
            title: "T-shirt normal",
            description: "Ce produit contient des termes violents comme tuer et sang pour attirer l'attention."
        }
    },
    {
        name: "Produit sans image",
        data: {
            title: "Ordinateur portable professionnel",
            description: "PC portable haute performance pour le travail et les études. Processeur Intel i7, 16GB RAM, SSD 512GB."
        }
    }
];

/**
 * Fonction pour tester un produit individuel
 * @param {string} name - Nom du test
 * @param {Object} productData - Données du produit
 */
async function testProductValidation(name, productData) {
    console.log(`\n🧪 Test: ${name}`);
    console.log('📦 Données:', productData);

    try {
        // Créer une instance du service
        const moderationService = new ModerationService();

        // Lancer la validation
        const result = await moderationService.validateProduct(productData);

        // Afficher les résultats
        console.log('✅ Résultat de validation:');
        console.log(`   - Valide: ${result.isValid ? '✅ OUI' : '❌ NON'}`);
        console.log(`   - Confiance: ${(result.confidence * 100).toFixed(1)}%`);

        if (result.reasons.length > 0) {
            console.log('   - Raisons:');
            result.reasons.forEach((reason, index) => {
                console.log(`     ${index + 1}. ${reason}`);
            });
        }

        // Afficher les détails des analyses
        if (result.details.imageAnalysis) {
            console.log(`   - Image: ${result.details.imageAnalysis.isAppropriate ? '✅ Appropriée' : '❌ Inappropriée'} (${(result.details.imageAnalysis.confidence * 100).toFixed(1)}%)`);
        }

        if (result.details.textAnalysis) {
            console.log(`   - Texte: ${result.details.textAnalysis.isAppropriate ? '✅ Approprié' : '❌ Inapproprié'} (${(result.details.textAnalysis.confidence * 100).toFixed(1)}%)`);
        }

        return result;

    } catch (error) {
        console.error(`❌ Erreur lors du test ${name}:`, error);
        return null;
    }
}

/**
 * Fonction pour lancer tous les tests
 */
async function runAllTests() {
    console.log('🚀 Démarrage des tests de validation...\n');

    const results = [];

    for (const testProduct of testProducts) {
        const result = await testProductValidation(testProduct.name, testProduct.data);
        results.push({
            name: testProduct.name,
            result: result
        });
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ DES TESTS');
    console.log('==================');

    results.forEach((test, index) => {
        const status = test.result?.isValid ? '✅ VALIDE' : '❌ REFUSÉ';
        const confidence = test.result ? (test.result.confidence * 100).toFixed(1) + '%' : 'ERREUR';
        console.log(`${index + 1}. ${test.name}: ${status} (${confidence})`);
    });

    console.log('\n✨ Tests terminés!');
}

/**
 * Exemple d'utilisation dans un composant Angular/modern framework
 */
function angularComponentExample() {
    // Dans un composant Angular/React/Vue...

    async function validateProductBeforeSubmission(productFormData) {
        // Créer le service
        const moderationService = new ModerationService();

        try {
            // Valider le produit
            const validationResult = await moderationService.validateProduct({
                imageUrl: productFormData.image,
                title: productFormData.title,
                description: productFormData.description
            });

            if (validationResult.isValid) {
                // Produit valide - procéder à la soumission
                console.log('✅ Produit validé, envoi en cours...');
                await submitProduct(productFormData);
            } else {
                // Produit refusé - afficher les raisons
                console.log('❌ Produit refusé:', validationResult.reasons);
                showValidationErrors(validationResult.reasons);
            }

        } catch (error) {
            console.error('Erreur lors de la validation:', error);
            showError('Erreur technique lors de la validation');
        }
    }
}

/**
 * Exemple d'utilisation en mode navigateur (sans framework)
 */
function browserExample() {
    // Dans un navigateur, le service est disponible globalement
    // window.ModerationService

    async function validateForm() {
        const imageInput = document.getElementById('product-image');
        const titleInput = document.getElementById('product-title');
        const descInput = document.getElementById('product-description');

        const productData = {
            imageUrl: imageInput.files[0] ? await fileToDataUrl(imageInput.files[0]) : null,
            title: titleInput.value,
            description: descInput.value
        };

        const result = await new ModerationService().validateProduct(productData);

        if (result.isValid) {
            alert('Produit validé avec succès!');
        } else {
            alert('Produit refusé: ' + result.reasons.join(', '));
        }
    }
}

// Utilitaires pour les exemples
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testProducts,
        testProductValidation,
        runAllTests,
        angularComponentExample,
        browserExample
    };
}

// Si vous voulez lancer les tests automatiquement (décommentez la ligne suivante)
// runAllTests();