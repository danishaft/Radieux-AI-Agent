'use server'

import { createClient } from 'redis';
import { generateEffectsEmbedding } from '@/app/lib/embeddings';

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Server Action to sync N8N data
export async function syncN8nData(force = false) {
  try {
    console.log('🔄 Starting N8N data sync via Server Action...');
    
    // Connect to Redis
    await redis.connect();
    
    // Check if data already exists (unless forced)
    if (!force) {
      const dataExists = await checkDataExists();
      if (dataExists) {
        console.log('📦 Data already exists in Redis. Use force=true to re-sync.');
        return {
          success: true,
          message: 'Data already exists in Redis',
          skipped: true
        };
      }
    }
    
    // Fetch data from N8N
    const products = await fetchN8nData();
    
    console.log(`📦 Processing ${products.length} products...`);
    
    // Create Redis index
    await createRedisIndex();
    
    // Process products
    const results = [];
    let newProducts = 0;
    let skippedProducts = 0;
    
    for (const product of products) {
      const result = await processAndStoreProduct(product);
      if (result) {
        results.push(result);
        newProducts++;
      } else {
        skippedProducts++;
      }
    }
    
    await redis.disconnect();
    
    return {
      success: true,
      message: `Synced ${newProducts} new products`,
      new_products: newProducts,
      skipped_products: skippedProducts,
      total_products: results.length
    };
    
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check if data already exists
async function checkDataExists() {
  try {
    const result = await redis.ft.search('products_idx', '*', {
      LIMIT: { from: 0, size: 1 }
    });
    return (result as any)?.total > 0;
  } catch (error) {
    return false; // Index doesn't exist
  }
}

// Fetch data from N8N
async function fetchN8nData() {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!n8nUrl) {
    throw new Error('N8N_WEBHOOK_URL environment variable not set');
  }
  
  const response = await fetch(n8nUrl);
  const data = await response.json();
  
  return data.products || data;
}

// Create Redis search index
async function createRedisIndex() {
  try {
    await redis.ft.create('products_idx', {
      '$.name': { type: 'TEXT', SORTABLE: true },
      '$.brand': { type: 'TAG' },
      '$.category': { type: 'TAG' },
      '$.effects': { type: 'TEXT' },
      '$.effect_vector': {
        type: 'VECTOR',
        ALGORITHM: 'HNSW',
        DIM: 128,
        DISTANCE_METRIC: 'COSINE'
      }
    }, { ON: 'JSON', PREFIX: 'product:' });
    
    console.log('🔍 Redis search index created');
  } catch (error: any) {
    if (error.message.includes('Index already exists')) {
      console.log('🔍 Redis search index already exists');
    } else {
      throw error;
    }
  }
}

// Process and store product
async function processAndStoreProduct(product: any) {
  try {
    // Check if product already exists
    const existingProduct = await redis.json.get(`product:${product.id || product.product_id}`);
    if (existingProduct) {
      console.log(`⏭️ Product already exists: ${product.name}`);
      return null; // Skip existing products
    }

    const effects = product.effects || [];
    const embedding = await generateEffectsEmbedding(effects);
    
    const productData = {
      product_id: product.id || product.product_id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      effects: effects,
      ingredients: product.ingredients || [],
      price: product.price || 0,
      image_url: product.image_url || '',
      effect_vector: embedding
    };
    
    const key = `product:${productData.product_id}`;
    await redis.json.set(key, '$', productData);
    
    console.log(`✅ Stored product: ${productData.name}`);
    return productData;
    
  } catch (error) {
    console.error(`❌ Failed to store product ${product.name}:`, error);
    throw error;
  }
}

// Get sync status
export async function getSyncStatus() {
  try {
    await redis.connect();
    
    const products = await redis.ft.search('products_idx', '*', {
      LIMIT: { from: 0, size: 1 }
    });
    
    await redis.disconnect();
    
    return {
      success: true,
      products_count: products.total,
      last_sync: new Date().toISOString()
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
} 