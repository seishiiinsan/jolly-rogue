CREATE TABLE "staging"."fandom" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staging"."fandom_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kind" text NOT NULL,
	"page_id" integer NOT NULL,
	"title" text NOT NULL,
	"rev_id" integer NOT NULL,
	"source_url" text NOT NULL,
	"license" text NOT NULL,
	"data" jsonb NOT NULL,
	"raw_response_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fandom_kind_page_id_key" UNIQUE("kind","page_id")
);
--> statement-breakpoint
ALTER TABLE "staging"."fandom" ADD CONSTRAINT "fandom_raw_response_id_responses_id_fk" FOREIGN KEY ("raw_response_id") REFERENCES "raw"."responses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fandom_raw_response_id_idx" ON "staging"."fandom" USING btree ("raw_response_id");--> statement-breakpoint
-- updated_at : même fonction que les autres tables staging (0003).
CREATE TRIGGER "fandom_set_updated_at" BEFORE UPDATE ON "staging"."fandom" FOR EACH ROW EXECUTE FUNCTION "staging"."set_updated_at"();
