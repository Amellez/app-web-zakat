import React from 'react';

export default function SourceBadge({ source }) {
  // Fonction pour obtenir le style selon la source
  const getSourceStyle = () => {
    switch (source) {
      case 'Import':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: '📥'
        };
      case 'Sur place':
        return {
          bg: 'bg-indigo-100',
          text: 'text-indigo-800',
          icon: '🏢'
        };
      case 'Formulaire en ligne':
      case 'online':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: '🌐'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: '📋'
        };
    }
  };

  const style = getSourceStyle();
  
  // Afficher un texte lisible
  const displayText = source === 'online' ? 'En ligne' : source;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon} {displayText || 'Non spécifié'}
    </span>
  );
}