# Fabrice Clicker

Jeu en HTML pur (`index.html`) avec système de scores compatible GitHub Pages.

## Supabase
Le classement peut utiliser la table Supabase définie dans [`supabase/scores.sql`](./supabase/scores.sql). Exécute ce fichier dans le SQL Editor de ton projet Supabase, puis définis ces variables avant le chargement de `supabase/scores.js` dans `index.html` :

```html
<script>
  window.FABRICE_SUPABASE_URL = "https://xxxxx.supabase.co";
  window.FABRICE_SUPABASE_ANON_KEY = "ta_cle_anon_publique";
</script>
```

Le client `supabase/scores.js` est déjà chargé par la page. Seule la clé publique/anon convient au navigateur ; ne mets jamais la clé `service_role` dans le HTML.

## Solution fonctionnelle pour GitHub
GitHub Pages est statique : il ne peut pas exécuter de vraie API backend sans configuration supplémentaire.

La solution fiable est de garder le frontend sur GitHub Pages et d’utiliser un stockage GitHub compatible en configurant:
- `window.FABRICE_GITHUB_REPO` = `owner/repo`
- `window.FABRICE_GITHUB_PATH` = `scores/highscores.json` (optionnel)
- `window.FABRICE_GITHUB_TOKEN` = token GitHub avec droit de lecture/écriture sur le dépôt

Exemple dans le script de chargement :
```html
<script>
  window.FABRICE_GITHUB_REPO = "mon-compte/fabrice-clicker";
  window.FABRICE_GITHUB_PATH = "scores/highscores.json";
  window.FABRICE_GITHUB_TOKEN = "ghp_xxx";
</script>
```

## Fallback sans backend
Si aucun backend n’est configuré, le jeu reste fonctionnel en mode local avec `localStorage`.

## Ancienne version Netlify
Le projet garde aussi un backend Netlify compatible pour les environnements qui utilisent `/api/scores` (`netlify/functions/scores.ts`).
