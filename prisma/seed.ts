import { PrismaClient, UserRole, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Créer les utilisateurs depuis db.json
  const usersData = [
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@klick.com',
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'Klick',
      isActive: true,
      permissions: ['all']
    },
    {
      id: 'seller-1',
      username: 'papa',
      email: 'vendeur1@klick.com',
      role: UserRole.SELLER,
      lastName: 'Dubois',
      phone: '+221771234567',
      whatsapp: '+221771234567',
      isActive: true,
      businessName: 'Boutique Marie',
      businessDescription: 'Mode et accessoires féminins',
      businessAddress: 'Dakar, Sénégal',
      businessPhone: '+221771234567',
      permissions: []
    },
    {
      id: 'seller-2',
      username: 'vendeur2',
      email: 'vendeur2@klick.com',
      role: UserRole.SELLER,
      firstName: 'Jean',
      lastName: 'Martin',
      phone: '+221789876543',
      whatsapp: '+221789876543',
      isActive: true,
      businessName: 'TechStore Jean',
      businessDescription: 'Électronique et gadgets',
      businessAddress: 'Dakar, Sénégal',
      businessPhone: '+221789876543',
      permissions: []
    },
    {
      id: 'customer-1',
      username: 'client1',
      email: 'client1@klick.com',
      role: UserRole.CUSTOMER,
      firstName: 'Sophie',
      lastName: 'Bernard',
      isActive: true,
      permissions: []
    }
  ];

  for (const userData of usersData) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
  }

  // Créer les catégories depuis db.json
  const categoriesData = [
    {
      id: 'cat-1',
      name: 'Électronique',
      description: 'Téléphones, ordinateurs, tablettes et accessoires',
      image: 'assets/images/categories/electronics.jpg',
      isActive: true,
      productCount: 15
    },
    {
      id: 'cat-2',
      name: 'Mode',
      description: 'Vêtements, chaussures et accessoires de mode',
      image: 'assets/images/categories/fashion.jpg',
      isActive: true,
      productCount: 25
    },
    {
      id: 'cat-3',
      name: 'Maison & Jardin',
      description: 'Décoration, meubles et articles de jardin',
      image: 'assets/images/categories/home.jpg',
      isActive: true,
      productCount: 18
    },
    {
      id: 'cat-4',
      name: 'Sports & Loisirs',
      description: 'Équipements sportifs et articles de loisir',
      image: 'assets/images/categories/sports.jpg',
      isActive: true,
      productCount: 12
    },
    {
      id: 'cat-5',
      name: 'Livres',
      description: 'Livres, ebooks et magazines',
      image: 'assets/images/categories/books.jpg',
      isActive: true,
      productCount: 8
    }
  ];

  for (const categoryData of categoriesData) {
    await prisma.category.upsert({
      where: { name: categoryData.name },
      update: categoryData,
      create: categoryData,
    });
  }

  // Créer quelques produits depuis db.json
  const productsData = [
    {
      id: 'prod-1',
      name: 'iPhone 15 Pro Max',
      description: 'Le smartphone Apple dernière génération avec appareil photo professionnel, puce A17 Pro et écran Super Retina XDR.',
      price: 899000,
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
      ],
      category: 'Électronique',
      stock: 5,
      rating: 4.8,
      status: ProductStatus.APPROVED,
      sellerId: 'seller-2',
      validatedBy: 'admin-1',
      views: 0,
      contactClicks: 0,
      addToCartClicks: 0,
      whatsappClicks: 2
    },
    {
      id: 'prod-2',
      name: 'Casque Bluetooth Sony',
      description: 'Casque sans fil Sony WH-1000XM4 avec réduction de bruit active et qualité audio exceptionnelle.',
      price: 285000,
      images: [
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'
      ],
      category: 'Électronique',
      stock: 3,
      rating: 4.7,
      status: ProductStatus.APPROVED,
      sellerId: 'seller-2',
      validatedBy: 'admin-1',
      views: 0,
      contactClicks: 1,
      addToCartClicks: 0,
      whatsappClicks: 1
    }
  ];

  for (const productData of productsData) {
    await prisma.product.upsert({
      where: { id: productData.id },
      update: productData,
      create: productData,
    });
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });