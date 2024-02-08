ALTER TABLE "users" ADD COLUMN "is_on_free_trial" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "free_trial_start" time;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "completed_user_onboarding" boolean DEFAULT false NOT NULL;