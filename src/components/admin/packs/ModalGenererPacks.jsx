'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Package, TrendingUp, Gift } from 'lucide-react';
import Modal from '../ui/Modal';
import { useMosquee } from '@/context/MosqueeContext'; // 🔥 AJOUTÉ
import { genererEtSauvegarderPacks, attribuerPacksAuxBeneficiaires } from '@/lib/firebaseAdmin';

export default function ModalGenererPacks({ isOpen, onClose, onSuccess, inventaire, beneficiaires }) {
  const { mosqueeActive } = useMosquee(); // 🔥 AJOUTÉ
  const [loading, setLoading] = useState(false);
  const [etape, setEtape] = useState('confirmation'); // confirmation, generation, attribution, success
  const [resultat, setResultat] = useState(null);

  // Statistiques
  const beneficiairesValides = beneficiaires.filter(b => b.statut === 'Validé');
  
  // Compter les familles par article favori
  const repartitionArticlesFavoris = {
    'RIZ': 0,
    'PÂTES': 0,
    'COUSCOUS': 0,
    'Non spécifié': 0
  };

  beneficiairesValides.forEach(b => {
    const article = b.articleFavori?.toUpperCase();
    if (article && repartitionArticlesFavoris[article] !== undefined) {
      repartitionArticlesFavoris[article]++;
    } else {
      repartitionArticlesFavoris['Non spécifié']++;
    }
  });

  // Compter les familles par taille
  const repartitionTailles = {
    'Petite': 0,
    'Moyenne': 0,
    'Grande': 0
  };

  beneficiairesValides.forEach(b => {
    if (repartitionTailles[b.tailleFamille] !== undefined) {
      repartitionTailles[b.tailleFamille]++;
    }
  });

  const stats = {
    totalArticles: inventaire.length,
    beneficiairesValides: beneficiairesValides.length,
    articlesFavorisUtilises: Object.values(repartitionArticlesFavoris).filter(v => v > 0).length
  };

  const handleGenerer = async () => {
    // 🔥 VÉRIFICATION mosqueeActive
    if (!mosqueeActive || mosqueeActive === 'ALL') {
      alert('Erreur: Veuillez sélectionner une mosquée spécifique pour générer les packs');
      return;
    }

    setLoading(true);
    setEtape('generation');

    try {
      // 1. Générer les packs
      const resultGeneration = await genererEtSauvegarderPacks(mosqueeActive); // 🔥 MODIFIÉ
      
      if (!resultGeneration.success) {
        throw new Error(resultGeneration.message);
      }

      setEtape('attribution');

      // 2. Attribuer les packs aux bénéficiaires
      const resultAttribution = await attribuerPacksAuxBeneficiaires(mosqueeActive); // 🔥 MODIFIÉ

      if (!resultAttribution.success) {
        throw new Error(resultAttribution.message);
      }

      // 3. Succès
      setResultat({
        packsGeneres: resultGeneration.packsGeneres,
        attributions: resultAttribution.attributions
      });
      setEtape('success');

      // Callback de succès
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }

    } catch (error) {
      console.error('Erreur:', error);
      setResultat({
        error: error.message
      });
      setEtape('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEtape('confirmation');
    setResultat(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Générer les Packs Automatiquement" size="lg">
      {/* Étape 1 : Confirmation */}
      {etape === 'confirmation' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Informations importantes
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Les packs seront générés automatiquement selon le nouvel algorithme</li>
              <li>• Les anciens packs seront supprimés et remplacés</li>
              <li>• Les bénéficiaires validés recevront automatiquement leur pack</li>
              <li>• <strong>Articles favoris (RIZ, PÂTES, COUSCOUS) :</strong> Distribution 70%-30%</li>
              <li>• <strong>Autres articles :</strong> Distribution 100% avec coefficients</li>
            </ul>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
              <Package className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{stats.totalArticles}</p>
              <p className="text-sm text-gray-600">Articles en stock</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{stats.beneficiairesValides}</p>
              <p className="text-sm text-gray-600">Bénéficiaires validés</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
              <Gift className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{stats.articlesFavorisUtilises}</p>
              <p className="text-sm text-gray-600">Articles favoris</p>
            </div>
          </div>

          {/* Répartition des articles favoris */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">📊 Répartition des articles favoris</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(repartitionArticlesFavoris).map(([article, nombre]) => (
                nombre > 0 && (
                  <div key={article} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 font-medium">
                      {article === 'RIZ' && '🍚'} 
                      {article === 'PÂTES' && '🍝'} 
                      {article === 'COUSCOUS' && '🥘'}
                      {article === 'Non spécifié' && '❓'}
                      {' '}{article}
                    </span>
                    <span className="font-bold text-gray-900">{nombre} familles</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Répartition par taille */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">👥 Répartition par taille de famille</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(repartitionTailles).map(([taille, nombre]) => (
                nombre > 0 && (
                  <div key={taille} className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="font-bold text-2xl text-gray-800">{nombre}</div>
                    <div className="text-sm text-gray-600">{taille}</div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Aperçu de la distribution */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-6">
            <h3 className="font-bold text-emerald-900 mb-4">🎯 Logique de distribution</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Coefficients famille</span>
                <span className="font-semibold text-gray-900">Petite: 1 | Moyenne: 2 | Grande: 3</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Articles favoris (RIZ/PÂTES/COUSCOUS)</span>
                <span className="font-semibold text-gray-900">70% avec coef + 30% équitable</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Autres articles</span>
                <span className="font-semibold text-gray-900">100% avec coefficient</span>
              </div>
            </div>
          </div>

          {/* Avertissement si articles favoris non spécifiés */}
          {repartitionArticlesFavoris['Non spécifié'] > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>{repartitionArticlesFavoris['Non spécifié']} bénéficiaire(s)</strong> n'ont pas spécifié d'article favori. 
                Ils recevront uniquement le pack standard (70% des articles favoris).
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handleGenerer}
              disabled={!mosqueeActive || mosqueeActive === 'ALL'}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Package className="w-5 h-5" />
              Générer les packs
            </button>
          </div>
        </div>
      )}

      {/* Étape 2 : Génération en cours */}
      {(etape === 'generation' || etape === 'attribution') && (
        <div className="space-y-6 py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {etape === 'generation' ? 'Génération des packs...' : 'Attribution aux bénéficiaires...'}
            </h3>
            <p className="text-gray-600 text-center">
              {etape === 'generation' 
                ? 'Calcul des distributions en fonction de l\'inventaire et des articles favoris'
                : 'Association des packs aux familles validées'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${etape === 'generation' ? 'text-emerald-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Analyse de l'inventaire</span>
              </div>
              <div className={`flex items-center gap-3 ${etape === 'generation' ? 'text-emerald-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Calcul des distributions par taille</span>
              </div>
              <div className={`flex items-center gap-3 ${etape === 'generation' ? 'text-emerald-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Calcul des suppléments par article favori</span>
              </div>
              <div className={`flex items-center gap-3 ${etape === 'attribution' ? 'text-emerald-600' : 'text-gray-400'}`}>
                {etape === 'attribution' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">Attribution aux bénéficiaires</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3 : Succès */}
      {etape === 'success' && resultat && (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Packs générés avec succès !
            </h3>
            <p className="text-gray-600 text-center">
              Tous les packs ont été créés et attribués aux bénéficiaires
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6 text-center">
              <Package className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-emerald-600 mb-2">{resultat.packsGeneres}</p>
              <p className="text-sm text-emerald-800 font-medium">Packs créés</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-blue-600 mb-2">{resultat.attributions}</p>
              <p className="text-sm text-blue-800 font-medium">Attributions effectuées</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
          >
            Terminer
          </button>
        </div>
      )}

      {/* Étape 4 : Erreur */}
      {etape === 'error' && resultat && (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Une erreur est survenue
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {resultat.error}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            Fermer
          </button>
        </div>
      )}
    </Modal>
  );
}