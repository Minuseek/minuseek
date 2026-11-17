# ADR-0030 — Stockage local signé pour l'auto-hébergement

- **Statut** : accepté
- **Date** : 2026-11-17
- **Décideurs** : mainteneur (publication open source)
- **Amende** : [ADR-0003](0003-gcs-only-image-storage.md)

## Contexte

L'ADR-0003 a supprimé le stockage sur disque : le dev local utilisait le bucket
GCS de l'équipe, par impersonation d'un compte de service. Ce choix tenait tant
que seuls les membres de l'équipe lançaient le projet.

Minuseek devient open source. Une personne extérieure n'a ni le bucket ni les
droits IAM, et le seul autre mode, `in-memory`, renvoie des URL que rien ne
sert : l'application démarre, mais aucune image ne s'affiche. Un laboratoire
qui s'auto-héberge n'a pas non plus de raison d'ouvrir un compte Google Cloud.

Les deux raisons de l'ADR-0003 contre le stockage local restent valables :
l'ancien montage `/media` servait les fichiers **sans contrôle d'accès**, et
deux chemins de stockage divergent.

## Décision

- `STORAGE_DRIVER` accepte **`local` | `gcs` | `in-memory`**. `local` devient la
  valeur du `.env.example` ; `gcs` reste la valeur par défaut du code, et le
  choix de production d'une installation sur GCP.
- En `local`, les pièces et les rapports sont écrits dans un dossier
  (`LOCAL_STORAGE_DIR`, un volume Docker en dev), sous les mêmes clés
  `media/<...>` qu'en GCS. Les deux contextes (biometrics, reporting) partagent
  la même racine, comme ils partagent le bucket.
- **La lecture passe par une URL signée**, comme en GCS : le back émet
  `<LOCAL_STORAGE_PUBLIC_URL>/<clé>?expires=…&signature=…` (en dev
  `http://localhost:3000/api/storage/…`, le front et l’API étant sur deux
  origines), une signature HMAC-SHA256 de la
  clé et de l'expiration (`LOCAL_STORAGE_SIGNING_SECRET`, 32 caractères
  minimum ; durée `LOCAL_STORAGE_URL_TTL_SECONDS`, 15 min par défaut).
- La route `GET /api/storage/*` n'est montée **que** si `STORAGE_DRIVER=local`.
  Elle est publique au sens de l'authentification (un `<img src>` n'envoie pas
  de jeton) : l'autorisation est portée par la signature, émise par le back à
  un appelant déjà autorisé. Elle rejoint explicitement la liste des routes
  publiques (`auth/public-route-allowlist.spec.ts`).
- Les garanties de l'adapter GCS sont conservées : un original n'est jamais
  écrasé (écriture exclusive, ADR-0009 point 6), une clé qui sortirait du
  dossier racine est refusée avant tout accès disque, la réponse interdit le
  cache partagé et le *sniffing* de type.

## Conséquences

- ✅ `make setup-dev` suffit pour lancer Minuseek avec des images, sans compte
  cloud ni réseau.
- ✅ Un laboratoire peut s'auto-héberger sur un seul serveur.
- ✅ Pas de retour du `/media` statique : sans signature valide, la route
  répond 403.
- ⚠️ Deux chemins de stockage à maintenir. Le contrat commun (clé `media/`,
  immutabilité, URL signée à durée limitée) est couvert par les tests des deux
  adapters.
- ⚠️ Les fichiers transitent par le back en lecture, ce qui ne passe pas à
  l'échelle comme un bucket. Pour un laboratoire, le volume reste modeste.
- ⚠️ Une URL signée reste valable jusqu'à son expiration, même si l'accès de
  l'appelant est retiré entre-temps, comme en GCS.
- ⚠️ Sauvegarder le volume revient à l'exploitant.

## Alternatives écartées

- **MinIO + adapter S3** — un service et un SDK de plus, pour la même
  fonction. Reste possible plus tard pour qui veut un stockage objet sur site.
- **Émulateur GCS (fake-gcs-server)** — ne couvre pas la signature V4 keyless
  utilisée par l'adapter GCS (ADR-0003).
- **Servir les fichiers derrière le jeton Keycloak** — un `<img src>` n'envoie
  pas d'en-tête `Authorization` ; il aurait fallu changer tout l'affichage du
  front.
