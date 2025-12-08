import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Zap, Shield, Euro, Check } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Builbox</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Créer un compte</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Créez votre Agent IA<br />en moins de 5 minutes
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Plateforme française no-code pour créer des chatbots IA autonomes.
          RGPD compliant, hébergé en EU. Plus simple et moins cher que Chatbase.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Commencer gratuitement
          </Button>
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          Pas de carte bancaire requise • 100 messages gratuits/mois
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Configuration rapide</CardTitle>
              <CardDescription>
                Uploadez vos docs PDF/URL → Entraînement en 30s → Intégration en 2 clics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>RGPD Conforme</CardTitle>
              <CardDescription>
                Données hébergées en EU (France/Allemagne). Bannière de consentement incluse.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>IA Française</CardTitle>
              <CardDescription>
                Réponses 100% en français avec GPT-4o. Détection automatique de confiance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Euro className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Prix imbattable</CardTitle>
              <CardDescription>
                Gratuit jusqu'à 100 msgs/mois. Pro à 19€/mois sans branding.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Tarification simple</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Gratuit</CardTitle>
              <div className="text-4xl font-bold">0€<span className="text-lg font-normal text-gray-500">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>100 messages/mois</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>1 agent IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Entraînement sur docs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Widget intégrable</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block mt-6">
                <Button className="w-full" variant="outline">Commencer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-600">
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-4xl font-bold">19€<span className="text-lg font-normal text-gray-500">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span><strong>Messages illimités</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Agents illimités</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Sans logo Builbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>AI Actions (Calendly, Zapier)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Analytics avancées</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block mt-6">
                <Button className="w-full">Passer à Pro</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Builbox</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 Builbox. Hébergé en France. RGPD compliant.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
