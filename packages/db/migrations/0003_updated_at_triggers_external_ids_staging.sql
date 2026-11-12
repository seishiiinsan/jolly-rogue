-- Custom SQL migration : updated_at pour les tables ajoutées en 0002.
-- Même fonction que 0001 (n'avance que si la ligne change réellement).
-- Le schéma staging reçoit sa propre fonction pour ne pas dépendre de canon.
CREATE TRIGGER "external_ids_set_updated_at" BEFORE UPDATE ON "canon"."external_ids" FOR EACH ROW EXECUTE FUNCTION "canon"."set_updated_at"();--> statement-breakpoint
CREATE FUNCTION "staging"."set_updated_at"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "api_onepiece_set_updated_at" BEFORE UPDATE ON "staging"."api_onepiece" FOR EACH ROW EXECUTE FUNCTION "staging"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "rejections_set_updated_at" BEFORE UPDATE ON "staging"."rejections" FOR EACH ROW EXECUTE FUNCTION "staging"."set_updated_at"();
