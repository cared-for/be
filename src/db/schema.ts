import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, boolean, integer, time } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey().notNull(),
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  checkedIn: boolean('checked_in').default(false).notNull(),
  checkInTime: time('check_in_time', { withTimezone: false }),
  attemptCount: integer('attempt_count').default(0).notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  dependents: many(dependents),
}));

export const dependents = pgTable('dependents', {
  id: serial('id').primaryKey().notNull(),
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  userId: serial('user_id'),
});

export const dependentRelations = relations(dependents, ({ one }) => ({
  users: one(users, {
    fields: [dependents.userId],
    references: [users.id],
  })
}));

