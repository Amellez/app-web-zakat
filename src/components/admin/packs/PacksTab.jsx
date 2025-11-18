import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, Trash2, Package, Gift } from 'lucide-react';
import ModalGenererPacks from './ModalGenererPacks';
import PackCard from './PackCard';
import { getPacks, supprimerTousLesPacks, ecouterPacks } from '@/lib/firebaseAdmin';

export default function PacksTab({ packs, setPacks, inventaire, beneficiaires }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🔥 Listener en temps réel sur les packs
  useEffect(() => {
    console.log('👂 Installation du listener temps réel sur les packs');
    
    const unsubscribe = ecouterPacks((packsData) => {
      setPacks(packsData);
      console.log('✅ Packs mis à jour automatiquement:', packsData.length);
    });

    return () => {
      console.log('🔌 Déconnexion du listener packs');
      unsubscribe();
    };
  }, [setPacks]);

  // Charger les packs depuis Firebase
  const chargerPacks = async () => {
    setLoading(true);
    try {
      const data = await getPacks();
      setPacks(data);
    } catch (error) {
      console.error('Erreur chargement packs:', error);
      alert('Erreur lors du chargement des packs');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer tous les packs
  const handleSupprimerTous = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUS les packs ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(true);
    try {
      await supprimerTousLesPacks();
      setPacks([]);
      alert('✅ Tous les packs ont été supprimés');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression des packs');
    } finally {
      setDeleting(false);
    }
  };

  const handleSuccess = () => {
    chargerPacks();
  };

  // Vérifier si des packs peuvent être générés
  const peutGenerer = inventaire.length > 0 && beneficiaires.filter(b => b.statut === 'Validé').length > 0;

  // SÉPARER LES PACKS STANDARD ET SUPPLÉMENTS
  const packsStandard = packs.filter(p => p.type === 'standard');
  const packsSupplements = packs.filter(p => p.type === 'supplement');

  // Résumé packs standard par taille
  const resumeParTaille = {};
  ['Grande', 'Moyenne', 'Petite'].forEach(taille => {
    const pack = packsStandard.find(p => p.tailleFamille === taille);
    if (pack) {
      resumeParTaille[taille] = {
        nombre: pack.nombreFamilles,
        composition: pack.composition
      };
    }
  });

  // Résumé suppléments par article favori
  const supplementsParArticle = {};
  packsSupplements.forEach(pack => {
    supplementsParArticle[pack.articleFavori] = {
      nombreFamilles: pack.nombreFamilles,
      composition: pack.composition
    };
  });

  // Totaux
  const totalPacksStandard = Object.values(resumeParTaille).reduce((sum, r) => sum + r.nombre, 0);
  const totalSupplements = Object.values(supplementsParArticle).reduce((sum, s) => sum + s.nombreFamilles, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-600" />
            Packs à Préparer
          </h2>
          <p className="text-gray-600 mt-1">Organisation des packs standard et suppléments par article favori</p>
        </div>
        <div className="flex gap-3">
          {packs.length > 0 && (
            <button
              onClick={handleSupprimerTous}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Supprimer tous
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowModal(true)}
            disabled={!peutGenerer}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            {packs.length > 0 ? 'Régénérer les packs' : 'Générer automatiquement'}
          </button>
        </div>
      </div>

      {/* Alerte si conditions non remplies */}
      {!peutGenerer && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              Impossible de générer les packs
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {inventaire.length === 0 && 'Ajoutez des articles à l\'inventaire. '}
              {beneficiaires.filter(b => b.statut === 'Validé').length === 0 && 'Validez au moins un bénéficiaire.'}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : packs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-12 text-center">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun pack créé</h3>
          <p className="text-gray-600 mb-6">
            Générez automatiquement les packs en fonction de votre inventaire et des bénéficiaires validés
          </p>
          {peutGenerer && (
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Générer les packs maintenant
            </button>
          )}
        </div>
      ) : (
        <>
          {/* TOTAUX GLOBAUX */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-lg p-4 text-center">
              <Package className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-emerald-700">{totalPacksStandard}</div>
              <div className="text-sm text-emerald-600 font-medium mt-1">Packs Standard Total</div>
            </div>
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 rounded-lg p-4 text-center">
              <Gift className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-amber-700">{totalSupplements}</div>
              <div className="text-sm text-amber-600 font-medium mt-1">Suppléments Total</div>
            </div>
          </div>

          {/* SECTION 1 : PACKS STANDARD */}
          {packsStandard.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                  📦 Packs Standard à Préparer
                </h3>
                <p className="text-sm text-gray-600">
                  Contient 70% des articles favoris + 100% des autres articles • Distribués avec coefficients (Petite: 1, Moyenne: 2, Grande: 3)
                </p>
              </div>
              
              {/* Affichage compact en colonnes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['Grande', 'Moyenne', 'Petite'].map(taille => {
                  const resume = resumeParTaille[taille];
                  if (!resume) return null;

                  const colorClasses = {
                    'Grande': {
                      gradient: 'from-orange-500 to-red-500',
                      bg: 'bg-orange-50',
                      border: 'border-orange-200',
                      text: 'text-orange-600'
                    },
                    'Moyenne': {
                      gradient: 'from-purple-500 to-indigo-500',
                      bg: 'bg-purple-50',
                      border: 'border-purple-200',
                      text: 'text-purple-600'
                    },
                    'Petite': {
                      gradient: 'from-blue-500 to-cyan-500',
                      bg: 'bg-blue-50',
                      border: 'border-blue-200',
                      text: 'text-blue-600'
                    }
                  };

                  const colors = colorClasses[taille];

                  return (
                    <div key={taille} className="border-2 border-gray-200 rounded-xl overflow-hidden flex flex-col">
                      {/* En-tête */}
                      <div className={`bg-gradient-to-r ${colors.gradient} text-white p-5`}>
                        <h4 className="text-lg font-bold mb-1">{taille} Famille</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{resume.nombre}</span>
                          <span className="text-sm opacity-90">packs</span>
                        </div>
                      </div>

                      {/* Composition */}
                      <div className="p-4 bg-gray-50 flex-1">
                        <h5 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                          📋 Par pack :
                        </h5>
                        <div className="space-y-2">
                          {resume.composition.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{item.produit}</span>
                                {item.type && (
                                  <span className="block text-xs text-gray-500 font-mono mt-0.5">
                                    {item.type}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-gray-900 ml-2">
                                {item.quantiteParFamille} {item.unite}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total à préparer */}
                        <div className={`mt-4 p-3 ${colors.bg} border-2 ${colors.border} rounded-lg`}>
                          <h6 className={`text-xs font-bold ${colors.text} mb-2 uppercase tracking-wide`}>
                            🎯 Total à préparer :
                          </h6>
                          <div className="space-y-1.5">
                            {resume.composition.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-xs text-gray-700 font-medium">{item.produit}</span>
                                <span className={`text-base font-bold ${colors.text}`}>
                                  {(item.quantiteParFamille * resume.nombre).toFixed(2)} {item.unite}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2 : SUPPLÉMENTS PAR ARTICLE FAVORI */}
          {Object.keys(supplementsParArticle).length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-amber-300 p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                  🎁 Suppléments à Préparer
                </h3>
                <p className="text-sm text-gray-600">
                  Contient 30% des articles favoris • Distribués équitablement (SANS coefficient) aux familles ayant choisi cet article
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['RIZ', 'PÂTES', 'COUSCOUS'].map(articleFavori => {
                  const supplement = supplementsParArticle[articleFavori];
                  if (!supplement) return null;

                  const articleColors = {
                    'RIZ': {
                      gradient: 'from-amber-500 to-yellow-500',
                      bg: 'bg-amber-50',
                      border: 'border-amber-200',
                      text: 'text-amber-700',
                      emoji: '🍚'
                    },
                    'PÂTES': {
                      gradient: 'from-orange-500 to-amber-500',
                      bg: 'bg-orange-50',
                      border: 'border-orange-200',
                      text: 'text-orange-700',
                      emoji: '🍝'
                    },
                    'COUSCOUS': {
                      gradient: 'from-yellow-500 to-lime-500',
                      bg: 'bg-yellow-50',
                      border: 'border-yellow-200',
                      text: 'text-yellow-700',
                      emoji: '🥘'
                    }
                  };

                  const colors = articleColors[articleFavori];

                  return (
                    <div key={articleFavori} className="border-2 border-amber-300 rounded-xl overflow-hidden flex flex-col">
                      {/* En-tête */}
                      <div className={`bg-gradient-to-r ${colors.gradient} text-white p-5`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{colors.emoji}</span>
                          <h4 className="text-lg font-bold">{articleFavori}</h4>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{supplement.nombreFamilles}</span>
                          <span className="text-sm opacity-90">suppléments</span>
                        </div>
                      </div>

                      {/* Composition */}
                      <div className="p-4 bg-gray-50 flex-1">
                        <h5 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                          🎁 Par supplément :
                        </h5>
                        <div className="space-y-2">
                          {supplement.composition.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{item.produit}</span>
                                {item.type && (
                                  <span className="block text-xs text-gray-500 font-mono mt-0.5">
                                    {item.type}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-gray-900 ml-2">
                                {item.quantiteParFamille || item.quantite} {item.unite}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total à préparer */}
                        <div className={`mt-4 p-3 ${colors.bg} border-2 ${colors.border} rounded-lg`}>
                          <h6 className={`text-xs font-bold ${colors.text} mb-2 uppercase tracking-wide`}>
                            🎯 Total à préparer :
                          </h6>
                          <div className="space-y-1.5">
                            {supplement.composition.map((item, idx) => {
                              const qteParItem = item.quantiteParFamille || item.quantite;
                              return (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-700 font-medium">{item.produit}</span>
                                  <span className={`text-base font-bold ${colors.text}`}>
                                    {(qteParItem * supplement.nombreFamilles).toFixed(2)} {item.unite}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info récapitulative */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Logique de distribution
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Articles favoris (RIZ, PÂTES, COUSCOUS) :</strong> 70% distribués dans les packs standard + 30% dans les suppléments</p>
              <p>• <strong>Packs standard :</strong> Distribution avec coefficients (Grande: 3, Moyenne: 2, Petite: 1)</p>
              <p>• <strong>Suppléments :</strong> Distribution équitable (SANS coefficient) aux familles ayant choisi l'article</p>
              <p>• <strong>Autres articles :</strong> 100% distribués dans les packs standard avec coefficients</p>
            </div>
          </div>
        </>
      )}

      {/* Modal de génération */}
      <ModalGenererPacks
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        inventaire={inventaire}
        beneficiaires={beneficiaires}
      />
    </div>
  );
}