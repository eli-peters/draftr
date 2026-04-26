-- One-time backfill of users.first_name and users.last_name to apply the
-- name normalization rules introduced alongside the input-display-normalization
-- feature. Mirrors the JS normalizeName() in src/lib/names.ts: trim + collapse
-- whitespace, Title Case, Mc/Mac/apostrophe/hyphen rules, and a fixed list of
-- name particles that stay lowercase except when they're the first token.
--
-- The trg_sync_full_name trigger (00025) rebuilds users.full_name automatically
-- whenever first_name or last_name changes, so we don't need to touch full_name
-- here. The helper functions are dropped at the end — this migration is single
-- shot and the runtime path uses the JS implementation.

CREATE OR REPLACE FUNCTION public._normalize_name_token(token text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
  i int;
  ch text;
BEGIN
  IF token IS NULL OR token = '' THEN
    RETURN COALESCE(token, '');
  END IF;

  result := lower(token);
  result := upper(substr(result, 1, 1)) || substr(result, 2);

  IF length(result) >= 5 AND lower(substr(result, 1, 3)) = 'mac' THEN
    result := substr(result, 1, 3) || upper(substr(result, 4, 1)) || substr(result, 5);
  ELSIF length(result) >= 3 AND lower(substr(result, 1, 2)) = 'mc' THEN
    result := substr(result, 1, 2) || upper(substr(result, 3, 1)) || substr(result, 4);
  END IF;

  i := 1;
  WHILE i < length(result) LOOP
    ch := substr(result, i, 1);
    IF ch = '''' OR ch = '-' THEN
      result := substr(result, 1, i) || upper(substr(result, i + 1, 1)) || substr(result, i + 2);
    END IF;
    i := i + 1;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public._normalize_name(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  collapsed text;
  tokens text[];
  particles text[] := ARRAY[
    'van', 'de', 'der', 'den', 'von', 'del', 'della', 'di', 'du', 'la', 'le'
  ];
  result text := '';
  token text;
  i int;
BEGIN
  IF input IS NULL THEN
    RETURN '';
  END IF;

  collapsed := trim(regexp_replace(input, '\s+', ' ', 'g'));
  IF collapsed = '' THEN
    RETURN '';
  END IF;

  tokens := string_to_array(collapsed, ' ');
  FOR i IN 1..array_length(tokens, 1) LOOP
    token := tokens[i];
    IF i > 1 AND lower(token) = ANY(particles) THEN
      token := lower(token);
    ELSE
      token := public._normalize_name_token(token);
    END IF;

    IF i = 1 THEN
      result := token;
    ELSE
      result := result || ' ' || token;
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

UPDATE public.users
SET
  first_name = public._normalize_name(first_name),
  last_name = public._normalize_name(last_name)
WHERE
  first_name IS NOT NULL OR last_name IS NOT NULL;

DROP FUNCTION public._normalize_name(text);
DROP FUNCTION public._normalize_name_token(text);
