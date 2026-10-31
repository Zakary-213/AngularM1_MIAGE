# Rapport des tests (TP3)

Dans ce rapport, je présente les tests que j’ai écrits et les vérifications que j’ai effectuées ou fait effectuer avec l’aide de mon assistant IA. Je distingue les résultats observés des scénarios que je n’ai pas exécutés manuellement.

## Résultats des tests — 31 octobre 2026

J’ai conservé les résultats du 8 et du 15 octobre comme historique. Pour les tests de la bibliothèque et de la validation des formats, j’ai fait exécuter les commandes avec l’aide de mon assistant sur Windows avec Node 24.21.0. J’ai obtenu les résultats suivants :

| Vérification | Résultat actuel |
|---|---|
| Frontend `npm test` | **9 tests réussis sur 9**, dans 2 fichiers, dernière exécution : 3,49 s |
| Frontend `npm run build` | **Réussi**, 4,063 s, sortie `frontend-starter/dist/gpc` |
| Backend `npm test` | **2 tests réussis sur 2**, sans ajout ni modification des routes |
| Nouveau test de bibliothèque | Après un GET simulé 503 : erreur visible, chargement terminé, anciennes pistes conservées, clic Actualiser, nouveau GET et disparition de l’erreur après succès |
| Nouveau test de format | MIME `audio/flac`, refusé par le backend : rejet local avant POST, message visible et aucun upload en cours |
| API réelle : fichier invalide | Multipart avec fichier texte : **400**, `Format audio non accepté` |
| API réelle : propriétaire | Audio temporaire fraîchement uploadé : **200**, `audio/mpeg`, 3 605 337 octets |
| API réelle : second compte | Même URL avec un autre utilisateur authentifié : **404**, `Piste inconnue` |
| Nettoyage | Piste et compte de vérification temporaires supprimés, anciennes pistes conservées |

Pour le test d’upload 400 et le contrôle de propriété, j’ai fait utiliser un client de vérification séparé du frontend, avec la véritable API et Atlas. Je ne compte pas ces contrôles parmi mes neuf tests Vitest. J’ai ajouté les captures du vrai panneau Network, la méthode de collecte et les limites dans la section TP2 de [RAPPORT_IA_MODELE.md](RAPPORT_IA_MODELE.md). J’ai conservé le journal final expurgé dans [captures/tp2-verifications-reelles.json](captures/tp2-verifications-reelles.json).

Lors du premier essai réel, j’ai constaté avec l’assistant que les anciens fichiers audio ne sont pas présents sur le disque Windows, bien que leurs métadonnées soient dans Atlas. Un 404 propriétaire de fichier absent ne prouve pas le contrôle de propriété : j’ai donc fait réaliser un second essai avec une piste temporaire disponible sur disque. J’ai obtenu 200 pour le propriétaire et 404 pour l’autre compte. Je distingue cet écart de données locales des résultats de mes tests et du build.

## Historique des séances précédentes

Le 8 octobre 2026, j’ai vérifié ma première suite de tests frontend avec Vitest, TestBed et HttpTestingController. Dans ces tests, j’intercepte les requêtes HTTP et je simule leurs réponses : je n’ai besoin ni du backend ni de MongoDB. J’utilise jsdom pour rendre le DOM des composants et je remplace le SnackBar par un double de test dont je vérifie les appels.

| Test | Résultat attendu | Résultat observé |
|---|---|---|
| Pagination serveur | GET /api/tracks avec page=2 et limit=5, restitution de la réponse simulée | Réussi |
| Multipart et progression | POST /api/tracks avec exactement audio et title, reportProgress activé | Réussi |
| Suppression confirmée | DELETE sur l'identifiant, blocage des doubles actions, GET de rafraîchissement, liste vide et SnackBar après 204 | Réussi |
| Annulation | Aucun DELETE, piste conservée | Réussi |
| Piste inaccessible / absente | Après 404 : message adapté, GET de rafraîchissement et état de suppression libéré | Réussi |
| Progression et succès | 25 % rendu dans la barre, fichier/titre bloqués, 100 % sans succès prématuré, réponse 201 puis formulaire vidé et page 1 rechargée | Réussi |
| Erreur d'upload et nouvel essai | Total inconnu géré, message 400 affiché, contrôles réactivés, titre/fichier conservés, nouvelle requête possible | Réussi |

**Bilan frontend : 7 tests réussis sur 7, dans 2 fichiers. Build Angular réussi**, avec Node 24.19.0 et exécution hors sandbox après interruption du processus dans le sandbox. Les réponses 400 et 404 sont volontaires dans les tests, elles ne représentent pas un défaut du serveur.

**Bilan backend existant : 2 tests réussis sur 2.** J’ai conservé le test de santé HTTP 200 et le test de schémas Mongoose/relation. Je n’ai pas ajouté de nouveau test backend. Je ne considère pas ces deux tests comme une preuve de toute la sécurité du backend.

## Comment je reproduis les tests

Avec une version compatible de Node (sur Node 24 : au minimum 24.15.0), je me place dans `frontend-starter` et je lance :

```bash
npm test
npm run build
```

Je me place ensuite dans `backend` et je lance :

```bash
npm test
```

Lors de la séance historique, j’ai fait utiliser par mon assistant le runtime Node 24.19.0 fourni par Codex, car mon Node système était alors en version 24.13.1. Je n’ai pas modifié cette installation système. J’ai conservé ci-dessous la commande exacte de cette séance dans `frontend-starter`, pour ma dernière vérification Windows, j’ai utilisé les commandes `npm` ci-dessus avec Node 24.21.0 :

```bash
/Users/zakary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@angular/cli/bin/ng.js test --watch=false
```

## Vérifications manuelles que je prévois ou que j’ai réalisées

- Suppression : annuler puis confirmer, observer DELETE 204 puis GET dans Network, vérifier le SnackBar et la disparition de la piste.
- Deux onglets : supprimer une piste dans le premier, la supprimer à nouveau dans le second sans actualiser, vérifier 404 et la liste actualisée.
- Upload : dans un navigateur permettant de ralentir le réseau, observer le pourcentage, les contrôles bloqués et un seul POST multipart. Après 201, vérifier le succès et la remise à zéro.
- Erreur : arrêter temporairement le backend puis envoyer un fichier valide, vérifier le message et la possibilité de réessayer une fois le serveur relancé.
- Régression : connexion, profil, pagination, upload et lecture audio doivent continuer à fonctionner.
- Captures : DELETE/GET et POST multipart avec progression visible. Masquer la valeur complète du JWT sur les captures partagées.

Je consigne les observations réellement obtenues dans la section Safari ci-dessous et je distingue les scénarios que je n’ai pas encore exécutés. Je ne considère pas les tests automatisés comme un remplacement des captures Network.

## Résultats que j’ai confirmés (8 octobre 2026)

J’ai exécuté les commandes sur ma machine et j’ai transmis leurs sorties à l’assistant :
- Frontend : `npm test`, 2 fichiers réussis, 7 tests réussis sur 7, à 09:30:02 (durée 1,21 s).
- Build : `npm run build`, génération réussie en 2,012 s, sortie `frontend-starter/dist/gpc`. J’ai ainsi confirmé que le build n’était plus bloqué dans ma session.
- Backend : 2 tests réussis sur 2, aucun échec (durée 452 ms).

Le message `[TracksPage] Envoi impossible 400` est attendu dans le test qui simule un refus serveur : il vérifie l'affichage de l'erreur, la réactivation des contrôles et la possibilité de réessayer. Il ne signale pas un échec de la suite. Les captures et observations Safari ajoutées ci-dessous complètent ces résultats, les scénarios encore non exécutés sont explicitement indiqués.

## Observations réelles dans Safari (8 octobre 2026)

| Vérification | Observation réelle | Preuve |
|---|---|---|
| Connexion et profil | Compte de démonstration connecté, profil affiché | `captures/tp1-profil.png` |
| Pagination | GET page 2, limite 5, statut 200, deux éléments sur sept, dernière page | `captures/tp2-pagination-page2.png`, `tp2-pagination-entetes.png` |
| Taille excessive | Fichier synthétique de 26 000 000 octets rejeté localement, aucune requête réseau | `captures/tp2-validation-taille.png` |
| Lecture audio | Audio réellement lu, Authorization Bearer, réponse 200, audio/mpeg | `captures/tp2-audio-jwt.png` |
| Nettoyage du lecteur | Log ngOnDestroy après navigation vers Profil | `captures/tp2-objecturl-destruction.png` |
| Progression réelle | 23 % avec contrôles désactivés, relais local temporaire ralentissant les octets | `captures/tp3-upload-progression.png` |
| Réponse et multipart | POST avec audio/title, réponse 201, formulaire vidé, piste ajoutée et page 1 rechargée | `captures/tp3-upload-reponse201.png`, `tp3-upload-multipart.png` |
| Annulation de suppression | Confirmation ouverte puis annulée, Network vide | `captures/tp3-suppression-confirmation.png` (avant annulation) |
| Suppression confirmée | Preuve complétée le 15 octobre sur une nouvelle piste temporaire autorisée, « Capture TP — piste 4 » conservée | Voir les captures finales ci-dessous |

J’ai complété la liste précédente avec ces observations. Je n’ai pas encore vérifié manuellement la double suppression dans deux onglets et l’échec réseau avec reprise. Les erreurs d’extension OKX Wallet et le favicon 404 m’empêchaient alors de déclarer une console entièrement sans erreurs. J’avais conservé les cinq pistes de démonstration créées à ce stade.

## Vérifications finales du 15 octobre 2026

J’ai fait effectuer la vérification finale dans Chromium 151, avec un profil de test distinct de Safari, la véritable API et MongoDB Atlas. Je n’ai utilisé aucune réponse simulée pour ces captures.

| Vérification | Résultat observé | Preuve |
|---|---|---|
| Suppression autorisée | Seule « TP3 preuve suppression temporaire 15-10 » supprimée, DELETE 204 | `captures/tp3-suppression-delete204.png` |
| Rafraîchissement | GET /api/tracks?page=1&limit=5, réponse 200, piste temporaire disparue | `captures/tp3-suppression-get200.png` |
| Retour utilisateur | SnackBar de succès, une seule coche | `captures/tp3-suppression-network.png`, `captures/tp3-suppression-snackbar.png` |
| Régression | Connexion, profil chargé via API, pagination aller-retour, lecture Blob et nettoyage ngOnDestroy exécutés | Journal des messages de console |
| Console | Aucune erreur console ni exception JavaScript sur les parcours observés | `captures/tp3-console-finale.png` |
| Données sensibles | Aucun JWT ni mot de passe de démonstration dans les messages collectés | `captures/tp3-verifications-finales.json` |
| Favicon | Icône SVG intégrée ajoutée dans src/index.html, plus de requête favicon manquante pendant cette vérification | Source et chargement réel du navigateur |
| Build après correction | Réussi en 1,859 s, sortie frontend-starter/dist/gpc | Sortie ng build du 15 octobre |
| Captures à partager | JWT masqués dans les trois images concernées, en-têtes repliés dans les nouvelles preuves | Contrôle visuel et OCR local |

J’ai conservé le journal détaillé dans [captures/tp3-verifications-finales.json](captures/tp3-verifications-finales.json), avec les messages de debug et une suggestion informative d’autocomplétion du formulaire. Je distingue les indicateurs d’erreurs des anciennes captures Safari du 8 octobre de ma vérification finale, datée séparément.

Je n’ai pas exécuté manuellement les scénarios complémentaires de double suppression dans deux onglets et de panne du backend, j’ai couvert les comportements 404 et erreur d’upload avec des tests automatisés. J’ai conservé les cinq pistes « Capture TP » du 8 octobre. J’ai autorisé la suppression de ma seule piste temporaire du 15 octobre après la vérification.
