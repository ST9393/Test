# AI Actions - Guide Complet

Les **AI Actions** permettent à vos agents d'exécuter des actions automatiques en détectant l'intention dans les messages des utilisateurs.

## 🎯 Actions Disponibles

### 1. Calendly Booking
Permet aux utilisateurs de réserver des créneaux via Calendly.

**Configuration requise :**
- URL de votre événement Calendly (ex: `https://calendly.com/username/30min`)
- API Key Calendly (optionnel, pour fonctionnalités avancées)

**Phrases détectées :**
- "prendre rendez-vous"
- "réserver un créneau"
- "planifier une réunion"
- "fixer un rendez-vous"
- "voir les disponibilités"
- "calendrier"

**Exemple de réponse :**
```
J'ai trouvé des créneaux disponibles ! Vous pouvez réserver en cliquant ici :
https://calendly.com/username/30min

Vous serez redirigé vers Calendly pour choisir l'heure qui vous convient le mieux.
```

**Setup Calendly :**
1. Allez sur [calendly.com](https://calendly.com)
2. Créez un type d'événement (ex: "Consultation 30 min")
3. Copiez l'URL de l'événement
4. Collez dans Builbox > Agent > Actions IA > Calendly

**API Key (optionnel) :**
Pour obtenir votre API key Calendly :
1. Calendly > Integrations > API & Webhooks
2. Personal Access Token > Generate New Token
3. Copiez et collez dans Builbox

---

### 2. Stripe Subscription Check
Affiche l'abonnement actuel de l'utilisateur et permet l'annulation.

**Configuration requise :**
- Utiliser le compte Stripe principal (recommandé) OU
- Clé secrète Stripe personnalisée

**Phrases détectées :**
- "mon abonnement"
- "ma souscription"
- "annuler"
- "résilier"
- "plan actuel"
- "formule"
- "facturation"

**Exemple de réponse :**
```
Votre abonnement actuel :
• Plan : Builbox Pro
• Statut : Actif ✓

Pour gérer ou annuler votre abonnement, cliquez ici :
[Lien vers Stripe Customer Portal]
```

**Setup :**
1. Par défaut, utilise le compte Stripe principal de Builbox
2. L'agent cherche l'abonnement par email de l'utilisateur
3. Si trouvé, affiche les infos et génère un lien de gestion

**Sécurité :**
- L'email de l'utilisateur doit correspondre à un customer Stripe
- Seul le propriétaire peut voir/gérer son abonnement

---

### 3. Zapier Webhook
Envoie les demandes vers Zapier pour traitement automatique.

**Configuration requise :**
- URL du webhook Zapier

**Phrases détectées :**
- "créer un ticket"
- "envoyer une demande"
- "contacter le support"
- "transmettre"
- "notifier"

**Exemple de réponse :**
```
✓ Votre demande a été transmise à notre équipe.
Nous vous répondrons dans les plus brefs délais !
```

**Données envoyées au webhook :**
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "agent_id": "uuid",
  "conversation_id": "uuid",
  "user_message": "Message complet de l'utilisateur",
  "params": {},
  "source": "builbox"
}
```

**Setup Zapier :**
1. Créez un nouveau Zap sur [zapier.com](https://zapier.com)
2. Trigger : "Webhooks by Zapier" > "Catch Hook"
3. Copiez l'URL du webhook
4. Collez dans Builbox > Agent > Actions IA > Zapier
5. Configurez vos actions (ex: créer ticket Notion, envoyer email, etc.)

**Exemples de Zaps :**
- Webhook → Créer ticket dans Notion
- Webhook → Envoyer email à support@votresite.com
- Webhook → Créer tâche Asana
- Webhook → Slack notification

---

## 🔧 Configuration dans Builbox

### Activer une action

1. Dashboard > Agents > Sélectionner un agent
2. Onglet "Actions IA"
3. Configurer chaque action (toggle + paramètres)
4. Sauvegarder

### Test

1. Allez dans Playground
2. Tapez une phrase qui déclenche l'action
3. L'agent devrait exécuter l'action et répondre

**Exemple de test Calendly :**
```
Utilisateur : "Je voudrais prendre rendez-vous"
Agent : "J'ai trouvé des créneaux disponibles ! Vous pouvez réserver..."
```

---

## 🚀 Comment ça marche ?

### 1. Détection d'intention

Quand un utilisateur envoie un message :
```typescript
const detectedIntent = detectActionIntent(message, enabledActions)
// Vérifie si le message contient des mots-clés de l'action
```

### 2. Extraction de paramètres

Si une intention est détectée :
```typescript
const params = extractActionParams(message, actionType)
// Extrait les infos utiles (date, heure, etc.)
```

### 3. Exécution de l'action

```typescript
const result = await executeAction(action, params, context)
// Exécute l'action (appel API, webhook, etc.)
```

### 4. Formatage de la réponse

```typescript
const response = formatActionResponse(actionType, result)
// Génère une réponse user-friendly
```

---

## 📊 Architecture

```
User Message
    ↓
Intent Detection (keywords matching)
    ↓
Action Matched?
    ↓ Yes
Extract Params
    ↓
Execute Action
    ├─ Calendly: Return booking URL
    ├─ Stripe: Fetch subscription + generate portal link
    └─ Zapier: POST to webhook
    ↓
Format Response
    ↓
Return to User (skip GPT-4o if action executed)
```

---

## 🔐 Sécurité

### Données sensibles

Les API keys et secrets sont stockés dans `ai_actions.config` (JSON chiffré).

**Bonnes pratiques :**
- Ne jamais exposer les clés API dans le frontend
- Utiliser des variables d'environnement en production
- Stripe : utiliser compte principal quand possible
- Zapier : utiliser des webhooks dédiés par agent

### Validation

- Email validation pour Stripe
- URL validation pour Calendly/Zapier
- Rate limiting sur les actions (100/jour par défaut)

---

## 🎨 Personnalisation

### Ajouter des mots-clés custom

Éditez `/lib/ai-actions/types.ts` :

```typescript
export const ACTION_INTENTS = {
  calendly: [
    'prendre rendez-vous',
    'réserver',
    // Ajoutez vos mots-clés ici
    'book appointment',
    'schedule meeting',
  ],
  // ...
}
```

### Créer une nouvelle action

1. Créez `/lib/ai-actions/mon-action.ts` :

```typescript
export async function executeMonAction(config, params) {
  // Votre logique ici
  return {
    success: true,
    action_type: 'mon_action',
    data: {},
    message: 'Action exécutée',
  }
}
```

2. Ajoutez dans `/lib/ai-actions/index.ts` :

```typescript
case 'mon_action':
  return await executeMonAction(action.config, params)
```

3. Ajoutez dans le schema DB :

```sql
-- action_type peut maintenant être 'mon_action'
```

4. Ajoutez le UI dans `ActionsConfig.tsx`

---

## 🐛 Debugging

### L'action ne se déclenche pas

1. Vérifiez que l'action est **activée** (toggle ON)
2. Vérifiez les **mots-clés** détectés
3. Testez dans Playground avec logs console
4. Vérifiez la config (API key, URL, etc.)

### Erreur lors de l'exécution

1. Vérifiez les logs Vercel
2. Testez l'API externe (Calendly, Stripe, Zapier) séparément
3. Vérifiez les credentials

### Webhook Zapier ne reçoit rien

1. Testez l'URL dans un outil comme Postman
2. Vérifiez que le Zap est activé
3. Regardez l'historique des Zaps

---

## 📈 Analytics

Les actions sont tracées dans `messages.metadata` :

```json
{
  "action_type": "calendly",
  "action_result": {
    "success": true,
    "data": {...}
  }
}
```

Pour analyser :
```sql
SELECT
  action_type,
  COUNT(*) as executions,
  AVG((metadata->>'success')::int) as success_rate
FROM messages
WHERE metadata->>'action_type' IS NOT NULL
GROUP BY action_type;
```

---

## 🎓 Exemples d'usage

### Cas 1 : Support client avec escalade Zapier

**Setup :**
- Calendly : Réservation de démos
- Zapier : Création de tickets pour demandes complexes

**Flow :**
1. User : "J'ai un problème avec ma facture"
2. Agent détecte → Trigger Zapier
3. Zapier crée ticket Notion
4. Support notifié par email

### Cas 2 : SaaS avec gestion d'abonnement

**Setup :**
- Stripe : Check abonnement
- Calendly : Onboarding call

**Flow :**
1. User : "Je veux annuler mon abonnement"
2. Agent détecte → Stripe action
3. Affiche plan actuel + lien portal
4. User peut gérer lui-même

---

## 🚀 Roadmap

### V1.1 (à venir)
- [ ] Conditions avancées (si X alors action Y)
- [ ] Actions multiples en séquence
- [ ] Analytics avancées des actions
- [ ] Plus d'intégrations (HubSpot, Intercom, etc.)

### V1.2
- [ ] Personnalisation des réponses par action
- [ ] A/B testing des actions
- [ ] Machine learning pour améliorer détection
- [ ] Webhooks bidirectionnels

---

## 💡 Support

Questions ? Ouvrez une issue GitHub ou contactez support@builbox.fr

---

**Créé avec ❤️ par Builbox**
