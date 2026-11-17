# front-minuseek

Front du projet **Minuseek** (React + TypeScript + Vite), containerisé avec Docker.

## Démarrage

```bash
cp .env.example .env   # première fois
make dev
```

Le front est disponible sur `http://localhost:5173`.

### Appels API

Le client axios appelle directement `VITE_API_URL` (par défaut
`http://localhost:3000/api`), et l'authentification passe par Keycloak sur
`VITE_KEYCLOAK_URL`. Le back autorise l'origine du front par sa variable
`ORIGIN` (CORS).

Le conteneur rejoint le réseau Docker partagé `minuseek` ; `make dev` le crée
automatiquement s'il n'existe pas (idempotent), des deux côtés.

> Aucune URL n'est codée en dur : tout passe par le `.env`.

### Export vidéo de la démonstration des concordances

Le bouton "Enregistrer la démonstration" du comparateur capture la lecture des concordances
via `MediaRecorder`/`captureStream` (natifs du navigateur, aucune dépendance chargée côté
client) et télécharge le fichier obtenu. Le format annoncé dans l'interface avant de cliquer
dépend de ce que le navigateur sait produire : Chrome/Edge récents encodent nativement en
**MP4/H.264**, sans rien charger de plus — c'est le format retenu en priorité. Sur un navigateur
qui ne sait produire que du **WebM** (ex. Firefox), convertir un fichier destiné au dossier vers
un format plus largement lisible avec `ffmpeg` :

```bash
ffmpeg -i demonstration.webm -c:v libx264 -pix_fmt yuv420p -c:a aac demonstration.mp4
```

### Commandes Makefile

| Commande         | Description                                            |
|------------------|--------------------------------------------------------|
| `make dev`       | Lance le front en mode dev avec hot-reload (Vite)      |
| `make dev-build` | Rebuild l'image puis lance le front                    |
| `make down`      | Arrête le front                                        |
| `make network`   | Crée le réseau Docker partagé `minuseek` (idempotent)  |
| `make logs`      | Affiche les logs du front en temps réel                |

## AI agents

### Ce que ça apporte

- **`AGENTS.md`** — conventions du repo (+ section « Directives agents » DO/DON'T) ; **`CLAUDE.md`** = `@AGENTS.md`.
- **`.agents/skills/`** — skills maison versionnés (review pré-PR, best practices, patterns Konva, etc.), exposés à Claude via le lien symbolique `.claude/skills` et lus nativement par Codex/antigravity.
- **`.agents/rules/`** — règles pour Antigravity (lien symbolique vers `AGENTS.md`).
- **`docs/adr/`** — gabarit d'ADR : on consigne les décisions structurantes.

### Windows

- **Windows uniquement** : si les liens symboliques apparaissent comme des fichiers texte → `git config core.symlinks true` puis re-checkout.

> Au clone, les symlinks et les skills sont restaurés automatiquement : rien à installer.

### Skills IA (`.agents/skills/`)

Les **skills** sont des instructions spécialisées que l'agent IA charge automatiquement selon le contexte de votre demande. Vous n'avez **rien à activer manuellement** : l'agent détecte les mots-clés dans votre prompt et charge le skill adapté. Vous pouvez aussi les invoquer explicitement en mentionnant leur nom.

| Skill | Quand ça se déclenche | Exemple de prompt |
|-------|----------------------|-------------------|
| `front-review` | Review de code / PR / diff front, avant un merge sur `main`, audit i18n, React Query, accessibilité, sécurité front | *« Réalise une review complète de ma branche »* |
| `frontend-best-practices` | Écriture ou refactoring de code React/TS, séparation UI/logique, extraction de hooks, placement dans `features/` | *« refactore ce composant, il fait trop de choses »* |
| `konva-patterns` | Travail sur le comparateur d'empreintes, canvas Konva, zoom/pan, annotations, filtres image, performance canvas | *« améliore les perfs du canvas de comparaison »* |

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
