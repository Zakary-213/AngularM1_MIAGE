# Rapport des tests : TP1, TP2 et TP3

J’ai testé les fonctionnalités de mon application avec des tests automatisés et des vérifications dans le navigateur. J’ai utilisé l’aide de mon assistant IA pour préparer les tests et analyser leurs résultats.

## Résultats

| Commande | Résultat |
|---|---|
| Frontend : `npm test` | 9 tests réussis sur 9, dans 2 fichiers |
| Backend : `npm test` | 2 tests réussis sur 2 |
| Frontend : `npm run build` | Réussi, application générée dans `frontend-starter/dist/gpc` |

J’ai utilisé Node 24.21.0 pour ces vérifications.

## Tests frontend

J’ai utilisé Vitest, TestBed et HttpTestingController. Je simule les réponses HTTP pour vérifier les services et le composant sans démarrer le backend ni MongoDB. J’utilise jsdom pour afficher le template et un double de SnackBar pour vérifier les notifications.

| Test | Résultat attendu | Résultat observé |
|---|---|---|
| Pagination serveur | GET `/api/tracks` avec `page=2` et `limit=5`, restitution de la réponse | Réussi |
| Multipart et progression | POST `/api/tracks` avec les champs `audio` et `title`, progression demandée | Réussi |
| Suppression confirmée | DELETE sur la bonne piste, blocage du double clic, GET de rafraîchissement et SnackBar après 204 | Réussi |
| Annulation | Aucune requête DELETE et piste conservée | Réussi |
| Piste absente ou inaccessible | Après 404, message adapté, liste actualisée et état de suppression libéré | Réussi |
| Progression et succès | Affichage à 25 %, contrôles bloqués, attente après 100 %, succès après 201 et formulaire vidé | Réussi |
| Erreur d’upload et nouvel essai | Total inconnu géré, erreur 400 affichée, contrôles réactivés et formulaire conservé pour réessayer | Réussi |
| Erreur de chargement de bibliothèque | Après 503, erreur visible et anciennes pistes conservées, puis nouvel essai réussi avec Actualiser | Réussi |
| Format audio refusé | Rejet local du MIME `audio/flac`, message affiché et aucun POST envoyé | Réussi |

Le message `[TracksPage] Envoi impossible 400` apparaît dans le scénario où je simule un refus serveur. Il correspond au comportement attendu du test.

## Tests backend

J’ai conservé et exécuté les deux tests fournis dans `backend/test/api.test.js`.

| Test | Résultat attendu | Résultat observé |
|---|---|---|
| Santé de l’API | GET `/api/health`, statut 200 et `{ "status": "ok" }` | Réussi |
| Schémas Mongoose | Email normalisé, métadonnées de piste et relation avec le modèle User | Réussi |

## Vérifications dans l’application

| Fonctionnalité | Action effectuée et résultat | Captures |
|---|---|---|
| Connexion réussie | J’ai connecté le compte de démonstration, obtenu 200 et accédé à la bibliothèque | [Connexion](captures/tp1-network-login200-details.png) |
| Connexion refusée | J’ai saisi un mauvais mot de passe, obtenu 401 et le message Identifiants incorrects | [Refus](captures/tp1-network-login401-reponse.png) |
| Profil | J’ai chargé le profil avec GET `/api/users/me`, obtenu 200 et retrouvé les données du compte | [Profil](captures/tp1-network-profil200-reponse.png) |
| Modification du profil | J’ai enregistré un nouveau nom, rechargé le profil et retrouvé la modification, puis restauré le nom initial | [Nom modifié](captures/tp1-profil-modifie.jpg) |
| Pagination | J’ai changé de page, retrouvé `page=2&limit=5` dans la requête et obtenu 200 | [Pagination](captures/tp2-pagination-entetes.png) |
| Taille du fichier | J’ai sélectionné un fichier dépassant le seuil frontend et constaté le blocage avant HTTP | [Validation locale](captures/tp2-validation-taille.png) |
| Lecture audio | J’ai lancé un morceau et vérifié la requête authentifiée ainsi que la réponse audio | [Lecture](captures/tp2-audio-jwt.png) |
| Nettoyage du lecteur | J’ai quitté la bibliothèque et retrouvé le message de révocation de l’ObjectURL | [Nettoyage](captures/tp2-objecturl-destruction.png) |
| Suppression | J’ai confirmé la suppression de ma piste temporaire, obtenu DELETE 204 puis GET 200, et retrouvé le SnackBar | [Suppression](captures/tp3-suppression-network.png) |
| Progression d’upload | J’ai observé 23 % pendant l’envoi avec les contrôles désactivés | [Progression](captures/tp3-upload-progression.png) |
| Succès d’upload | J’ai obtenu 201, retrouvé la piste dans la liste et constaté le formulaire vidé | [Succès](captures/tp3-upload-reponse201.png) |
| Multipart | J’ai retrouvé les champs `audio` et `title` dans le POST | [Multipart](captures/tp3-upload-multipart.png) |
| Console | J’ai contrôlé les messages des parcours de vérification après correction du favicon | [Console](captures/tp3-console-finale.png) |

J’ai également vérifié le retour à la connexion après un JWT invalide. Le relais de test a remplacé le jeton d’une requête de profil, l’API a renvoyé 401 et l’intercepteur a nettoyé la session.

## Validation serveur et droits sur les pistes

J’ai fait utiliser un client de vérification séparé du frontend avec la véritable API et MongoDB Atlas. J’ai envoyé volontairement un fichier invalide pour tester la validation du serveur. J’ai aussi utilisé deux comptes distincts pour vérifier les droits sur une même piste temporaire.

| Contrôle | Résultat attendu | Résultat observé |
|---|---|---|
| Upload valide temporaire | POST multipart accepté | 201 |
| Upload texte avec MIME `text/plain` | Fichier refusé par le serveur | 400, `Format audio non accepté` |
| Lecture par le propriétaire | Fichier audio accessible | 200, `audio/mpeg`, 3 605 337 octets |
| Lecture par le second utilisateur | Accès refusé à la même piste | 404, `Piste inconnue` |
| Nettoyage | Suppression des seules données temporaires | Piste et compte temporaires supprimés |

J’ai conservé les résultats expurgés dans [le journal des contrôles HTTP](captures/tp2-verifications-reelles.json) et les captures dans [le rapport IA](RAPPORT_IA_MODELE.md).

## Reproduire mes tests

Dans `frontend-starter`, je lance :

```bash
npm test
npm run build
```

Dans `backend`, je lance :

```bash
npm test
```

## Points à connaître

J’ai constaté que certaines anciennes pistes ont leurs métadonnées dans Atlas mais plus de fichier correspondant sur le disque local. Pour vérifier la lecture et les droits, j’ai utilisé un MP3 temporaire fraîchement envoyé. Les anciens morceaux nécessitent une restauration de leurs fichiers ou un nouvel upload.

Je n’ai pas effectué manuellement la double suppression depuis deux onglets ni la panne du backend pendant un upload. J’ai vérifié les réponses 404 et les erreurs d’upload avec des tests automatisés.
