CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resume_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"resume_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"change_summary" text NOT NULL,
	"snapshot_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"template_id" text,
	"current_json" text NOT NULL,
	"resume_group_id" text,
	"language" text DEFAULT 'en' NOT NULL,
	"sync_source_id" text,
	"sync_base_json" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"html_content" text NOT NULL,
	"css_content" text NOT NULL,
	"schema_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;