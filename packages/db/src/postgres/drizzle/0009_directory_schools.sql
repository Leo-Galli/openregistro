ALTER TABLE "hosting_requests" ADD COLUMN "listed_in_app" boolean DEFAULT true NOT NULL;-->statement-breakpoint
CREATE TABLE "directory_schools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"listed_in_app" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "directory_schools_base_url_unique" UNIQUE("base_url")
);
