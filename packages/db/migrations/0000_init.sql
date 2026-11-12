CREATE SCHEMA "canon";
--> statement-breakpoint
CREATE SCHEMA "raw";
--> statement-breakpoint
CREATE SCHEMA "staging";
--> statement-breakpoint
CREATE TYPE "canon"."crew_kind" AS ENUM('pirate', 'marine', 'government', 'revolutionary', 'other');--> statement-breakpoint
CREATE TYPE "canon"."devil_fruit_type" AS ENUM('paramecia', 'zoan', 'logia');--> statement-breakpoint
CREATE TYPE "canon"."haki_kind" AS ENUM('observation', 'armament', 'conqueror');--> statement-breakpoint
CREATE TYPE "canon"."vital_status" AS ENUM('alive', 'deceased', 'unknown');--> statement-breakpoint
CREATE TABLE "canon"."arcs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."arcs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text,
	"saga_id" integer NOT NULL,
	"chapter_start" integer,
	"chapter_end" integer,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arcs_slug_unique" UNIQUE("slug"),
	CONSTRAINT "arcs_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "arcs_chapter_range_check" CHECK ("canon"."arcs"."chapter_end" >= "canon"."arcs"."chapter_start")
);
--> statement-breakpoint
CREATE TABLE "canon"."bounties" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."bounties_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"character_id" integer NOT NULL,
	"amount_berry" bigint NOT NULL,
	"as_of_chapter" integer,
	"is_current" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bounties_character_id_amount_berry_key" UNIQUE("character_id","amount_berry"),
	CONSTRAINT "bounties_amount_berry_check" CHECK ("canon"."bounties"."amount_berry" >= 0),
	CONSTRAINT "bounties_as_of_chapter_check" CHECK ("canon"."bounties"."as_of_chapter" > 0)
);
--> statement-breakpoint
CREATE TABLE "canon"."character_affiliations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."character_affiliations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"character_id" integer NOT NULL,
	"crew_id" integer NOT NULL,
	"role" text,
	"is_current" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_affiliations_character_id_crew_id_role_key" UNIQUE NULLS NOT DISTINCT("character_id","crew_id","role")
);
--> statement-breakpoint
CREATE TABLE "canon"."character_aliases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."character_aliases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"character_id" integer NOT NULL,
	"alias" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_aliases_character_id_alias_kind_key" UNIQUE("character_id","alias","kind")
);
--> statement-breakpoint
CREATE TABLE "canon"."character_fruits" (
	"character_id" integer NOT NULL,
	"fruit_id" integer NOT NULL,
	"is_current" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_fruits_character_id_fruit_id_pk" PRIMARY KEY("character_id","fruit_id")
);
--> statement-breakpoint
CREATE TABLE "canon"."characters" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."characters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text,
	"name_jp" text,
	"epithet" text,
	"status" "canon"."vital_status" DEFAULT 'unknown' NOT NULL,
	"age" smallint,
	"height_cm" integer,
	"origin_location_id" integer,
	"debut_chapter" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "characters_slug_unique" UNIQUE("slug"),
	CONSTRAINT "characters_age_check" CHECK ("canon"."characters"."age" >= 0),
	CONSTRAINT "characters_height_cm_check" CHECK ("canon"."characters"."height_cm" > 0),
	CONSTRAINT "characters_debut_chapter_check" CHECK ("canon"."characters"."debut_chapter" > 0)
);
--> statement-breakpoint
CREATE TABLE "canon"."crews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."crews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text,
	"kind" "canon"."crew_kind" NOT NULL,
	"captain_id" integer,
	"is_yonko" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crews_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "canon"."devil_fruits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."devil_fruits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_romaji" text NOT NULL,
	"name_en" text,
	"name_fr" text,
	"type" "canon"."devil_fruit_type",
	"subtype" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devil_fruits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "canon"."haki" (
	"character_id" integer NOT NULL,
	"kind" "canon"."haki_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "haki_character_id_kind_pk" PRIMARY KEY("character_id","kind")
);
--> statement-breakpoint
CREATE TABLE "canon"."locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text,
	"sea" text,
	"kind" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "canon"."provenance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."provenance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entity" text NOT NULL,
	"entity_id" integer NOT NULL,
	"field" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"license" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provenance_entity_entity_id_field_source_key" UNIQUE("entity","entity_id","field","source")
);
--> statement-breakpoint
CREATE TABLE "canon"."sagas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "canon"."sagas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text,
	"chapter_start" integer,
	"chapter_end" integer,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sagas_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sagas_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "sagas_chapter_range_check" CHECK ("canon"."sagas"."chapter_end" >= "canon"."sagas"."chapter_start")
);
--> statement-breakpoint
ALTER TABLE "canon"."arcs" ADD CONSTRAINT "arcs_saga_id_sagas_id_fk" FOREIGN KEY ("saga_id") REFERENCES "canon"."sagas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."bounties" ADD CONSTRAINT "bounties_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "canon"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."character_affiliations" ADD CONSTRAINT "character_affiliations_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "canon"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."character_affiliations" ADD CONSTRAINT "character_affiliations_crew_id_crews_id_fk" FOREIGN KEY ("crew_id") REFERENCES "canon"."crews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."character_aliases" ADD CONSTRAINT "character_aliases_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "canon"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."character_fruits" ADD CONSTRAINT "character_fruits_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "canon"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."character_fruits" ADD CONSTRAINT "character_fruits_fruit_id_devil_fruits_id_fk" FOREIGN KEY ("fruit_id") REFERENCES "canon"."devil_fruits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."characters" ADD CONSTRAINT "characters_origin_location_id_locations_id_fk" FOREIGN KEY ("origin_location_id") REFERENCES "canon"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."crews" ADD CONSTRAINT "crews_captain_id_characters_id_fk" FOREIGN KEY ("captain_id") REFERENCES "canon"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canon"."haki" ADD CONSTRAINT "haki_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "canon"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arcs_saga_id_idx" ON "canon"."arcs" USING btree ("saga_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bounties_current_character_key" ON "canon"."bounties" USING btree ("character_id") WHERE "canon"."bounties"."is_current";--> statement-breakpoint
CREATE INDEX "character_affiliations_crew_id_idx" ON "canon"."character_affiliations" USING btree ("crew_id");--> statement-breakpoint
CREATE INDEX "character_aliases_alias_idx" ON "canon"."character_aliases" USING btree ("alias");--> statement-breakpoint
CREATE UNIQUE INDEX "character_fruits_current_fruit_key" ON "canon"."character_fruits" USING btree ("fruit_id") WHERE "canon"."character_fruits"."is_current";--> statement-breakpoint
CREATE INDEX "characters_origin_location_id_idx" ON "canon"."characters" USING btree ("origin_location_id");--> statement-breakpoint
CREATE INDEX "crews_captain_id_idx" ON "canon"."crews" USING btree ("captain_id");