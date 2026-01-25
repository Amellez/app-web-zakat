'use client';
import React from 'react';
import { Users, MapPin, ExternalLink } from 'lucide-react';

export default function ClusterCard({
  cluster,
  selection,
  onOpenCluster
}) {
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

  const benefsAssignes = cluster.beneficiaires.filter(b => b.estAssigne).length;
  const selectionDansCeCluster = cluster.beneficiaires.filter(b => selection.includes(b.id)).length;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{cluster.nom}</h3>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/30 whitespace-nowrap flex-shrink-0">
              {cluster.beneficiaires.length} bénéf.
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${getStatutColor(cluster.statut)} whitespace-nowrap flex-shrink-0 ml-2`}>
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

        {/* Indicateur de sélection */}
        {selectionDansCeCluster > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-emerald-800">
              ✓ {selectionDansCeCluster} sélectionné{selectionDansCeCluster > 1 ? 's' : ''} dans ce cluster
            </p>
          </div>
        )}

        {/* Bouton ouvrir */}
        <button
          onClick={() => onOpenCluster(cluster)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
        >
          <ExternalLink className="w-5 h-5" />
          Ouvrir le cluster
        </button>

        {/* Message si tout assigné */}
        {benefsAssignes === cluster.beneficiaires.length && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2 text-center">
            <p className="text-xs font-semibold text-green-800">
              ✅ Tous assignés
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
