'use client';
import React, { useState } from 'react';
import { Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClusterCard({
  cluster,
  selection,
  onToggleBeneficiaire,
  onToggleAll
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Non assigné': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Partiellement assigné': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Totalement assigné': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'Non assigné': return '⚪';
      case 'Partiellement assigné': return '🟡';
      case 'Totalement assigné': return '🟢';
      default: return '⚪';
    }
  };

  const formaterDistance = (distanceEnMetres) => {
    if (!distanceEnMetres || distanceEnMetres === 0) return '0 m';
    if (distanceEnMetres < 1000) {
      return `${Math.round(distanceEnMetres)} m`;
    } else {
      return `${(distanceEnMetres / 1000).toFixed(1)} km`;
    }
  };

  const benefsNonAssignes = cluster.beneficiaires.filter(b => !b.estAssigne);
  const tousSelectionnes = benefsNonAssignes.every(b => selection.includes(b.id)) && benefsNonAssignes.length > 0;
  const benefsAssignes = cluster.beneficiaires.filter(b => b.estAssigne).length;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg truncate pr-2">{cluster.nom}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${getStatutColor(cluster.statut)} whitespace-nowrap flex-shrink-0`}>
            <span>{getStatutIcon(cluster.statut)}</span>
          </span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Bénéficiaires</p>
            <p className="text-lg font-bold text-gray-800">{cluster.beneficiaires.length}</p>
          </div>

          <div className="bg-emerald-50 rounded-lg p-3 text-center border-2 border-emerald-200">
            <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-emerald-600 font-semibold">Depuis mosquée</p>
            <p className="text-lg font-bold text-emerald-800">
              {formaterDistance(cluster.statistiques?.distanceDepuisMosquee)}
            </p>
          </div>
        </div>

        {/* Progression si partiellement assigné */}
        {benefsAssignes > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-800">Assignés</p>
              <p className="text-sm font-bold text-blue-800">
                {benefsAssignes}/{cluster.beneficiaires.length}
              </p>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(benefsAssignes / cluster.beneficiaires.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Toggle liste des bénéficiaires */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-semibold text-gray-700"
        >
          <span>Voir les bénéficiaires ({cluster.beneficiaires.length})</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Liste des bénéficiaires (collapsible) */}
        {isExpanded && (
          <div className="space-y-2 pt-2 border-t max-h-64 overflow-y-auto">
            {cluster.beneficiaires.map((benef, idx) => (
              <div
                key={`${cluster.id}-${benef.id}`}
                className={`flex items-center gap-2 p-2 rounded-lg border transition text-sm ${
                  benef.estAssigne
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : selection.includes(benef.id)
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Checkbox ou indicateur */}
                {benef.estAssigne ? (
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">✓</span>
                  </div>
                ) : (
                  <input
                    type="checkbox"
                    checked={selection.includes(benef.id)}
                    onChange={() => onToggleBeneficiaire(benef.id)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                  />
                )}

                {/* Numéro */}
                <div className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Nom */}
                <span className="truncate flex-1 font-medium text-gray-800">
                  {benef.nom}
                </span>

                {/* Badge si assigné */}
                {benef.estAssigne && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded flex-shrink-0">
                    Assigné
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {benefsNonAssignes.length > 0 && (
          <div className="border-t pt-3">
            <button
              onClick={() => onToggleAll(cluster)}
              className="w-full px-4 py-2 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-semibold text-sm"
            >
              {tousSelectionnes ? '☐ Désélectionner tout' : '☑ Sélectionner tout'}
            </button>
          </div>
        )}

        {benefsNonAssignes.length === 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-green-800">
              ✅ Tous assignés
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
