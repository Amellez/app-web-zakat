import React, { useState, useEffect } from 'react';
import { Package, Gift, CheckCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getPacks } from '@/lib/firebaseAdmin';

export default function PackAttribueDetails({ beneficiaire, compact = false }) {
  const [packStandard, setPackStandard] = useState(null);
  const [packSupplement, setPackSupplement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const chargerPacks = async () => {
      const { packId, packSupplementId, mosqueeId } = beneficiaire;

      if (!mosqueeId || (!packId && !packSupplementId)) {
        setLoading(false);
        return;
      }

      try {
        const packs = await getPacks(mosqueeId);
        
        if (packId) {
          const pack = packs.find(p => p.id === packId);
          if (pack) setPackStandard(pack);
        }

        if (packSupplementId) {
          const pack = packs.find(p => p.id === packSupplementId);
          if (pack) setPackSupplement(pack);
        }
      } catch (error) {
        console.error('Erreur chargement packs:', error);
      } finally {
        setLoading(false);
      }
    };

    chargerPacks();
  }, [beneficiaire.id]);

  if (loading) {
    return (
      <div className="text-xs text-gray-500 italic">
        Chargement...
      </div>
    );
  }

  if (!packStandard && !packSupplement) {
    return (
      <div className="text-xs text-gray-500 italic">
        Aucun pack attribué
      </div>
    );
  }

  const articleEmojis = {
    'RIZ': '🍚',
    'PÂTES': '🍝',
    'COUSCOUS': '🥘'
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {packStandard && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Package className="w-3 h-3" />
            Pack {packStandard.tailleFamille}
          </div>
        )}
        {packSupplement && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            <Gift className="w-3 h-3" />
            {articleEmojis[packSupplement.articleFavori]} {packSupplement.articleFavori}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div className="text-left">
            <p className="font-semibold text-gray-800">Pack attribué</p>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {beneficiaire.dateAttribution 
                ? new Date(beneficiaire.dateAttribution).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : 'Date inconnue'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {packStandard && (
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Pack {packStandard.tailleFamille}
            </div>
          )}
          {packSupplement && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              + {articleEmojis[packSupplement.articleFavori]} Supplément
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 bg-gray-50 space-y-4">
          {packStandard && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-gray-800">Pack Standard - {packStandard.tailleFamille} Famille</h4>
              </div>
              <div className="space-y-2">
                {packStandard.composition?.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-800">{item.produit}</span>
                      {item.type && (
                        <span className="ml-2 text-xs text-gray-500 font-mono">
                          ({item.type})
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {item.quantiteParFamille || item.quantite} {item.unite}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {packSupplement && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-gray-800">
                  {articleEmojis[packSupplement.articleFavori]} Supplément {packSupplement.articleFavori}
                </h4>
              </div>
              <div className="space-y-2">
                {packSupplement.composition?.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-800">{item.produit}</span>
                      {item.type && (
                        <span className="ml-2 text-xs text-gray-500 font-mono">
                          ({item.type})
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      {item.quantiteParFamille || item.quantite} {item.unite}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t-2 border-gray-200">
            <p className="text-xs text-gray-600 font-medium">
              📦 Total d'articles : {
                (packStandard?.composition?.length || 0) + 
                (packSupplement?.composition?.length || 0)
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}