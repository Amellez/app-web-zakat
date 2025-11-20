'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getParametres, updateParametres, validerParametres } from '@/lib/parametresconfig';
import { Loader2, Save, RefreshCw, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ParametresPage() {
  const { user } = useAuth();
  
  // États pour les paramètres
  const [parametres, setParametres] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // États temporaires pour les sliders
  const [tempStandard, setTempStandard] = useState(70);
  const [tempSupplement, setTempSupplement] = useState(30);
  
  // États pour les coefficients
  const [coeffPetite, setCoeffPetite] = useState(1);
  const [coeffMoyenne, setCoeffMoyenne] = useState(2);
  const [coeffGrande, setCoeffGrande] = useState(3);

  // Charger les paramètres au montage
  useEffect(() => {
    chargerParametres();
  }, []);

  const chargerParametres = async () => {
    setLoading(true);
    try {
      const data = await getParametres();
      setParametres(data);
      
      // Initialiser les états locaux
      setTempStandard(data.repartition.standard);
      setTempSupplement(data.repartition.supplement);
      setCoeffPetite(data.coefficients.Petite);
      setCoeffMoyenne(data.coefficients.Moyenne);
      setCoeffGrande(data.coefficients.Grande);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      afficherMessage('Erreur lors du chargement des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const afficherMessage = (texte, type = 'success') => {
    setMessage({ texte, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleStandardChange = (value) => {
    const newStandard = parseFloat(value);
    setTempStandard(newStandard);
    setTempSupplement(100 - newStandard);
  };

  const handleSupplementChange = (value) => {
    const newSupplement = parseFloat(value);
    setTempSupplement(newSupplement);
    setTempStandard(100 - newSupplement);
  };

  const sauvegarderParametres = async () => {
    setSaving(true);
    
    try {
      const nouveauxParametres = {
        repartition: {
          standard: tempStandard,
          supplement: tempSupplement
        },
        coefficients: {
          Petite: parseFloat(coeffPetite),
          Moyenne: parseFloat(coeffMoyenne),
          Grande: parseFloat(coeffGrande)
        }
      };
      
      // Valider les paramètres
      const erreurs = validerParametres(nouveauxParametres);
      if (erreurs.length > 0) {
        afficherMessage(erreurs.join(', '), 'error');
        return;
      }
      
      // Sauvegarder
      await updateParametres(nouveauxParametres, user?.email);
      setParametres(nouveauxParametres);
      afficherMessage('Paramètres sauvegardés avec succès ! Les nouveaux packs seront générés automatiquement.', 'success');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      afficherMessage('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reinitialiserParametres = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      setTempStandard(70);
      setTempSupplement(30);
      setCoeffPetite(1);
      setCoeffMoyenne(2);
      setCoeffGrande(3);
      afficherMessage('Paramètres réinitialisés (pensez à sauvegarder)', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Bouton retour */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Retour au dashboard</span>
          </Link>
        </div>

        {/* Header de la page */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Paramètres des Packs</h1>
          </div>
          <p className="text-gray-600">Configurez la distribution et les coefficients pour la génération automatique des packs</p>
        </div>

        {/* Message de notification */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border-2 border-green-300 text-green-800' 
              : 'bg-red-50 border-2 border-red-300 text-red-800'
          }`}>
            <p className="font-medium">{message.texte}</p>
          </div>
        )}

        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Section Répartition Standard/Supplément */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Répartition Articles Favoris</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configurez la répartition entre packs standard et suppléments pour les articles favoris (RIZ, PÂTES, COUSCOUS)
                      </p>
                    </div>
                  </div>

                  {/* Visualisation graphique */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-blue-700">Packs Standard</span>
                          <span className="text-2xl font-bold text-blue-700">{tempStandard.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                            style={{ width: `${tempStandard}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-400">+</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-purple-700">Suppléments</span>
                          <span className="text-2xl font-bold text-purple-700">{tempSupplement.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300"
                            style={{ width: `${tempSupplement}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sliders de contrôle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Packs Standard (avec coefficients)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={tempStandard}
                        onChange={(e) => handleStandardChange(e.target.value)}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-blue"
                      />
                      <p className="text-xs text-gray-500">
                        Distribution avec coefficients par taille de famille
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Packs Supplément (équitable)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={tempSupplement}
                        onChange={(e) => handleSupplementChange(e.target.value)}
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider-purple"
                      />
                      <p className="text-xs text-gray-500">
                        Distribution équitable sans coefficient
                      </p>
                    </div>
                  </div>

                  {/* Exemples d'impact */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>💡 Exemple :</strong> Avec 100kg de riz disponible, {tempStandard}kg seront répartis dans les packs standard selon les coefficients de taille, 
                      et {tempSupplement}kg seront répartis équitablement comme supplément pour les bénéficiaires ayant choisi le riz.
                    </p>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="border-t-2 border-gray-200" />

                {/* Section Coefficients */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Coefficients par Taille de Famille</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ajustez les coefficients de distribution selon la taille des familles
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Petite famille */}
                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Petite</h4>
                          <p className="text-xs text-gray-600">1-2 personnes</p>
                        </div>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coefficient
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={coeffPetite}
                        onChange={(e) => setCoeffPetite(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Quantité de base × {coeffPetite}
                      </p>
                    </div>

                    {/* Moyenne famille */}
                    <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">👥</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Moyenne</h4>
                          <p className="text-xs text-gray-600">3-5 personnes</p>
                        </div>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coefficient
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={coeffMoyenne}
                        onChange={(e) => setCoeffMoyenne(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Quantité de base × {coeffMoyenne}
                      </p>
                    </div>

                    {/* Grande famille */}
                    <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">👨‍👩‍👧‍👦</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Grande</h4>
                          <p className="text-xs text-gray-600">6+ personnes</p>
                        </div>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coefficient
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={coeffGrande}
                        onChange={(e) => setCoeffGrande(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Quantité de base × {coeffGrande}
                      </p>
                    </div>
                  </div>

                  {/* Exemple d'impact des coefficients */}
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-800">
                      <strong>💡 Exemple :</strong> Avec les coefficients actuels, une famille moyenne recevra {(coeffMoyenne / coeffPetite).toFixed(1)}× plus qu'une petite famille, 
                      et une grande famille recevra {(coeffGrande / coeffPetite).toFixed(1)}× plus qu'une petite famille.
                    </p>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={reinitialiserParametres}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Réinitialiser
                  </button>

                  <button
                    onClick={sauvegarderParametres}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 font-semibold shadow-lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Sauvegarder les paramètres
                      </>
                    )}
                  </button>
                </div>

                {/* Avertissement */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Important :</strong> La modification de ces paramètres déclenchera automatiquement une régénération de tous les packs 
                    lors de la prochaine modification de l'inventaire ou des bénéficiaires.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info sur la dernière modification */}
        {parametres && (
          <div className="mt-6 bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Dernière modification : {new Date(parametres.updatedAt).toLocaleString('fr-FR')}
              </span>
              {parametres.updatedBy && (
                <span>
                  Par : {parametres.updatedBy}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        input[type="range"].slider-blue::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        input[type="range"].slider-purple::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #9333ea);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}