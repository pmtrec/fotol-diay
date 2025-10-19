/**
 * Test rapide du service de modération
 * Ce script teste le service avec des données fictives
 */

// Importer le service
import('./moderationService.js').then(({ ModerationService }) => {
    console.log('🧪 Test du service de modération...');

    // Créer une instance du service
    const moderationService = new ModerationService();

    // Données de test
    const testProduct = {
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        title: 'Smartphone de test',
        description: 'Un smartphone normal pour tester la validation automatique du système.'
    };

    console.log('📦 Test avec un produit normal...');

    // Tester la validation
    moderationService.validateProduct(testProduct)
        .then(result => {
            console.log('✅ Résultat du test:');
            console.log(`   - Valide: ${result.isValid ? 'OUI' : 'NON'}`);
            console.log(`   - Confiance: ${(result.confidence * 100).toFixed(1)}%`);

            if (result.reasons.length > 0) {
                console.log(`   - Raisons: ${result.reasons.join(', ')}`);
            }

            console.log('\n📊 Détails de l\'analyse:');
            if (result.details.imageAnalysis) {
                console.log(`   - Image: ${result.details.imageAnalysis.isAppropriate ? 'Appropriée' : 'Inappropriée'}`);
            }
            if (result.details.textAnalysis) {
                console.log(`   - Texte: ${result.details.textAnalysis.isAppropriate ? 'Approprié' : 'Inapproprié'}`);
            }

            console.log('\n✨ Test terminé avec succès!');
        })
        .catch(error => {
            console.error('❌ Erreur lors du test:', error);
        });

}).catch(error => {
    console.error('❌ Erreur d\'importation:', error);
});