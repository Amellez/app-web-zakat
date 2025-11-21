'use client';
import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { geolocaliserBeneficiaires, genererItinerairesAutomatiques } from '@/lib/itinerairesService';

export default function ModalCreerItineraire({ isOpen, onClose, beneficiaires, mosqueeId, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Config, 2: Géolocalisation, 3: Génération
  const [rayonKm, setRayonKm] = useState(3);
  const [forceRegeneration, setForceRegeneration] = useState(false); // 🔥 NOUVEAU
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Filtrer les bénéficiaires par mosqueeId
  const beneficiairesMosquee = beneficiaires.filter(b => b.mosqueeId === mosqueeId);

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setError(null);
      setResult(null);
      setForceRegeneration(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
      onClose();
    }
  };

  const handleStart = async () => {
    if (!mosqueeId) {
      setError('mosqueeId manquant');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStep(2);

      // Étape 1: Géolocalisation
      console.log('📍 Étape 1: Géolocalisation...');

      const geoResult = await geolocaliserBeneficiaires(
        beneficiairesMosquee,
        mosqueeId,
        (prog) => setProgress(prog)
      );

      if (!geoResult.success) {
        throw new Error('Erreur lors de la géolocalisation');
      }

      console.log(`✅ ${geoResult.count} bénéficiaires géolocalisés`);

      // Petite pause pour que l'utilisateur voie le succès
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Génération des itinéraires
      console.log('🚀 Étape 2: Génération des itinéraires...');
      setStep(3);
      setProgress({ current: 0, total: 0, percentage: 0 });

      const itineraireResult = await genererItinerairesAutomatiques(
        beneficiairesMosquee,
        mosqueeId,
        { rayonKm, forceRegeneration } // 🔥 Passer le paramètre
      );

      if (!itineraireResult.success) {
        throw new Error('Erreur lors de la génération des itinéraires');
      }

      console.log('✅ Itinéraires générés avec succès');

      setResult({
        nombreItineraires: itineraireResult.nombreItineraires,
        nombreBeneficiaires: itineraireResult.nombreBeneficiaires,
        geolocalisations: geoResult.count
      });

      // Attendre un peu avant de fermer
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques des bénéficiaires éligibles
  const benefsEligibles = beneficiairesMosquee.filter(b =>
    (b.statut === 'Pack Attribué' || b.statut === 'Validé') &&
    (!b.itineraireId || forceRegeneration) // 🔥 Inclure même ceux avec itineraireId si force
  );

  const benefsAvecItineraire = beneficiairesMosquee.filter(b => b.itineraireId);

  const benefsSansCoords = benefsEligibles.filter(b =>
    !b.coords || !b.coords.lat || !b.coords.lng
  );

  // Vérification mosqueeId
  if (!mosqueeId) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Erreur">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">mosqueeId manquant</p>
            <p className="text-sm text-red-700 mt-1">
              Impossible de créer des itinéraires sans mosqueeId.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer des Itinéraires Optimisés">
      <div className="space-y-6">
        {step === 1 && (
          <>
            {/* Informations */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    Création automatique d'itinéraires
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Géolocalisation automatique des adresses</li>
                    <li>• Regroupement par proximité géographique</li>
                    <li>• Optimisation de l'ordre des visites</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Info mosquée */}
            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-emerald-500">
              <p className="text-xs text-gray-600">Mosquée ID</p>
              <p className="text-sm font-semibold text-gray-800">{mosqueeId}</p>
            </div>

            {/* Statistiques */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bénéficiaires de votre mosquée:</span>
                <span className="text-lg font-bold text-gray-800">{beneficiairesMosquee.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bénéficiaires éligibles:</span>
                <span className="text-lg font-bold text-gray-800">{benefsEligibles.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">À géolocaliser:</span>
                <span className="text-lg font-bold text-orange-600">{benefsSansCoords.length}</span>
              </div>
            </div>

            {/* 🔥 NOUVEAU : Avertissement si des itinéraires existent déjà */}
            {benefsAvecItineraire.length > 0 && !forceRegeneration && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-800 mb-2">
                      ⚠️ {benefsAvecItineraire.length} bénéficiaire(s) ont déjà un itinéraire
                    </p>
                    <p className="text-sm text-orange-700 mb-3">
                      Ces bénéficiaires seront ignorés. Cochez l'option ci-dessous pour les réassigner.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceRegeneration}
                        onChange={(e) => setForceRegeneration(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-orange-800">
                        Régénérer tous les itinéraires (supprime les anciens)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {benefsEligibles.length === 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Aucun bénéficiaire éligible
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Assurez-vous d'avoir des bénéficiaires de votre mosquée avec le statut "Pack Attribué" ou "Validé".
                  </p>
                </div>
              </div>
            )}

            {/* Configuration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rayon de regroupement (km)
              </label>
              <input
                type="number"
                value={rayonKm}
                onChange={(e) => setRayonKm(parseFloat(e.target.value))}
                min="1"
                max="10"
                step="0.5"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Les bénéficiaires dans ce rayon seront regroupés dans le même itinéraire
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleStart}
                disabled={benefsEligibles.length === 0}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Générer les itinéraires
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Géolocalisation en cours...
              </h3>
              <p className="text-sm text-gray-600">
                {progress.current > 0 ? (
                  <>
                    {progress.current} / {progress.total} adresses géolocalisées
                    <br />
                    <span className="text-xs text-gray-500">
                      Cela peut prendre quelques minutes
                    </span>
                  </>
                ) : (
                  'Préparation...'
                )}
              </p>
            </div>

            {/* Barre de progression */}
            {progress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && !result && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Génération des itinéraires...
              </h3>
              <p className="text-sm text-gray-600">
                Création des clusters et optimisation des routes
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="py-6 space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Itinéraires créés avec succès !
              </h3>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Itinéraires créés:</span>
                <span className="text-lg font-bold text-green-700">{result.nombreItineraires}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Bénéficiaires assignés:</span>
                <span className="text-lg font-bold text-green-700">{result.nombreBeneficiaires}</span>
              </div>
              {result.geolocalisations > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Nouvelles géolocalisations:</span>
                  <span className="text-lg font-bold text-green-700">{result.geolocalisations}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-center text-gray-600">
              Fermeture automatique dans quelques instants...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Erreur</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}