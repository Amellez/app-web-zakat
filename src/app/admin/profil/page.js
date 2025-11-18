'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function ProfilPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('informations');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et vos préférences</p>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* En-tête du profil */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-4 border-white/30">
                <span className="text-4xl font-bold text-white">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Administrateur</h2>
                <p className="text-emerald-100">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                    Compte actif
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('informations')}
                className={`py-4 border-b-2 font-medium transition-all ${
                  activeTab === 'informations'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('securite')}
                className={`py-4 border-b-2 font-medium transition-all ${
                  activeTab === 'securite'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sécurité
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 border-b-2 font-medium transition-all ${
                  activeTab === 'notifications'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Notifications
              </button>
            </div>
          </div>

          {/* Contenu des tabs */}
          <div className="p-8">
            {activeTab === 'informations' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Votre adresse email ne peut pas être modifiée
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de création du compte
                  </label>
                  <input
                    type="text"
                    value={user?.metadata?.creationTime || 'Non disponible'}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dernière connexion
                  </label>
                  <input
                    type="text"
                    value={user?.metadata?.lastSignInTime || 'Non disponible'}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
              </div>
            )}

            {activeTab === 'securite' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-amber-900">Changement de mot de passe</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Pour des raisons de sécurité, le changement de mot de passe doit être effectué via Firebase Console.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Authentification à deux facteurs</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">2FA</p>
                      <p className="text-sm text-gray-600">Non configuré</p>
                    </div>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
                      Activer
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Sessions actives</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Session actuelle</p>
                          <p className="text-sm text-gray-600">Villejuif, France • Maintenant</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Actif
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Préférences de notification</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Nouveaux bénéficiaires</p>
                      <p className="text-sm text-gray-600">Recevoir une notification pour chaque nouveau bénéficiaire</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Mises à jour système</p>
                      <p className="text-sm text-gray-600">Être informé des mises à jour et maintenances</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Rapports hebdomadaires</p>
                      <p className="text-sm text-gray-600">Recevoir un résumé hebdomadaire des activités</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Bénéficiaires</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Distributions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Dernière connexion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="mt-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-all"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-gray-700 font-medium">Retour au dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}