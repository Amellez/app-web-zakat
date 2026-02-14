'use client';
import React, { useState, useEffect } from 'react';
import { X, Users, Navigation, Clock, MapPin, CheckCircle, Loader2, AlertCircle, Printer, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../ui/Modal';

export default function ModalAssignerItineraire({
  isOpen,
  onClose,
  beneficiairesSelectionnes,
  clusters,
  mosqueeId,
  onSuccess
}) {
  const [benevole, setBenevole] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [itineraireCreé, setItineraireCreé] = useState(null);
  const [coordsMosquee, setCoordsMosquee] = useState(null);
  const [loadingCoords, setLoadingCoords] = useState(true);

  // Charger les coordonnées de la mosquée à l'ouverture
  useEffect(() => {
    if (isOpen && mosqueeId) {
      chargerCoordsMosquee();
    }
  }, [isOpen, mosqueeId]);

  const chargerCoordsMosquee = async () => {
    setLoadingCoords(true);
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const mosqueeDoc = await getDoc(doc(db, 'mosquees', mosqueeId));
      if (mosqueeDoc.exists()) {
        const mosqueeData = mosqueeDoc.data();

        // Si coords déjà disponibles
        if (mosqueeData.coords && mosqueeData.coords.lat && mosqueeData.coords.lng) {
          setCoordsMosquee(mosqueeData.coords);
          console.log('✅ Coordonnées mosquée chargées');
        }
        // Sinon, géolocaliser l'adresse
        else if (mosqueeData.adresse) {
          console.log(`🌍 Géolocalisation de la mosquée: ${mosqueeData.adresse}`);
          const { geocodeAdresseUnique } = await import('@/lib/geocoding');
          const coords = await geocodeAdresseUnique(mosqueeData.adresse);

          if (coords) {
            setCoordsMosquee(coords);
            console.log('✅ Mosquée géolocalisée:', coords);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Impossible de charger les coords de la mosquée:', err);
    } finally {
    setLoadingCoords(false);
    }
  };

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setBenevole('');
      setTelephone('');
      setError(null);
      setShowSuccess(false);
      setItineraireCreé(null);
    }
  }, [isOpen, beneficiairesSelectionnes, clusters]);

  const handleClose = () => {
    if (!loading) {
      setShowSuccess(false);
      setItineraireCreé(null);
      onClose();
    }
  };

  const handleFinalClose = () => {
    onSuccess();
    handleClose();
  };

  const handleCopyCode = () => {
    if (itineraireCreé?.codeUnique) {
      navigator.clipboard.writeText(itineraireCreé.codeUnique);
      alert('✅ Code copié dans le presse-papier !');
    }
  };

  const handlePrint = () => {
    window.print();
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
      const clustersBeneficiaires = new Map();

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

      let coordsMosqueeLocales = coordsMosquee; // Essayer d'abord le state

      // Si pas dans le state, charger maintenant
      if (!coordsMosqueeLocales) {
        console.log('⚠️ Coords pas dans le state, rechargement...');
        try {
          const mosqueeDoc = await getDoc(doc(db, 'mosquees', mosqueeId));
          if (mosqueeDoc.exists()) {
            const mosqueeData = mosqueeDoc.data();

            if (mosqueeData.coords && mosqueeData.coords.lat && mosqueeData.coords.lng) {
              coordsMosqueeLocales = mosqueeData.coords;
            } else if (mosqueeData.adresse) {
              const { geocodeAdresseUnique } = await import('@/lib/geocoding');
              coordsMosqueeLocales = await geocodeAdresseUnique(mosqueeData.adresse);
            }
          }
        } catch (err) {
          console.warn('⚠️ Impossible de récupérer les coords de la mosquée');
        }
      }

      // Calculer les statistiques de l'itinéraire
      console.log('🕌 Coords au calcul:', coordsMosqueeLocales);
      const stats = calculerStatistiquesItineraire(benefsComplets, coordsMosqueeLocales);
      console.log('📊 Stats:', stats);

      // Créer l'itinéraire
      const itineraire = {
        nom: benevole.trim()
        ? `Itinéraire - ${benevole.trim()}`
        : `Itinéraire ${codeUnique}`,
        mosqueeId: mosqueeId,
        codeUnique: codeUnique,
        benevole: benevole.trim() || null,
        telephone: telephone.trim() || null,
        statut: 'Assigné',
        beneficiaires: benefsComplets.map(b => ({
          id: b.id,
          nom: b.nom,
          adresse: b.adresse,
          telephone: b.telephone,
          nbPersonnes: b.nbPersonnes,
          tailleFamille: b.tailleFamille,
          coords: b.coords,
          packId: b.packId,
          packSupplementId: b.packSupplementId,
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

      benefsComplets.forEach(benef => {
        const clusterId = clustersBeneficiaires.get(benef.id);
        if (!clustersAMettreAJour.has(clusterId)) {
          clustersAMettreAJour.set(clusterId, []);
        }
        clustersAMettreAJour.get(clusterId).push(benef.id);
      });

      for (const [clusterId, benefIds] of clustersAMettreAJour.entries()) {
        try {
          await marquerBeneficiairesAssignes(clusterId, benefIds, docRef.id);
          console.log(`✅ Cluster ${clusterId} mis à jour`);
        } catch (clusterError) {
          console.error(`❌ Erreur mise à jour cluster ${clusterId}:`, clusterError);
        }
      }

      console.log('✅ Assignation terminée');

      // Stocker les infos pour l'écran de succès
      setItineraireCreé({
        ...itineraire,
        id: docRef.id,
        nombreBeneficiaires: benefsComplets.length
      });

      // Afficher l'écran de succès
      setShowSuccess(true);

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
    tempsEstime: 0,
    parcours: []
  };

  if (benefsComplets.length > 0) {
    try {
      const { calculerStatistiquesItineraire } = require('@/lib/routeOptimizer');
      statsPrevisionnelles = calculerStatistiquesItineraire(benefsComplets, coordsMosquee);
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

  // URL pour le QR code (votre URL de production + /distribution)
  const getDistributionUrl = (code) => {
    // Remplacez par votre vraie URL de production
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/distribution?code=${code}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={showSuccess ? "Itinéraire créé !" : "Créer un itinéraire"} size="md">
      {showSuccess && itineraireCreé ? (
        // Écran de succès avec QR code
        <div className="space-y-6">
          {/* Message de succès */}
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Itinéraire créé avec succès !
            </h3>
            <p className="text-gray-600">
              Communiquez le code ci-dessous au bénévole
            </p>
          </div>

          {/* Code unique + QR Code */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <QRCodeSVG
                  value={getDistributionUrl(itineraireCreé.codeUnique)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Infos code */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Code d'accès bénévole
                </p>
                <div className="bg-white border-2 border-emerald-300 rounded-lg p-4 mb-4">
                  <p className="text-4xl font-black text-emerald-600 font-mono tracking-wider">
                    {itineraireCreé.codeUnique}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition mx-auto md:mx-0"
                >
                  <Copy className="w-4 h-4" />
                  Copier le code
                </button>
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">📋 Récapitulatif</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nom de l'itinéraire:</span>
                <span className="text-sm font-semibold text-gray-800">{itineraireCreé.nom}</span>
              </div>
              {itineraireCreé.benevole && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bénévole:</span>
                  <span className="text-sm font-semibold text-gray-800">{itineraireCreé.benevole}</span>
                </div>
              )}
              {itineraireCreé.telephone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Téléphone:</span>
                  <span className="text-sm font-semibold text-gray-800">{itineraireCreé.telephone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nombre de livraisons:</span>
                <span className="text-sm font-semibold text-gray-800">{itineraireCreé.nombreBeneficiaires}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Instructions pour le bénévole :</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 ml-4 space-y-1 list-decimal">
              <li>Scanner le QR code ou aller sur /distribution</li>
              <li>Entrer le code : <strong>{itineraireCreé.codeUnique}</strong></li>
              <li>Suivre les instructions de livraison</li>
            </ol>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
            <button
              onClick={handleFinalClose}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
            >
              Terminer
            </button>
          </div>
        </div>
      ) : (
        // Formulaire de création
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

          {/* ✅ Parcours détaillé uniquement */}
          {statsPrevisionnelles.parcours && statsPrevisionnelles.parcours.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">📍 Parcours détaillé</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {statsPrevisionnelles.parcours.map((etape, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-mono">{idx + 1}.</span>
                    <span className="text-gray-700 truncate flex-1">
                      {etape.de} → {etape.vers}
                    </span>
                    <span className="text-emerald-600 font-semibold whitespace-nowrap">
                      {formaterDistance(etape.distance * 1000)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4" />

          {/* Formulaire */}
          <div className="space-y-4">
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
              ℹ️ Un <strong>code unique et QR code</strong> seront générés automatiquement.
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
              disabled={loading || loadingCoords || benefsComplets.length === 0}
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
      )}
    </Modal>
  );
}
