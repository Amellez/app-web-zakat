'use client';
import React, { useState, useEffect } from 'react';
import { Layers, MapPin, Loader2, AlertCircle, Trash2, Users, ExternalLink, CheckCircle } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ModalCreerClusters from './ModalCreerClusters';
import ModalDetailCluster from './ModalDetailCluster';
import ModalAssignerItineraire from './ModalAssignerItineraire';
import ModalConfirmation from '../ui/ModalConfirmation';
import { getClusters, supprimerTousClusters } from '@/lib/clustersService';
import { useMosquee } from '@/context/MosqueeContext';

export default function ClustersTab({ beneficiaires }) {
  const { mosqueeActive } = useMosquee();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [clusterSelectionne, setClusterSelectionne] = useState(null);
  const [showModalAssignation, setShowModalAssignation] = useState(false);
  const [showConfirmSupprimer, setShowConfirmSupprimer] = useState(false);
  const [selection, setSelection] = useState([]); // IDs des bénéficiaires sélectionnés
  const [sortBy, setSortBy] = useState('nom'); // 'nom', 'beneficiaires', 'distance'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

  // Fonction pour gérer le tri
  const handleSort = (column) => {
    if (sortBy === column) {
      // Si on clique sur la même colonne, inverser l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, ordre ascendant par défaut
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Trier les clusters
  const clustersTries = [...clusters].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'nom') {
      comparison = a.nom.localeCompare(b.nom);
    } else if (sortBy === 'beneficiaires') {
      comparison = a.beneficiaires.length - b.beneficiaires.length;
    } else if (sortBy === 'distance') {
      const distA = a.statistiques?.distanceDepuisMosquee || 0;
      const distB = b.statistiques?.distanceDepuisMosquee || 0;
      comparison = distA - distB;
    } else if (sortBy === 'statut') {
      const ordreStatut = {
        'Non assigné': 1,
        'Partiellement assigné': 2,
        'Totalement assigné': 3
      };
      comparison = (ordreStatut[a.statut] || 0) - (ordreStatut[b.statut] || 0);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  useEffect(() => {
    if (!mosqueeActive) {
      console.error('Aucune mosquée active');
      setLoading(false);
      return;
    }

    chargerClusters();
  }, [mosqueeActive]);

  const chargerClusters = async () => {
    setLoading(true);
    try {
      const data = await getClusters(mosqueeActive);
      setClusters(data);
    } catch (error) {
      console.error('Erreur chargement secteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimerTous = () => {
    setShowConfirmSupprimer(true);
  };

  const handleConfirmSupprimer = async () => {
    try {
      setLoading(true);
      await supprimerTousClusters(mosqueeActive);

      // Vider le state
      setClusters([]);

      alert('✅ Tous les secteurs ont été supprimés');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression des secteurs');
      // En cas d'erreur, recharger
      chargerClusters();
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessCreation = () => {
    chargerClusters();
  };

  const handleSuccessAssignation = () => {
    setSelection([]);
    setShowModalDetail(false);
    chargerClusters();
  };

  const handleOpenCluster = (cluster) => {
    setClusterSelectionne(cluster);
    setShowModalDetail(true);
  };

  // Gestion de la sélection
  const handleToggleBeneficiaire = (beneficiaireId) => {
    setSelection(prev => {
      if (prev.includes(beneficiaireId)) {
        return prev.filter(id => id !== beneficiaireId);
      } else {
        return [...prev, beneficiaireId];
      }
    });
  };

  const handleSelectionnerTout = (cluster) => {
    const benefsNonAssignes = cluster.beneficiaires
      .filter(b => !b.estAssigne)
      .map(b => b.id);

    setSelection(prev => {
      // Si tous sont déjà sélectionnés, on désélectionne
      const tousSelectionnes = benefsNonAssignes.every(id => prev.includes(id));
      if (tousSelectionnes) {
        return prev.filter(id => !benefsNonAssignes.includes(id));
      } else {
        // Sinon on ajoute ceux qui ne sont pas sélectionnés
        const nouveaux = benefsNonAssignes.filter(id => !prev.includes(id));
        return [...prev, ...nouveaux];
      }
    });
  };

  const handleDeselectionneTout = () => {
    setSelection([]);
  };

  const handleAssignerSelection = () => {
    if (selection.length === 0) {
      alert('Veuillez sélectionner au moins un bénéficiaire');
      return;
    }
    setShowModalAssignation(true);
  };

  // Fonction pour formater la distance
  const formaterDistance = (distanceEnMetres) => {
    if (!distanceEnMetres || distanceEnMetres === 0) return '0 m';
    if (distanceEnMetres < 1000) {
      return `${Math.round(distanceEnMetres)} m`;
    } else {
      return `${(distanceEnMetres / 1000).toFixed(1)} km`;
    }
  };

  // Fonction pour obtenir la couleur du statut
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

  // Statistiques
  const stats = {
    totalClusters: clusters.length,
    nonAssignes: clusters.filter(c => c.statut === 'Non assigné').length,
    partiels: clusters.filter(c => c.statut === 'Partiellement assigné').length,
    complets: clusters.filter(c => c.statut === 'Totalement assigné').length,
    totalBeneficiaires: clusters.reduce((sum, c) => sum + c.beneficiaires.length, 0)
  };

  if (!mosqueeActive) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 text-center mb-2">
            Aucune mosquée sélectionnée
          </h3>
          <p className="text-sm text-red-700 text-center">
            Veuillez sélectionner une mosquée pour accéder aux secteurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Secteurs</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.totalClusters} secteur{stats.totalClusters > 1 ? 's' : ''} • {stats.totalBeneficiaires} bénéficiaire{stats.totalBeneficiaires > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {clusters.length > 0 && (
            <button
              onClick={handleSupprimerTous}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer tout
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={!mosqueeActive}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
          >
            <Layers className="w-5 h-5" />
            Générer les secteurs
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {clusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-600">Total secteurs</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalClusters}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
            <p className="text-sm text-gray-600">Non assignés</p>
            <p className="text-2xl font-bold text-gray-800">{stats.nonAssignes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Partiellement assignés</p>
            <p className="text-2xl font-bold text-gray-800">{stats.partiels}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Totalement assignés</p>
            <p className="text-2xl font-bold text-gray-800">{stats.complets}</p>
          </div>
        </div>
      )}

      {/* Barre de sélection flottante */}
      {selection.length > 0 && (
        <div className="sticky top-4 z-10 bg-emerald-600 text-white rounded-lg shadow-lg p-4 animate-in slide-in-from-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span className="font-semibold">
                {selection.length} bénéficiaire{selection.length > 1 ? 's' : ''} sélectionné{selection.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeselectionneTout}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition font-semibold"
              >
                Désélectionner tout
              </button>
              <button
                onClick={handleAssignerSelection}
                className="px-4 py-2 bg-white text-emerald-600 hover:bg-gray-100 rounded-lg transition font-semibold"
              >
                Assigner la sélection →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des secteurs */}
      {loading && clusters.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : clusters.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucun secteur créé"
          description="Créez vos premiers secteurs pour commencer à organiser la distribution"
          buttonText="Générer les secteurs"
          onButtonClick={() => setShowModal(true)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
          {/* En-tête du tableau */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <tr>
                  <th
                    onClick={() => handleSort('nom')}
                    className="px-6 py-4 text-left text-sm font-bold cursor-pointer hover:bg-emerald-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      Nom du secteur
                      {sortBy === 'nom' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('beneficiaires')}
                    className="px-6 py-4 text-center text-sm font-bold cursor-pointer hover:bg-emerald-700 transition"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Bénéficiaires
                      {sortBy === 'beneficiaires' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('distance')}
                    className="px-6 py-4 text-center text-sm font-bold cursor-pointer hover:bg-emerald-700 transition"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Distance mosquée
                      {sortBy === 'distance' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Assignés</th>
                  <th
                    onClick={() => handleSort('statut')}
                    className="px-6 py-4 text-center text-sm font-bold cursor-pointer hover:bg-emerald-700 transition"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Statut
                      {sortBy === 'statut' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clustersTries.map((cluster) => {
                  const benefsAssignes = cluster.beneficiaires.filter(b => b.estAssigne).length;
                  const selectionDansCeCluster = cluster.beneficiaires.filter(b => selection.includes(b.id)).length;

                  return (
                    <tr
                      key={cluster.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Nom du secteur */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{cluster.nom}</span>
                          {selectionDansCeCluster > 0 && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                              {selectionDansCeCluster} sélectionné{selectionDansCeCluster > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nombre de bénéficiaires */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="font-bold text-gray-800">{cluster.beneficiaires.length}</span>
                        </div>
                      </td>

                      {/* Distance depuis mosquée */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-emerald-700">
                            {formaterDistance(cluster.statistiques?.distanceDepuisMosquee)}
                          </span>
                        </div>
                      </td>

                      {/* Progression assignation */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {benefsAssignes}/{cluster.beneficiaires.length}
                          </span>
                          {benefsAssignes > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${(benefsAssignes / cluster.beneficiaires.length) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatutColor(cluster.statut)}`}>
                          <span>{getStatutIcon(cluster.statut)}</span>
                          <span className="hidden lg:inline">{cluster.statut}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenCluster(cluster)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de création */}
      <ModalCreerClusters
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        beneficiaires={beneficiaires}
        mosqueeId={mosqueeActive}
        onSuccess={handleSuccessCreation}
      />

      {/* Modal détail secteur */}
      <ModalDetailCluster
        isOpen={showModalDetail}
        onClose={() => setShowModalDetail(false)}
        cluster={clusterSelectionne}
        selection={selection}
        onToggleBeneficiaire={handleToggleBeneficiaire}
        onToggleAll={handleSelectionnerTout}
        onAssignerSelection={handleAssignerSelection}
      />

      {/* Modal d'assignation */}
      <ModalAssignerItineraire
        isOpen={showModalAssignation}
        onClose={() => setShowModalAssignation(false)}
        beneficiairesSelectionnes={selection}
        clusters={clusters}
        mosqueeId={mosqueeActive}
        onSuccess={handleSuccessAssignation}
      />

      {/* Modal de confirmation de suppression */}
      <ModalConfirmation
        isOpen={showConfirmSupprimer}
        onClose={() => setShowConfirmSupprimer(false)}
        onConfirm={handleConfirmSupprimer}
        title="Supprimer tous les secteurs"
        message="⚠️ Êtes-vous sûr de vouloir supprimer TOUS les secteurs ? Cette action est irréversible et supprimera tous les groupes de bénéficiaires."
        confirmText="Supprimer tout"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
