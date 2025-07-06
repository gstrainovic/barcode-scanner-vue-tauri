CREATE OR REPLACE VIEW public.arbeitszeiten_pro_tag AS
WITH geordnete_daten AS (
  SELECT *,
         LAG(login_or_logout) OVER (PARTITION BY mitarbeiter ORDER BY zeitpunkt) AS vorheriger_status,
         LEAD(login_or_logout) OVER (PARTITION BY mitarbeiter ORDER BY zeitpunkt) AS naechster_status,
         LEAD(zeitpunkt) OVER (PARTITION BY mitarbeiter ORDER BY zeitpunkt) AS naechster_zeitpunkt
  FROM zeitprotokoll
),
paare AS (
  SELECT
    mitarbeiter,
    abteilung,
    zeitpunkt AS login_zeit,
    naechster_zeitpunkt AS logout_zeit,
    EXTRACT(EPOCH FROM naechster_zeitpunkt - zeitpunkt) / 3600 AS dauer_stunden
  FROM geordnete_daten
  WHERE login_or_logout = 'login'
    AND naechster_status = 'logout'
),
gefiltert AS (
  SELECT *
  FROM paare
  WHERE dauer_stunden BETWEEN 0.01 AND 12  -- nur Sitzungen zwischen 1 Minute und 12 Stunden
)
SELECT
  date(login_zeit) AS arbeitstag,
  mitarbeiter,
  abteilung,
  ROUND(SUM(EXTRACT(EPOCH FROM logout_zeit - login_zeit) / 60)::numeric, 0) AS gearbeitete_minuten,
  ROUND(SUM(EXTRACT(EPOCH FROM logout_zeit - login_zeit) / 3600)::numeric, 1) AS gearbeitete_stunden
FROM gefiltert
GROUP BY date(login_zeit), mitarbeiter, abteilung
ORDER BY arbeitstag DESC, mitarbeiter;