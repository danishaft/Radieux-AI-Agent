import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema';

// Initialize database
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'skincareai.db');
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Database utility functions using Drizzle
export const database = {
  // User operations
  async createUser(userId: string): Promise<schema.User> {
    const newUser = await db.insert(schema.users).values({
      id: userId,
    }).returning();
    
    return newUser[0];
  },

  async getUser(userId: string): Promise<schema.User | null> {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    return user[0] || null;
  },

  // Questionnaire operations
  async createQuestionnaire(data: Omit<schema.NewQuestionnaire, 'id' | 'created_at'>): Promise<schema.Questionnaire> {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newQuestionnaire = await db.insert(schema.questionnaires).values({
      id,
      ...data,
    }).returning();
    
    return newQuestionnaire[0];
  },

  async getQuestionnaire(questionnaireId: string): Promise<schema.Questionnaire | null> {
    const questionnaire = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, questionnaireId)).limit(1);
    return questionnaire[0] || null;
  },

  async getQuestionnairesByUser(userId: string): Promise<schema.Questionnaire[]> {
    return await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.user_id, userId)).orderBy(desc(schema.questionnaires.created_at));
  },

  // Routine operations
  async createRoutine(data: Omit<schema.NewRoutine, 'id' | 'created_at'>): Promise<schema.Routine> {
    const id = `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRoutine = await db.insert(schema.routines).values({
      id,
      ...data,
    }).returning();
    
    return newRoutine[0];
  },

  async getRoutine(routineId: string): Promise<schema.Routine | null> {
    const routine = await db.select().from(schema.routines).where(eq(schema.routines.id, routineId)).limit(1);
    return routine[0] || null;
  },

  async getRoutineByQuestionnaire(questionnaireId: string): Promise<schema.Routine | null> {
    const routine = await db.select().from(schema.routines).where(eq(schema.routines.questionnaire_id, questionnaireId)).orderBy(desc(schema.routines.created_at)).limit(1);
    return routine[0] || null;
  },

  async getRoutinesByUser(userId: string): Promise<schema.Routine[]> {
    return await db.select({
      id: schema.routines.id,
      questionnaire_id: schema.routines.questionnaire_id,
      products: schema.routines.products,
      created_at: schema.routines.created_at,
    }).from(schema.routines).innerJoin(schema.questionnaires, eq(schema.routines.questionnaire_id, schema.questionnaires.id)).where(eq(schema.questionnaires.user_id, userId)).orderBy(desc(schema.routines.created_at));
  },

  // Utility functions
  close(): void {
    sqlite.close();
  },

  // Health check
  ping(): boolean {
    try {
      sqlite.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }
};

// Import Drizzle functions
import { eq, desc } from 'drizzle-orm';

export default db; 