# Fabrice Clicker

Jeu en HTML pur (`index.html`) + API de scores en ligne (Netlify Functions + Netlify Database).

## Déployer
1. Pousser ce dépôt sur GitHub.
2. Sur Netlify : *Add new site → Import from Git* → choisir le dépôt. Aucune commande de build n'est nécessaire (voir `netlify.toml`).
3. Les scores sont servis par `/api/scores` (`netlify/functions/scores.ts`, table créée par `netlify/database/migrations`).

## Front sur GitHub Pages ?
GitHub Pages est statique : il ne peut pas exécuter l'API. Garde le backend sur Netlify et renseigne
son URL dans `index.html` : `var API_BASE="https://ton-site.netlify.app";` (le CORS est déjà activé).
