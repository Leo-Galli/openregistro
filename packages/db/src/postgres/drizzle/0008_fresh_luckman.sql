CREATE TABLE "platform_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"notification_emails" text,
	"updated_at" timestamp with time zone NOT NULL
);
