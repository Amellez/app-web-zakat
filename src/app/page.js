'use client';

import { useRouter } from 'next/navigation';
import { Building, Users, LogIn, Gift } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100">
      
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🕌 Zakat al-Fitr
              </h1>
              <p className="text-sm text-gray-600">Gestion de la Distribution</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
          >
            <LogIn className="w-5 h-5" />
            Connexion Admin
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-block bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full text-sm font-bold mb-6">
            Assalamu Alaikum
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-gray-800 mb-6">
            Plateforme de Gestion<br />de la Zakat al-Fitr
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Système complet pour gérer la collecte, l'attribution et la distribution des denrées alimentaires de la Zakat al-Fitr
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Card Bénéficiaires */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition border-2 border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Vous êtes Bénéficiaire ?
            </h3>
            <p className="text-gray-600 mb-6">
              Inscrivez-vous pour recevoir votre colis alimentaire de la Zakat al-Fitr auprès de votre mosquée
            </p>
            <button
              onClick={() => router.push('/inscription')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              S'inscrire comme Bénéficiaire
            </button>
          </div>

          {/* Card Administration */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition border-2 border-gray-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <Building className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Vous êtes Administrateur ?
            </h3>
            <p className="text-gray-600 mb-6">
              Accédez à votre espace d'administration pour gérer les bénéficiaires, l'inventaire et les distributions
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Accéder à l'Administration
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            ✨ Fonctionnalités de la Plateforme
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="font-bold text-gray-800 mb-2">Inscription en Ligne</h4>
              <p className="text-sm text-gray-600">
                Les bénéficiaires s'inscrivent facilement via un formulaire
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📦</div>
              <h4 className="font-bold text-gray-800 mb-2">Gestion d'Inventaire</h4>
              <p className="text-sm text-gray-600">
                Suivi complet des denrées alimentaires disponibles
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🚚</div>
              <h4 className="font-bold text-gray-800 mb-2">Distribution Optimisée</h4>
              <p className="text-sm text-gray-600">
                Calcul automatique et optimisation des itinéraires
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 - Plateforme de Gestion Zakat al-Fitr
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Développé pour faciliter la distribution aux nécessiteux
          </p>
        </div>
      </div>
    </div>
  );
}