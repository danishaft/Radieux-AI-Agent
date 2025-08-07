import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import { generateEffectsEmbedding } from '../../lib/embeddings';

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

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
        DISTANCE_METRIC: 'COSINE',
        TYPE: 'FLOAT32'
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

// Process and store individual product
async function processAndStoreProduct(product: any) {
  try {
    // Check if product already exists
    const existingProduct = await redis.json.get(`product:${product.id || product.product_id}`);
    if (existingProduct) {
      console.log(`⏭️ Product already exists: ${product.name}`);
      return existingProduct;
    }

    // Generate vector embedding from effects
    const effects = product.effects || [];
    const embedding = await generateEffectsEmbedding(effects);
    
    // Prepare product data for Redis
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
    
    // Store in Redis as JSON
    const key = `product:${productData.product_id}`;
    await redis.json.set(key, '$', productData);
    
    console.log(`✅ Stored product: ${productData.name}`);
    return productData;
    
  } catch (error) {
    console.error(`❌ Failed to store product ${product.name}:`, error);
    throw error;
  }
}

// Fetch data from N8N (webhook or API)
async function fetchN8nData() {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!n8nUrl) {
    throw new Error('N8N_WEBHOOK_URL environment variable not set');
  }
  
  const response = await fetch(n8nUrl);
  const data = await response.json();
  
  return data.products || data;
}

// Read from N8N export file
async function readN8nExport() {
  const fs = await import('fs/promises');
  const data = await fs.readFile('./data/n8n-export.json', 'utf8');
  return JSON.parse(data);
}

// Main sync function with persistence check
async function syncN8nToRedis(force = false) {
  try {
    console.log('🔄 Starting N8N to Redis sync...');
    
    // Connect to Redis
    await redis.connect();
    
    // Check if data already exists (unless forced)
    if (!force) {
      const dataExists = await checkDataExists();
      if (dataExists) {
        console.log('📦 Data already exists in Redis. Use force=true to re-sync.');
        return { skipped: true, message: 'Data already exists' };
      }
    }
    
    // Option 1: Fetch from N8N webhook/API
    const products = await fetchN8nData();
    
    // Option 2: Read from exported JSON file
    // const products = await readN8nExport();
    
    console.log(`📦 Processing ${products.length} products...`);
    
    // Create Redis index for vector search
    await createRedisIndex();
    
    // Process and store each product
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
    
    console.log(`✅ Sync completed! New: ${newProducts}, Skipped: ${skippedProducts}`);
    return { 
      new: newProducts, 
      skipped: skippedProducts, 
      total: results.length 
    };
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await redis.disconnect();
  }
}

// POST /api/sync-n8n - Sync data from N8N
export async function POST(request: NextRequest) {
  try {
    const { force } = await request.json().catch(() => ({}));
    const results = await syncN8nToRedis(force);
    
    if (results.skipped) {
      return NextResponse.json({
        success: true,
        message: results.message,
        force_sync: false
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${results.new} new products to Redis`,
      new_products: results.new,
      skipped_products: results.skipped,
      total_products: results.total
    });
    
  } catch (error: any) {
    console.error('❌ Sync API failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET /api/sync-n8n - Get sync status
export async function GET() {
  try {
    await redis.connect();
    
    // Check if products exist in Redis
    const products = await redis.ft.search('products_idx', '*', {
      LIMIT: { from: 0, size: 1 }
    });
    
    await redis.disconnect();
    
    return NextResponse.json({
      success: true,
      products_count: (products as any)?.total || 0,
      data_exists: (products as any)?.total > 0,
      last_sync: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      data_exists: false
    }, { status: 500 });
  }
} 