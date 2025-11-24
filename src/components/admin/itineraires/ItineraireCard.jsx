'use client';
import React, { useState } from 'react';
import { Users, Navigation, Clock, Trash2, Copy, CheckCircle, QrCode, MapPin } from 'lucide-react';
import { supprimerItineraire } from '@/lib/itinerairesService';

export default function ItineraireCard({ itineraire, onUpdate, mosqueeId }) {
  const [loading, setLoading] = useState(false);
  const [codeCopie, setCodeCopie] = useState(false);

  const handleSupprimer = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'itinéraire "${itineraire.nom}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      const beneficiairesIds = itineraire.beneficiaires.map(b => b.id);
      await supprimerItineraire(itineraire.id, beneficiairesIds, mosqueeId);
      onUpdate();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleCopierCode = () => {
    if (!itineraire.codeUnique) {
      alert('Code unique non disponible');
      return;
    }
    navigator.clipboard.writeText(itineraire.codeUnique);
    setCodeCopie(true);
    setTimeout(() => setCodeCopie(false), 2000);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Non assigné': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'En cours': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Terminé': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const stats = itineraire.statistiques || {};

  // Calculer les livraisons effectuées
  const livraisonsEffectuees = itineraire.beneficiaires?.filter(b => b.statutLivraison === 'Livré').length || 0;
  const totalBeneficiaires = itineraire.beneficiaires?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{itineraire.nom}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatutColor(itineraire.statut)}`}>
            {itineraire.statut}
          </span>
        </div>
      </div>

      {/* Code unique */}
      {itineraire.codeUnique && (
        <div className="bg-emerald-50 border-b-2 border-emerald-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-700" />
              <div>
                <p className="text-xs text-emerald-600 font-medium">Code d'accès bénévole</p>
                <p className="text-2xl font-mono font-bold text-emerald-800 tracking-wider">
                  {itineraire.codeUnique}
                </p>
              </div>
            </div>
            <button
              onClick={handleCopierCode}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
            >
              {codeCopie ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Bénéficiaires</p>
            <p className="text-lg font-bold text-gray-800">{totalBeneficiaires}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Temps</p>
            <p className="text-lg font-bold text-gray-800">{stats.tempsEstime || 0} min</p>
          </div>

          <div className="bg-emerald-50 rounded-lg p-3 text-center border-2 border-emerald-200">
            <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-emerald-600 font-semibold">Depuis mosquée</p>
            <p className="text-lg font-bold text-emerald-800">{stats.distanceDepuisMosquee || 0} m</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Navigation className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Distance parcours</p>
            <p className="text-lg font-bold text-gray-800">{stats.distanceTotale || 0} m</p>
          </div>
        </div>

        {/* Progression des livraisons */}
        {livraisonsEffectuees > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-800">Progression des livraisons</p>
              <p className="text-sm font-bold text-blue-800">
                {livraisonsEffectuees}/{totalBeneficiaires}
              </p>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(livraisonsEffectuees / totalBeneficiaires) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Liste des bénéficiaires (aperçu) */}
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Bénéficiaires:</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {itineraire.beneficiaires?.slice(0, 5).map((benef, idx) => (
              <div key={benef.id} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="bg-emerald-100 text-emerald-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span className="truncate flex-1">{benef.nom}</span>
                {benef.statutLivraison === 'Livré' && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            ))}
            {itineraire.beneficiaires?.length > 5 && (
              <p className="text-xs text-gray-500 italic ml-7">
                +{itineraire.beneficiaires.length - 5} autres...
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-3 space-y-2">
          <button
            onClick={handleSupprimer}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition font-semibold disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
