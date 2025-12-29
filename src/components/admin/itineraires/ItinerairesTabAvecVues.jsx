'use client';
import React, { useState } from 'react';
import { Layers, Route } from 'lucide-react';
import ClustersTab from './ClustersTab';
import ItinerairesTab from './ItinerairesTab';

export default function ItinerairesTabAvecVues({ beneficiaires }) {
  const [view, setView] = useState('clusters'); // 'clusters' ou 'itineraires'

  return (
    <div className="space-y-6">
      {/* Toggle entre les vues */}
      <div className="bg-white rounded-lg shadow-md p-1 inline-flex gap-1">
        <button
          onClick={() => setView('clusters')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all font-semibold ${
            view === 'clusters'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Clusters</span>
        </button>
        <button
          onClick={() => setView('itineraires')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all font-semibold ${
            view === 'itineraires'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Route className="w-5 h-5" />
          <span>Itinéraires assignés</span>
        </button>
      </div>

      {/* Description de la vue active */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        {view === 'clusters' ? (
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              📦 Vue Clusters
            </p>
            <p className="text-sm text-blue-700">
              Créez des groupes géographiques et sélectionnez les bénéficiaires à assigner à un bénévole.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              ✓ Vue Itinéraires Assignés
            </p>
            <p className="text-sm text-blue-700">
              Suivez la progression des distributions et consultez les itinéraires assignés aux bénévoles.
            </p>
          </div>
        )}
      </div>

      {/* Contenu de la vue active */}
      <div>
        {view === 'clusters' ? (
          <ClustersTab beneficiaires={beneficiaires} />
        ) : (
          <ItinerairesTab beneficiaires={beneficiaires} />
        )}
      </div>
    </div>
  );
}
