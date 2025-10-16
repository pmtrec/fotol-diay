// Script de correction automatique des composants
// Ce script corrige tous les composants pour utiliser la nouvelle structure de données

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des composants...\n');

// Liste des corrections à appliquer
const corrections = [
  // 1. Correction des propriétés dans les fichiers TypeScript
  {
    file: 'src/app/features/produits/pages/admin-validation/admin-validation.component.ts',
    replacements: [
      { old: 'a.dateAjout', new: 'a.createdAt' },
      { old: 'b.dateAjout', new: 'b.createdAt' }
    ]
  },
  {
    file: 'src/app/pages/admin/admin-dashboard/admin-dashboard.component.ts',
    replacements: [
      { old: 'p.statut === \'pending\'', new: 'p.status === \'pending\'' },
      { old: 'p.statut === \'approved\'', new: 'p.status === \'approved\'' },
      { old: 'p.statut === \'rejected\'', new: 'p.status === \'rejected\'' },
      { old: 'b.dateAjout', new: 'b.createdAt' },
      { old: 'a.dateAjout', new: 'a.createdAt' },
      { old: 'product.prix', new: 'product.price' }
    ]
  },
  {
    file: 'src/app/pages/vendeur/vendeur-dashboard/vendeur-dashboard.component.ts',
    replacements: [
      { old: 'p.statut === \'pending\'', new: 'p.status === \'pending\'' },
      { old: 'p.statut === \'approved\'', new: 'p.status === \'approved\'' },
      { old: 'p.statut === \'rejected\'', new: 'p.status === \'rejected\'' }
    ]
  },
  {
    file: 'src/app/shared/components/admin/sidebar/sidebar.component.ts',
    replacements: [
      { old: 'p.statut === \'pending\'', new: 'p.status === \'pending\'' }
    ]
  },
  {
    file: 'src/app/shared/components/client/produits/produit.component.ts',
    replacements: [
      { old: 'p.statut === \'approved\'', new: 'p.status === \'approved\'' },
      { old: 'p.imageUrl', new: 'p.images?.[0]' },
      { old: 'p.nom', new: 'p.name' }
    ]
  },
  {
    file: 'src/app/shared/components/vendeur/produits/produit.component.ts',
    replacements: [
      { old: 'product.nom', new: 'product.name' }
    ]
  },

  // 2. Correction des templates HTML
  {
    file: 'src/app/features/produits/pages/admin-validation/admin-validation.component.html',
    replacements: [
      { old: 'produit.imageUrl', new: 'produit.images?.[0]' },
      { old: 'produit.nom', new: 'produit.name' },
      { old: 'produit.prix', new: 'produit.price' },
      { old: 'produit.categorie', new: 'produit.category' },
      { old: 'produit.vendeurId', new: 'produit.sellerId' },
      { old: 'produit.dateAjout', new: 'produit.createdAt' },
      { old: 'selectedProductForModal.imageUrl', new: 'selectedProductForModal.images?.[0]' },
      { old: 'selectedProductForModal.nom', new: 'selectedProductForModal.name' }
    ]
  },
  {
    file: 'src/app/features/produits/pages/mes-produits/mes-produits.component.html',
    replacements: [
      { old: 'produit.imageUrl', new: 'produit.images?.[0]' },
      { old: 'produit.nom', new: 'produit.name' },
      { old: 'produit.categorie', new: 'produit.category' },
      { old: 'produit.prix', new: 'produit.price' },
      { old: 'produit.dateAjout', new: 'produit.createdAt' },
      { old: 'produit.statut', new: 'produit.status' },
      { old: 'selectedProductForModal.imageUrl', new: 'selectedProductForModal.images?.[0]' },
      { old: 'selectedProductForModal.nom', new: 'selectedProductForModal.name' }
    ]
  },
  {
    file: 'src/app/pages/admin/admin-dashboard/admin-dashboard.component.html',
    replacements: [
      { old: 'product.photoFlouDataUrl', new: 'product.images?.[0]' },
      { old: 'product.nom', new: 'product.name' },
      { old: 'product.prix', new: 'product.price' },
      { old: 'product.statut', new: 'product.status' }
    ]
  },
  {
    file: 'src/app/pages/vendeur/vendeur-dashboard/vendeur-dashboard.component.html',
    replacements: [
      { old: 'product.photoFlouDataUrl', new: 'product.images?.[0]' },
      { old: 'product.nom', new: 'product.name' },
      { old: 'product.prix', new: 'product.price' },
      { old: 'product.statut', new: 'product.status' }
    ]
  },
  {
    file: 'src/app/shared/components/client/produits/produit.component.html',
    replacements: [
      { old: 'p.imageUrl', new: 'p.images?.[0]' },
      { old: 'p.nom', new: 'p.name' },
      { old: 'p.categorie', new: 'p.category' },
      { old: 'p.prix', new: 'p.price' },
      { old: 'p.vendeurId', new: 'p.sellerId' },
      { old: 'p.statut', new: 'p.status' }
    ]
  },
  {
    file: 'src/app/shared/components/vendeur/produits/produit.component.html',
    replacements: [
      { old: 'p.imageUrl', new: 'p.images?.[0]' },
      { old: 'p.nom', new: 'p.name' },
      { old: 'p.categorie', new: 'p.category' },
      { old: 'p.prix', new: 'p.price' },
      { old: 'p.statut', new: 'p.status' }
    ]
  }
];

// Fonction pour appliquer les corrections
function applyCorrections() {
  let successCount = 0;
  let errorCount = 0;

  corrections.forEach(({ file, replacements }) => {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ Fichier non trouvé: ${file}`);
      errorCount++;
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');

      replacements.forEach(({ old, new: newValue }) => {
        const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, newValue);
      });

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${file}`);
      successCount++;

    } catch (error) {
      console.log(`❌ Erreur lors de la correction de ${file}:`, error.message);
      errorCount++;
    }
  });

  console.log(`\n📊 Résumé:`);
  console.log(`✅ Fichiers corrigés: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📈 Taux de succès: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);

  return successCount > 0;
}

// Exécuter les corrections
if (applyCorrections()) {
  console.log('\n🎉 Corrections terminées avec succès!');
  console.log('💡 Il peut rester quelques erreurs TypeScript mineures à corriger manuellement.');
} else {
  console.log('\n❌ Aucune correction n\'a pu être appliquée.');
}