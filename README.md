# Serveur Gen — le cerveau (+ le site web)

Ce serveur fait deux choses en un seul déploiement :
1. **Il sert le site web de Gen** (dossier `public/`) — accessible directement
   depuis un navigateur, sur ordinateur ou mobile.
2. **Il reçoit les messages** (du site web), ajoute la personnalité de Gen
   (mode normal / maths / philosophie), appelle l'API Gemini (gratuite), et
   renvoie la réponse.

C'est ici — et seulement ici — que ta clé API est stockée. Elle ne doit
**jamais** se trouver dans le code du site ni de l'app Android.

## 1. Tester en local

```bash
cd gen-server
npm install
cp .env.example .env
# ouvre .env et colle ta vraie clé API Gemini (GEMINI_API_KEY)
# choisis aussi un GEN_APP_SECRET (une longue chaîne aléatoire)
npm start
```

Le serveur écoute sur `http://localhost:3000`. Teste avec :

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "x-gen-secret: TA_VALEUR_DE_GEN_APP_SECRET" \
  -d '{"messages":[{"text":"Bonjour Gen","user":true}],"mode":"default"}'
```

## 2. Obtenir une clé API Gemini gratuite (si tu n'en as pas)

1. Va sur https://aistudio.google.com/
2. Connecte-toi avec un compte Google, clique "Get API key" puis "Create API key".
3. Aucune carte bancaire n'est demandée pour le niveau gratuit.

## 3. Déployer le serveur pour que ton téléphone puisse l'atteindre

Ton téléphone ne peut pas appeler `localhost` de ton ordinateur. Il te faut un
serveur accessible sur internet. Options simples et gratuites pour démarrer :

- **Render.com** (recommandé pour débuter) : crée un compte, "New Web Service",
  connecte ton dépôt Git, build command `npm install`,
  start command `npm start`. Ajoute tes variables d'environnement
  (`GEMINI_API_KEY`, `GEN_APP_SECRET`) dans l'onglet "Environment".
- **Railway.app** : principe similaire, très simple aussi.

Une fois déployé, tu obtiens une URL du style
`https://gen-server-xxxx.onrender.com`. C'est cette URL qui te sert à accéder
à ton site depuis n'importe où.

## Utiliser le site web

Ouvre simplement l'URL de ton serveur déployé (`https://gen-server-xxxx.onrender.com`)
dans un navigateur — sur ton téléphone comme sur ton ordinateur. La première
fois, il te demande un "code d'accès" : entre la même valeur que ton
`GEN_APP_SECRET`. Ça évite que des inconnus tombant sur ton URL publique
utilisent ton budget API. Ce n'est pas une sécurité de niveau bancaire, juste
un filtre simple — largement suffisant pour un usage personnel.

## 4. Sécurité — ce qu'il ne faut jamais faire

- Ne mets jamais `GEMINI_API_KEY` dans le code du site (index.html, chat.html).
- Garde `GEN_APP_SECRET` uniquement dans le serveur (variables d'environnement
  Render), pas dans un dépôt Git public.
- Ne commite jamais le fichier `.env` réel dans Git — seul `.env.example` doit
  y être.
