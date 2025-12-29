// src/components/admin/AdminDashboard.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Users, Package, MapPin, Box } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useMosquee } from '@/context/MosqueeContext';
import { useRouter } from 'next/navigation';
import BeneficiairesTab from "./beneficiaires/BeneficiairesTab";
import InventaireTab from "./inventaire/InventaireTab";
import PacksTab from "./packs/PacksTab";
import ItinerairesTabAvecVues from "./itineraires/ItinerairesTabAvecVues";
import MosqueeSelector from "./ui/MosqueeSelector";
import { getBeneficiaires, getInventaire, getPacks } from "@/lib/firebaseAdmin";

// Composant Menu Profil
function ProfileMenu() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-all"
      >
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">
            {userData?.nom || 'Administrateur'}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          {userData?.role && (
            <p className="text-xs text-emerald-600 font-medium">
              {userData.role === 'super_admin' ? 'Super Admin' :
               userData.role === 'admin_mosquee' ? 'Admin Mosquée' :
               'Bénévole'}
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
          {user?.email?.[0].toUpperCase()}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            showMenu ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {showMenu && (
        <>
          {/* Overlay pour fermer le menu en cliquant ailleurs */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
              <p className="text-sm font-medium text-gray-900">Connecté en tant que</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              {userData?.role && (
                <span className="inline-block mt-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                  {userData.role === 'super_admin' ? 'Super Admin' :
                   userData.role === 'admin_mosquee' ? 'Admin Mosquée' :
                   'Bénévole'}
                </span>
              )}
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  router.push('/admin/profil');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Mon profil</span>
              </button>

              <button
                onClick={() => {
                  router.push('/admin/parametres');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Paramètres</span>
              </button>

              {/* Afficher "Gérer les Mosquées" seulement pour super_admin */}
              {userData?.role === 'super_admin' && (
                <button
                  onClick={() => {
                    router.push('/super-admin/mosquees');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all text-left"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">🕌 Gérer les Mosquées</span>
                </button>
              )}
            </div>

            <div className="p-2 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-all text-left group"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { mosqueeActive, loading: mosqueeLoading } = useMosquee();
  const [activeTab, setActiveTab] = useState("beneficiaires");
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [inventaire, setInventaire] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chargement initial des données quand mosqueeActive change
  useEffect(() => {
    if (mosqueeActive && !mosqueeLoading) {
      chargerDonnees();
    }
  }, [mosqueeActive, mosqueeLoading]);

  const chargerDonnees = async () => {
    if (!mosqueeActive) {
      console.warn('⚠️ Aucune mosquée active');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Passer mosqueeActive aux fonctions de chargement
      const [dataBeneficiaires, dataInventaire, dataPacks] =
        await Promise.all([
          getBeneficiaires(mosqueeActive),
          getInventaire(mosqueeActive),
          getPacks(mosqueeActive)
        ]);

      setBeneficiaires(dataBeneficiaires);
      setInventaire(dataInventaire);
      setPacks(dataPacks);

      console.log('✅ Données chargées:', {
        mosqueeId: mosqueeActive,
        beneficiaires: dataBeneficiaires.length,
        inventaire: dataInventaire.length,
        packs: dataPacks.length
      });
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "beneficiaires", label: "Bénéficiaires", icon: Users },
    { id: "inventaire", label: "Inventaire", icon: Box },
    { id: "packs", label: "Packs", icon: Package },
    { id: "itineraires", label: "Itinéraires", icon: MapPin },
  ];

  // Afficher un loader pendant le chargement de la mosquée
  if (mosqueeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher un message si aucune mosquée active
  if (!mosqueeActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Aucune mosquée sélectionnée
          </h2>
          <p className="text-gray-600">
            Veuillez sélectionner une mosquée pour continuer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-emerald-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-800">
                Admin - Zakat al-Fitr
              </h1>
              <p className="text-sm text-gray-600">
                Système de gestion complet
              </p>
            </div>

            {/* Sélecteur de mosquée + Menu utilisateur */}
            <div className="flex items-center gap-4">
              <MosqueeSelector />
              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-4 transition ${
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                      : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "beneficiaires" && (
              <BeneficiairesTab
                beneficiaires={beneficiaires}
                setBeneficiaires={setBeneficiaires}
              />
            )}
            {activeTab === "inventaire" && (
              <InventaireTab
                inventaire={inventaire}
                setInventaire={setInventaire}
                beneficiaires={beneficiaires}
              />
            )}
            {activeTab === "packs" && (
              <PacksTab
                packs={packs}
                setPacks={setPacks}
                inventaire={inventaire}
                beneficiaires={beneficiaires}
              />
            )}
            {activeTab === "itineraires" && (
              <ItinerairesTabAvecVues beneficiaires={beneficiaires} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
