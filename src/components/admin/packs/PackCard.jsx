import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp, Gift } from 'lucide-react';

export default function PackCard({ pack, isSupplementPack = false, isBonusPack = false }) {
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

  // Couleurs pour Pack Bonus
  const bonusColors = {
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800'
  };

  // Déterminer les couleurs à utiliser
  let colors, titre, nombre;
  
  if (isBonusPack) {
    colors = bonusColors;
    titre = '🎁 Pack Bonus';
    nombre = pack.quantiteTotale?.toFixed(2) || 0;
  } else if (isSupplementPack) {
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

        {/* Badge bonus si applicable */}
        {isBonusPack && (
          <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
            RESTES À DISTRIBUER
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              {isBonusPack ? (
                <Gift className="w-8 h-8" />
              ) : isSupplementPack ? (
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
                {isBonusPack 
                  ? 'Premier arrivé, premier servi'
                  : isSupplementPack 
                    ? 'Familles ayant choisi cet article' 
                    : 'Standard (70% + autres articles)'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black">{nombre}</div>
            <div className="text-sm font-semibold opacity-90 mt-1">
              {isBonusPack ? 'kg/L total' : isSupplementPack ? 'suppléments' : 'packs'}
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
            📋 Contenu {isBonusPack ? 'du pack bonus' : isSupplementPack ? 'par supplément' : 'par pack'}
          </h4>
          <div className="space-y-2">
            {pack.composition.map((item, idx) => {
              // 🔥 FIX NaN : Gérer les valeurs undefined/null/0
              const quantiteAffichee = isBonusPack 
                ? (item.quantite || 0)
                : (item.quantiteParFamille || item.quantite || 0);
              
              return (
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
                      {quantiteAffichee.toFixed(2)} {item.unite}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {isBonusPack ? 'total disponible' : isSupplementPack ? 'par supplément' : 'par pack'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note spéciale pour pack bonus */}
          {isBonusPack && pack.note && (
            <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ℹ️ <strong>{pack.note}</strong>
              </p>
            </div>
          )}

          {/* Total à préparer (sauf pour pack bonus) */}
          {!isBonusPack && (
            <div className={`mt-6 p-4 ${colors.bg} border-2 ${colors.border} rounded-lg`}>
              <h5 className="font-bold text-gray-800 mb-3">📊 Quantités totales à préparer</h5>
              <div className="grid grid-cols-2 gap-3">
                {pack.composition.map((item, idx) => {
                  // 🔥 FIX NaN : Gérer les undefined/null/0
                  const qteParItem = item.quantiteParFamille || item.quantite || 0;
                  const totalQuantite = qteParItem * nombre;
                  
                  return (
                    <div key={idx} className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-600 truncate">{item.produit}</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {totalQuantite.toFixed(2)} {item.unite}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}