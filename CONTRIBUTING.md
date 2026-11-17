# Contribuer à Minuseek

Merci de votre intérêt ! Ce guide explique comment proposer un changement.
En participant, vous acceptez de respecter le [code de conduite](CODE_OF_CONDUCT.md).

## Avant de commencer

- **Une faille de sécurité ?** Ne l'ouvrez pas en issue : suivez [SECURITY.md](SECURITY.md).
- **Un changement important ?** Ouvrez d'abord une issue pour en discuter. Ça évite
  de travailler sur une piste que les mainteneurs ne pourront pas intégrer.
- **Jamais de données réelles.** Aucune image d'empreinte, aucun nom de personne ou
  de service réel, aucune pièce d'affaire, ni dans le code, ni dans les tests, ni
  dans les issues.

## Organisation du dépôt

| Dossier | Contenu | Guide détaillé |
|---|---|---|
| `back/` | API NestJS 11 + Prisma 7 + PostgreSQL 17, Keycloak | [`back/AGENTS.md`](back/AGENTS.md) |
| `front/` | SPA React 19 + Vite + TypeScript | [`front/AGENTS.md`](front/AGENTS.md) |

Les `AGENTS.md` décrivent l'architecture, les conventions et les règles à
respecter. Ils servent aux humains comme aux agents IA. Les décisions
d'architecture sont consignées dans les ADR de [`back/docs/adr/`](back/docs/adr/)
et [`front/docs/adr/`](front/docs/adr/).

## Proposer un changement

1. Forkez le dépôt et créez une branche depuis `main` : `feat/…`, `fix/…`, `docs/…`.
2. Lancez le projet en local (voir le [README](README.md#démarrage-rapide)).
3. **Écrivez le test avant le code** : on observe le test échouer, puis passer,
   puis on refactorise. Un test qui n'a jamais échoué ne protège de rien.
4. Vérifiez avant d'ouvrir la PR :
   - back : `make test` (et `make test-integration` si vous touchez à la persistance),
     `pnpm lint` dans `back/app` ;
   - front : `pnpm lint` et `pnpm build` dans `front/`.
5. Ouvrez une pull request vers `main` en remplissant le modèle. Visez un diff de
   moins de 400 lignes : plusieurs petites PR valent mieux qu'une grosse.

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/)
  (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Back** : architecture hexagonale, DDD et CQRS. Le domaine ne dépend jamais de
  l'infrastructure.
- **Front** : architecture par feature, alignée sur les bounded contexts du back.
  Tout texte visible passe par l'i18n.
- **Décision structurante** (nouvelle bibliothèque, contrat d'API, pattern) :
  ajoutez un ADR à partir du gabarit `docs/adr/0000-template.md`.

## Licence des contributions

Minuseek est distribué sous [licence Apache 2.0](LICENSE). En proposant une
contribution, vous acceptez qu'elle soit distribuée sous cette même licence
(section 5 de la licence).
