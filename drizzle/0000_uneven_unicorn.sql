CREATE TABLE IF NOT EXISTS "dependents" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"user_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" varchar(256) NOT NULL,
	"email" varchar(256),
	"checked_in" boolean DEFAULT false NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL
);
