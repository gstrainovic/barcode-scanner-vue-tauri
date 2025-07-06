CREATE OR REPLACE VIEW public.arbeitszeiten_pro_tag AS
WITH geordnete_daten AS (
  SELECT *,
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
    EXTRACT(EPOCH FROM naechster_zeitpunkt - zeitpunkt) / 60 AS dauer_minuten
  FROM geordnete_daten
  WHERE login_or_logout = 'login'
    AND naechster_status = 'logout'
),
pausenabzug AS (
  SELECT *,
    -- Pausenzeitraum: 10:00 bis 10:30 am selben Tag wie login
    GREATEST(
      0,
      LEAST(logout_zeit, date_trunc('day', login_zeit) + interval '10:30') -
      GREATEST(login_zeit, date_trunc('day', login_zeit) + interval '10:00')
    ) / 60 AS pause_minuten
  FROM paare
  WHERE EXTRACT(EPOCH FROM logout_zeit - login_zeit) / 3600 BETWEEN 0.01 AND 12
)
SELECT
  date(login_zeit) AS arbeitstag,
  mitarbeiter,
  abteilung,
  ROUND(SUM(dauer_minuten - pause_minuten), 0) AS gearbeitete_minuten,
  ROUND(SUM(dauer_minuten - pause_minuten) / 60, 1) AS gearbeitete_stunden
FROM pausenabzug
GROUP BY date(login_zeit), mitarbeiter, abteilung
ORDER BY arbeitstag DESC, mitarbeiter;