# AGENTS.md

Consignes pour les agents IA (Codex, Claude Code, Cursor, Antigravity…) et les
humains qui travaillent à la racine du monorepo. Les règles détaillées vivent
dans le guide de chaque partie : lisez celui du dossier que vous modifiez
**avant** de toucher au code.

## Organisation

| Dossier | Contenu | Guide à lire |
|---|---|---|
| `back/` | API NestJS 11 + Prisma 7, PostgreSQL 17, Keycloak (Docker Compose) | [`back/AGENTS.md`](back/AGENTS.md) |
| `front/` | SPA React 19 + Vite + TypeScript, react-konva | [`front/AGENTS.md`](front/AGENTS.md) |
| `.github/` | CI (`back-ci.yml`, `front-ci.yml`), Dependabot, modèles d'issue et de PR | — |

Back et front sont deux projets indépendants : chacun a son `package.json`, son
lockfile, son `Makefile` et ses conteneurs. Il n'y a pas de workspace pnpm à la
racine : lancez les commandes depuis `back/` (ou `back/app/`) et `front/`.

## Démarrer

```bash
cd back && cp .env.example .env && make setup-dev    # API, PostgreSQL, Keycloak, organisation de démo
cd front && cp .env.example .env && make dev         # dans un autre terminal
```

Puis <http://localhost:5173/tenant-demo>, compte `responsable` / `responsable`.

## Vérifier avant une PR

| Partie | Commandes | Dossier |
|---|---|---|
| Back | `make test`, `make test-integration` si la persistance change | `back/` |
| Back | `pnpm lint`, `pnpm exec tsc --noEmit` | `back/app/` |
| Front | `pnpm lint`, `pnpm build` | `front/` |

La CI rejoue ces vérifications sur chaque PR qui touche `back/` ou `front/`.

## Règles communes

- **Jamais de données réelles** : aucune empreinte, aucun nom de personne ou de
  service réel, aucune adresse, aucun numéro de téléphone réel. Utilisez les
  valeurs fictives existantes (`labo-demo`, `contact@labo-demo.example`,
  `12 rue des Exemples`, `01 00 00 xx 00`).
- **Jamais de secret commité** : partir des `.env.example`, ne jamais committer
  de `.env`.
- **Test d'abord** côté back (skill `tdd`), et tout texte visible côté front
  passe par l'i18n.
- **Commits** en [Conventional Commits](https://www.conventionalcommits.org/fr/).
- **Décision structurante** : un ADR dans `back/docs/adr/` ou `front/docs/adr/`.

## Skills

Les skills sont rangés avec la partie qu'ils concernent :

- `back/.agents/skills/` : `tdd`, `back-review`, `architecture-review`, `api-security` ;
- `front/.agents/skills/` : `front-review`, `frontend-best-practices`, `konva-patterns`.

Chaque `.claude/skills` est un lien vers le `.agents/skills` voisin. Pour qu'un
agent les charge automatiquement, lancez-le depuis `back/` ou `front/` ;
depuis la racine, citez le skill voulu par son chemin.
