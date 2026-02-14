'use client';
import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { geolocaliserBeneficiaires } from '@/lib/itinerairesService';
import { genererClusters } from '@/lib/clustersService';

export default function ModalCreerClusters({ isOpen, onClose, beneficiaires, mosqueeId, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Config, 2: Géolocalisation, 3: Génération
  const [rayonMetres, setRayonMetres] = useState(1000); // En mètres maintenant
  const [forceRegeneration, setForceRegeneration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [beneficiairesLocaux, setBeneficiairesLocaux] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const beneficiairesMosquee = beneficiaires.filter(b => b.mosqueeId === mosqueeId);
      setBeneficiairesLocaux(beneficiairesMosquee);
      console.log('📋 Bénéficiaires locaux initialisés:', beneficiairesMosquee.length);
    }
  }, [isOpen, beneficiaires, mosqueeId]);

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setError(null);
      setResult(null);
      setForceRegeneration(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
      setBeneficiairesLocaux([]);
      onClose();
    }
  };

  // Formater l'affichage du rayon (mètres < 1000, km >= 1000)
  const formatRayon = (metres) => {
    if (metres < 1000) {
      return `${metres} m`;
    } else {
      return `${(metres / 1000).toFixed(1)} km`;
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
        beneficiairesLocaux,
        mosqueeId,
        (prog) => setProgress(prog)
      );

      if (!geoResult.success) {
        throw new Error('Erreur lors de la géolocalisation');
      }

      console.log(`✅ ${geoResult.count} bénéficiaires géolocalisés`);

      // Mettre à jour les coords dans le state local
      let benefsAvecCoords = [...beneficiairesLocaux];

      if (geoResult.coordsMap && Object.keys(geoResult.coordsMap).length > 0) {
        benefsAvecCoords = beneficiairesLocaux.map(b => {
          if (geoResult.coordsMap[b.id]) {
            return { ...b, coords: geoResult.coordsMap[b.id] };
          }
          return b;
        });
        setBeneficiairesLocaux(benefsAvecCoords);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Génération des secteurs
      console.log('🚀 Étape 2: Génération des secteurs...');
      setStep(3);
      setProgress({ current: 0, total: 0, percentage: 0 });

      // Convertir les mètres en km pour l'API
      const rayonKm = rayonMetres / 1000;

      const clusterResult = await genererClusters(
        benefsAvecCoords,
        mosqueeId,
        { rayonKm, forceRegeneration }
      );

      if (!clusterResult.success) {
        throw new Error('Erreur lors de la génération des secteurs');
      }

      console.log('✅ Secteurs générés avec succès');

      setResult({
        nombreClusters: clusterResult.nombreClusters,
        nombreBeneficiaires: clusterResult.nombreBeneficiaires,
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
  const benefsEligibles = beneficiairesLocaux.filter(b =>
    (b.statut === 'Pack Attribué' || b.statut === 'Validé') &&
    !b.itineraireId
  );

  const benefsAvecItineraire = beneficiairesLocaux.filter(b => b.itineraireId);

  const benefsSansCoords = benefsEligibles.filter(b =>
    !b.coords || !b.coords.lat || !b.coords.lng
  );

  if (!mosqueeId) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Erreur">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">mosqueeId manquant</p>
            <p className="text-sm text-red-700 mt-1">
              Impossible de créer des secteurs sans mosqueeId.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer des Secteurs Géographiques">
      <div className="space-y-6">
        {step === 1 && (
          <>
            {/* Informations */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    Création automatique de secteurs
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Géolocalisation automatique des adresses</li>
                    <li>• Regroupement par proximité géographique</li>
                    <li>• Optimisation de l'ordre des visites</li>
                    <li>• Vous pourrez ensuite assigner manuellement les bénéficiaires</li>
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
                <span className="text-lg font-bold text-gray-800">{beneficiairesLocaux.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bénéficiaires éligibles:</span>
                <span className="text-lg font-bold text-gray-800">{benefsEligibles.length}</span>
              </div>
              <div className="flex justify-between items-center">

              </div>
            </div>

            {/* Avertissement si des bénéficiaires ont déjà un itinéraire */}
            {benefsAvecItineraire.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-800 mb-2">
                      ℹ️ {benefsAvecItineraire.length} bénéficiaire(s) déjà assigné(s)
                    </p>
                    <p className="text-sm text-orange-700">
                      Ces bénéficiaires ont déjà été assignés à un itinéraire et seront ignorés.
                    </p>
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

            {/* Configuration du rayon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rayon de regroupement
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  value={rayonMetres}
                  onChange={(e) => setRayonMetres(parseInt(e.target.value))}
                  min="100"
                  max="5000"
                  step="100"
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold text-lg min-w-[100px] text-center">
                  {formatRayon(rayonMetres)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Les bénéficiaires dans ce rayon seront regroupés dans le même secteur
              </p>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100 m</span>
                <span>5 km</span>
              </div>
            </div>

            {/* Option de régénération */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceRegeneration}
                  onChange={(e) => setForceRegeneration(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Supprimer les secteurs existants avant de créer de nouveaux
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    ⚠️ Cette action supprimera tous vos secteurs actuels. Laissez décoché si vous voulez conserver les secteurs existants.
                  </p>
                </div>
              </label>
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
                Générer les secteurs
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
                Génération des secteurs...
              </h3>
              <p className="text-sm text-gray-600">
                Création des groupes géographiques et optimisation
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="py-6 space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Secteurs créés avec succès !
              </h3>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Secteurs créés:</span>
                <span className="text-lg font-bold text-green-700">{result.nombreClusters}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Bénéficiaires regroupés:</span>
                <span className="text-lg font-bold text-green-700">{result.nombreBeneficiaires}</span>
              </div>
              {result.geolocalisations > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Nouvelles géolocalisations:</span>
                  <span className="text-lg font-bold text-green-700">{result.geolocalisations}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Prochaine étape :</strong> Vous pouvez maintenant sélectionner les bénéficiaires à assigner dans chaque secteur.
              </p>
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
