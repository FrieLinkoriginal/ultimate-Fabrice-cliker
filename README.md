# Fabrice Clicker

Jeu en HTML pur (`index.html`) avec classement en ligne sur Supabase.

## Supabase
Le classement lit et enregistre uniquement les scores en ligne. Il n'y a pas de repli vers `localStorage`, GitHub ou Netlify. L'URL du projet et la clé publique Publishable sont configurées dans `index.html`.

La table et ses règles de sécurité sont définies dans [`supabase/scores.sql`](./supabase/scores.sql). Exécute ce fichier dans le SQL Editor de ton projet Supabase pour autoriser la lecture et l'ajout de scores avec RLS activé.

Seule une clé publique/Publishable convient au navigateur ; ne mets jamais une clé `service_role` dans le HTML.
