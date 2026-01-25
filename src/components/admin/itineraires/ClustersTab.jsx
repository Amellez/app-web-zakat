'use client';
import React, { useState, useEffect } from 'react';
import { Layers, MapPin, Loader2, AlertCircle, Trash2, Users } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ClusterCard from './ClusterCard';
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
      console.error('Erreur chargement clusters:', error);
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

      alert('✅ Tous les clusters ont été supprimés');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression des clusters');
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
            Veuillez sélectionner une mosquée pour accéder aux clusters.
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
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Clusters</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.totalClusters} cluster{stats.totalClusters > 1 ? 's' : ''} • {stats.totalBeneficiaires} bénéficiaire{stats.totalBeneficiaires > 1 ? 's' : ''}
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
            Créer des clusters
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {clusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-600">Total clusters</p>
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

      {/* Liste des clusters */}
      {loading && clusters.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : clusters.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucun cluster créé"
          description="Créez vos premiers clusters pour commencer à organiser la distribution"
          buttonText="Créer des clusters"
          onButtonClick={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map(cluster => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              selection={selection}
              onOpenCluster={handleOpenCluster}
            />
          ))}
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

      {/* Modal détail cluster */}
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
        title="Supprimer tous les clusters"
        message="⚠️ Êtes-vous sûr de vouloir supprimer TOUS les clusters ? Cette action est irréversible et supprimera tous les groupes de bénéficiaires."
        confirmText="Supprimer tout"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
