import { sqliteTable, text, integer, sql } from 'drizzle-orm/sqlite-core';

// Users table as specified in 1.2
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Questionnaires table as specified in 1.2
export const questionnaires = sqliteTable('questionnaires', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skin_type: text('skin_type').notNull(),
  goals: text('goals').notNull(), // JSON array
  conditions: text('conditions').notNull(), // JSON array
  age: integer('age').notNull(),
  sensitivities: text('sensitivities'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Routines table as specified in 1.2
export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  questionnaire_id: text('questionnaire_id').notNull().references(() => questionnaires.id, { onDelete: 'cascade' }),
  products: text('products').notNull(), // JSON array
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// TypeScript types inferred from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Questionnaire = typeof questionnaires.$inferSelect;
export type NewQuestionnaire = typeof questionnaires.$inferInsert;

export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert; 