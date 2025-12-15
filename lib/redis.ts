import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
});

// Connect to Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize Redis connection
if (!redisClient.isOpen) {
  redisClient.connect();
}

export default redisClient;

// // Product JSON schema as specified in 1.2
// export interface Product {
//   product_id: string;
//   name: string;
//   brand: string;
//   category: string;
//   effects: string[];
//   ingredients: string[];
//   price: number;
//   image_url: string;
//   description?: string;
//   created_at?: string;
//   updated_at?: string;
// }

// // Redis utility functions
// export const redis = {
//   // Product operations
//   async setProduct(product: Product): Promise<void> {
//     await redisClient.json.set(`product:${product.product_id}`, '$', product);
//   },

//   async getProduct(productId: string): Promise<Product | null> {
//     const product = await redisClient.json.get(`product:${productId}`);
//     return product as Product | null;
//   },

//   async getAllProducts(): Promise<Product[]> {
//     const keys = await redisClient.keys('product:*');
//     const products: Product[] = [];
    
//     for (const key of keys) {
//       const product = await redisClient.json.get(key);
//       if (product) {
//         products.push(product as Product);
//       }
//     }
    
//     return products;
//   },

//   // Health check
//   async ping(): Promise<string> {
//     return await redisClient.ping();
//   },

//   // Close connection
//   async disconnect(): Promise<void> {
//     await redisClient.disconnect();
//   }
// };

// export default redisClient; 