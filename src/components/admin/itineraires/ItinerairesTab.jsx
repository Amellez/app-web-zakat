'use client';
import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Loader2, AlertCircle, Trash2, XCircle, Filter } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ItineraireCard from './ItineraireCard';
import ModalCreerItineraire from './ModalCreerItineraire';
import ModalConfirmation from '../ui/ModalConfirmation';
import {
  getItineraires,
  ecouterItineraires,
  supprimerTousLesItineraires
} from '@/lib/itinerairesService';
import { useMosquee } from '@/context/MosqueeContext';

export default function ItinerairesTab({ beneficiaires }) {
  const { mosqueeActive } = useMosquee();
  const [itineraires, setItineraires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'map'
  const [showConfirmSupprimer, setShowConfirmSupprimer] = useState(false);

  // ✅ NOUVEAU : Filtre pour afficher uniquement les itinéraires avec échecs
  const [filtreEchecs, setFiltreEchecs] = useState(false);

  // Charger les itinéraires au montage
  useEffect(() => {
    if (!mosqueeActive) {
      console.error('Aucune mosquée active');
      setLoading(false);
      return;
    }

    chargerItineraires();
  }, [mosqueeActive]);

  // ✅ NOUVEAU : Fonction pour charger/recharger les itinéraires
  const chargerItineraires = async () => {
    setLoading(true);
    try {
      const data = await getItineraires(mosqueeActive);
      setItineraires(data);
    } catch (error) {
      console.error('Erreur chargement itinéraires:', error);
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
      await supprimerTousLesItineraires(mosqueeActive);

      // Recharger les données
      await chargerItineraires();

      alert('✅ Tous les itinéraires ont été supprimés');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression des itinéraires');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessCreation = () => {
    // Recharger les données après création
    chargerItineraires();
  };

  // ✅ SIMPLIFIÉ : Callback après suppression d'un itinéraire
  const handleSuppressionItineraire = () => {
    // Recharger les données
    chargerItineraires();
  };

  // ✅ NOUVEAU : Filtrer les itinéraires selon le filtre échecs
  const itinerairesFiltres = filtreEchecs
    ? itineraires.filter(it =>
        it.beneficiaires?.some(b => b.statutLivraison === 'Échec')
      )
    : itineraires;

  // Statistiques
  const stats = {
    total: itineraires.length,
    assignes: itineraires.filter(i => i.statut === 'Assigné').length,
    enDistribution: itineraires.filter(i => i.statut === 'En distribution').length,
    termines: itineraires.filter(i => i.statut === 'Terminé').length,
    // Anciens statuts pour rétrocompatibilité
    nonAssignes: itineraires.filter(i => i.statut === 'Non assigné').length,
    enCours: itineraires.filter(i => i.statut === 'En cours').length,
    totalBeneficiaires: itineraires.reduce((sum, i) => sum + (i.beneficiaires?.length || 0), 0),
    // ✅ NOUVEAU : Stats échecs
    avecEchecs: itineraires.filter(it =>
      it.beneficiaires?.some(b => b.statutLivraison === 'Échec')
    ).length,
    totalEchecs: itineraires.reduce((sum, it) =>
      sum + (it.beneficiaires?.filter(b => b.statutLivraison === 'Échec').length || 0), 0
    )
  };

  // Si pas de mosqueeActive, afficher un message d'erreur
  if (!mosqueeActive) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 text-center mb-2">
            Aucune mosquée sélectionnée
          </h3>
          <p className="text-sm text-red-700 text-center">
            Veuillez sélectionner une mosquée pour accéder aux itinéraires.
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
          <h2 className="text-2xl font-bold text-gray-800">Itinéraires Assignés</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.total} itinéraire{stats.total > 1 ? 's' : ''} • {stats.totalBeneficiaires} bénéficiaire{stats.totalBeneficiaires > 1 ? 's' : ''}
            {stats.totalEchecs > 0 && (
              <span className="text-red-600 font-semibold ml-2">
                • {stats.totalEchecs} échec{stats.totalEchecs > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {itineraires.length > 0 && (
          <button
            onClick={handleSupprimerTous}
            disabled={loading || !mosqueeActive}
            className="flex items-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer tout
          </button>
        )}
      </div>

      {/* Statistiques */}
      {itineraires.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-600">Assignés</p>
            <p className="text-2xl font-bold text-gray-800">{stats.assignes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">En distribution</p>
            <p className="text-2xl font-bold text-gray-800">{stats.enDistribution}</p>
          </div>
          {/* ✅ NOUVEAU : Stat échecs */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Avec échecs</p>
            <p className="text-2xl font-bold text-red-800">{stats.avecEchecs}</p>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Filtre échecs + Toggle Vue */}
      {itineraires.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {/* Filtre échecs */}
          {stats.totalEchecs > 0 && (
            <button
              onClick={() => setFiltreEchecs(!filtreEchecs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium border-2 ${
                filtreEchecs
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {filtreEchecs ? 'Tous les itinéraires' : 'Voir uniquement les échecs'}
              {filtreEchecs && (
                <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {stats.avecEchecs}
                </span>
              )}
            </button>
          )}

          {/* Toggle Vue Liste / Carte */}
          <div className="flex gap-2 bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📋 Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                viewMode === 'map'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🗺️ Carte
            </button>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Message si filtre échecs actif mais aucun résultat */}
      {filtreEchecs && itinerairesFiltres.length === 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-lg font-bold text-green-800">Aucun échec à signaler !</p>
          <p className="text-sm text-green-700 mt-2">
            Toutes les livraisons se sont bien déroulées.
          </p>
        </div>
      )}

      {/* Contenu */}
      {loading && itineraires.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : itineraires.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucun itinéraire créé"
          onButtonClick={() => setShowModal(true)}
        />
      ) : viewMode === 'list' && itinerairesFiltres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itinerairesFiltres.map(itineraire => (
            <ItineraireCard
              key={itineraire.id}
              itineraire={itineraire}
              onUpdate={handleSuppressionItineraire}
              mosqueeId={mosqueeActive}
            />
          ))}
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Vue carte bientôt disponible</p>
        </div>
      ) : null}

      {/* Modal de création */}
      <ModalCreerItineraire
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        beneficiaires={beneficiaires}
        mosqueeId={mosqueeActive}
        onSuccess={handleSuccessCreation}
      />

      {/* Modal de confirmation de suppression */}
      <ModalConfirmation
        isOpen={showConfirmSupprimer}
        onClose={() => setShowConfirmSupprimer(false)}
        onConfirm={handleConfirmSupprimer}
        title="Supprimer tous les itinéraires"
        message="⚠️ Êtes-vous sûr de vouloir supprimer TOUS les itinéraires ? Cette action est irréversible et les bénéficiaires seront libérés."
        confirmText="Supprimer tout"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
