/*
# Phase B — Fermeture de la lecture publique du fichier clients

## Contexte
Audit du 2026-08-12. Trois policies héritées sur `appointments` et une sur
`clients`, accordées au rôle `{public}` avec `USING (true)`, rendaient
inopérantes les policies granulaires posées en dessous : les policies
permissives se combinent avec un OU, il suffit qu'une seule autorise l'accès.

Avec la seule clé `anon` — publique, présente dans le bundle JS du site :
- `clients` était intégralement lisible : noms, téléphones, emails, notes,
  total dépensé, points de fidélité ;
- `appointments` était intégralement lisible ET modifiable par quiconque.

`appointments_anon_select` semblait restrictive avec
`USING ((email IS NOT NULL) OR (phone IS NOT NULL))`, mais `phone` est NOT NULL
sur toutes les lignes : elle équivalait à `USING (true)`.

## Approche
Le tunnel de réservation publique s'appuyait sur ces policies en six points :
lecture des créneaux déjà pris, recherche de la cliente par email, création de
la cliente, insertion du rendez-vous, relecture du rendez-vous inséré, création
du rappel.

Plutôt que d'ouvrir six accès, l'ensemble passe par des fonctions
`SECURITY DEFINER` exposant le strict nécessaire. `anon` perd alors tout droit
direct sur `appointments`, `clients`, `reminders` et `reminder_settings`.

Le parcours d'inscription reposait sur les mêmes policies pour rattacher une
cliente à sa fiche : il reçoit lui aussi sa fonction dédiée.

## ⚠️ Cette migration est couplée au code
Elle doit être déployée AVEC les modifications de `Booking.tsx`,
`appointmentService.ts` et `AuthContext.tsx` qui appellent ces fonctions.
Appliquée seule, la réservation en ligne et l'inscription cessent de
fonctionner.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Créneaux déjà réservés — sans aucune donnée personnelle
-- ---------------------------------------------------------------------------
-- Remplace la lecture directe de `appointments` faite par Booking.tsx, qui
-- exposait l'intégralité du carnet de rendez-vous pour n'obtenir que des heures.

CREATE OR REPLACE FUNCTION public.get_booked_times(p_date date)
RETURNS TABLE (booked_time text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.time
  FROM public.appointments a
  WHERE a.date = p_date
    AND a.status IN ('pending', 'confirmed');
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_times(date) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Création d'un rendez-vous public
-- ---------------------------------------------------------------------------
-- Reprend intégralement la logique de `appointmentService.create()` :
-- résolution ou création de la cliente, tarifs relus depuis `services` (jamais
-- transmis par le navigateur), insertion, puis création du rappel.

CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_client_name        text,
  p_phone              text,
  p_email              text,
  p_service_ids        uuid[],
  p_date               date,
  p_time               text,
  p_payment_method_id  uuid DEFAULT NULL,
  p_reference_images   jsonb DEFAULT '[]'::jsonb,
  p_client_notes       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_services     jsonb;
  v_client_id    uuid;
  v_appointment  public.appointments%ROWTYPE;
  v_settings     public.reminder_settings%ROWTYPE;
  v_service_name text;
BEGIN
  IF p_client_name IS NULL OR btrim(p_client_name) = '' THEN
    RAISE EXCEPTION 'Le nom est requis' USING ERRCODE = '22023';
  END IF;
  IF p_phone IS NULL OR btrim(p_phone) = '' THEN
    RAISE EXCEPTION 'Le téléphone est requis' USING ERRCODE = '22023';
  END IF;
  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Au moins une prestation est requise' USING ERRCODE = '22023';
  END IF;

  -- Tarifs et durées relus en base : le navigateur ne transmet que des
  -- identifiants, il ne peut donc pas influencer le montant enregistré.
  SELECT jsonb_agg(
           jsonb_build_object(
             'id', s.id, 'name', s.name,
             'price', s.price, 'duration', s.duration
           ) ORDER BY s.name
         ),
         string_agg(s.name, ' + ' ORDER BY s.name)
    INTO v_services, v_service_name
  FROM public.services s
  WHERE s.id = ANY(p_service_ids);

  IF v_services IS NULL THEN
    RAISE EXCEPTION 'Prestations introuvables' USING ERRCODE = '22023';
  END IF;

  -- Cliente existante (réservation antérieure ou compte) sinon création.
  IF p_email IS NOT NULL AND btrim(p_email) <> '' THEN
    SELECT c.id INTO v_client_id
    FROM public.clients c
    WHERE c.email = p_email
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (name, phone, email)
    VALUES (p_client_name, p_phone, NULLIF(btrim(COALESCE(p_email, '')), ''))
    RETURNING id INTO v_client_id;
  END IF;

  INSERT INTO public.appointments (
    client_id, client_name, phone, email, services, "date", "time",
    status, payment_method_id, reference_images, client_notes
  )
  VALUES (
    v_client_id, p_client_name, p_phone,
    NULLIF(btrim(COALESCE(p_email, '')), ''),
    v_services, p_date, p_time,
    'pending', p_payment_method_id,
    COALESCE(p_reference_images, '[]'::jsonb), p_client_notes
  )
  RETURNING * INTO v_appointment;

  -- Rappel automatique, si activé.
  SELECT * INTO v_settings FROM public.reminder_settings LIMIT 1;

  IF FOUND AND v_settings.enabled THEN
    INSERT INTO public.reminders (
      appointment_id, client_name, client_phone, client_email,
      service_name, appointment_date, appointment_time,
      scheduled_at, recipients, sent
    )
    VALUES (
      v_appointment.id::text, p_client_name, p_phone,
      NULLIF(btrim(COALESCE(p_email, '')), ''),
      v_service_name, p_date, p_time,
      -- L'heure du rendez-vous est exprimée dans le fuseau du salon ; le calcul
      -- reproduit celui que faisait `computeScheduledAt()` côté navigateur.
      ((p_date + p_time::time) AT TIME ZONE 'Indian/Antananarivo')
        - make_interval(hours => v_settings.delay_hours),
      v_settings.recipients, false
    );
  END IF;

  RETURN to_jsonb(v_appointment);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_appointment(
  text, text, text, uuid[], date, text, uuid, jsonb, text
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Rattachement du compte cliente à sa fiche
-- ---------------------------------------------------------------------------
-- `AuthContext.register()` cherchait une fiche cliente par email, la créait au
-- besoin, puis rattachait les rendez-vous pris en anonyme. Ces trois opérations
-- reposaient sur la lecture publique de `clients` et l'écriture libre de
-- `appointments` : une fois celles-ci retirées, l'inscription échouait.
--
-- L'email n'est pas un paramètre : la fonction lit `auth.email()`, une cliente
-- ne peut donc revendiquer que les fiches correspondant à sa propre identité.
-- Seules les fiches non encore rattachées (`user_id IS NULL`) sont éligibles,
-- afin qu'un compte ne puisse pas en récupérer un autre.

CREATE OR REPLACE FUNCTION public.link_client_account(
  p_name  text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_email     text := auth.email();
  v_client_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = '42501';
  END IF;

  -- Fiche déjà rattachée à ce compte ?
  SELECT c.id INTO v_client_id
  FROM public.clients c WHERE c.user_id = v_uid LIMIT 1;

  -- Sinon, fiche créée lors d'une réservation anonyme avec le même email.
  IF v_client_id IS NULL AND v_email IS NOT NULL THEN
    SELECT c.id INTO v_client_id
    FROM public.clients c
    WHERE c.email = v_email AND c.user_id IS NULL
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (user_id, name, phone, email)
    VALUES (v_uid, COALESCE(p_name, ''), COALESCE(p_phone, ''), v_email)
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE public.clients
       SET user_id = v_uid,
           name    = COALESCE(NULLIF(btrim(p_name), ''), name),
           phone   = COALESCE(NULLIF(btrim(p_phone), ''), phone)
     WHERE id = v_client_id;
  END IF;

  -- Rattacher les rendez-vous pris en anonyme avec cet email.
  IF v_email IS NOT NULL THEN
    UPDATE public.appointments
       SET client_id = v_client_id
     WHERE email = v_email
       AND client_id IS DISTINCT FROM v_client_id;
  END IF;

  RETURN v_client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_client_account(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Retrait des policies laxistes
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Enable read for all users"   ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.appointments;

-- Condition trompeuse : `phone` étant NOT NULL, elle valait `USING (true)`.
DROP POLICY IF EXISTS appointments_anon_select ON public.appointments;

-- L'insertion anonyme passe désormais par create_public_appointment().
DROP POLICY IF EXISTS appointments_anon_insert ON public.appointments;

DROP POLICY IF EXISTS "Enable read for all users" ON public.clients;
DROP POLICY IF EXISTS clients_anon_insert        ON public.clients;

-- Rappels : plus aucun accès anonyme, la création est faite côté serveur.
DROP POLICY IF EXISTS anon_select_reminders          ON public.reminders;
DROP POLICY IF EXISTS anon_insert_reminders          ON public.reminders;
DROP POLICY IF EXISTS anon_select_reminder_settings  ON public.reminder_settings;

-- ---------------------------------------------------------------------------
-- 5. Espace cliente : voir ses rendez-vous réservés sans compte
-- ---------------------------------------------------------------------------
-- `appointments_own_select` n'autorisait que la liaison via `clients.user_id`.
-- Une cliente ne voyait donc pas les rendez-vous pris en anonyme avec son email
-- tant que la liaison n'avait pas eu lieu. Le repli par email est ajouté, en
-- cohérence avec `appointments_own_update_client_id` qui l'appliquait déjà.

DROP POLICY IF EXISTS appointments_own_select ON public.appointments;
CREATE POLICY appointments_own_select ON public.appointments
  FOR SELECT TO authenticated
  USING (
    email = auth.email()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id AND c.user_id = auth.uid()
    )
  );

-- Idem côté modification : la condition WITH CHECK exigeait la liaison
-- `clients.user_id`, ce qui empêchait d'annuler un rendez-vous pris en anonyme.
DROP POLICY IF EXISTS appointments_own_update_client_id ON public.appointments;
CREATE POLICY appointments_own_update ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    email = auth.email()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    email = auth.email()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id AND c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Restreindre ce qu'une cliente peut modifier
-- ---------------------------------------------------------------------------
-- Une policy RLS raisonne par ligne, pas par colonne : la policy ci-dessus
-- laisserait une cliente déplacer son rendez-vous ou en changer les tarifs.
-- Seul le statut lui est réellement destiné (annulation depuis son espace).

CREATE OR REPLACE FUNCTION public.restrict_client_appointment_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Seuls les rôles exposés à l'API sont restreints. Les appels privilégiés —
  -- fonctions SECURITY DEFINER comme link_client_account(), maintenance SQL —
  -- s'exécutent sous un autre rôle et ne sont pas concernés.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF (NEW.client_id, NEW.client_name, NEW.phone, NEW.email, NEW.services,
      NEW.date, NEW.time, NEW.payment_method_id, NEW.reference_images,
      NEW.client_notes, NEW.notes, NEW.price, NEW.service_name)
     IS DISTINCT FROM
     (OLD.client_id, OLD.client_name, OLD.phone, OLD.email, OLD.services,
      OLD.date, OLD.time, OLD.payment_method_id, OLD.reference_images,
      OLD.client_notes, OLD.notes, OLD.price, OLD.service_name)
  THEN
    RAISE EXCEPTION 'Seul le statut du rendez-vous peut être modifié'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_restrict_client_update ON public.appointments;
CREATE TRIGGER appointments_restrict_client_update
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.restrict_client_appointment_update();

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS APRÈS APPLICATION
-- ---------------------------------------------------------------------------
-- a) Plus aucune policy accordée à `anon` sur les tables sensibles :
--
--    select tablename, policyname, cmd, roles from pg_policies
--    where schemaname = 'public'
--      and tablename in ('appointments','clients','reminders','reminder_settings')
--      and ('anon' = any(roles) or 'public' = any(roles))
--    order by tablename;
--
--    Résultat attendu : aucune ligne.
--
-- b) La fuite est fermée. Depuis un onglet non connecté, la console du site :
--
--    const { data, error } = await supabase.from('clients').select('*');
--
--    Résultat attendu : `data` vide (et non la liste des clientes).
--
-- c) Les créneaux pris restent lisibles publiquement, sans donnée personnelle :
--
--    select * from public.get_booked_times(current_date);

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- BEGIN;
--   DROP TRIGGER IF EXISTS appointments_restrict_client_update ON public.appointments;
--   DROP FUNCTION IF EXISTS public.restrict_client_appointment_update();
--   DROP FUNCTION IF EXISTS public.create_public_appointment(text,text,text,uuid[],date,text,uuid,jsonb,text);
--   DROP FUNCTION IF EXISTS public.get_booked_times(date);
--
--   CREATE POLICY "Enable read for all users"   ON public.appointments FOR SELECT TO public USING (true);
--   CREATE POLICY "Enable insert for all users" ON public.appointments FOR INSERT TO public WITH CHECK (true);
--   CREATE POLICY "Enable update for all users" ON public.appointments FOR UPDATE TO public USING (true) WITH CHECK (true);
--   CREATE POLICY "Enable read for all users"   ON public.clients      FOR SELECT TO public USING (true);
--   CREATE POLICY clients_anon_insert ON public.clients FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY anon_select_reminders ON public.reminders FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY anon_insert_reminders ON public.reminders FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY anon_select_reminder_settings ON public.reminder_settings FOR SELECT TO anon, authenticated USING (true);
-- COMMIT;
