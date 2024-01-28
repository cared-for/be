import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, boolean } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
  email: varchar('email', { length: 256 }),
  checkedIn: boolean('checked_in').default(false),
})

export const usersRelations = relations(users, ({ many }) => ({
  dependents: many(dependents),
}));

export const dependents = pgTable('dependents', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
  email: varchar('email', { length: 256 }),
  userId: serial('user_id'),
});

export const dependentRelations = relations(dependents, ({ one }) => ({
  users: one(users, {
    fields: [dependents.userId],
    references: [users.id],
  })
}));

