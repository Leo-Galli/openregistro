CREATE TYPE "public"."hosting_request_status" AS ENUM('pending', 'contacted', 'activated', 'declined');--> statement-breakpoint
CREATE TABLE "hosting_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"approx_students" integer,
	"message" text,
	"status" "hosting_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
