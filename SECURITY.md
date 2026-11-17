# Politique de sécurité

Minuseek traite des données judiciaires et biométriques. Une faille peut
exposer des personnes réelles : merci de la signaler en privé.

## Signaler une vulnérabilité

**N'ouvrez pas d'issue publique.** Utilisez le
[signalement privé de GitHub](https://github.com/minuseek/minuseek/security/advisories/new)
(onglet *Security* → *Report a vulnerability*). Seuls les mainteneurs voient
le rapport.

Indiquez si possible :

- la partie concernée (back, front, configuration Keycloak…) ;
- les étapes pour reproduire, ou une preuve de concept ;
- l'impact estimé (fuite entre tenants, contournement d'autorisation,
  altération de la chaîne d'audit…).

Les mainteneurs accusent réception sous 7 jours, puis vous tiennent informé·e
de la correction. Une fois le correctif publié, la faille est rendue publique
dans un *security advisory*, avec votre nom si vous le souhaitez.

## Versions prises en charge

Seule la dernière version de la branche `main` reçoit des correctifs de
sécurité.

## Périmètre

Sont notamment dans le périmètre : l'isolation entre tenants, l'authentification
et les rôles, l'intégrité de la chaîne d'audit et des scellés, le chiffrement
des images, l'exposition de données par l'API.

Les identifiants de démonstration (`seed-demo-users`, superadmin de dev) sont
publics par conception et ne doivent jamais servir hors d'un poste local.
