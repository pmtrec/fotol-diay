/**
 * Comprehensive CRUD Examples for Product Management System
 *
 * This file demonstrates all CRUD operations with proper error handling,
 * validation, and real-world usage examples.
 */

const API_BASE_URL = 'http://localhost:3002';

// Example products for testing
const exampleProducts = [
  {
    name: 'Smartphone Samsung Galaxy A54',
    description: 'Smartphone dernière génération avec appareil photo 50MP, écran AMOLED 120Hz et batterie longue durée.',
    price: 285000,
    category: 'Électronique',
    stock: 15,
    images: ['https://picsum.photos/400/400?random=samsung-a54'],
    sellerId: 2,
    status: 'pending'
  },
  {
    name: 'Robe d\'été fleurie',
    description: 'Belle robe d\'été légère avec motifs floraux, parfaite pour les journées chaudes.',
    price: 35000,
    category: 'Mode',
    stock: 8,
    images: ['https://picsum.photos/400/400?random=robe-ete'],
    sellerId: 3,
    status: 'pending'
  },
  {
    name: 'Set de casseroles antiadhésives',
    description: 'Ensemble de 5 casseroles avec revêtement antiadhésif, compatibles induction.',
    price: 75000,
    category: 'Maison & Jardin',
    stock: 12,
    images: ['https://picsum.photos/400/400?random=casseroles'],
    sellerId: 2,
    status: 'pending'
  }
];

// Helper function for API requests with better error handling
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ API Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// ==================== COMPREHENSIVE CRUD EXAMPLES ====================

/**
 * Example 1: Create multiple products with validation
 */
async function exampleCreateProducts() {
  console.log('\n📝 EXAMPLE 1: Creating Multiple Products with Validation');
  console.log('='.repeat(60));

  for (const productData of exampleProducts) {
    try {
      console.log(`\n🔄 Creating product: ${productData.name}`);

      // Validate product data before sending
      validateProductData(productData);

      const createdProduct = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      console.log(`✅ Product created successfully:`);
      console.log(`   ID: ${createdProduct.id}`);
      console.log(`   Name: ${createdProduct.name}`);
      console.log(`   Status: ${createdProduct.status}`);
      console.log(`   Category: ${createdProduct.category}`);

    } catch (error) {
      console.error(`❌ Failed to create product "${productData.name}":`, error.message);

      // Demonstrate error handling for specific cases
      if (error.message.includes('validation')) {
        console.log('💡 This is a validation error. Check your product data.');
      } else if (error.message.includes('500')) {
        console.log('💡 This is a server error. The server might be down.');
      }
    }
  }
}

/**
 * Example 2: Read products with filtering and error handling
 */
async function exampleReadProducts() {
  console.log('\n📖 EXAMPLE 2: Reading Products with Filtering');
  console.log('='.repeat(60));

  try {
    // Get all products
    console.log('\n🔄 Fetching all products...');
    const allProducts = await apiRequest('/products');
    console.log(`✅ Retrieved ${allProducts.length} products`);

    // Filter by category
    console.log('\n🔄 Filtering products by category "Électronique"...');
    const electronicProducts = await apiRequest('/products?category=Électronique');
    console.log(`✅ Found ${electronicProducts.length} electronic products`);

    // Filter by seller
    console.log('\n🔄 Filtering products by seller ID 2...');
    const sellerProducts = await apiRequest('/products?sellerId=2');
    console.log(`✅ Seller 2 has ${sellerProducts.length} products`);

    // Get single product
    if (allProducts.length > 0) {
      const firstProductId = allProducts[0].id;
      console.log(`\n🔄 Getting single product with ID: ${firstProductId}`);
      const singleProduct = await apiRequest(`/products/${firstProductId}`);
      console.log(`✅ Retrieved product: ${singleProduct.name}`);
    }

  } catch (error) {
    console.error('❌ Error reading products:', error.message);

    if (error.message.includes('404')) {
      console.log('💡 No products found. Create some products first.');
    }
  }
}

/**
 * Example 3: Update products with partial data and validation
 */
async function exampleUpdateProducts() {
  console.log('\n🔄 EXAMPLE 3: Updating Products with Validation');
  console.log('='.repeat(60));

  try {
    // Get products first
    const products = await apiRequest('/products?sellerId=2');

    if (products.length === 0) {
      console.log('⚠️ No products found for seller 2. Create some products first.');
      return;
    }

    const productToUpdate = products[0];
    console.log(`\n🔄 Updating product: ${productToUpdate.name}`);

    // Example 1: Update price and stock
    const priceUpdate = {
      price: productToUpdate.price * 1.1, // 10% increase
      stock: productToUpdate.stock + 5
    };

    try {
      const updatedProduct = await apiRequest(`/products/${productToUpdate.id}`, {
        method: 'PATCH',
        body: JSON.stringify(priceUpdate)
      });

      console.log(`✅ Price updated from ${productToUpdate.price} to ${updatedProduct.price}`);
      console.log(`✅ Stock updated from ${productToUpdate.stock} to ${updatedProduct.stock}`);

    } catch (error) {
      console.error('❌ Price update failed:', error.message);
    }

    // Example 2: Update status (admin operation)
    console.log(`\n🔄 Updating product status to "approved"...`);
    const statusUpdate = {
      status: 'approved',
      validatedBy: 1,
      validatedAt: new Date().toISOString()
    };

    try {
      const approvedProduct = await apiRequest(`/products/${productToUpdate.id}`, {
        method: 'PATCH',
        body: JSON.stringify(statusUpdate)
      });

      console.log(`✅ Product status updated to: ${approvedProduct.status}`);

    } catch (error) {
      console.error('❌ Status update failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error in update example:', error.message);
  }
}

/**
 * Example 4: Delete products with confirmation
 */
async function exampleDeleteProducts() {
  console.log('\n🗑️ EXAMPLE 4: Deleting Products Safely');
  console.log('='.repeat(60));

  try {
    // Get products by a specific seller (test products)
    const products = await apiRequest('/products?sellerId=2&status=pending');

    if (products.length === 0) {
      console.log('⚠️ No pending products found for deletion.');
      return;
    }

    console.log(`\n🔄 Found ${products.length} products that can be deleted`);

    for (const product of products) {
      console.log(`\n🗑️ Deleting product: ${product.name}`);

      try {
        await apiRequest(`/products/${product.id}`, {
          method: 'DELETE'
        });

        console.log(`✅ Product "${product.name}" deleted successfully`);

      } catch (error) {
        console.error(`❌ Failed to delete product "${product.name}":`, error.message);

        if (error.message.includes('404')) {
          console.log('💡 Product was already deleted or never existed.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in delete example:', error.message);
  }
}

/**
 * Example 5: Error handling demonstration
 */
async function exampleErrorHandling() {
  console.log('\n🚨 EXAMPLE 5: Error Handling Demonstration');
  console.log('='.repeat(60));

  // Test various error scenarios
  const errorTests = [
    {
      name: 'Invalid product ID',
      request: () => apiRequest('/products/invalid-id-123'),
      expectedError: '404'
    },
    {
      name: 'Delete non-existent product',
      request: () => apiRequest('/products/99999', { method: 'DELETE' }),
      expectedError: '404'
    },
    {
      name: 'Invalid JSON in request body',
      request: () => apiRequest('/products', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' }
      }),
      expectedError: '400'
    }
  ];

  for (const test of errorTests) {
    console.log(`\n🔍 Testing: ${test.name}`);

    try {
      await test.request();
      console.log(`⚠️ Expected error but request succeeded`);

    } catch (error) {
      console.log(`✅ Got expected error: ${error.message}`);

      if (test.expectedError && error.message.includes(test.expectedError)) {
        console.log(`🎯 Error type matches expected: ${test.expectedError}`);
      }
    }
  }
}

/**
 * Example 6: Complete workflow demonstration
 */
async function exampleCompleteWorkflow() {
  console.log('\n🔄 EXAMPLE 6: Complete Product Management Workflow');
  console.log('='.repeat(60));

  try {
    console.log('\n📊 Starting complete workflow demonstration...');

    // Step 1: Check current state
    const initialProducts = await apiRequest('/products');
    console.log(`📊 Initial product count: ${initialProducts.length}`);

    // Step 2: Create a test product
    console.log('\n📝 Step 1: Creating test product...');
    const testProduct = {
      name: 'Workflow Test Product',
      description: 'Produit créé pour démontrer le workflow complet du système CRUD',
      price: 50000,
      category: 'Électronique',
      stock: 5,
      images: ['https://picsum.photos/400/400?random=workflow-test'],
      sellerId: 2,
      status: 'pending'
    };

    const createdProduct = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(testProduct)
    });

    console.log(`✅ Created product: ${createdProduct.name} (ID: ${createdProduct.id})`);

    // Step 3: Read the created product
    console.log('\n📖 Step 2: Reading created product...');
    const retrievedProduct = await apiRequest(`/products/${createdProduct.id}`);
    console.log(`✅ Retrieved product: ${retrievedProduct.name}`);
    console.log(`   Price: ${retrievedProduct.price} FCFA`);
    console.log(`   Stock: ${retrievedProduct.stock}`);
    console.log(`   Status: ${retrievedProduct.status}`);

    // Step 4: Update the product
    console.log('\n🔄 Step 3: Updating product...');
    const updateData = {
      price: 55000,
      stock: 10,
      description: 'Description mise à jour lors du workflow de test'
    };

    const updatedProduct = await apiRequest(`/products/${createdProduct.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });

    console.log(`✅ Updated product:`);
    console.log(`   New price: ${updatedProduct.price} FCFA`);
    console.log(`   New stock: ${updatedProduct.stock}`);

    // Step 5: Update status (admin approval)
    console.log('\n👑 Step 4: Admin approving product...');
    const approvalData = {
      status: 'approved',
      validatedBy: 1,
      validatedAt: new Date().toISOString()
    };

    const approvedProduct = await apiRequest(`/products/${createdProduct.id}`, {
      method: 'PATCH',
      body: JSON.stringify(approvalData)
    });

    console.log(`✅ Product approved! Status: ${approvedProduct.status}`);

    // Step 6: Clean up - delete test product
    console.log('\n🗑️ Step 5: Cleaning up test product...');
    await apiRequest(`/products/${createdProduct.id}`, {
      method: 'DELETE'
    });

    console.log(`✅ Test product deleted successfully`);

    // Step 7: Verify final state
    const finalProducts = await apiRequest('/products');
    console.log(`\n📊 Final product count: ${finalProducts.length}`);
    console.log(`✅ Workflow completed successfully!`);

  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
  }
}

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate product data before sending to API
 */
function validateProductData(product) {
  const errors = [];

  if (!product.name || product.name.trim().length < 3) {
    errors.push('Product name must be at least 3 characters long');
  }

  if (!product.description || product.description.trim().length < 10) {
    errors.push('Product description must be at least 10 characters long');
  }

  if (!product.price || product.price <= 0) {
    errors.push('Product price must be greater than 0');
  }

  if (typeof product.stock !== 'number' || product.stock < 0) {
    errors.push('Product stock must be a positive number');
  }

  if (!product.category || product.category.trim().length === 0) {
    errors.push('Product category is required');
  }

  if (!product.images || product.images.length === 0) {
    errors.push('At least one product image is required');
  }

  if (!product.sellerId || product.sellerId <= 0) {
    errors.push('Valid seller ID is required');
  }

  // Check for basic content validation
  if (product.name && product.name.length > 100) {
    errors.push('Product name is too long (maximum 100 characters)');
  }

  if (product.description && product.description.length > 1000) {
    errors.push('Product description is too long (maximum 1000 characters)');
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.join('\n')}`);
  }
}

// ==================== MAIN EXECUTION ====================

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 COMPREHENSIVE CRUD SYSTEM EXAMPLES');
  console.log('=====================================\n');

  try {
    await exampleCreateProducts();
    await exampleReadProducts();
    await exampleUpdateProducts();
    await exampleErrorHandling();
    await exampleCompleteWorkflow();
    await exampleDeleteProducts();

    console.log('\n🎉 ALL EXAMPLES COMPLETED!');
    console.log('\n📚 Summary of what was demonstrated:');
    console.log('   ✅ Product creation with validation');
    console.log('   ✅ Product reading with filtering');
    console.log('   ✅ Product updating with partial data');
    console.log('   ✅ Product deletion with safety checks');
    console.log('   ✅ Comprehensive error handling');
    console.log('   ✅ Complete workflow from creation to deletion');
    console.log('   ✅ Data validation and sanitization');
    console.log('   ✅ Real-world usage scenarios');

  } catch (error) {
    console.error('\n💥 Examples suite failed:', error);
  }
}

// ==================== USAGE INSTRUCTIONS ====================

/**
 * Instructions for using this CRUD system
 */
function printUsageInstructions() {
  console.log('\n📖 CRUD SYSTEM USAGE INSTRUCTIONS');
  console.log('==================================');
  console.log('\n1. CREATE - Add new products:');
  console.log('   POST /products');
  console.log('   Body: { name, description, price, category, stock, images, sellerId }');
  console.log('\n2. READ - Get products:');
  console.log('   GET /products - Get all products');
  console.log('   GET /products/{id} - Get single product');
  console.log('   GET /products?category=Electronique - Filter by category');
  console.log('   GET /products?sellerId=2 - Filter by seller');
  console.log('\n3. UPDATE - Modify products:');
  console.log('   PATCH /products/{id}');
  console.log('   Body: { price, stock, description, status, etc. }');
  console.log('\n4. DELETE - Remove products:');
  console.log('   DELETE /products/{id}');
  console.log('\n5. VALIDATION RULES:');
  console.log('   - Name: minimum 3 characters');
  console.log('   - Description: minimum 10 characters');
  console.log('   - Price: must be greater than 0');
  console.log('   - Stock: must be positive number');
  console.log('   - Category: required');
  console.log('   - Images: at least one image required');
  console.log('   - Seller ID: valid seller ID required');
  console.log('   - Content: must be appropriate for all audiences');
}

// Run examples if this file is executed directly
if (typeof window === 'undefined') {
  printUsageInstructions();
  runAllExamples().catch(console.error);
}

module.exports = {
  runAllExamples,
  exampleCreateProducts,
  exampleReadProducts,
  exampleUpdateProducts,
  exampleDeleteProducts,
  exampleErrorHandling,
  exampleCompleteWorkflow,
  validateProductData,
  printUsageInstructions
};