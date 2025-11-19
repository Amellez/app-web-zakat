'use client';
import React, { useState } from 'react';
import { Users, Navigation, Clock, Trash2, UserPlus, CheckCircle } from 'lucide-react';
import ModalAssignerBenevole from './ModalAssignerBenevole';
import { supprimerItineraire, updateStatutItineraire } from '@/lib/itinerairesService';

export default function ItineraireCard({ itineraire, onUpdate }) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSupprimer = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'itinéraire "${itineraire.nom}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      const beneficiairesIds = itineraire.beneficiaires.map(b => b.id);
      await supprimerItineraire(itineraire.id, beneficiairesIds);
      onUpdate();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleMarquerTermine = async () => {
    try {
      setLoading(true);
      await updateStatutItineraire(itineraire.id, 'Terminé');
      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Non assigné': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Assigné': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Terminé': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const stats = itineraire.statistiques || {};

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">{itineraire.nom}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatutColor(itineraire.statut)}`}>
              {itineraire.statut}
            </span>
          </div>

          {itineraire.benevole && (
            <p className="text-sm text-emerald-100">
              👤 {itineraire.benevole.nom}
            </p>
          )}
        </div>

        {/* Statistiques */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Bénéficiaires</p>
              <p className="text-lg font-bold text-gray-800">{stats.nombreBeneficiaires || 0}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Navigation className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Distance</p>
              <p className="text-lg font-bold text-gray-800">{stats.distanceTotale || 0} km</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Temps</p>
              <p className="text-lg font-bold text-gray-800">{stats.tempsEstime || 0} min</p>
            </div>
          </div>

          {/* Liste des bénéficiaires (aperçu) */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Bénéficiaires:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {itineraire.beneficiaires?.slice(0, 5).map((benef, idx) => (
                <div key={benef.id} className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="bg-emerald-100 text-emerald-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className="truncate">{benef.nom}</span>
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
            {itineraire.statut === 'Non assigné' && (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                Assigner un bénévole
              </button>
            )}

            {itineraire.statut === 'Assigné' && (
              <button
                onClick={handleMarquerTermine}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Marquer comme terminé
              </button>
            )}

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

      {/* Modal d'assignation */}
      <ModalAssignerBenevole
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        itineraire={itineraire}
        onSuccess={onUpdate}
      />
    </>
  );
}
