CREATE TYPE "public"."provisioning_status" AS ENUM('not_started', 'provisioning', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "hosting_requests" ADD COLUMN "vercel_project_id" text;--> statement-breakpoint
ALTER TABLE "hosting_requests" ADD COLUMN "provisioning_status" "provisioning_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_requests" ADD COLUMN "provisioning_error" text;