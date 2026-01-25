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
  const [filtreFamily, setFiltreFamily] = useState('Tous'); // Nouveau filtre

  useEffect(() => {
    if (isOpen && cluster) {
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
  const beneficiairesFiltres = cluster.beneficiaires.filter(benef => {
    if (filtreFamily === 'Tous') return true;
    return benef.tailleFamille === filtreFamily;
  });

  const benefsNonAssignes = beneficiairesFiltres.filter(b => !b.estAssigne);
  const tousSelectionnes = benefsNonAssignes.every(b => selection.includes(b.id)) && benefsNonAssignes.length > 0;
  const selectionDansCeCluster = beneficiairesFiltres.filter(b => selection.includes(b.id)).length;

  // Obtenir les tailles de famille uniques pour le filtre
  const taillesFamille = ['Tous', ...new Set(cluster.beneficiaires.map(b => b.tailleFamille).filter(Boolean))].sort((a, b) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title={cluster.nom} size="large">
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white -mt-6 -mx-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{cluster.nom}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${getStatutColor(cluster.statut)}`}>
              <span>{getStatutIcon(cluster.statut)}</span>
              {cluster.statut}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <Users className="w-5 h-5 mb-1" />
              <p className="text-xs opacity-90">Bénéficiaires</p>
              <p className="text-2xl font-bold">{cluster.beneficiaires.length}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <MapPin className="w-5 h-5 mb-1" />
              <p className="text-xs opacity-90">Depuis mosquée</p>
              <p className="text-2xl font-bold">{formaterDistance(cluster.statistiques?.distanceDepuisMosquee)}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <Package className="w-5 h-5 mb-1" />
              <p className="text-xs opacity-90">Sélectionnés</p>
              <p className="text-2xl font-bold">{selectionDansCeCluster}</p>
            </div>
          </div>
        </div>

        {/* Actions groupées */}
        {benefsNonAssignes.length > 0 && (
          <div className="space-y-3">
            {/* Filtre par taille de famille */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Filtrer par taille :
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
                        ({cluster.beneficiaires.filter(b => b.tailleFamille === taille).length})
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-semibold"
              >
                {tousSelectionnes ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                {tousSelectionnes ? 'Désélectionner tout' : 'Sélectionner tout'}
              </button>
              {selectionDansCeCluster > 0 && (
                <button
                  onClick={handleAssigner}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
                >
                  Assigner la sélection ({selectionDansCeCluster}) →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste des bénéficiaires */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {beneficiairesFiltres.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun bénéficiaire ne correspond au filtre sélectionné</p>
            </div>
          ) : (
            beneficiairesFiltres.map((benef, idx) => {
            const { packStandard, packSupplement } = getPackInfo(benef);

            return (
              <div
                key={benef.id}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 transition ${
                  benef.estAssigne
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : selection.includes(benef.id)
                    ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-emerald-200'
                }`}
              >
                {/* Checkbox ou indicateur */}
                {benef.estAssigne ? (
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">✓</span>
                  </div>
                ) : (
                  <input
                    type="checkbox"
                    checked={selection.includes(benef.id)}
                    onChange={() => onToggleBeneficiaire(benef.id)}
                    className="w-6 h-6 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0 mt-1"
                  />
                )}

                {/* Numéro */}
                <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  {idx + 1}
                </div>

                {/* Infos bénéficiaire */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-gray-800">{benef.nom}</p>
                    {/* Badge type de famille */}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      {benef.tailleFamille || benef.nbPersonnes ?
                        `${benef.tailleFamille || benef.nbPersonnes} famille` :
                        'N/A'
                      }
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{benef.adresse}</p>

                  {benef.telephone && (
                    <p className="text-xs text-gray-500 mb-2">📞 {benef.telephone}</p>
                  )}

                  {/* Packs attribués */}
                  {!loading && (packStandard || packSupplement) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {packStandard && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">
                            Pack {packStandard.tailleFamille}
                          </span>
                        </div>
                      )}
                      {packSupplement && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md">
                          <Gift className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">
                            {articleEmojis[packSupplement.articleFavori] || '🎁'} {packSupplement.articleFavori}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Badge assigné */}
                {benef.estAssigne && benef.itineraireId && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded flex-shrink-0 mt-1">
                    ✓ Assigné
                  </span>
                )}
              </div>
            );
          }))}
        </div>

        {/* Message si tous assignés */}
        {benefsNonAssignes.length === 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-green-800">
              ✅ Tous les bénéficiaires de ce cluster ont été assignés
            </p>
          </div>
        )}

        {/* Bouton fermer */}
        <div className="flex justify-end pt-4 border-t">
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
