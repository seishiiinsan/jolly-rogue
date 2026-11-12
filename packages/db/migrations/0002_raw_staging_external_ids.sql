CREATE TABLE "canon"."external_ids" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."external_ids_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entity" text NOT NULL,
	"entity_id" integer NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_ids_source_entity_external_id_key" UNIQUE("source","entity","external_id")
);
--> statement-breakpoint
CREATE TABLE "raw"."responses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw"."responses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"url" text NOT NULL,
	"status" smallint NOT NULL,
	"body" text NOT NULL,
	"hash" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staging"."api_onepiece" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staging"."api_onepiece_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"resource" text NOT NULL,
	"lang" text NOT NULL,
	"external_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"raw_response_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_onepiece_resource_lang_external_id_key" UNIQUE("resource","lang","external_id")
);
--> statement-breakpoint
CREATE TABLE "staging"."rejections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staging"."rejections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"resource" text NOT NULL,
	"lang" text NOT NULL,
	"external_id" text NOT NULL,
	"errors" jsonb NOT NULL,
	"raw_response_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rejections_source_resource_lang_external_id_key" UNIQUE("source","resource","lang","external_id")
);
--> statement-breakpoint
ALTER TABLE "staging"."api_onepiece" ADD CONSTRAINT "api_onepiece_raw_response_id_responses_id_fk" FOREIGN KEY ("raw_response_id") REFERENCES "raw"."responses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staging"."rejections" ADD CONSTRAINT "rejections_raw_response_id_responses_id_fk" FOREIGN KEY ("raw_response_id") REFERENCES "raw"."responses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_ids_entity_entity_id_idx" ON "canon"."external_ids" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "responses_url_fetched_at_idx" ON "raw"."responses" USING btree ("url","fetched_at");--> statement-breakpoint
CREATE INDEX "responses_source_idx" ON "raw"."responses" USING btree ("source");--> statement-breakpoint
CREATE INDEX "api_onepiece_raw_response_id_idx" ON "staging"."api_onepiece" USING btree ("raw_response_id");--> statement-breakpoint
CREATE INDEX "rejections_raw_response_id_idx" ON "staging"."rejections" USING btree ("raw_response_id");