import React from 'react';
import { Search, Plus } from 'lucide-react';

export default function SearchAndFilter({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  onAddNew, 
  addButtonText 
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {filterStatus !== undefined && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="En attente">En attente</option>
            {/* ✅ CORRECTION : Utilisation de la valeur réelle 'Validé' pour cibler les bénéficiaires en attente d'attribution de pack */}
            <option value="Validé">Packs en Attente d'Attribution</option>
            <option value="Rejeté">Rejeté</option>
            <option value="Pack Attribué">Pack Attribué</option>
          </select>
        )}

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            {addButtonText || 'Ajouter'}
          </button>
        )}
      </div>
    </div>
  );
}