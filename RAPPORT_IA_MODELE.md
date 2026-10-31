# Rapport d’usage de l’IA — TP1, TP2 et TP3

J’ai utilisé un assistant IA pour analyser le projet, compléter le code Angular et préparer les tests. Je m’en suis aussi servi pour m’aider à vérifier l’application et à rédiger ce rapport. Pour chaque mission, je présente ma demande, les modifications obtenues et les résultats des vérifications. Les exemples de prompts sont des extraits courts ou des reformulations de mes demandes.

| Mission | TP | Contenu |
|---|---|---|
| 1 | TP1 | Inscription, connexion et profil |
| 2 | TP2 | Bibliothèque paginée |
| 3 | TP2 | Upload, validation et lecture audio |
| 5 | TP3 | Suppression d’une piste |
| 6 | TP3 | Progression de l’upload |
| 7 | TP3 | Tests automatisés |

## Mission 1 — Inscription, connexion et profil (TP1)

**Objectif.** Compléter les formulaires d’authentification, la déconnexion et le traitement des réponses 401.

**Ce que j’ai demandé à l’IA.** Je lui ai transmis la consigne du TP1 pour identifier les fonctionnalités manquantes dans les formulaires et la gestion de l’authentification.

**Exemple de prompt :**

> « À partir de la consigne du TP1, complète les formulaires et la gestion de l’authentification. »

**Ce que j’ai obtenu.** Avec l’aide de l’IA, j’ai constaté que la logique TypeScript des formulaires était déjà présente. Les changements ont porté sur les messages de validation, la désactivation des boutons lorsque les formulaires sont invalides, la déconnexion et l’affichage de la navigation selon l’état de connexion. L’intercepteur HTTP ajoute le jeton aux requêtes et, après une réponse 401, efface la session puis redirige vers la connexion.

**Comment j’ai vérifié.** J’ai saisi une adresse sans « @ » pour contrôler le message de validation et le blocage du formulaire. J’ai aussi testé la déconnexion et le comportement avec un jeton modifié dans le stockage local : la réponse 401 entraîne une redirection vers la connexion. Pour le contrôle final, j’ai également fait vérifier la connexion et le chargement du profil avec l’assistant.

**Fichiers concernés.** `login-page.html`, `register-page.html`, `app.ts`, `app.html` et `auth.interceptor.ts`, dans `frontend-starter/src/app/`.

**Preuve.** Profil chargé sur le compte de démonstration et lien de déconnexion visible :

![Profil chargé et lien Déconnexion](captures/tp1-profil.png)

## Mission 2 — Bibliothèque paginée (TP2)

**Objectif.** Afficher les pistes page par page à partir de `GET /api/tracks`, avec les paramètres `page` et `limit`.

**Ce que j’ai demandé à l’IA.** Je voulais vérifier que la pagination utilisait bien le serveur et que les boutons respectaient les limites de la liste.

**Exemple de prompt :**

> « Vérifie que la bibliothèque appelle GET /api/tracks?page=1&limit=5 et désactive les boutons aux extrémités. »

**Ce que j’ai obtenu.** J’ai fait vérifier le service et le composant avec l’IA. `TrackService.list(page, limit)` transmet les paramètres au backend. Le composant conserve les pistes, la page courante, le nombre de pages et l’état de chargement dans des Signals. `load()` récupère la page demandée ; `go(page)` change de page puis relance le chargement. Le template gère la liste vide et désactive « Préc. » sur la première page et « Suiv. » sur la dernière.

**Mon choix.** J’ai conservé la pagination côté serveur, conformément au sujet. Charger toute la bibliothèque puis utiliser `slice()` aurait contourné cette exigence. Le filtre par titre porte uniquement sur les pistes de la page chargée.

**Comment j’ai vérifié.** Je me suis appuyé sur le panneau Network et les captures obtenues avec l’assistant. La page 2 sur 2 affiche deux pistes sur un total de sept, avec `page: 2`, `limit: 5`, `total: 7`, `pages: 2`. La requête répond avec le statut 200. Une limite de cinq correspond à un maximum par page : la dernière peut contenir moins d’éléments. J’ai également fait vérifier un aller-retour entre les pages 1 et 2.

**Fichiers concernés.** `track.service.ts`, `tracks-page.ts` et `tracks-page.html`.

![Page 2, bornes de navigation et réponse JSON](captures/tp2-pagination-page2.png)

![GET page=2 et limit=5 avec statut HTTP 200](captures/tp2-pagination-entetes.png)

## Mission 3 — Upload, validation et lecture audio (TP2)

### Validation et envoi d’un fichier

**Objectif.** Vérifier le fichier avant l’envoi et informer l’utilisateur pendant le traitement.

**Ce que j’ai demandé à l’IA.** Je lui ai demandé de compléter la validation du fichier et les messages affichés pendant l’envoi.

**Exemple de prompt :**

> « Bloque l’envoi si le fichier dépasse 25 Mo ou n’est pas audio. Affiche le chargement, les erreurs et un message de succès. »

**Ce que j’ai obtenu.** Avec l’aide de l’IA, j’ai complété la méthode `upload()` pour vérifier la taille du fichier ainsi que son type MIME ou son extension. Si le fichier est invalide, elle renseigne `uploadError` et quitte la méthode avant l’appel HTTP. Les Signals `uploading`, `uploadError` et `uploadSuccess` pilotent les contrôles et les messages. Après un succès, le titre, le fichier sélectionné et l’élément HTML de sélection sont réinitialisés ; la page 1 est rechargée. Cette gestion a ensuite été enrichie par la progression de la mission 6.

**Corrections et choix retenus.** J’ai conservé les contrôles du serveur : la validation du navigateur améliore le retour utilisateur, mais ne suffit pas à sécuriser l’upload. Le backend conserve les limites et la validation Multer. Vider uniquement la variable TypeScript du fichier ne suffit pas : il faut aussi réinitialiser l’élément `<input type="file">`.

**Comment j’ai vérifié.** J’ai fait contrôler le rejet local avec l’assistant : un fichier synthétique de 26 000 000 octets, nommé avec l’extension `.mp3`, est refusé sans requête réseau. Il sert uniquement au contrôle de taille et n’a pas été envoyé au serveur. Un envoi réel de `song1.mp3` a ensuite permis de vérifier les champs multipart `audio` et `title`, ainsi que l’ajout de la piste. La réponse 201 et le formulaire vidé sont également visibles dans les preuves de la mission 6. La gestion d’une erreur serveur et d’un nouvel essai est couverte par les tests de la mission 7.

**Fichiers concernés.** `tracks-page.ts`, `tracks-page.html` et `tracks-page.css`.

![Fichier supérieur à 25 Mo rejeté sans requête réseau](captures/tp2-validation-taille.png)

![Upload réel multipart avec les champs audio et title](captures/tp2-upload-multipart.png)

### Lecture authentifiée et gestion de l’ObjectURL

**Objectif.** Afficher le morceau en cours, signaler les erreurs de lecture et libérer l’URL du fichier lorsque le lecteur n’en a plus besoin.

**Ce que j’ai demandé à l’IA.** Je lui ai demandé de compléter le lecteur et de m’expliquer la gestion du fichier audio.

**Exemple de prompt :**

> « Ajoute le nettoyage de l’ObjectURL dans ngOnDestroy et affiche clairement le morceau en cours de lecture. »

**Ce que j’ai obtenu.** J’ai complété le lecteur avec l’IA. `TrackService.audio(id)` récupère le fichier avec `HttpClient` et `responseType: 'blob'`. L’intercepteur ajoute l’en-tête d’authentification. Le composant crée ensuite une URL locale avec `URL.createObjectURL(blob)` et la transmet au lecteur. Les Signals `currentTrack`, `audioLoading` et `audioError` servent à afficher la piste active, le chargement et les erreurs. L’ancienne ObjectURL est révoquée au changement de piste, à la suppression de la piste active et à la destruction du composant.

**Mon choix.** J’ai conservé le passage par `HttpClient`, car une URL HTTP placée directement dans `<audio src>` ne passe pas par l’intercepteur Angular et ne reçoit donc pas son en-tête Bearer. J’ai écarté l’ajout du JWT dans l’URL, car il pourrait apparaître dans l’historique et les journaux. L’en-tête `Authorization` transporte le jeton ; le chiffrement du transport dépend de HTTPS, et non de la présence de cet en-tête.

**Comment j’ai vérifié.** J’ai fait vérifier la lecture de « Capture TP — piste 4 » avec l’assistant. La requête répond avec le statut 200 et `Content-Type: audio/mpeg`. Après navigation vers Profil, la console affiche le message de révocation dans `ngOnDestroy`. Ce message confirme l’exécution du nettoyage ; il ne mesure pas la mémoire libérée.

**Fichiers concernés.** `track.service.ts`, `tracks-page.ts`, `tracks-page.html` et `tracks-page.css`.

![Lecture audio, Authorization Bearer, HTTP 200 et audio/mpeg](captures/tp2-audio-jwt.png)

![Révocation ObjectURL après navigation vers Profil](captures/tp2-objecturl-destruction.png)

### Réponses aux questions sur la mémoire, le buffering et le streaming

#### 1. Le backend charge-t-il le fichier entier en mémoire ?

La route audio de `backend/src/app.js` utilise `res.sendFile(audioPath)` après vérification du JWT et du propriétaire. Le fichier peut être transféré progressivement depuis le disque. Le code de la route ne crée pas un Buffer contenant tout le fichier avant de répondre. Cela ne signifie pas que la consommation mémoire est nulle : le transfert utilise des tampons et dépend aussi du nombre de requêtes simultanées.

#### 2. Quand le composant reçoit-il le Blob ?

Dans l’appel actuel, `HttpClient` émet le Blob une fois la réponse entièrement téléchargée. Le composant crée alors l’ObjectURL et lance la lecture. Le serveur peut envoyer les octets progressivement, mais cette implémentation du composant attend le fichier complet avant de le transmettre au lecteur.

#### 3. Cent pistes dans la bibliothèque impliquent-elles cent fichiers audio chargés ?

Non. `TrackService.list()` demande uniquement les métadonnées de la page courante. Les fichiers binaires sont récupérés par une route distincte, appelée dans `play(track)` après une action de lecture. Le nombre de fichiers audio téléchargés ne dépend donc pas directement du nombre de pistes enregistrées dans la bibliothèque.

#### 4. Que changerait l’utilisation de cent éléments `<audio>` avec une URL HTTP ?

Le navigateur gérerait directement le chargement des médias. Selon `preload`, ses choix et les possibilités du serveur, il pourrait charger des métadonnées ou une partie des fichiers avant la lecture. Cela peut augmenter le nombre de requêtes et les ressources utilisées ; cela ne permet pas de conclure que cent téléchargements complets seraient lancés simultanément. La lecture directe peut commencer avant la réception de tout le fichier. Avec l’API actuelle, elle poserait aussi un problème d’authentification, puisque ces éléments n’ajoutent pas l’en-tête Bearer de l’intercepteur Angular.

#### 5. Pourquoi révoquer l’ObjectURL ?

Une ObjectURL maintient une référence vers le Blob associé. La révoquer lorsqu’elle n’est plus utilisée permet au navigateur de libérer les ressources correspondantes lorsque les autres références ont disparu. Cette libération n’est pas nécessairement immédiate et le stockage du Blob n’est pas forcément limité à la RAM. Le composant effectue ce nettoyage au changement de piste et dans `ngOnDestroy`.

Le flux de lecture est le suivant :

```text
Clic sur Écouter
  → TracksPage.play(track)
  → TrackService.audio(id)
  → HttpClient + intercepteur Authorization
  → vérification du JWT et du propriétaire par le backend
  → transfert du fichier par res.sendFile
  → réception du Blob complet
  → création d’une ObjectURL
  → lecture par <audio>
  → révocation de l’ObjectURL lorsqu’elle n’est plus utilisée
```

### Améliorations facultatives réalisées (TP2)

La bibliothèque comprend aussi la suppression avec confirmation, le formatage des tailles et des dates, un filtre local et la mise en évidence de la piste active. La suppression a été complétée dans la mission 5 du TP3.

## Mission 5 — Suppression d’une piste (TP3)

**Objectif.** Compléter la suppression existante avec un état de requête, un SnackBar et la gestion d’une liste devenue obsolète.

**Ce que j’ai demandé à l’IA.** Les boutons, la confirmation et l’appel au service existaient déjà. Je lui ai demandé de compléter les états et les messages.

**Exemple de prompt :**

> « Ajoute un état de suppression pour empêcher les doubles clics, puis un SnackBar après succès ou erreur. »

**Ce que j’ai obtenu.** J’ai complété la suppression avec l’aide de l’IA. Le Signal `deleting` contient l’identifiant de la piste en cours de suppression. Les boutons sont désactivés pendant la requête et la méthode refuse un second appel. La confirmation native et l’appel à `TrackService.delete(id)` sont conservés. `finalize` remet l’état à zéro après succès ou erreur. Un SnackBar indique le résultat ; après une réponse 404 ou 403, un message signale que la piste est supprimée ou inaccessible et la liste est actualisée. Le lecteur est nettoyé si la piste supprimée était active. La pagination revient à la page précédente si nécessaire.

**Pourquoi passer par un service ?** Le composant gère l’action et l’affichage, tandis que `TrackService` centralise le contrat HTTP. Cette séparation facilite aussi les tests des requêtes et des états de l’interface.

**Pourquoi la sécurité dépend-elle du backend ?** Le guard Angular contrôle la navigation, mais une requête peut être envoyée directement à l’API. Le middleware serveur vérifie le JWT et la requête `Track.findOneAndDelete({ _id: req.params.id, ownerId: req.auth.sub })` vérifie la propriété de la piste. Le backend fourni renvoie 404 aussi bien pour une piste absente que pour une piste appartenant à un autre compte. Il n’a pas été modifié.

**Difficultés et corrections.** J’ai rencontré une erreur de résolution du thème Material et j’ai demandé à l’IA de la corriger. Le chemin du thème a été déclaré dans `angular.json`. J’ai aussi signalé que le SnackBar affichait deux coches ; son style a été corrigé pour n’en conserver qu’une. Les erreurs de suppression utilisent le SnackBar et restent distinctes de la bannière d’erreur audio.

**Fichiers concernés.** `tracks-page.ts`, `tracks-page.html`, `tracks-page.css`, `src/styles.css`, `angular.json`, `package.json` et `package-lock.json`.

**Comment j’ai vérifié.** J’ai fait vérifier l’annulation avec l’assistant : aucune requête DELETE n’est envoyée. Pour le test de suppression, j’ai autorisé uniquement la suppression de « TP3 preuve suppression temporaire 15-10 ». Les captures montrent le DELETE 204, puis le GET de rafraîchissement 200, la disparition de la piste et le SnackBar de succès. J’ai conservé « Capture TP — piste 4 ». Les tests automatisés vérifient aussi le blocage d’un second appel, l’annulation et le rafraîchissement après 404.

![Confirmation avant suppression de la piste de démonstration](captures/tp3-suppression-confirmation.png)

![Suppression : réponse 204, rafraîchissement 200 et SnackBar](captures/tp3-suppression-network.png)

![Détail de la requête DELETE avec réponse 204](captures/tp3-suppression-delete204.png)

![Détail du GET de rafraîchissement avec réponse 200](captures/tp3-suppression-get200.png)

![SnackBar de succès après suppression de la piste temporaire](captures/tp3-suppression-snackbar.png)

## Mission 6 — Progression de l’upload (TP3)

**Objectif.** Afficher la progression d’envoi, empêcher une seconde soumission et attendre la réponse du serveur avant d’annoncer le succès.

**Ce que j’ai demandé à l’IA.** Je lui ai demandé de réaliser la progression de l’upload et de structurer le rapport par mission.

**Exemple de prompt :**

> « Fais la mission 6 et modifie le rapport pour mettre les titres par mission avec le TP entre parenthèses. »

**Ce que j’ai obtenu.** J’ai fait évoluer l’upload avec l’aide de l’IA. `TrackService.upload()` conserve le multipart `audio` et `title`, avec `observe: 'events'` et `reportProgress: true`. `main.ts` configure `withXhr()` pour disposer des événements de progression d’upload. Le Signal `uploadProgress` est mis à jour à partir de `HttpEventType.UploadProgress`, avec le calcul `Math.round(100 * loaded / total)`. Si le total est inconnu, la barre reste indéterminée.

Pendant l’envoi, le titre, le fichier et le bouton sont désactivés. La méthode refuse une seconde soumission. `finalize` réactive les contrôles après succès ou erreur. Après un échec, le titre et le fichier restent disponibles pour réessayer.

**Distinction entre progression et réponse.** Une requête classique émet sa réponse finale. Avec `observe: 'events'`, il faut distinguer les événements de départ, de progression et de réponse. Un envoi à 100 % ne prouve pas que le serveur a accepté le fichier : seul `HttpEventType.Response` déclenche le succès, le vidage du formulaire et le rechargement de la page 1. Un pourcentage simulé avec un minuteur a donc été écarté.

**Comment j’ai vérifié.** J’ai demandé à l’assistant de contrôler un envoi réel dans le navigateur. La capture de `song2.mp3` (6,41 Mo) montre une progression à 23 %, avec les contrôles désactivés. La réponse 201 a ensuite déclenché le message de succès, le vidage du formulaire et l’affichage de la piste en première position. Un relais HTTP local temporaire sur le port 4201 a ralenti le transfert vers Angular sur le port 4200 pour rendre la progression visible dans Safari. Le fichier a été envoyé à l’API réelle ; le relais a été arrêté après la vérification.

**Vérifications automatisées.** Les tests couvrent l’affichage à 25 %, l’attente de la réponse après 100 %, le blocage des contrôles, l’absence de total et un nouvel essai après une réponse 400.

**Fichiers concernés.** `src/main.ts`, `track.service.ts`, `tracks-page.ts`, `tracks-page.html` et `tracks-page.css`.

![Upload à 23 pour cent avec contrôles désactivés](captures/tp3-upload-progression.png)

![Réponse HTTP 201, piste ajoutée et formulaire vidé](captures/tp3-upload-reponse201.png)

![Multipart contenant audio et title](captures/tp3-upload-multipart.png)

## Mission 7 — Tests automatisés (TP3)

**Objectif.** Tester le contrat HTTP et les états du composant sans dépendre d’un backend ni de MongoDB.

**Ce que j’ai demandé à l’IA.** Je lui ai demandé d’ajouter les tests et de m’indiquer comment les lancer.

**Exemple de prompt :**

> « Fais la mission 7 et dis-moi ce qu’il faut vérifier et comment tester. »

**Ce que j’ai obtenu.** Avec l’aide de l’IA, j’ai mis en place Angular/Vitest et jsdom, créé `tsconfig.spec.json` et ajouté deux tests de service et cinq tests de composant. J’ai conservé les tests backend existants.

| Test frontend | Assertions principales |
|---|---|
| Pagination | Méthode GET, URL, paramètres page et limit, réponse restituée |
| Upload multipart | Méthode POST, URL, champs audio/title, progression demandée |
| Suppression | DELETE sur le bon identifiant, blocage du double appel, GET et notification après 204 |
| Annulation | Aucun DELETE, piste conservée |
| Piste absente ou inaccessible | Message après 404, liste actualisée et état libéré |
| Progression et succès | Affichage à 25 %, contrôles bloqués, attente après 100 %, succès après 201 |
| Erreur et nouvel essai | Total inconnu, erreur 400, formulaire conservé et nouvelle requête possible |

**Pourquoi les tests ne nécessitent-ils pas MongoDB ?** `HttpTestingController` intercepte les requêtes du service. Les tests fournissent les événements avec `event()` et les réponses avec `flush()`, puis vérifient les effets attendus. `http.verify()` contrôle l’absence de requêtes inattendues en attente.

Les tests du service ciblent le contrat HTTP. Ceux du composant combinent le template, les Signals et le service avec un transport simulé. Ils ne constituent pas une vérification de bout en bout de l’API et de MongoDB. Les tests d’intercepteur et de guard font partie des choix proposés dans le sujet, mais n’ont pas été ajoutés : les sept tests retenus couvrent plus de trois scénarios parmi les options demandées.

**Difficulté rencontrée.** Lors du premier lancement avec l’assistant, le double de SnackBar n’était pas correctement utilisé. J’ai fait corriger sa configuration avec `TestBed.overrideProvider` pour remplacer le provider importé par Material. Après correction, les tests passent.

**Comment j’ai vérifié.** J’ai lancé `npm test` dans le frontend et le backend, puis `npm run build` dans le frontend. J’ai obtenu les résultats suivants et les ai partagés avec l’assistant :

| Commande | Résultat |
|---|---|
| Frontend : `npm test` | 7 tests réussis sur 7, dans 2 fichiers ; durée 1,21 s |
| Backend : `npm test` | 2 tests existants réussis sur 2 ; durée 452 ms |
| Frontend : `npm run build` | Réussi ; durée 2,012 s |

Le message `[TracksPage] Envoi impossible 400` provient du scénario d’erreur simulée. Il est attendu et ne correspond pas à un échec de la suite. Le détail des résultats attendus et observés figure dans [RAPPORT_TESTS_TP3.md](RAPPORT_TESTS_TP3.md).

Pour les vérifications effectuées avec l’assistant, les commandes Angular ont utilisé Node 24.19.0. Après la correction du favicon, j’ai fait relancer le build : il réussit en 1,859 s. La sortie est `frontend-starter/dist/gpc`.

**Fichiers concernés.** `track.service.spec.ts`, `tracks-page.spec.ts`, `tsconfig.spec.json`, `tsconfig.app.json`, `angular.json`, `package.json`, `package-lock.json` et `RAPPORT_TESTS_TP3.md`.

## Vérifications finales et bilan (TP3)

Pour terminer, j’ai demandé à l’assistant de vérifier les principaux parcours dans Chromium 151 : connexion, chargement du profil via l’API, pagination aller-retour, lecture audio, nettoyage du lecteur et suppression de la piste temporaire. J’ai également fait corriger le favicon manquant, qui provoquait une requête 404, en ajoutant une icône SVG dans `frontend-starter/src/index.html`.

Je me suis appuyé sur le journal de vérification pour contrôler la console : sur ces parcours, il ne contient aucune erreur ou exception JavaScript, aucun JWT et aucun mot de passe de démonstration. Le navigateur affiche une suggestion d’autocomplétion du formulaire, sans erreur d’exécution. Les messages et résultats sont conservés dans [le journal de vérification finale](captures/tp3-verifications-finales.json).

![Console finale, tous niveaux de journalisation activés](captures/tp3-console-finale.png)

J’ai conservé les premières captures Safari, qui montrent encore les indicateurs d’erreurs liés notamment à une extension et au favicon. La capture finale de la console présente le résultat après correction. J’ai fait masquer les JWT dans les trois captures concernées et replier les en-têtes de requête dans les nouvelles preuves détaillées. Les méthodes, les statuts HTTP et les champs multipart restent lisibles.

| Livrable TP3 | Résultat |
|---|---|
| Suppression | Implémentée ; tests réussis ; DELETE 204, GET 200 et SnackBar capturés |
| Progression de l’upload | Implémentée ; progression, multipart et réponse 201 capturés |
| Tests frontend | 7 réussis sur 7 |
| Tests backend disponibles | 2 réussis sur 2 |
| Rapport des tests | Résultats attendus et observés consignés |
| Build | Réussi après la dernière correction |
| Captures Network | Suppression et upload documentés ; JWT masqués |
| Console | Aucune erreur ni donnée d’authentification journalisée sur les parcours vérifiés |

**Limites de mes vérifications.** Je n’ai pas testé manuellement la suppression depuis deux onglets ni la panne du backend pendant un upload lors du contrôle final. Les comportements associés aux réponses 404 et aux erreurs d’upload sont couverts par des tests automatisés avec réponses simulées. Les deux tests backend existants ne suffisent pas à valider toute la sécurité de l’API.
