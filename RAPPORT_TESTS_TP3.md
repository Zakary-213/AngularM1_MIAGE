# Rapport des tests (TP3)

Exécution le 8 octobre 2026. Les tests frontend utilisent Vitest, TestBed et HttpTestingController. Les requêtes HTTP sont interceptées et leurs réponses simulées : aucun backend ni MongoDB n'est nécessaire. Le DOM des composants est rendu avec jsdom ; le SnackBar est remplacé par un double de test dont les appels sont vérifiés.

| Test | Résultat attendu | Résultat observé |
|---|---|---|
| Pagination serveur | GET /api/tracks avec page=2 et limit=5 ; restitution de la réponse simulée | Réussi |
| Multipart et progression | POST /api/tracks avec exactement audio et title ; reportProgress activé | Réussi |
| Suppression confirmée | DELETE sur l'identifiant, blocage des doubles actions, GET de rafraîchissement, liste vide et SnackBar après 204 | Réussi |
| Annulation | Aucun DELETE, piste conservée | Réussi |
| Piste inaccessible / absente | Après 404 : message adapté, GET de rafraîchissement et état de suppression libéré | Réussi |
| Progression et succès | 25 % rendu dans la barre, fichier/titre bloqués ; 100 % sans succès prématuré ; réponse 201 puis formulaire vidé et page 1 rechargée | Réussi |
| Erreur d'upload et nouvel essai | Total inconnu géré ; message 400 affiché, contrôles réactivés, titre/fichier conservés ; nouvelle requête possible | Réussi |

**Bilan frontend : 7 tests réussis sur 7, dans 2 fichiers. Build Angular réussi**, avec Node 24.19.0 et exécution hors sandbox après interruption du processus dans le sandbox. Les réponses 400 et 404 sont volontaires dans les tests ; elles ne représentent pas un défaut du serveur.

**Bilan backend existant : 2 tests réussis sur 2.** Test de santé HTTP 200 et test de schémas Mongoose/relation. Aucun nouveau test backend n'a été ajouté. Ces deux tests ne prouvent pas la sécurité complète du backend.

## Reproduire les tests

Avec une version compatible de Node (sur Node 24 : au minimum 24.15.0), depuis `frontend-starter` :

```bash
npm test
npm run build
```

Depuis `backend` :

```bash
npm test
```

L'agent a utilisé Node 24.19.0 fourni par Codex pour les commandes Angular, car le Node système est en version 24.13.1. Cela ne modifie pas l'installation système. Commande exacte de tests utilisée dans `frontend-starter` :

```bash
/Users/zakary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@angular/cli/bin/ng.js test --watch=false
```

## Liste des vérifications manuelles

- Suppression : annuler puis confirmer ; observer DELETE 204 puis GET dans Network ; vérifier le SnackBar et la disparition de la piste.
- Deux onglets : supprimer une piste dans le premier, la supprimer à nouveau dans le second sans actualiser ; vérifier 404 et la liste actualisée.
- Upload : dans un navigateur permettant de ralentir le réseau, observer le pourcentage, les contrôles bloqués et un seul POST multipart. Après 201, vérifier le succès et la remise à zéro.
- Erreur : arrêter temporairement le backend puis envoyer un fichier valide ; vérifier le message et la possibilité de réessayer une fois le serveur relancé.
- Régression : connexion, profil, pagination, upload et lecture audio doivent continuer à fonctionner.
- Captures : DELETE/GET et POST multipart avec progression visible. Masquer la valeur complète du JWT sur les captures partagées.

Les observations réellement réalisées sont consignées dans la section Safari ci-dessous. Les scénarios restants y sont distingués. Les tests automatisés ne remplacent pas les captures Network.

## Résultats confirmés par le binôme (8 octobre 2026)

Zakary a fourni la sortie des commandes exécutées sur sa machine :
- Frontend : `npm test`, 2 fichiers réussis, 7 tests réussis sur 7, à 09:30:02 (durée 1,21 s).
- Build : `npm run build`, génération réussie en 2,012 s, sortie `frontend-starter/dist/gpc`. Le build n'est donc plus bloqué dans sa session.
- Backend : 2 tests réussis sur 2, aucun échec (durée 452 ms).

Le message `[TracksPage] Envoi impossible 400` est attendu dans le test qui simule un refus serveur : il vérifie l'affichage de l'erreur, la réactivation des contrôles et la possibilité de réessayer. Il ne signale pas un échec de la suite. Les captures et observations Safari ajoutées ci-dessous complètent ces résultats ; les scénarios encore non exécutés sont explicitement indiqués.

## Observations réelles dans Safari (8 octobre 2026)

| Vérification | Observation réelle | Preuve |
|---|---|---|
| Connexion et profil | Compte de démonstration connecté, profil affiché | `captures/tp1-profil.png` |
| Pagination | GET page 2, limite 5, statut 200 ; deux éléments sur sept, dernière page | `captures/tp2-pagination-page2.png`, `tp2-pagination-entetes.png` |
| Taille excessive | Fichier synthétique de 26 000 000 octets rejeté localement, aucune requête réseau | `captures/tp2-validation-taille.png` |
| Lecture audio | Audio réellement lu ; Authorization Bearer, réponse 200, audio/mpeg | `captures/tp2-audio-jwt.png` |
| Nettoyage du lecteur | Log ngOnDestroy après navigation vers Profil | `captures/tp2-objecturl-destruction.png` |
| Progression réelle | 23 % avec contrôles désactivés ; relais local temporaire ralentissant les octets | `captures/tp3-upload-progression.png` |
| Réponse et multipart | POST avec audio/title, réponse 201, formulaire vidé, piste ajoutée et page 1 rechargée | `captures/tp3-upload-reponse201.png`, `tp3-upload-multipart.png` |
| Annulation de suppression | Confirmation ouverte puis annulée, Network vide | `captures/tp3-suppression-confirmation.png` (avant annulation) |
| Suppression confirmée | Preuve complétée le 15 octobre sur une nouvelle piste temporaire autorisée ; « Capture TP — piste 4 » conservée | Voir les captures finales ci-dessous |

Ces observations complètent la liste précédente. Les scénarios de double suppression dans deux onglets et d'échec réseau avec reprise restent à vérifier manuellement. Les erreurs d'extension OKX Wallet et le favicon 404 ne permettent pas de déclarer une console entièrement sans erreurs. Les cinq pistes de démonstration créées sont conservées à ce stade.

## Vérifications finales du 15 octobre 2026

Navigateur : Chromium 151, profil de test distinct de Safari. API réelle et MongoDB Atlas ; aucune réponse simulée pour ces captures.

| Vérification | Résultat observé | Preuve |
|---|---|---|
| Suppression autorisée | Seule « TP3 preuve suppression temporaire 15-10 » supprimée ; DELETE 204 | `captures/tp3-suppression-delete204.png` |
| Rafraîchissement | GET /api/tracks?page=1&limit=5, réponse 200, piste temporaire disparue | `captures/tp3-suppression-get200.png` |
| Retour utilisateur | SnackBar de succès, une seule coche | `captures/tp3-suppression-network.png`, `captures/tp3-suppression-snackbar.png` |
| Régression | Connexion, profil chargé via API, pagination aller-retour, lecture Blob et nettoyage ngOnDestroy exécutés | Journal des messages de console |
| Console | Aucune erreur console ni exception JavaScript sur les parcours observés | `captures/tp3-console-finale.png` |
| Données sensibles | Aucun JWT ni mot de passe de démonstration dans les messages collectés | `captures/tp3-verifications-finales.json` |
| Favicon | Icône SVG intégrée ajoutée dans src/index.html ; plus de requête favicon manquante pendant cette vérification | Source et chargement réel du navigateur |
| Build après correction | Réussi en 1,859 s ; sortie frontend-starter/dist/gpc | Sortie ng build du 15 octobre |
| Captures à partager | JWT masqués dans les trois images concernées ; en-têtes repliés dans les nouvelles preuves | Contrôle visuel et OCR local |

Le journal détaillé est dans [captures/tp3-verifications-finales.json](captures/tp3-verifications-finales.json). Les messages de debug sont conservés, ainsi qu’une suggestion informative d’autocomplétion du formulaire. Les indicateurs d’erreurs visibles dans les anciennes captures Safari du 8 octobre appartiennent à cette séance historique ; la vérification finale est datée séparément.

Les scénarios manuels de double suppression dans deux onglets et de panne du backend restent des vérifications complémentaires non exécutées ; leurs comportements 404 et erreur d’upload sont testés automatiquement. Les cinq pistes « Capture TP » du 8 octobre sont conservées. La piste temporaire du 15 octobre a été supprimée après accord explicite de Zakary.
