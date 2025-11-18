import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp, Gift } from 'lucide-react';

export default function PackCard({ pack, isSupplementPack = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Couleurs badge taille (pour packs standard)
  const tailleColors = {
    'Petite': {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800'
    },
    'Moyenne': {
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      text: 'text-purple-800'
    },
    'Grande': {
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-800'
    }
  };

  // Couleurs pour suppléments par article favori
  const articleFavoriColors = {
    'RIZ': {
      gradient: 'from-amber-500 to-yellow-500',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      emoji: '🍚'
    },
    'PÂTES': {
      gradient: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      emoji: '🍝'
    },
    'COUSCOUS': {
      gradient: 'from-yellow-500 to-lime-500',
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      emoji: '🥘'
    }
  };

  // Déterminer les couleurs à utiliser
  let colors, titre, nombre;
  
  if (isSupplementPack) {
    colors = articleFavoriColors[pack.articleFavori] || articleFavoriColors['RIZ'];
    titre = `${colors.emoji} Supplément ${pack.articleFavori}`;
    nombre = pack.nombreFamilles;
  } else {
    colors = tailleColors[pack.tailleFamille] || tailleColors['Moyenne'];
    titre = `Pack ${pack.tailleFamille} Famille`;
    nombre = pack.nombreFamilles;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      {/* En-tête avec gradient */}
      <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white relative overflow-hidden`}>
        {/* Badge supplément si applicable */}
        {isSupplementPack && (
          <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Gift className="w-3 h-3" />
            30% SUPPLÉMENT
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              {isSupplementPack ? (
                <Gift className="w-8 h-8" />
              ) : (
                <Package className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {titre}
              </h3>
              <div className="text-sm opacity-90 mt-1">
                {isSupplementPack ? 'Familles ayant choisi cet article' : 'Standard (70% + autres articles)'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black">{nombre}</div>
            <div className="text-sm font-semibold opacity-90 mt-1">
              {isSupplementPack ? 'suppléments' : 'packs'}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton pour déplier/replier */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between font-semibold text-gray-700"
      >
        <span>📦 Voir la composition détaillée</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      {/* Composition (dépliable) */}
      {isExpanded && (
        <div className="p-6 bg-gray-50">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            📋 Contenu par {isSupplementPack ? 'supplément' : 'pack'}
          </h4>
          <div className="space-y-2">
            {pack.composition.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 rounded-lg border-2 bg-white border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <span className="font-medium text-gray-800">
                      {item.produit}
                    </span>
                    {item.type && (
                      <span className="ml-2 text-xs text-gray-500 font-mono">
                        ({item.type})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    {item.quantiteParFamille || item.quantite} {item.unite}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    par {isSupplementPack ? 'supplément' : 'pack'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total à préparer */}
          <div className={`mt-6 p-4 ${colors.bg} border-2 ${colors.border} rounded-lg`}>
            <h5 className="font-bold text-gray-800 mb-3">📊 Quantités totales à préparer</h5>
            <div className="grid grid-cols-2 gap-3">
              {pack.composition.map((item, idx) => {
                const qteParItem = item.quantiteParFamille || item.quantite;
                return (
                  <div key={idx} className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-gray-600 truncate">{item.produit}</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {(qteParItem * nombre).toFixed(2)} {item.unite}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}