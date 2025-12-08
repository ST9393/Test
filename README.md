# Builbox - Agent IA as a Service (SaaS MVP)

**Builbox** est une plateforme française no-code pour créer des agents IA autonomes de support client. Alternative compétitive à Chatbase, avec focus sur le RGPD, simplicité d'utilisation et pricing agressif.

## 🚀 Fonctionnalités

### ✅ Core Features (MVP)
- **Authentification complète** - Email/password + Google OAuth (Supabase Auth)
- **Création d'agents IA** - En 2 clics : nom, description, message d'accueil
- **Entraînement rapide** - Upload PDF, URL ou texte → Entraînement en ~30s
- **Chat avec confiance scoring** - GPT-4o avec score de confiance 0-100%
- **Playground intégré** - Testez votre agent en temps réel
- **Widget embeddable** - Script JS simple à intégrer sur votre site
- **Analytics de base** - Conversations, messages, confiance moyenne
- **Billing Stripe** - Free tier (100 msg/mois) + Pro (19€/mois illimité)
- **RGPD compliant** - Données EU, consentement, droit à l'oubli

### 🎯 Competitive Advantages vs Chatbase
1. **Plus rapide** - Entraînement en 30s (vs 2-3 min Chatbase)
2. **Meilleur UX** - Dashboard plus simple, onboarding en 3 étapes
3. **Prix compétitif** - 19€/mois vs 29€+ chez Chatbase
4. **RGPD natif** - Hébergement EU, bannière de consentement
5. **Français first** - Interface 100% française

## 🛠 Stack Technique

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4o + text-embedding-3-large
- **Auth**: Supabase Auth
- **Payments**: Stripe (EUR)
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## 📦 Installation

### Prérequis

- Node.js 18+
- Compte Supabase (région EU recommandée : Paris ou Frankfurt)
- Compte OpenAI avec API key
- Compte Stripe

### 1. Clone et installation

```bash
git clone <repo-url>
cd builbox
npm install
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine :

```bash
# Supabase (EU Region - Paris ou Frankfurt pour RGPD)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe (EUR currency)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your-price-id

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Rate Limiting (messages per month)
FREE_TIER_MESSAGE_LIMIT=100
```

### 3. Configuration Supabase

#### A. Créer la base de données

1. Allez dans votre projet Supabase
2. Allez dans SQL Editor
3. Copiez-collez le contenu de `supabase/schema.sql`
4. Exécutez le script

#### B. Activer pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### C. Configurer Storage

1. Allez dans Storage
2. Créez un bucket nommé `documents`
3. Configurez les permissions :
   - SELECT: public (pour lire les documents uploadés)
   - INSERT: authenticated
   - UPDATE: authenticated
   - DELETE: authenticated

#### D. Configurer Auth

1. Allez dans Authentication > Providers
2. Activez "Email" provider
3. Activez "Google" provider (optionnel) :
   - Client ID et Secret depuis Google Cloud Console
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Configuration Stripe

#### A. Créer un produit Pro

1. Allez dans Stripe Dashboard > Products
2. Créez un nouveau produit "Builbox Pro"
3. Prix : 19€/mois récurrent
4. Copiez le Price ID dans `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

#### B. Configurer le webhook

1. Stripe Dashboard > Developers > Webhooks
2. Ajoutez un endpoint : `https://your-domain.com/api/stripe/webhook`
3. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copiez le signing secret dans `STRIPE_WEBHOOK_SECRET`

### 5. Lancer en développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 🚢 Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Importez votre repo GitHub
3. Configurez les variables d'environnement (copier depuis `.env.local`)
4. Deploy !

### 3. Configuration post-déploiement

#### A. Mise à jour de l'URL Stripe webhook

1. Stripe Dashboard > Webhooks
2. Mettez à jour l'URL : `https://your-domain.vercel.app/api/stripe/webhook`

#### B. Mise à jour de NEXT_PUBLIC_APP_URL

Dans Vercel Settings > Environment Variables :
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### C. Configuration OAuth Google (si activé)

Google Cloud Console > Credentials :
- Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

## 📖 Guide d'utilisation

### Pour les utilisateurs

1. **Inscription** - Créez un compte gratuit (pas de CB requise)
2. **Créer un agent** - Donnez-lui un nom et une description
3. **Entraîner** - Uploadez vos docs (PDF, URL ou texte)
4. **Tester** - Utilisez le playground pour tester
5. **Intégrer** - Copiez le code widget sur votre site

### Widget Integration

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-agent-id', 'YOUR_AGENT_ID');
    document.body.appendChild(script);
  })();
</script>
```

## 🏗 Architecture

### Training Pipeline

1. **Upload** - PDF/URL/Text → Supabase Storage
2. **Parse** - Extraction du texte (pdf-parse pour PDF)
3. **Chunk** - Découpage en morceaux de ~512 tokens
4. **Embed** - Génération d'embeddings (text-embedding-3-large)
5. **Store** - Stockage dans pgvector

### Chat Flow

1. **User Message** - Envoyé à `/api/chat`
2. **Embed Query** - Embedding de la question
3. **Retrieve** - Top-5 chunks similaires (cosine similarity)
4. **Generate** - GPT-4o avec contexte
5. **Confidence** - Calcul du score de confiance
6. **Store** - Sauvegarde de la conversation

### Confidence Scoring

- **>70%** - Réponse fiable (vert)
- **50-70%** - Réponse incertaine (jaune)
- **<50%** - Transfert suggéré vers humain (rouge)

## 🔒 RGPD Compliance

### Données stockées en EU
- Supabase région EU (Paris/Frankfurt)
- Hébergement Vercel région EU

### Consentement
- Checkbox RGPD à l'inscription
- Enregistré dans `profiles.rgpd_consent`

### Droit à l'oubli
- Bouton "Supprimer mon compte" dans Settings
- Suppression complète de toutes les données
- Cascading deletes dans la DB

## 📊 Database Schema

```sql
profiles          → User data + subscription
agents            → AI agents
documents         → Training documents
embeddings        → Vector embeddings (pgvector)
conversations     → Chat sessions
messages          → Chat messages
ai_actions        → AI automation configs
analytics         → Daily aggregates
```

## 🎨 Customization

### Widget Colors

```html
<script>
  script.setAttribute('data-primary-color', '#FF6B6B');
</script>
```

### Agent Settings

- Message d'accueil personnalisable
- Logo (à venir)
- Couleurs primaire/secondaire (à venir)

## 🐛 Debugging

### Erreur "Agent non entraîné"
- Vérifiez que des documents ont été ajoutés
- Vérifiez les logs d'entraînement dans `/api/train`

### Erreur "Limite de messages atteinte"
- Free tier limité à 100 messages/mois
- Passer à Pro pour illimité

### Widget ne s'affiche pas
- Vérifiez l'agent ID
- Vérifiez la console pour erreurs CORS
- Vérifiez que `widget_enabled = true`

## 📈 Roadmap

### V1.1 (à venir)
- [ ] AI Actions avancées (Calendly, Zapier, Stripe)
- [ ] Personnalisation widget (logo, couleurs, ton)
- [ ] Transfert vers email/Slack
- [ ] Multi-langue (EN, ES, DE)

### V1.2
- [ ] Analytics avancées (graphiques, exports)
- [ ] Intégration Notion/Google Drive
- [ ] Voice chat (Speech-to-Text)
- [ ] Mobile app

## 🤝 Support

Pour toute question ou bug :
- GitHub Issues
- Email : support@builbox.fr (à configurer)

## 📄 License

MIT License - Voir LICENSE file

---

**Builbox** - Créé avec ❤️ en France 🇫🇷
