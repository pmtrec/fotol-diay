// Test d'intégration API - Simulation des fonctionnalités
const API_BASE = 'http://localhost:3002';

async function testAPIIntegration() {
  console.log('🚀 Test d\'intégration API avec JSON Server');
  console.log('=============================================\n');

  try {
    // Test 1: Récupérer tous les produits
    console.log('📦 Test 1: Récupération des produits...');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const products = await productsResponse.json();
    console.log(`✅ ${products.length} produits récupérés`);

    // Test 2: Récupérer les catégories
    console.log('\n🏷️  Test 2: Récupération des catégories...');
    const categoriesResponse = await fetch(`${API_BASE}/categories`);
    const categories = await categoriesResponse.json();
    console.log(`✅ ${categories.length} catégories récupérées`);

    // Test 3: Récupérer les utilisateurs
    console.log('\n👥 Test 3: Récupération des utilisateurs...');
    const usersResponse = await fetch(`${API_BASE}/users`);
    const users = await usersResponse.json();
    console.log(`✅ ${users.length} utilisateurs récupérés`);

    // Test 4: Analyser les données
    console.log('\n📊 Test 4: Analyse des données...');

    const approvedProducts = products.filter(p => p.status === 'approved');
    const pendingProducts = products.filter(p => p.status === 'pending');
    const rejectedProducts = products.filter(p => p.status === 'rejected');

    console.log(`   ✅ Produits approuvés: ${approvedProducts.length}`);
    console.log(`   ⏳ Produits en attente: ${pendingProducts.length}`);
    console.log(`   ❌ Produits rejetés: ${rejectedProducts.length}`);

    // Test 5: Vérifier la structure des données
    console.log('\n🔍 Test 5: Vérification de la structure des données...');

    if (products.length > 0) {
      const firstProduct = products[0];
      const requiredFields = ['id', 'name', 'description', 'price', 'category', 'stock', 'images', 'status', 'sellerId'];
      const missingFields = requiredFields.filter(field => !(field in firstProduct));

      if (missingFields.length === 0) {
        console.log('✅ Structure des produits conforme');
      } else {
        console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
      }
    }

    // Test 6: Tester les endpoints vendeur
    console.log('\n🛒 Test 6: Test des produits par vendeur...');
    const seller2Products = products.filter(p => p.sellerId === 2);
    console.log(`✅ Vendeur 2 a ${seller2Products.length} produits`);

    // Test 7: Vérifier les données nettoyées
    console.log('\n🧹 Test 7: Vérification du nettoyage des données...');
    const testProducts = products.filter(p => p.price < 1 || p.name.length < 5);
    if (testProducts.length === 0) {
      console.log('✅ Aucune donnée de test inappropriée trouvée');
    } else {
      console.log(`❌ ${testProducts.length} données de test trouvées`);
    }

    console.log('\n🎯 Résumé des tests:');
    console.log('===================');
    console.log(`📦 Produits: ${products.length}`);
    console.log(`🏷️  Catégories: ${categories.length}`);
    console.log(`👥 Utilisateurs: ${users.length}`);
    console.log(`✅ Approuvés: ${approvedProducts.length}`);
    console.log(`⏳ En attente: ${pendingProducts.length}`);
    console.log(`❌ Rejetés: ${rejectedProducts.length}`);

    console.log('\n✨ Intégration API réussie !');
    console.log('L\'application peut maintenant communiquer avec le JSON Server.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testAPIIntegration();