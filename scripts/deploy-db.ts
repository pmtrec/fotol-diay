import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function deployDatabase() {
  console.log('🚀 Déploiement de la base de données sur Supabase...');

  try {
    // Vérifier que les variables Supabase sont définies
    if (!process.env.SUPABASE_URL || !process.env.DATABASE_URL) {
      throw new Error('Variables d\'environnement SUPABASE_URL et DATABASE_URL requises');
    }

    console.log('📋 Génération du client Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('🔄 Push du schéma vers Supabase...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('🌱 Exécution des seeders...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

    console.log('✅ Déploiement terminé avec succès !');
    console.log('🎉 Votre base de données Supabase est prête !');

  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error);
    process.exit(1);
  }
}

deployDatabase();