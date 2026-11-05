# Fabrice Clicker

Jeu en HTML pur (`index.html`) avec classement en ligne sur Supabase.

## Supabase
Le classement lit et enregistre uniquement les scores en ligne. Il n'y a pas de repli vers `localStorage`, GitHub ou Netlify. L'URL du projet et la clé publique Publishable sont configurées dans `index.html`.

La table et ses règles de sécurité sont définies dans [`supabase/scores.sql`](./supabase/scores.sql). Exécute ce fichier dans le SQL Editor de ton projet Supabase pour autoriser la lecture et l'ajout de scores avec RLS activé.

Seule une clé publique/Publishable convient au navigateur ; ne mets jamais une clé `service_role` dans le HTML.

## Statistiques de visite
Exécute [`supabase/analytics.sql`](./supabase/analytics.sql) dans le SQL Editor Supabase. Le site enregistre ensuite une visite par onglet/session, un identifiant aléatoire conservé dans le navigateur, le type d'appareil (ordinateur/mobile) et le temps pendant lequel la page reste visible. Aucun nom ni adresse IP n'est enregistré par ce code. Un même navigateur compte comme un visiteur ; effacer ses données ou utiliser un autre navigateur crée un autre visiteur.

Pour consulter les statistiques par jour dans le SQL Editor :

```sql
select
  (started_at at time zone 'Europe/Paris')::date as jour,
  count(distinct visitor_id) as visiteurs_uniques,
  count(*) as visites,
  round(avg(duration_seconds)::numeric, 1) as duree_moyenne_secondes,
  sum(duration_seconds) as duree_totale_secondes
from public.site_visits
group by jour
order by jour desc;
```

Au premier chargement de cette version, l'argent local et les succès 80, 90 et 100 sont remis à zéro. Le cœur se débloque après tous les succès qui ne dépendent pas du combat ; les succès au-dessus de 70 et la Vraie fin sont gagnés pendant le combat.

Pour vider une fois le classement existant, exécute [`supabase/reset_scores.sql`](./supabase/reset_scores.sql) dans le SQL Editor Supabase avec un rôle administrateur.
