import React from 'react';
import { CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import StatutBadge from '../ui/StatutBadge';
import SourceBadge from '../ui/SourceBadge';

export default function BeneficiaireRow({ beneficiaire, onValidate, onReject, onEdit, onDelete }) {
  // Emojis pour les articles favoris
  const articleEmojis = {
    'RIZ': '🍚',
    'PÂTES': '🍝',
    'COUSCOUS': '🥘'
  };
  
  const emoji = articleEmojis[beneficiaire.articleFavori] || '❓';
  
  return (
    <tr className="hover:bg-gray-50">
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
        {/* ✅ CHANGEMENT : articleFavori au lieu de origine */}
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
        {/* ✅ MODIFICATION : Mappage pour afficher "En attente d'attribution" au lieu de "Validé" */}
        <StatutBadge statut={beneficiaire.statut === 'Validé' ? "En attente d'attribution" : beneficiaire.statut} />
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
  );
}