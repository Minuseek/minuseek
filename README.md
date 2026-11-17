# Minuseek

Logiciel open source d'expertise dactyloscopique : il accompagne un laboratoire
de police technique et scientifique de la réception d'une affaire jusqu'au
rapport signé, en gardant la trace vérifiable de chaque opération.

*Minuseek is an open-source fingerprint examination platform for forensic labs:
case management, minutiae comparison, blind verification, tamper-evident audit
trail and signed reports. Documentation is in French.*

**Présentation du projet / Project website : <https://minuseek.github.io>**

## Fonctionnalités

- **Affaires et pièces** : traces relevées et empreintes de référence, avec
  métadonnées de capture, empreinte SHA-256 et retrait motivé d'une pièce.
- **Comparateur** : affichage côte à côte, réglages d'image (courbe tonale…),
  annotation des minuties et appariement trace / référence.
- **Vérification indépendante** : mission de vérification distincte de
  l'opérateur, mode aveugle côté serveur, confrontation des conclusions.
- **Traçabilité** : journal d'audit chaîné en ajout seul, horodaté RFC 3161, et
  registre de scellés vérifiable publiquement.
- **Rapports** : rapports techniques PDF numérotés et signés, avec section
  d'intégrité et lien de vérification.
- **Multi-organisation** : une base PostgreSQL et un realm Keycloak par
  organisation. Chaque organisation peut brancher son propre annuaire (LDAP,
  Active Directory) ou son SSO (SAML, OIDC) sur son realm.

## Architecture

```text
minuseek/
├── back/    API NestJS 11 + Prisma 7, PostgreSQL 17, Keycloak (Docker Compose)
└── front/   SPA React 19 + Vite + TypeScript, react-konva
```

Le back suit une architecture hexagonale (DDD + CQRS). Les décisions
structurantes sont dans [`back/docs/adr/`](back/docs/adr/), et le multi-tenant
est détaillé dans [`back/docs/multitenancy.md`](back/docs/multitenancy.md).

## Démarrage rapide

Prérequis : [Docker](https://docs.docker.com/get-docker/) avec Docker Compose, `make`,
`curl` et `python3` (présents par défaut sur macOS et la plupart des Linux).

```bash
# 1. Back : API, PostgreSQL, Keycloak, et une organisation de démo « tenant-demo »
cd back
cp .env.example .env
make setup-dev

# 2. Front, dans un autre terminal
cd front
cp .env.example .env
make dev
```

Ouvrez ensuite <http://localhost:5173/tenant-demo> et connectez-vous avec un
compte de démo : `responsable` / `responsable` (rôle administrateur) ou
`operateur1` / `operateur1`.

> Ces identifiants sont publics : ils ne servent qu'en local.

| Service | Adresse locale |
|---|---|
| Front | <http://localhost:5173> |
| API | <http://localhost:3000/api> |
| Keycloak | <http://localhost:8080> |

### Stockage et analyse automatique

- **Stockage** : par défaut, les pièces et les rapports sont écrits dans un
  volume Docker et servis par l'API derrière des URL signées. Un bucket Google
  Cloud Storage est aussi possible (`STORAGE_DRIVER=gcs`, voir
  [ADR-0030](back/docs/adr/0030-stockage-local-pour-l-auto-hebergement.md)).
- **Analyse automatique** : le classement des empreintes par score de
  similarité fait appel à un moteur de comparaison externe, qui n'est pas
  inclus dans ce dépôt. Sans `DATA_API_URL`, le bouton « Analyse IA » répond
  que l'analyse n'est pas configurée. La comparaison manuelle, les minuties et
  le reste de l'application fonctionnent normalement.

### Créer sa propre organisation

```bash
cd back
make provision SLUG=mon-labo NAME="Mon laboratoire"
```

Cette commande crée la base de l'organisation et son realm Keycloak
`minuseek-mon-labo`. L'application est alors disponible sur
`http://localhost:5173/mon-labo`.

## Contribuer

Les contributions sont bienvenues : lisez [CONTRIBUTING.md](CONTRIBUTING.md).
Pour une faille de sécurité, suivez [SECURITY.md](SECURITY.md).

## Licence

Minuseek est distribué sous [licence Apache 2.0](LICENSE).
Copyright 2026 les [auteurs de Minuseek](AUTHORS.md).
