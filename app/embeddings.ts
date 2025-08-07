// Embeddings utility for product vector generation
import { pipeline } from '@xenova/transformers';

let embeddingModel: any = null;

// Initialize embedding model
async function initializeModel() {
  if (!embeddingModel) {
    try {
      // Use a lightweight model for MVP
      embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('🧠 Embedding model loaded');
    } catch (error) {
      console.warn('⚠️ Could not load embedding model, using fallback');
      embeddingModel = null;
    }
  }
  return embeddingModel;
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = await initializeModel();
    
    if (model) {
      // Use proper embedding model
      const result = await model(text);
      return Array.from(result.data);
    } else {
      // Fallback to simple hash-based embedding
      return await simpleHashEmbedding(text);
    }
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    return await simpleHashEmbedding(text);
  }
}

// Simple hash-based embedding fallback
async function simpleHashEmbedding(text: string): Promise<number[]> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Generate 128-dimensional vector
  return Array.from({ length: 128 }, (_, i) => {
    const hashValue = hashArray[i % hashArray.length];
    return Math.sin(hashValue + i) * 0.5 + 0.5;
  });
}

// Generate embedding for effects array
export async function generateEffectsEmbedding(effects: string[]): Promise<number[]> {
  const effectsText = Array.isArray(effects) ? effects.join(' ') : effects;
  return await generateEmbedding(effectsText);
}

// Generate user profile embedding from questionnaire
export async function generateUserEmbedding(questionnaire: {
  goals?: string[];
  conditions?: string[];
  skin_type?: string;
}): Promise<number[]> {
  const { goals = [], conditions = [], skin_type = '' } = questionnaire;
  
  const userText = [
    skin_type,
    ...goals,
    ...conditions
  ].join(' ');
  
  return await generateEmbedding(userText);
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Find most similar products using vector search
export async function findSimilarProducts(
  userVector: number[], 
  redis: any, 
  limit: number = 10
) {
  try {
    // Use Redis vector search
    const results = await redis.ft.search('products_idx', 
      `*=>[KNN $k @effect_vector $query_vector AS score]`, {
      PARAMS: {
        k: limit,
        query_vector: userVector
      },
      RETURN: ['product_id', 'name', 'brand', 'category', 'effects', 'score'],
      SORTBY: 'score',
      DIALECT: 2
    });
    
    return results.documents.map((doc: any) => ({
      product_id: doc.value.product_id,
      name: doc.value.name,
      brand: doc.value.brand,
      category: doc.value.category,
      effects: doc.value.effects,
      similarity: 1 - parseFloat(doc.value.score) // Convert distance to similarity
    }));
    
  } catch (error) {
    console.error('❌ Vector search failed:', error);
    return [];
  }
} 