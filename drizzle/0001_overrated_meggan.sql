ALTER TABLE "users" ADD COLUMN "email" varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "checked_in" boolean DEFAULT false;