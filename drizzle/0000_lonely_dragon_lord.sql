CREATE TABLE IF NOT EXISTS "dependents" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" varchar(256),
	"email" varchar(256),
	"user_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" varchar(256)
);
