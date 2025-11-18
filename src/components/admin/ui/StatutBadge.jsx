import React from 'react';

export default function StatutBadge({ statut }) {
  const getStatutColor = () => {
    switch(statut) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Validé': return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejeté': return 'bg-red-100 text-red-800 border-red-300';
      case 'Pack Attribué': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatutColor()}`}>
      {statut}
    </span>
  );
}