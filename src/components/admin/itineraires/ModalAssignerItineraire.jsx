'use client';
import React, { useState, useEffect } from 'react';
import { X, Users, Navigation, Clock, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

export default function ModalAssignerItineraire({
  isOpen,
  onClose,
  beneficiairesSelectionnes,
  clusters,
  mosqueeId,
  onSuccess
}) {
  const [nom, setNom] = useState('');
  const [benevole, setBenevole] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      // Générer un nom par défaut basé sur le premier cluster
      const premierCluster = clusters.find(c =>
        c.beneficiaires.some(b => beneficiairesSelectionnes.includes(b.id))
      );

      if (premierCluster) {
        setNom(`${premierCluster.nom.split('(')[0].trim()} - Itinéraire`);
      } else {
        setNom('Nouvel itinéraire');
      }

      setBenevole('');
      setTelephone('');
      setError(null);
    }
  }, [isOpen, beneficiairesSelectionnes, clusters]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (beneficiairesSelectionnes.length === 0) {
      setError('Aucun bénéficiaire sélectionné');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer les données complètes des bénéficiaires sélectionnés
      const benefsComplets = [];
      const clustersBeneficiaires = new Map(); // Pour savoir quel bénéficiaire vient de quel cluster

      clusters.forEach(cluster => {
        cluster.beneficiaires.forEach(benef => {
          if (beneficiairesSelectionnes.includes(benef.id)) {
            benefsComplets.push(benef);
            clustersBeneficiaires.set(benef.id, cluster.id);
          }
        });
      });

      console.log('📦 Bénéficiaires à assigner:', benefsComplets.length);

      // Importer les services nécessaires
      const { addDoc, collection } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const { genererCodeUniqueNonUtilise } = await import('@/lib/codeGenerator');
      const { getItineraires } = await import('@/lib/itinerairesService');
      const { marquerBeneficiairesAssignes } = await import('@/lib/clustersService');
      const { calculerStatistiquesItineraire } = await import('@/lib/routeOptimizer');

      // Récupérer les codes existants
      const itinerairesExistants = await getItineraires(mosqueeId);
      const codesExistants = itinerairesExistants.map(it => it.codeUnique).filter(Boolean);

      // Générer un code unique
      const codeUnique = genererCodeUniqueNonUtilise(codesExistants);

      // Récupérer les coordonnées de la mosquée
      const { getDoc, doc } = await import('firebase/firestore');
      let coordsMosquee = null;

      try {
        const mosqueeDoc = await getDoc(doc(db, 'mosquees', mosqueeId));
        if (mosqueeDoc.exists()) {
          const mosqueeData = mosqueeDoc.data();
          if (mosqueeData.coords) {
            coordsMosquee = mosqueeData.coords;
          }
        }
      } catch (err) {
        console.warn('⚠️ Impossible de récupérer les coords de la mosquée');
      }

      // Calculer les statistiques de l'itinéraire
      const stats = calculerStatistiquesItineraire(benefsComplets, coordsMosquee);

      // Créer l'itinéraire
      const itineraire = {
        nom: nom.trim() || 'Itinéraire sans nom',
        mosqueeId: mosqueeId,
        codeUnique: codeUnique,
        benevole: benevole.trim() || null,
        telephone: telephone.trim() || null,
        statut: 'Non assigné',
        beneficiaires: benefsComplets.map(b => ({
          id: b.id,
          nom: b.nom,
          adresse: b.adresse,
          telephone: b.telephone,
          nbPersonnes: b.nbPersonnes,
          coords: b.coords,
          statutLivraison: 'En attente'
        })),
        statistiques: stats,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };

      // Sauvegarder l'itinéraire
      const docRef = await addDoc(collection(db, 'itineraires'), itineraire);
      console.log(`✅ Itinéraire créé: ${docRef.id}`);

      // Mettre à jour les bénéficiaires dans Firestore
      const { updateDoc } = await import('firebase/firestore');

      for (const benef of benefsComplets) {
        try {
          const benefDocRef = doc(db, 'beneficiaires', benef.id);
          await updateDoc(benefDocRef, {
            itineraireId: docRef.id,
            dateAssignationItineraire: new Date().toISOString()
          });
        } catch (updateError) {
          console.error(`❌ Erreur mise à jour bénéficiaire ${benef.id}:`, updateError);
        }
      }

      // Marquer les bénéficiaires comme assignés dans leurs clusters
      const clustersAMettreAJour = new Map();

      // Grouper les bénéficiaires par cluster
      benefsComplets.forEach(benef => {
        const clusterId = clustersBeneficiaires.get(benef.id);
        if (!clustersAMettreAJour.has(clusterId)) {
          clustersAMettreAJour.set(clusterId, []);
        }
        clustersAMettreAJour.get(clusterId).push(benef.id);
      });

      // Mettre à jour chaque cluster
      for (const [clusterId, benefIds] of clustersAMettreAJour.entries()) {
        try {
          await marquerBeneficiairesAssignes(clusterId, benefIds, docRef.id);
          console.log(`✅ Cluster ${clusterId} mis à jour`);
        } catch (clusterError) {
          console.error(`❌ Erreur mise à jour cluster ${clusterId}:`, clusterError);
        }
      }

      console.log('✅ Assignation terminée');

      // Fermer et notifier le succès
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 500);

    } catch (err) {
      console.error('❌ Erreur assignation:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les bénéficiaires complets
  const benefsComplets = [];
  clusters.forEach(cluster => {
    cluster.beneficiaires.forEach(benef => {
      if (beneficiairesSelectionnes.includes(benef.id)) {
        benefsComplets.push(benef);
      }
    });
  });

  // Calculer les statistiques prévisionnelles
  let statsPrevisionnelles = {
    nombreBeneficiaires: benefsComplets.length,
    distanceDepuisMosquee: 0,
    distanceTotale: 0,
    tempsEstime: 0
  };

  if (benefsComplets.length > 0) {
    try {
      // Calculer les stats si possible
      const { calculerStatistiquesItineraire } = require('@/lib/routeOptimizer');
      statsPrevisionnelles = calculerStatistiquesItineraire(benefsComplets, null);
    } catch (err) {
      console.warn('Impossible de calculer les stats:', err);
    }
  }

  const formaterDistance = (distanceEnMetres) => {
    if (!distanceEnMetres || distanceEnMetres === 0) return '0 m';
    if (distanceEnMetres < 1000) {
      return `${Math.round(distanceEnMetres)} m`;
    } else {
      return `${(distanceEnMetres / 1000).toFixed(1)} km`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer un itinéraire">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Résumé de la sélection */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800">
              {benefsComplets.length} bénéficiaire{benefsComplets.length > 1 ? 's' : ''} sélectionné{benefsComplets.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1 max-h-32 overflow-y-auto">
            {benefsComplets.map((benef, idx) => (
              <div key={benef.id} className="flex items-center gap-2 text-sm text-emerald-700">
                <span className="bg-emerald-200 text-emerald-800 font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span className="font-medium">{benef.nom}</span>
                <span className="text-emerald-600">•</span>
                <span className="text-emerald-600 truncate">{benef.adresse}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">📊 Statistiques prévisionnelles</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <MapPin className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Depuis mosquée</p>
              <p className="text-lg font-bold text-gray-800">
                {formaterDistance(statsPrevisionnelles.distanceDepuisMosquee)}
              </p>
            </div>
            <div className="text-center">
              <Navigation className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Distance totale</p>
              <p className="text-lg font-bold text-gray-800">
                {formaterDistance(statsPrevisionnelles.distanceTotale)}
              </p>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Temps estimé</p>
              <p className="text-lg font-bold text-gray-800">
                {statsPrevisionnelles.tempsEstime} min
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4" />

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de l'itinéraire <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Versailles Centre - Jean Dupont"
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom du bénévole <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={benevole}
              onChange={(e) => setBenevole(e.target.value)}
              placeholder="Ex: Jean Dupont"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone du bénévole <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: 06 12 34 56 78"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Info code unique */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-800">
            ℹ️ Un <strong>code unique</strong> sera généré automatiquement pour cet itinéraire.
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Erreur</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || benefsComplets.length === 0}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Créer l'itinéraire
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
