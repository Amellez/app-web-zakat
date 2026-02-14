'use client';
import React, { useState, useEffect } from 'react';
import { X, Users, MapPin, Package, CheckSquare, Square, Gift } from 'lucide-react';
import Modal from '../ui/Modal';
import { getPacks } from '@/lib/firebaseAdmin';

export default function ModalDetailCluster({
  isOpen,
  onClose,
  cluster,
  selection,
  onToggleBeneficiaire,
  onToggleAll,
  onAssignerSelection
}) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreFamily, setFiltreFamily] = useState('Tous');

  useEffect(() => {
    if (isOpen && cluster) {
      setFiltreFamily('Tous');
      chargerPacks();
    }
  }, [isOpen, cluster?.id]);

  const chargerPacks = async () => {
    if (!cluster) return;

    setLoading(true);
    try {
      const packsData = await getPacks(cluster.mosqueeId);
      setPacks(packsData);
    } catch (error) {
      console.error('Erreur chargement packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPackInfo = (beneficiaire) => {
    if (!beneficiaire) return null;

    const packStandard = packs.find(p => p.id === beneficiaire.packId);
    const packSupplement = packs.find(p => p.id === beneficiaire.packSupplementId);

    return { packStandard, packSupplement };
  };

  const articleEmojis = {
    'RIZ': '🍚',
    'PÂTES': '🍝',
    'COUSCOUS': '🥘'
  };

  if (!cluster) return null;

  // Filtrer les bénéficiaires selon la taille de famille sélectionnée
  const beneficiairesFiltres = cluster.beneficiaires
    .filter(benef => {
      if (filtreFamily === 'Tous') return true;
      return benef.tailleFamille === filtreFamily;
    })
    .sort((a, b) => {
      // ✅ NOUVEAU : Trier pour mettre les assignés en bas
      if (a.estAssigne && !b.estAssigne) return 1;
      if (!a.estAssigne && b.estAssigne) return -1;
      return 0;
    });

  const benefsNonAssignes = beneficiairesFiltres.filter(b => !b.estAssigne);
  const tousSelectionnes = benefsNonAssignes.every(b => selection.includes(b.id)) && benefsNonAssignes.length > 0;
  const selectionDansCeCluster = beneficiairesFiltres.filter(b => selection.includes(b.id)).length;

  // Obtenir les tailles de famille uniques pour le filtre
  // ✅ MODIFIÉ : Obtenir les tailles de famille avec au moins 1 bénéficiaire non assigné
  const taillesFamille = ['Tous', ...new Set(
    cluster.beneficiaires
      .filter(b => !b.estAssigne) // ✅ Seulement les non assignés
      .map(b => b.tailleFamille)
      .filter(Boolean)
  )].sort((a, b) => {
    if (a === 'Tous') return -1;
    if (b === 'Tous') return 1;
    return a.localeCompare(b);
  });

  const formaterDistance = (distanceEnMetres) => {
    if (!distanceEnMetres || distanceEnMetres === 0) return '0 m';
    if (distanceEnMetres < 1000) {
      return `${Math.round(distanceEnMetres)} m`;
    } else {
      return `${(distanceEnMetres / 1000).toFixed(1)} km`;
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Non assigné': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Partiellement assigné': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Totalement assigné': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'Non assigné': return '⚪';
      case 'Partiellement assigné': return '🟡';
      case 'Totalement assigné': return '🟢';
      default: return '⚪';
    }
  };

  const handleAssigner = () => {
    if (selectionDansCeCluster === 0) {
      alert('Veuillez sélectionner au moins un bénéficiaire de ce cluster');
      return;
    }
    onAssignerSelection();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cluster.nom} size="md">
      <div className="space-y-4">

        {/* Actions groupées */}
        {benefsNonAssignes.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            {/* Filtre par taille de famille */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrer par taille de famille :
              </label>
              <div className="flex gap-2 flex-wrap">
                {taillesFamille.map(taille => (
                  <button
                    key={taille}
                    onClick={() => setFiltreFamily(taille)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                      filtreFamily === taille
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {taille}
                    {taille !== 'Tous' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({cluster.beneficiaires.filter(b => b.tailleFamille === taille && !b.estAssigne).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button
                onClick={() => onToggleAll(cluster)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-semibold text-sm"
              >
                {tousSelectionnes ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                {tousSelectionnes ? 'Désélectionner' : 'Tout sélectionner'}
              </button>
              {selectionDansCeCluster > 0 && (
                <button
                  onClick={handleAssigner}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm"
                >
                  Assigner ({selectionDansCeCluster})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste des bénéficiaires */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Liste des bénéficiaires ({beneficiairesFiltres.length})
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {beneficiairesFiltres.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucun bénéficiaire ne correspond au filtre</p>
                {filtreFamily !== 'Tous' && (
                  <button
                    onClick={() => setFiltreFamily('Tous')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm"
                  >
                    Réinitialiser le filtre
                  </button>
                )}
              </div>
            ) : (
              beneficiairesFiltres.map((benef, idx) => {
                const { packStandard, packSupplement } = getPackInfo(benef);

                return (
                  <div
                    key={benef.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition ${
                      benef.estAssigne
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : selection.includes(benef.id)
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    {/* Checkbox ou indicateur */}
                    {benef.estAssigne ? (
                      <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">✓</span>
                      </div>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selection.includes(benef.id)}
                        onChange={() => onToggleBeneficiaire(benef.id)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0 mt-0.5"
                      />
                    )}

                    {/* Numéro */}
                    <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {idx + 1}
                    </div>

                    {/* Infos bénéficiaire */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm">{benef.nom}</p>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {benef.tailleFamille || benef.nbPersonnes || 'N/A'}
                        </span>
                        {benef.estAssigne && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            ✓ Assigné
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mb-1">{benef.adresse}</p>

                      {benef.telephone && (
                        <p className="text-xs text-gray-500 mb-2">📞 {benef.telephone}</p>
                      )}

                      {/* Packs attribués */}
                      {!loading && (packStandard || packSupplement) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {packStandard && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                              <Package className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-700">
                                {packStandard.tailleFamille}
                              </span>
                            </div>
                          )}
                          {packSupplement && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded">
                              <Gift className="w-3 h-3 text-amber-600" />
                              <span className="text-xs font-semibold text-amber-700">
                                {articleEmojis[packSupplement.articleFavori] || '🎁'} {packSupplement.articleFavori}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message si tous assignés */}
        {benefsNonAssignes.length === 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-800">
              ✅ Tous les bénéficiaires ont été assignés
            </p>
          </div>
        )}

        {/* Bouton fermer */}
        <div className="flex justify-end pt-3 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
