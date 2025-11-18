'use client';

import React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

export default function ItinerairesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Itinéraires</h2>
        <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
          <Navigation className="w-5 h-5" />
          Créer un itinéraire
        </button>
      </div>

      <EmptyState
        icon={MapPin}
        title="Aucun itinéraire créé"
        description="Créez votre premier itinéraire optimisé pour commencer les livraisons"
        buttonText="Créer mon premier itinéraire"
        onButtonClick={() => console.log('Create route')}
      />
    </div>
  );
}