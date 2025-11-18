"use client";

import React, { useState, useEffect } from "react";
import { Users, Package, MapPin, Box } from "lucide-react";
import BeneficiairesTab from "./beneficiaires/BeneficiairesTab";
import InventaireTab from "./inventaire/InventaireTab";
import PacksTab from "./packs/PacksTab";
import ItinerairesTab from "./itineraires/ItinerairesTab";
import { getBeneficiaires, getInventaire, getPacks } from "@/lib/firebaseAdmin";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("beneficiaires");
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [inventaire, setInventaire] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const chargerDonnees = async () => {
      setLoading(true);
      try {
        const [dataBeneficiaires, dataInventaire, dataPacks] =
          await Promise.all([getBeneficiaires(), getInventaire(), getPacks()]);

        setBeneficiaires(dataBeneficiaires);
        setInventaire(dataInventaire);
        setPacks(dataPacks);
      } catch (error) {
        console.error("Erreur chargement données:", error);
      } finally {
        setLoading(false);
      }
    };

    chargerDonnees();
  }, []);

  const tabs = [
    { id: "beneficiaires", label: "Bénéficiaires", icon: Users },
    { id: "inventaire", label: "Inventaire", icon: Box },
    { id: "packs", label: "Packs", icon: Package },
    { id: "itineraires", label: "Itinéraires", icon: MapPin },
  ];

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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  Administrateur
                </p>
                <p className="text-xs text-gray-500">admin@mosquee.fr</p>
              </div>
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
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
            beneficiaires={beneficiaires} // ✅ AJOUTE CETTE LIGNE
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
        {activeTab === "itineraires" && <ItinerairesTab />}
      </div>
    </div>
  );
}
