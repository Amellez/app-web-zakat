'use client';
import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, RefreshCw, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ItineraireCard from './ItineraireCard';
import ModalCreerItineraire from './ModalCreerItineraire';
import CarteItineraires from './CarteItineraires';
import {
  getItineraires,
  ecouterItineraires,
  supprimerTousLesItineraires
} from '@/lib/itinerairesService';

export default function ItinerairesTab({ beneficiaires }) {
  const [itineraires, setItineraires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'map'

  // Charger les itinéraires au montage
  useEffect(() => {
    chargerItineraires();

    // Écouter les changements en temps réel
    const unsubscribe = ecouterItineraires((data) => {
      setItineraires(data);
    });

    return () => unsubscribe();
  }, []);

  const chargerItineraires = async () => {
    setLoading(true);
    try {
      const data = await getItineraires();
      setItineraires(data);
    } catch (error) {
      console.error('Erreur chargement itinéraires:', error);
      alert('Erreur lors du chargement des itinéraires');
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimerTous = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUS les itinéraires ? Cette action est irréversible.')) {
      return;
    }

    try {
      setLoading(true);
      await supprimerTousLesItineraires();
      await chargerItineraires();
      alert('✅ Tous les itinéraires ont été supprimés');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression des itinéraires');
    } finally {
      setLoading(false);
    }
  };

  // Statistiques
  const stats = {
    total: itineraires.length,
    nonAssignes: itineraires.filter(i => i.statut === 'Non assigné').length,
    assignes: itineraires.filter(i => i.statut === 'Assigné').length,
    termines: itineraires.filter(i => i.statut === 'Terminé').length,
    totalBeneficiaires: itineraires.reduce((sum, i) => sum + (i.beneficiaires?.length || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Itinéraires</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.total} itinéraire{stats.total > 1 ? 's' : ''} • {stats.totalBeneficiaires} bénéficiaire{stats.totalBeneficiaires > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={chargerItineraires}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>

          {itineraires.length > 0 && (
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
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
          >
            <Navigation className="w-5 h-5" />
            Créer des itinéraires
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {itineraires.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Non assignés</p>
            <p className="text-2xl font-bold text-gray-800">{stats.nonAssignes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">En cours</p>
            <p className="text-2xl font-bold text-gray-800">{stats.assignes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Terminés</p>
            <p className="text-2xl font-bold text-gray-800">{stats.termines}</p>
          </div>
        </div>
      )}

      {/* Toggle Vue Liste / Carte */}
      {itineraires.length > 0 && (
        <div className="flex gap-2 bg-white rounded-lg shadow p-1 w-fit">
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
          description="Créez vos premiers itinéraires optimisés pour commencer les livraisons"
          buttonText="Créer mes itinéraires"
          onButtonClick={() => setShowModal(true)}
        />
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itineraires.map(itineraire => (
            <ItineraireCard
              key={itineraire.id}
              itineraire={itineraire}
              onUpdate={chargerItineraires}
            />
          ))}
        </div>
      ) : (
        <CarteItineraires itineraires={itineraires} />
      )}

      {/* Modal de création */}
      <ModalCreerItineraire
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        beneficiaires={beneficiaires}
        onSuccess={chargerItineraires}
      />
    </div>
  );
}
