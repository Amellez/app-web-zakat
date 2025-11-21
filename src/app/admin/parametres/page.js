'use client';

import { useState, useEffect } from 'react';
import { useMosquee } from '@/context/MosqueeContext';
import { getParametres, updateParametres, validerParametres } from '@/lib/parametresconfig';
import { AlertCircle, Save, CheckCircle, X } from 'lucide-react';

export default function ParametresPage() {
  const { mosqueeActive } = useMosquee();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const [parametres, setParametres] = useState({
    repartition: {
      standard: 70,
      supplement: 30
    },
    coefficients: {
      Petite: 1,
      Moyenne: 2,
      Grande: 3
    }
  });

  const [erreurs, setErreurs] = useState([]);

  useEffect(() => {
    const chargerParametres = async () => {
      if (!mosqueeActive) {
        setLoading(false);
        return;
      }
      
      try {
        const params = await getParametres(mosqueeActive);
        setParametres(params);
      } catch (error) {
        console.error('Erreur chargement paramètres:', error);
      } finally {
        setLoading(false);
      }
    };
    chargerParametres();
  }, [mosqueeActive]);

  const handleRepartitionChange = (type, value) => {
    const newValue = parseFloat(value);
    const autreType = type === 'standard' ? 'supplement' : 'standard';
    const autreValue = 100 - newValue;

    setParametres(prev => ({
      ...prev,
      repartition: {
        [type]: newValue,
        [autreType]: autreValue
      }
    }));
  };

  const handleCoefficientChange = (taille, value) => {
    setParametres(prev => ({
      ...prev,
      coefficients: {
        ...prev.coefficients,
        [taille]: parseFloat(value)
      }
    }));
  };

  const handleSave = async () => {
    if (!mosqueeActive) {
      setErreurs(['Aucune mosquée sélectionnée']);
      return;
    }

    const erreursValidation = validerParametres(parametres);
    if (erreursValidation.length > 0) {
      setErreurs(erreursValidation);
      return;
    }

    setSaving(true);
    setErreurs([]);

    try {
      await updateParametres(parametres, mosqueeActive);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setErreurs(['Erreur lors de la sauvegarde des paramètres']);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!mosqueeActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 text-center mb-2">
            Aucune mosquée sélectionnée
          </h3>
          <p className="text-sm text-red-700 text-center">
            Veuillez sélectionner une mosquée pour accéder aux paramètres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        
        {showSuccessPopup && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-emerald-500 p-6 flex items-start gap-4 max-w-md">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Paramètres enregistrés !</h3>
                <p className="text-sm text-gray-600">
                  Vos modifications ont été sauvegardées avec succès. Les nouveaux paramètres seront appliqués à la prochaine génération de packs.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-all"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-gray-700 font-medium">Retour au dashboard</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Paramètres de Distribution</h1>
          <p className="text-gray-600">Configurez la répartition et les coefficients pour la génération des packs</p>
        </div>

        {erreurs.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">Erreurs de validation</h3>
                <ul className="space-y-1">
                  {erreurs.map((erreur, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {erreur}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📊 Répartition des Articles Favoris
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Définissez comment répartir les articles favoris (RIZ, PÂTES, COUSCOUS) entre packs standard et suppléments
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Packs Standard (avec coefficients)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={parametres.repartition.standard}
                  onChange={(e) => handleRepartitionChange('standard', e.target.value)}
                  className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-right">
                  <span className="text-2xl font-bold text-emerald-600">
                    {parametres.repartition.standard}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suppléments (équitable, sans coefficient)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={parametres.repartition.supplement}
                  onChange={(e) => handleRepartitionChange('supplement', e.target.value)}
                  className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-right">
                  <span className="text-2xl font-bold text-amber-600">
                    {parametres.repartition.supplement}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="flex h-8 rounded-lg overflow-hidden">
                <div
                  style={{ width: `${parametres.repartition.standard}%` }}
                  className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold"
                >
                  {parametres.repartition.standard >= 15 && `${parametres.repartition.standard}%`}
                </div>
                <div
                  style={{ width: `${parametres.repartition.supplement}%` }}
                  className="bg-amber-500 flex items-center justify-center text-white text-xs font-bold"
                >
                  {parametres.repartition.supplement >= 15 && `${parametres.repartition.supplement}%`}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Standard</span>
                <span>Supplément</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🎯 Coefficients par Taille de Famille
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Définissez les multiplicateurs pour chaque taille de famille (utilisés uniquement pour les packs standard)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
              <label className="block text-sm font-medium text-blue-800 mb-4">
                👨‍👩‍👦 Petite Famille (1-2 personnes)
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={parametres.coefficients.Petite}
                onChange={(e) => handleCoefficientChange('Petite', e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-center text-2xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
              <label className="block text-sm font-medium text-purple-800 mb-4">
                👨‍👩‍👧‍👦 Moyenne Famille (3-5 personnes)
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={parametres.coefficients.Moyenne}
                onChange={(e) => handleCoefficientChange('Moyenne', e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg text-center text-2xl font-bold text-purple-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
              <label className="block text-sm font-medium text-orange-800 mb-4">
                👨‍👩‍👧‍👦‍👶 Grande Famille (6+ personnes)
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={parametres.coefficients.Grande}
                onChange={(e) => handleCoefficientChange('Grande', e.target.value)}
                className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg text-center text-2xl font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-lg border-2 border-blue-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Exemple de calcul</h2>
          <p className="text-sm text-gray-700 mb-4">
            Avec 100kg de RIZ et vos paramètres actuels :
          </p>
          <div className="space-y-2 text-sm text-gray-800">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span>Packs standard (avec coefficients)</span>
              <span className="font-bold text-emerald-600">{parametres.repartition.standard}kg</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span>Suppléments (équitable)</span>
              <span className="font-bold text-amber-600">{parametres.repartition.supplement}kg</span>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                Une <strong>Grande famille</strong> recevra <strong>{parametres.coefficients.Grande}×</strong> plus qu'une <strong>Petite famille</strong> dans les packs standard
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !mosqueeActive}
            className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer les paramètres
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}