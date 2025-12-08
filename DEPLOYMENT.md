# Déploiement Builbox - Guide Complet

Ce guide vous accompagne pas à pas pour déployer Builbox en production sur Vercel avec Supabase.

## ⚡ Quick Start (5 minutes)

Si vous voulez juste tester rapidement :

```bash
# 1. Clone et install
git clone <repo> && cd builbox && npm install

# 2. Créez .env.local avec vos clés
cp .env.example .env.local
# Remplissez SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY

# 3. Setup Supabase DB
# Copiez-collez supabase/schema.sql dans Supabase SQL Editor

# 4. Run
npm run dev
```

## 🔧 Configuration Complète

### 1. Supabase Setup (10 min)

#### Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. **Important**: Choisissez une région EU (Paris `eu-west-3` ou Frankfurt `eu-central-1`) pour RGPD
4. Notez votre Database Password

#### Récupérer les clés

Dans Project Settings > API :
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (secret!)

#### Exécuter le schema

1. Allez dans SQL Editor
2. Nouvelle requête
3. Copiez tout le contenu de `supabase/schema.sql`
4. Exécutez (ça prend ~10 secondes)
5. Vérifiez que les tables apparaissent dans Table Editor

#### Configurer Storage

1. Storage > Create bucket
2. Nom: `documents`
3. Public bucket: ✅ (pour que les PDFs soient accessibles)
4. Policies:
   ```sql
   -- SELECT policy (public read)
   CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

   -- INSERT policy (authenticated only)
   CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

   -- DELETE policy (users can delete their own)
   CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

#### Configurer Auth

1. Authentication > Providers
2. Email : ✅ Activé
3. Email confirmation : ❌ Désactivé (pour dev) ou ✅ Activé (prod recommandé)
4. Google OAuth (optionnel mais recommandé) :
   - Allez sur [Google Cloud Console](https://console.cloud.google.com)
   - Créez un projet "Builbox"
   - APIs & Services > Credentials > Create OAuth Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copiez Client ID et Client Secret dans Supabase Auth > Google

### 2. OpenAI Setup (2 min)

1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez une API key
3. **Important**: Ajoutez des crédits (minimum 5€ recommandé)
4. Copiez la clé dans `OPENAI_API_KEY`

### 3. Stripe Setup (15 min)

#### Créer un compte Stripe

1. [stripe.com](https://stripe.com) → Créer un compte
2. **Activez le mode Test** pour commencer
3. Settings > Business details → Remplissez (France, EUR)

#### Créer le produit Pro

1. Products > Add product
2. Name: "Builbox Pro"
3. Description: "Abonnement Pro - Messages illimités"
4. Pricing: Recurring, 19€/mois
5. Sauvegardez
6. Copiez le **Price ID** (commence par `price_...`)
7. Collez dans `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

#### Récupérer les clés

1. Developers > API keys
2. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Publishable key
3. `STRIPE_SECRET_KEY` = Secret key

#### Configurer le webhook (APRÈS déploiement Vercel)

On configurera ça après car on a besoin de l'URL de prod.

### 4. Déploiement Vercel (5 min)

#### Push sur GitHub

```bash
git init
git add .
git commit -m "Initial commit - Builbox MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/builbox.git
git push -u origin main
```

#### Importer sur Vercel

1. [vercel.com](https://vercel.com) → New Project
2. Import Git Repository → Sélectionnez votre repo
3. Framework Preset: Next.js (auto-détecté)
4. Root Directory: `./`
5. **Environment Variables** → Ajoutez toutes vos variables :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_SECRET_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
FREE_TIER_MESSAGE_LIMIT=100
```

6. Deploy ! (ça prend ~2 minutes)

#### Configurer le domaine (optionnel)

1. Project Settings > Domains
2. Ajoutez votre domaine custom (ex: `builbox.fr`)
3. Suivez les instructions DNS
4. Mettez à jour `NEXT_PUBLIC_APP_URL` avec le nouveau domaine

### 5. Finaliser Stripe Webhook

Maintenant qu'on a l'URL de prod :

1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Description: "Builbox Subscription Events"
5. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
6. Add endpoint
7. Copiez le **Signing secret** (commence par `whsec_...`)
8. Vercel > Settings > Environment Variables
9. Ajoutez `STRIPE_WEBHOOK_SECRET` = votre signing secret
10. Redéployez (Deployments > ... > Redeploy)

### 6. Tests Post-Déploiement

#### Test 1 : Inscription

1. Allez sur `https://your-domain.vercel.app`
2. Sign up avec un email test
3. Vérifiez que vous êtes redirigé vers `/dashboard`
4. Vérifiez dans Supabase > Table Editor > `profiles` que l'utilisateur existe

#### Test 2 : Créer un agent

1. Dashboard > Créer un agent
2. Nom: "Test Support"
3. Description: "Agent de test"
4. Vérifiez dans `agents` table

#### Test 3 : Entraîner

1. Ajoutez un texte simple :
   ```
   Nos heures d'ouverture sont du lundi au vendredi de 9h à 18h.
   Nous sommes fermés le weekend.
   Pour nous contacter : contact@exemple.fr
   ```
2. Attendez 30 secondes
3. Vérifiez que `training_status` = "completed"
4. Vérifiez dans `embeddings` table qu'il y a des embeddings

#### Test 4 : Chat

1. Playground
2. "Quelles sont vos heures d'ouverture ?"
3. Devrait répondre avec les bonnes infos + score de confiance

#### Test 5 : Widget

1. Copiez le code embed
2. Créez un fichier `test.html` :
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Test Widget</h1>
     <script>
       (function() {
         var script = document.createElement('script');
         script.src = 'https://your-domain.vercel.app/widget.js';
         script.setAttribute('data-agent-id', 'YOUR_AGENT_ID');
         document.body.appendChild(script);
       })();
     </script>
   </body>
   </html>
   ```
3. Ouvrez dans un navigateur
4. Testez le chat

#### Test 6 : Stripe (Test Mode)

1. Dashboard > Billing > Passer à Pro
2. Utilisez une carte test Stripe : `4242 4242 4242 4242`
3. Date: n'importe quelle date future
4. CVC: 123
5. Vérifiez que vous êtes redirigé vers `/dashboard/billing?success=true`
6. Vérifiez que `subscription_tier` = "pro" dans `profiles`

### 7. Passer en Production

Quand vous êtes prêt :

#### Stripe Production

1. Stripe Dashboard > Passez en mode Live
2. Créez le même produit Pro en mode Live
3. Mettez à jour les clés dans Vercel (remplacez `_test_` par les clés live)
4. Recréez le webhook avec les mêmes events
5. Redéployez

#### OpenAI Production

1. Vérifiez que vous avez des crédits
2. Configurez des limites de rate (Recommended: 10 req/min)

#### Monitoring

1. Vercel > Analytics → Activez (gratuit)
2. Supabase > Database > Performance Insights
3. OpenAI > Usage → Suivez vos coûts

## 🔐 Sécurité Checklist

Avant de lancer en prod :

- [ ] Variables d'environnement en Vercel (pas dans le code)
- [ ] Supabase RLS policies activées
- [ ] Stripe webhook signature vérifiée
- [ ] Rate limiting configuré
- [ ] OpenAI rate limits configurés
- [ ] CORS configuré pour le widget
- [ ] HTTPS activé (automatique avec Vercel)
- [ ] Logs configurés (Vercel Logs)

## 🐛 Troubleshooting

### "Agent non entraîné" après upload

- Vérifiez les logs Vercel pour `/api/train`
- Vérifiez que OpenAI API key est valide
- Vérifiez les crédits OpenAI

### Widget ne s'affiche pas

- Ouvrez la console navigateur
- Vérifiez les erreurs CORS
- Vérifiez que l'agent ID est correct
- Vérifiez que le script est bien chargé (Network tab)

### Stripe webhook ne marche pas

- Stripe Dashboard > Webhooks > Testez l'endpoint
- Vérifiez les logs Vercel
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Testez avec Stripe CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Embeddings échouent

- Vérifiez OpenAI quota
- Vérifiez que pgvector est activé : `CREATE EXTENSION vector;`
- Vérifiez la dimension (3072 pour text-embedding-3-large)

## 📊 Monitoring & Costs

### Supabase (Free tier)
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth/month
- ⚠️ Upgrade si vous dépassez

### OpenAI Costs
- Embeddings: ~$0.00013 / 1K tokens
- GPT-4o: ~$0.005 / 1K tokens input, ~$0.015 / 1K tokens output
- **Estimation**: 1000 messages/mois ≈ $5-10

### Vercel (Free tier)
- ✅ 100 GB bandwidth
- ✅ Serverless functions
- ✅ Analytics

### Total coût mensuel estimé (petite échelle)
- Supabase: $0 (free tier)
- OpenAI: $10-50 (selon usage)
- Vercel: $0 (free tier)
- Stripe: Gratuit + 1.5% + 0.25€ par transaction

## 🚀 Next Steps

Une fois déployé :

1. Testez complètement
2. Ajoutez du contenu sur la landing page
3. Configurez Google Analytics
4. Configurez Sentry pour error tracking
5. Ajoutez votre logo
6. Lancez ! 🎉

---

Questions ? Ouvrez une issue GitHub !
