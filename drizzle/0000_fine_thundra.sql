CREATE TYPE "public"."role" AS ENUM('IT', 'Sousakuten', 'Taiikusai', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'ClassA', 'ClassB', 'ClassC', 'ClassD', 'Students', 'Teachers', 'SousakutenMain');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"username" varchar(32) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_id_is_sha256_hex" CHECK ("sessions"."id" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"username" varchar(32) PRIMARY KEY NOT NULL,
	"password_hash" varchar(60) NOT NULL,
	"has_logged_in" boolean DEFAULT false NOT NULL,
	"roles" "role"[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_username_idx" ON "sessions" USING btree ("username");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");