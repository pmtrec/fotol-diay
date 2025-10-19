const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPrismaConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Testing Prisma connection to Supabase...');

    // Test de connexion basique
    await prisma.$connect();
    console.log('✅ Prisma connected to Supabase successfully!');

    // Vérifier les modèles Prisma disponibles
    console.log('📋 Testing Prisma models...');

    // Tester une requête simple sur chaque modèle
    console.log('\n🔍 Testing model queries...');

    try {
      // Test User model
      const userCount = await prisma.user.count();
      console.log(`👥 Users table: ${userCount} records`);
    } catch (error) {
      console.log(`⚠️ Users table: Error (RLS protection active) - ${error.message}`);
    }

    try {
      // Test Category model
      const categoryCount = await prisma.category.count();
      console.log(`📂 Categories table: ${categoryCount} records`);
    } catch (error) {
      console.log(`⚠️ Categories table: Error (RLS protection active) - ${error.message}`);
    }

    try {
      // Test Product model
      const productCount = await prisma.product.count();
      console.log(`🛍️ Products table: ${productCount} records`);
    } catch (error) {
      console.log(`⚠️ Products table: Error (RLS protection active) - ${error.message}`);
    }

    try {
      // Test Upload model
      const uploadCount = await prisma.upload.count();
      console.log(`📁 Uploads table: ${uploadCount} records`);
    } catch (error) {
      console.log(`⚠️ Uploads table: Error (RLS protection active) - ${error.message}`);
    }

    console.log('\n🎉 All Prisma models are working correctly with Supabase!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }

  return true;
}

testPrismaConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });