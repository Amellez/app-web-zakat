'use client';
import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, MapPin, Users, Navigation, CheckCircle, XCircle, Package, Gift } from 'lucide-react';
import { getItineraireParCode, updateStatutLivraison } from '@/lib/itinerairesService';
import { getPacks } from '@/lib/firebaseAdmin';

export default function DistributionPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itineraire, setItineraire] = useState(null);
  const [loadingLivraison, setLoadingLivraison] = useState({});
  const [packs, setPacks] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  // ✅ NOUVEAU : États pour le modal d'échec
  const [beneficiaireEchec, setBeneficiaireEchec] = useState(null);
  const [raisonEchec, setRaisonEchec] = useState('');

  // Charger les packs quand un itinéraire est chargé
  useEffect(() => {
    if (itineraire && itineraire.mosqueeId) {
      chargerPacks(itineraire.mosqueeId);
    }
  }, [itineraire?.mosqueeId]);

  const chargerPacks = async (mosqueeId) => {
    setLoadingPacks(true);
    console.log('📦 Chargement packs pour mosquée:', mosqueeId);
    try {
      const packsData = await getPacks(mosqueeId);
      console.log('📦 Packs chargés:', packsData.length, packsData);
      setPacks(packsData);
    } catch (err) {
      console.error('❌ Erreur chargement packs:', err);
    } finally {
      setLoadingPacks(false);
    }
  };

  const getPackInfo = (beneficiaire) => {
    if (!beneficiaire) return null;

    console.log('🔍 Bénéficiaire:', beneficiaire.nom);
    console.log('  - packId:', beneficiaire.packId);
    console.log('  - packSupplementId:', beneficiaire.packSupplementId);
    console.log('  - Nombre de packs disponibles:', packs.length);

    const packStandard = packs.find(p => p.id === beneficiaire.packId);
    const packSupplement = packs.find(p => p.id === beneficiaire.packSupplementId);

    console.log('  - Pack trouvé:', packStandard?.tailleFamille || 'Aucun');
    console.log('  - Supplément trouvé:', packSupplement?.articleFavori || 'Aucun');

    return { packStandard, packSupplement };
  };

  const articleEmojis = {
    'RIZ': '🍚',
    'PÂTES': '🍝',
    'COUSCOUS': '🥘'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code || code.trim().length === 0) {
      setError('Veuillez entrer un code');
      return;
    }

    setLoading(true);
    setError('');
    setItineraire(null);

    try {
      const codeFormate = code.toUpperCase().trim();
      const result = await getItineraireParCode(codeFormate);

      if (!result) {
        setError('Code invalide. Vérifiez le code et réessayez.');
        return;
      }

      setItineraire(result);
      console.log('✅ Itinéraire chargé:', result);

    } catch (err) {
      console.error('Erreur chargement itinéraire:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutLivraison = async (beneficiaireId, nouveauStatut) => {
    setLoadingLivraison(prev => ({ ...prev, [beneficiaireId]: true }));

    try {
      await updateStatutLivraison(itineraire.id, beneficiaireId, nouveauStatut);

      // Mettre à jour l'état local
      setItineraire(prev => ({
        ...prev,
        beneficiaires: prev.beneficiaires.map(b =>
          b.id === beneficiaireId
            ? { ...b, statutLivraison: nouveauStatut }
            : b
        )
      }));

      console.log(`✅ Statut mis à jour: ${beneficiaireId} → ${nouveauStatut}`);

    } catch (err) {
      console.error('Erreur mise à jour:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setLoadingLivraison(prev => ({ ...prev, [beneficiaireId]: false }));
    }
  };

  // ✅ NOUVEAU : Ouvrir le modal pour saisir la raison d'échec
  const handleOuvrirModalEchec = (beneficiaire) => {
    setBeneficiaireEchec(beneficiaire);
    setRaisonEchec('');
  };

  // ✅ NOUVEAU : Confirmer l'échec avec raison
  const handleConfirmerEchec = async () => {
    if (!beneficiaireEchec || !raisonEchec.trim()) {
      alert('Veuillez indiquer une raison');
      return;
    }

    setLoadingLivraison(prev => ({ ...prev, [beneficiaireEchec.id]: true }));

    try {
      await updateStatutLivraison(
        itineraire.id,
        beneficiaireEchec.id,
        'Échec',
        raisonEchec.trim() // ✅ NOUVEAU : Passer la raison
      );

      // Mettre à jour l'état local
      setItineraire(prev => ({
        ...prev,
        beneficiaires: prev.beneficiaires.map(b =>
          b.id === beneficiaireEchec.id
            ? {
                ...b,
                statutLivraison: 'Échec',
                raisonEchec: raisonEchec.trim() // ✅ NOUVEAU
              }
            : b
        )
      }));

      setBeneficiaireEchec(null);
      setRaisonEchec('');

    } catch (err) {
      console.error('Erreur mise à jour:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setLoadingLivraison(prev => ({ ...prev, [beneficiaireEchec.id]: false }));
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Livré': return 'bg-green-100 text-green-800 border-green-300';
      case 'Échec': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  // Calculer les statistiques
  const stats = itineraire ? {
    total: itineraire.beneficiaires?.length || 0,
    livres: itineraire.beneficiaires?.filter(b => b.statutLivraison === 'Livré').length || 0,
    echecs: itineraire.beneficiaires?.filter(b => b.statutLivraison === 'Échec').length || 0,
    enAttente: itineraire.beneficiaires?.filter(b => b.statutLivraison === 'En attente').length || 0
  } : null;

  // Fonction pour formater la distance
  const formaterDistance = (distanceEnMetres) => {
    if (!distanceEnMetres || distanceEnMetres === 0) return '0 m';

    if (distanceEnMetres < 1000) {
      return `${Math.round(distanceEnMetres)} m`;
    } else {
      return `${(distanceEnMetres / 1000).toFixed(1)} km`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-emerald-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-4 shadow-lg">
              🌙 Distribution Zakat al-Fitr
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-800">
              Feuille de Route Bénévole
            </h1>
            <p className="text-gray-600 mt-2">
              Entrez votre code d'accès pour voir votre itinéraire
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!itineraire ? (
          // Formulaire de saisie du code
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-gray-100">
            <div className="text-center mb-8">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Accès à votre itinéraire
              </h2>
              <p className="text-gray-600">
                Entrez le code unique qui vous a été remis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code d'accès
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ITI-ABC123"
                  maxLength={10}
                  className="w-full px-6 py-4 text-2xl font-mono font-bold text-center border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none uppercase tracking-wider"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Format: ITI-XXX999 (3 lettres + 3 chiffres)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Accéder à mon itinéraire
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Information:</strong> Ce code vous a été remis par votre mosquée.
                Si vous ne l'avez pas reçu, contactez votre référent.
              </p>
            </div>
          </div>
        ) : (
          // Feuille de route
          <div className="space-y-6">
            {/* En-tête de l'itinéraire */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{itineraire.nom}</h2>
                <button
                  onClick={() => {
                    setItineraire(null);
                    setCode('');
                    setPacks([]);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Changer de code
                </button>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Package className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-green-600">Livrés</p>
                  <p className="text-2xl font-bold text-green-800">{stats.livres}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-xs text-yellow-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-800">{stats.enAttente}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs text-red-600">Échecs</p>
                  <p className="text-2xl font-bold text-red-800">{stats.echecs}</p>
                </div>
              </div>

              {/* Barre de progression */}
              {stats.livres > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Progression</p>
                    <p className="text-sm font-bold text-emerald-600">
                      {Math.round((stats.livres / stats.total) * 100)}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${(stats.livres / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Infos itinéraire */}
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Navigation className="w-4 h-4" />
                  <span>{formaterDistance(itineraire.statistiques?.distanceTotale)}</span>
                </div>

              </div>
            </div>

            {/* Liste des bénéficiaires */}
            <div className="space-y-4">
              {itineraire.beneficiaires?.map((benef, index) => {
                const { packStandard, packSupplement } = getPackInfo(benef);

                return (
                  <div
                    key={benef.id}
                    className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden transition ${
                      benef.statutLivraison === 'Livré'
                        ? 'border-green-300 opacity-75'
                        : benef.statutLivraison === 'Échec'
                        ? 'border-red-300'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      {/* En-tête */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800 mb-2">{benef.nom}</h3>

                            {/* Badges Packs */}
                            {!loadingPacks && (packStandard || packSupplement) && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {packStandard && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-700">
                                      Pack {packStandard.tailleFamille}
                                    </span>
                                  </div>
                                )}
                                {packSupplement && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                                    <Gift className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-amber-700">
                                      {articleEmojis[packSupplement.articleFavori] || '🎁'} {packSupplement.articleFavori}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatutColor(benef.statutLivraison)}`}>
                          {benef.statutLivraison}
                        </span>
                      </div>

                      {/* Adresse */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{benef.adresse}</p>
                            {benef.telephone && (
                              <a
                                href={`tel:${benef.telephone}`}
                                className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
                              >
                                📞 {benef.telephone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {benef.statutLivraison === 'En attente' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleStatutLivraison(benef.id, 'Livré')}
                            disabled={loadingLivraison[benef.id]}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                          >
                            {loadingLivraison[benef.id] ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                Livré
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleOuvrirModalEchec(benef)}
                            disabled={loadingLivraison[benef.id]}
                            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition font-semibold disabled:opacity-50"
                          >
                            {loadingLivraison[benef.id] ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-5 h-5" />
                                Échec
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {benef.statutLivraison === 'Livré' && (
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-sm font-semibold text-green-800">
                            ✅ Distribution effectuée
                          </p>
                        </div>
                      )}

                      {benef.statutLivraison === 'Échec' && (
                        <div className="space-y-2">
                          {/* ✅ NOUVEAU : Afficher la raison d'échec */}
                          {benef.raisonEchec && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-red-700 mb-1">Raison de l'échec :</p>
                              <p className="text-sm text-red-800">{benef.raisonEchec}</p>
                            </div>
                          )}

                          <button
                            onClick={() => handleStatutLivraison(benef.id, 'En attente')}
                            disabled={loadingLivraison[benef.id]}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold disabled:opacity-50"
                          >
                            Réessayer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ✅ NOUVEAU : Modal raison d'échec */}
      {beneficiaireEchec && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Raison de l'échec
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Bénéficiaire : <strong>{beneficiaireEchec.nom}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pourquoi la livraison a-t-elle échoué ?
              </label>
              <textarea
                value={raisonEchec}
                onChange={(e) => setRaisonEchec(e.target.value)}
                placeholder="Ex: Absent, Adresse introuvable, Refus..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBeneficiaireEchec(null);
                  setRaisonEchec('');
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmerEchec}
                disabled={!raisonEchec.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer l'échec
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
