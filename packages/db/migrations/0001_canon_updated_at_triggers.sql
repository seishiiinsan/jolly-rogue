-- Custom SQL migration : maintien de updated_at sur toutes les tables canon.
-- updated_at n'avance que si la ligne change réellement : un upsert qui réécrit
-- les mêmes valeurs ne modifie pas updated_at.
-- Toute nouvelle table canon doit recevoir son trigger dans une nouvelle migration.
CREATE FUNCTION "canon"."set_updated_at"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "arcs_set_updated_at" BEFORE UPDATE ON "canon"."arcs" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "bounties_set_updated_at" BEFORE UPDATE ON "canon"."bounties" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "character_affiliations_set_updated_at" BEFORE UPDATE ON "canon"."character_affiliations" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "character_aliases_set_updated_at" BEFORE UPDATE ON "canon"."character_aliases" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "character_fruits_set_updated_at" BEFORE UPDATE ON "canon"."character_fruits" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "characters_set_updated_at" BEFORE UPDATE ON "canon"."characters" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "crews_set_updated_at" BEFORE UPDATE ON "canon"."crews" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "devil_fruits_set_updated_at" BEFORE UPDATE ON "canon"."devil_fruits" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "haki_set_updated_at" BEFORE UPDATE ON "canon"."haki" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "locations_set_updated_at" BEFORE UPDATE ON "canon"."locations" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "provenance_set_updated_at" BEFORE UPDATE ON "canon"."provenance" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "sagas_set_updated_at" BEFORE UPDATE ON "canon"."sagas" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();
