/**
 * Test script for CRUD operations on the Product Management System
 * This script tests the API connectivity and all CRUD operations
 */

const API_BASE_URL = 'http://localhost:3002';

// Test data for creating a new product
const testProduct = {
  name: 'Test Product - CRUD System',
  description: 'Produit de test pour vérifier le système CRUD complet',
  price: 25000,
  category: 'Électronique',
  stock: 10,
  images: ['https://picsum.photos/400/400?random=test-crud'],
  sellerId: 2,
  status: 'pending'
};

let createdProductId = null;

// Helper function to make API requests
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
    console.error(`API Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Test functions
async function testGetProducts() {
  console.log('\n🧪 Testing GET /products (READ operation)');
  try {
    const products = await apiRequest('/products');
    console.log(`✅ Successfully retrieved ${products.length} products`);
    console.log('Sample product:', products[0]);
    return products;
  } catch (error) {
    console.error('❌ Failed to get products:', error.message);
    return [];
  }
}

async function testCreateProduct() {
  console.log('\n🧪 Testing POST /products (CREATE operation)');
  try {
    const createdProduct = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(testProduct)
    });
    console.log('✅ Successfully created product:', createdProduct);
    createdProductId = createdProduct.id;
    return createdProduct;
  } catch (error) {
    console.error('❌ Failed to create product:', error.message);
    return null;
  }
}

async function testGetProductById(id) {
  console.log(`\n🧪 Testing GET /products/${id} (READ single product)`);
  try {
    const product = await apiRequest(`/products/${id}`);
    console.log('✅ Successfully retrieved product:', product);
    return product;
  } catch (error) {
    console.error(`❌ Failed to get product ${id}:`, error.message);
    return null;
  }
}

async function testUpdateProduct(id) {
  console.log(`\n🧪 Testing PATCH /products/${id} (UPDATE operation)`);
  const updateData = {
    price: 30000,
    stock: 15,
    description: 'Description mise à jour pour le test CRUD'
  };

  try {
    const updatedProduct = await apiRequest(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    console.log('✅ Successfully updated product:', updatedProduct);
    return updatedProduct;
  } catch (error) {
    console.error(`❌ Failed to update product ${id}:`, error.message);
    return null;
  }
}

async function testUpdateProductStatus(id) {
  console.log(`\n🧪 Testing PATCH /products/${id} (UPDATE STATUS operation)`);
  const statusUpdate = {
    status: 'approved',
    validatedBy: 1,
    validatedAt: new Date().toISOString()
  };

  try {
    const updatedProduct = await apiRequest(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(statusUpdate)
    });
    console.log('✅ Successfully updated product status:', updatedProduct);
    return updatedProduct;
  } catch (error) {
    console.error(`❌ Failed to update product status ${id}:`, error.message);
    return null;
  }
}

async function testDeleteProduct(id) {
  console.log(`\n🧪 Testing DELETE /products/${id} (DELETE operation)`);
  try {
    await apiRequest(`/products/${id}`, {
      method: 'DELETE'
    });
    console.log(`✅ Successfully deleted product ${id}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete product ${id}:`, error.message);
    return false;
  }
}

async function testCategories() {
  console.log('\n🧪 Testing GET /categories (READ categories)');
  try {
    const categories = await apiRequest('/categories');
    console.log(`✅ Successfully retrieved ${categories.length} categories`);
    console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name })));
    return categories;
  } catch (error) {
    console.error('❌ Failed to get categories:', error.message);
    return [];
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting CRUD System Tests...\n');

  try {
    // Test basic connectivity and read operations
    await testGetProducts();
    await testCategories();

    // Test create operation
    const createdProduct = await testCreateProduct();
    if (!createdProduct) {
      console.log('\n❌ CREATE operation failed, skipping remaining tests');
      return;
    }

    // Test read single product
    await testGetProductById(createdProductId);

    // Test update operation
    await testUpdateProduct(createdProductId);

    // Test status update
    await testUpdateProductStatus(createdProductId);

    // Test delete operation
    await testDeleteProduct(createdProductId);

    console.log('\n🎉 All CRUD operations completed successfully!');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Execute tests if this script is run directly
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testGetProducts,
  testCreateProduct,
  testGetProductById,
  testUpdateProduct,
  testDeleteProduct,
  testCategories
};