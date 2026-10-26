ALTER TABLE "hosting_requests" ADD COLUMN "subdomain" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "use_platform_email" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_requests" ADD CONSTRAINT "hosting_requests_subdomain_unique" UNIQUE("subdomain");