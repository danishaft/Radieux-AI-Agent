import { redis } from './redis';

// Setup Redis vector index for product search as specified in 1.2
export async function setupRedisIndex() {
  try {
    // Check if index already exists
    try {
      await redis.ft.info('products_idx');
      console.log('Redis index already exists');
      return;
    } catch (error) {
      // Index doesn't exist, create it
      console.log('Creating Redis index...');
    }

    // Create the vector index for products as specified in 1.2
    await redis.ft.create('products_idx', {
      '$.name': { type: 'TEXT', SORTABLE: true },
      '$.category': { type: 'TAG' },
      '$.brand': { type: 'TAG' },
      '$.effect_vector': {
        type: 'VECTOR',
        ALGORITHM: 'HNSW',
        DIM: 128,
        DISTANCE_METRIC: 'COSINE'
      }
    }, { 
      ON: 'JSON', 
      PREFIX: 'product:' 
    });

    console.log('Redis vector index created successfully');
  } catch (error) {
    console.error('Error setting up Redis index:', error);
    throw error;
  }
}

// Test the index
export async function testIndex() {
  try {
    const productInfo = await redis.ft.info('products_idx');
    console.log('Product index info:', productInfo);
    console.log('Redis index is working correctly');
  } catch (error) {
    console.error('Error testing index:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupRedisIndex()
    .then(() => testIndex())
    .then(() => {
      console.log('Redis setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Redis setup failed:', error);
      process.exit(1);
    });
} 