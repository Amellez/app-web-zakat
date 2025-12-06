'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, Gift, MapPin, Phone, Users, Calendar, Printer } from 'lucide-react';
import { getPacks } from '@/lib/firebaseAdmin';
import Modal from '../ui/Modal';

export default function ModalDetailPackBeneficiaire({ isOpen, onClose, beneficiaire }) {
  const [packStandard, setPackStandard] = useState(null);
  const [packSupplement, setPackSupplement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && beneficiaire) {
      chargerPackDetails();
    }
  }, [isOpen, beneficiaire?.id]);

  const chargerPackDetails = async () => {
    setLoading(true);
    try {
      const packs = await getPacks(beneficiaire.mosqueeId);
      
      if (beneficiaire.packId) {
        const pack = packs.find(p => p.id === beneficiaire.packId);
        if (pack) setPackStandard(pack);
      }

      if (beneficiaire.packSupplementId) {
        const pack = packs.find(p => p.id === beneficiaire.packSupplementId);
        if (pack) setPackSupplement(pack);
      }
    } catch (error) {
      console.error('Erreur chargement pack:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!beneficiaire) return null;

  const articleEmojis = {
    'RIZ': '🍚',
    'PÂTES': '🍝',
    'COUSCOUS': '🥘'
  };

  const totalArticles = (packStandard?.composition?.length || 0) + (packSupplement?.composition?.length || 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Pack Alimentaire - ${beneficiaire.nom}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* En-tête avec infos bénéficiaire */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{beneficiaire.nom}</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{beneficiaire.adresse}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{beneficiaire.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{beneficiaire.nbPersonnes} personnes - Famille {beneficiaire.tailleFamille}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {beneficiaire.dateAttribution && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Attribué le</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(beneficiaire.dateAttribution).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (packStandard || packSupplement) ? (
          <>
            {/* Pack Standard */}
            {packStandard && (
              <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6" />
                    <div>
                      <h4 className="text-lg font-bold">Pack Standard</h4>
                      <p className="text-sm opacity-90">Famille {packStandard.tailleFamille}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50">
                  <div className="space-y-3">
                    {packStandard.composition?.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200"
                      >
                        <div>
                          <span className="font-semibold text-gray-800">{item.produit}</span>
                          {item.type && (
                            <span className="ml-2 text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            {item.quantiteParFamille || item.quantite}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">{item.unite}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pack Supplément */}
            {packSupplement && (
              <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6" />
                    <div>
                      <h4 className="text-lg font-bold">
                        {articleEmojis[packSupplement.articleFavori]} Supplément {packSupplement.articleFavori}
                      </h4>
                      <p className="text-sm opacity-90">Article favori de la famille</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-amber-50">
                  <div className="space-y-3">
                    {packSupplement.composition?.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-amber-200"
                      >
                        <div>
                          <span className="font-semibold text-gray-800">{item.produit}</span>
                          {item.type && (
                            <span className="ml-2 text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-amber-600">
                            {item.quantiteParFamille || item.quantite}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">{item.unite}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Résumé */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-800">Total d'articles</p>
                  <p className="text-sm text-emerald-700">
                    {packStandard && `${packStandard.composition?.length || 0} articles standard`}
                    {packStandard && packSupplement && ' + '}
                    {packSupplement && `${packSupplement.composition?.length || 0} articles supplément`}
                  </p>
                </div>
                <div className="text-4xl font-black text-emerald-600">
                  {totalArticles}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Aucun pack n'a été attribué à ce bénéficiaire</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            disabled={!packStandard && !packSupplement}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            <Printer className="w-5 h-5" />
            Imprimer
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}