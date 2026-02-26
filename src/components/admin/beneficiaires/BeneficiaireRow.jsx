import React, { useState } from 'react';
import { CheckCircle, XCircle, Edit, Trash2, Package, ChevronDown, ChevronUp } from 'lucide-react';
import StatutBadge from '../ui/StatutBadge';
import SourceBadge from '../ui/SourceBadge';
import PackAttribueDetails from './PackAttribueDetails';

export default function BeneficiaireRow({ beneficiaire, onValidate, onReject, onEdit, onDelete, isSelected, onToggleSelect }) {
  const [showPackDetails, setShowPackDetails] = useState(false);
  
  // Emojis pour les articles favoris
  const articleEmojis = {
    'RIZ': '🍚',
    'PÂTES': '🍝',
    'COUSCOUS': '🥘'
  };
  
  const emoji = articleEmojis[beneficiaire.articleFavori] || '❓';
  
  // Vérifier si un pack est attribué
  const aPackAttribue = beneficiaire.packId || beneficiaire.packSupplementId;
  
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 w-12">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(beneficiaire.id)}
            className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
          />
        </td>
        <td className="px-6 py-4">
          <div>
            <p className="font-semibold text-gray-800">{beneficiaire.nom}</p>
            <p className="text-sm text-gray-500">{beneficiaire.adresse}</p>
          </div>
        </td>
        <td className="px-6 py-4">
          <div>
            <p className="text-sm text-gray-800">{beneficiaire.telephone}</p>
            <p className="text-sm text-gray-500">{beneficiaire.email}</p>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-medium text-gray-800">
              {beneficiaire.articleFavori || 'Non spécifié'}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">{beneficiaire.nbPersonnes} pers.</p>
            <p className="text-xs text-gray-500">{beneficiaire.tailleFamille}</p>
          </div>
        </td>
        <td className="px-6 py-4">
          <SourceBadge source={beneficiaire.source} />
        </td>
        <td className="px-6 py-4">
          <div className="space-y-2">
            <StatutBadge statut={beneficiaire.statut === 'Validé' ? "En attente d'attribution" : beneficiaire.statut} />
            
            {/* Badge Pack Attribué avec bouton détails */}
            {aPackAttribue && (
              <button
                onClick={() => setShowPackDetails(!showPackDetails)}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 rounded-lg transition border border-blue-200"
                title="Voir les détails du pack"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">
                    Pack attribué
                  </span>
                </div>
                {showPackDetails ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex gap-2">
            {beneficiaire.statut === 'En attente' && (
              <>
                <button
                  onClick={() => onValidate(beneficiaire.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                  title="Valider"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onReject(beneficiaire.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  title="Rejeter"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={() => onEdit(beneficiaire)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
              title="Modifier"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(beneficiaire.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
              title="Supprimer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Ligne extensible pour les détails du pack */}
      {showPackDetails && aPackAttribue && (
        <tr className="bg-gradient-to-r from-blue-50/50 to-emerald-50/50">
          <td colSpan="8" className="px-6 py-4">
            <PackAttribueDetails beneficiaire={beneficiaire} />
          </td>
        </tr>
      )}
    </>
  );
}